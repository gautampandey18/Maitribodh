import assert from 'node:assert/strict';
import test from 'node:test';
import { createApprovalsRepository } from '../src/modules/approvals/approvals.repository.js';

test('pending queue sorts by submission and returns no object storage key', async () => {
  let sql;
  const repository = createApprovalsRepository({
    async query(statement, params) {
      sql = statement;
      assert.deepEqual(params, [25, 0]);
      return { rows: [{ person_id: 1, has_photo: true, total: 1 }] };
    },
  });

  const rows = await repository.listPending({ pageSize: 25, offset: 0 });

  assert.equal(rows[0].has_photo, true);
  assert.match(sql, /WHERE p\.status = 'PENDING'/);
  assert.match(sql, /ORDER BY h\.acted_at/);
  assert.match(sql, /p\.photo_key IS NOT NULL AS has_photo/);
  assert.doesNotMatch(sql, /SELECT[^;]*p\.photo_key,/s);
  assert.match(sql, /LIMIT \$1 OFFSET \$2/);
});

test('status queue lists paginated registrations for the requested state', async () => {
  let sql;
  let params;
  const repository = createApprovalsRepository({
    async query(statement, values) {
      sql = statement;
      params = values;
      return { rows: [{ person_id: 1, status: 'ACTIVE', total: 1 }] };
    },
  });

  const rows = await repository.listByStatus({ status: 'ACTIVE', pageSize: 10, offset: 20 });

  assert.equal(rows[0].status, 'ACTIVE');
  assert.match(sql, /WHERE p\.status = \$1/);
  assert.match(sql, /LEFT JOIN LATERAL/);
  assert.deepEqual(params, ['ACTIVE', 10, 20]);
});

test('approval writes status, history, notification, audit, and commit in order', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) return { rows: [{ person_id: 10, status: 'PENDING' }] };
      if (sql.includes('FROM mams.approval_history')) return { rows: [{ acted_by: 4 }] };
      if (sql.includes('UPDATE mams.person')) {
        return { rows: [{ person_id: 10, status: 'ACTIVE', qr_version: 1 }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  const result = await repository.decide({
    personId: 10,
    decision: 'APPROVE',
    actorUserId: 7,
    actorRole: 'APPROVER',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(result.status, 'ACTIVE');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE/);
  assert.match(calls[3].sql, /UPDATE mams\.person/);
  assert.match(calls[4].sql, /INSERT INTO mams\.approval_history/);
  assert.match(calls[5].sql, /INSERT INTO mams\.notification/);
  assert.match(calls[6].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(calls[6].values[7].length, 100);
  assert.equal(calls[7].sql, 'COMMIT');
});

test('Admin cannot decide their own submission', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) return { rows: [{ person_id: 10, status: 'PENDING' }] };
      if (sql.includes('FROM mams.approval_history')) return { rows: [{ acted_by: 7 }] };
      throw new Error('Decision write must not occur');
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  await assert.rejects(
    repository.decide({ personId: 10, decision: 'APPROVE', actorUserId: 7, actorRole: 'ADMIN' }),
    (error) => error.code === 'SELF_APPROVAL_FORBIDDEN',
  );
  assert.equal(calls.at(-1).sql, 'ROLLBACK');
});

test('Super Admin cannot decide their own submission', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) return { rows: [{ person_id: 10, status: 'PENDING' }] };
      if (sql.includes('FROM mams.approval_history')) return { rows: [{ acted_by: 7 }] };
      throw new Error('Decision write must not occur');
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  await assert.rejects(
    repository.decide({ personId: 10, decision: 'APPROVE', actorUserId: 7, actorRole: 'SUPER_ADMIN' }),
    (error) => error.code === 'SELF_APPROVAL_FORBIDDEN',
  );
  assert.equal(calls.at(-1).sql, 'ROLLBACK');
});

test('Approver cannot decide their own submission', async () => {
  const client = {
    async query(sql) {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) return { rows: [{ person_id: 10, status: 'PENDING' }] };
      if (sql.includes('FROM mams.approval_history')) return { rows: [{ acted_by: 7 }] };
      throw new Error('Decision write must not occur');
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  await assert.rejects(
    repository.decide({ personId: 10, decision: 'APPROVE', actorUserId: 7, actorRole: 'APPROVER' }),
    (error) => error.code === 'SELF_APPROVAL_FORBIDDEN',
  );
});

test('original submitter resubmits the same rejected record with append-only history', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FROM mams.person')) {
        return { rows: [{ person_id: 10, status: 'REJECTED', registered_by: 7 }] };
      }
      if (sql.includes('UPDATE mams.person')) {
        return { rows: [{ person_id: 10, person_code: 'MB-000010', status: 'PENDING' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  const result = await repository.resubmit({
    personId: 10,
    actorUserId: 7,
    actorRole: 'REG_OFFICER',
  });

  assert.equal(result.status, 'PENDING');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE/);
  assert.match(calls[1].sql, /registered_by/);
  assert.match(calls[2].sql, /SET status = 'PENDING'/);
  assert.equal(calls[2].values[1], 7);
  assert.match(calls[3].sql, /'RESUBMITTED'/);
  assert.match(calls[4].sql, /old_value, new_value/);
  assert.equal(calls[5].sql, 'COMMIT');
});

test('non-submitter Registration Officer cannot resubmit another user record', async () => {
  const client = {
    async query(sql) {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) {
        return { rows: [{ person_id: 10, status: 'REJECTED', registered_by: 7 }] };
      }
      throw new Error('Resubmission write must not occur');
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  await assert.rejects(
    repository.resubmit({ personId: 10, actorUserId: 8, actorRole: 'REG_OFFICER' }),
    (error) => error.code === 'RESUBMISSION_FORBIDDEN',
  );
});

test('approved registration can be rejected and its QR version is invalidated', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) return { rows: [{ person_id: 10, status: 'ACTIVE', registered_by: 4 }] };
      if (sql.includes('FROM mams.approval_history')) return { rows: [] };
      if (sql.includes('UPDATE mams.person')) return { rows: [{ person_id: 10, status: 'REJECTED' }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  const result = await repository.decide({
    personId: 10,
    decision: 'REJECT',
    reason: 'Eligibility documents are missing',
    actorUserId: 7,
    actorRole: 'APPROVER',
  });

  assert.equal(result.status, 'REJECTED');
  assert.match(calls[3].sql, /qr_version = CASE WHEN status = 'ACTIVE' THEN qr_version \+ 1/);
  assert.match(calls[3].sql, /approved_by = NULL, approved_at = NULL/);
  assert.equal(calls[3].values[2], 'ACTIVE');
  assert.deepEqual(JSON.parse(calls[6].values[4]), { status: 'ACTIVE' });
});

test('resubmitting a category without approval returns it to the pending queue', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM mams.person')) {
        return { rows: [{ person_id: 10, status: 'REJECTED', registered_by: 7 }] };
      }
      if (sql.includes('UPDATE mams.person')) {
        return { rows: [{ person_id: 10, person_code: 'MB-000010', status: 'PENDING', qr_version: 2 }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createApprovalsRepository({ async connect() { return client; } });

  const result = await repository.resubmit({ personId: 10, actorUserId: 7, actorRole: 'REG_OFFICER' });

  assert.equal(result.status, 'PENDING');
  assert.match(calls[1].sql, /FOR UPDATE/);
  assert.match(calls[2].sql, /SET status = 'PENDING'/);
  assert.equal(calls[2].values[1], 7);
  assert.deepEqual(JSON.parse(calls[4].values[4]), { status: 'PENDING' });
});