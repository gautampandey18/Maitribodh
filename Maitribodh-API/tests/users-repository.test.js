import assert from 'node:assert/strict';
import test from 'node:test';
import { createUsersRepository } from '../src/modules/users/users.repository.js';

test('user list and detail projections exclude credential/token fields', async () => {
  const queries = [];
  const repository = createUsersRepository({
    async query(sql, values = []) {
      queries.push({ sql, values });
      return { rows: [] };
    },
  });

  await repository.listUsers({ pageSize: 25, offset: 0 });
  await repository.getUser(15);

  assert.equal(queries.length, 2);
  for (const query of queries) {
    assert.match(query.sql, /is_security_head, can_bulk_upload, status/);
    assert.doesNotMatch(query.sql, /password_hash|token_version|failed_login_count/);
  }
  assert.deepEqual(queries[1].values, [15]);
  assert.match(queries[0].sql, /count\(\*\) OVER\(\)::int AS total/);
  assert.match(queries[0].sql, /username ILIKE/);
  assert.match(queries[0].sql, /regexp_replace\(mobile, '\[\^0-9\]'/);
  assert.match(queries[0].sql, /AND \(\$2::varchar IS NULL OR \$2 = ANY\(roles\)\)/);
  assert.match(queries[0].sql, /LIMIT \$4 OFFSET \$5/);
  assert.deepEqual(queries[0].values, ['', null, null, 25, 0]);
});

test('user creation inserts no password and commits together with its audit record', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('RETURNING user_id')) {
        return {
          rows: [{ user_id: 42, username: 'new.user', role: 'APPROVER' }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createUsersRepository({
    async connect() {
      return client;
    },
  });

  const result = await repository.createUser({
    firstName: 'New',
    lastName: 'User',
    mobile: '9876543210',
    email: null,
    username: 'new.user',
    role: 'APPROVER',
    isSecurityHead: false,
    canBulkUpload: false,
    createdBy: 3,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.deepEqual(result, { user_id: 42, username: 'new.user', role: 'APPROVER' });
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /pg_advisory_xact_lock/);
  assert.match(calls[2].sql, /INSERT INTO mams\.app_user/);
  assert.doesNotMatch(calls[2].sql, /password_hash/);
  assert.match(calls[3].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(calls[3].values[5].length, 100);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('user creation rolls back if audit insertion fails', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      if (sql.includes('INSERT INTO mams.audit_log')) {
        throw new Error('audit unavailable');
      }
      if (sql.includes('RETURNING user_id')) {
        return { rows: [{ user_id: 42 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createUsersRepository({
    async connect() {
      return client;
    },
  });

  await assert.rejects(repository.createUser({
    firstName: 'New',
    lastName: 'User',
    mobile: '9876543210',
    email: null,
    username: 'new.user',
    role: 'APPROVER',
    isSecurityHead: false,
    canBulkUpload: false,
    createdBy: 3,
    actorRole: 'ADMIN',
  }), /audit unavailable/);

  assert.equal(calls[0], 'BEGIN');
  assert.match(calls[1], /pg_advisory_xact_lock/);
  assert.match(calls[2], /INSERT INTO mams\.app_user/);
  assert.match(calls[3], /INSERT INTO mams\.audit_log/);
  assert.equal(calls[4], 'ROLLBACK');
});

test('user role updates persist every role, invalidate changed sessions, and audit assignments', async () => {
  const calls = [];
  const roles = ['APPROVER', 'SECURITY_GUARD'];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('SELECT roles')) return { rows: [{ roles: ['APPROVER'] }] };
      if (sql.includes('RETURNING user_id')) return { rows: [{ user_id: 25, role: 'APPROVER', roles }] };
      return { rows: [] };
    },
    release() {},
  };
  const repository = createUsersRepository({ async connect() { return client; } });
  const result = await repository.updateUser({
    targetUserId: 25, role: 'APPROVER', roles, actorUserId: 7, actorRole: 'ADMIN',
  });
  assert.deepEqual(result.roles, roles);
  const update = calls.find(({ sql }) => sql.includes('UPDATE mams.app_user'));
  assert.deepEqual(update.values[11], roles);
  assert.match(update.sql, /roles = COALESCE\(\$12::varchar\[\], roles\)/);
  assert.match(update.sql, /roles IS DISTINCT FROM \$12::varchar\[\]/);
  assert.match(update.sql, /THEN token_version \+ 1/);
  const audit = calls.find(({ sql }) => sql.includes('INSERT INTO mams.audit_log'));
  assert.deepEqual(JSON.parse(audit.values[3]).roles, roles);
  assert.equal(calls.at(-1).sql, 'COMMIT');
});

test('an Admin cannot replace a Super Admin role assignment', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return { rows: sql.includes('SELECT roles') ? [{ roles: ['SUPER_ADMIN'] }] : [] };
    },
    release() {},
  };
  const repository = createUsersRepository({ async connect() { return client; } });
  await assert.rejects(repository.updateUser({
    targetUserId: 1, roles: ['VIEWER'], actorUserId: 7, actorRole: 'ADMIN',
  }), { code: 'FORBIDDEN' });
  assert.ok(!calls.some((sql) => sql.includes('UPDATE mams.app_user')));
  assert.equal(calls.at(-1), 'ROLLBACK');
});

test('deactivation increments token_version and bulk permission is audited in one transaction', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('RETURNING user_id, first_name')) {
        return { rows: [{ user_id: 25, status: 'INACTIVE', can_bulk_upload: false }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createUsersRepository({
    async connect() {
      return client;
    },
  });

  await repository.updateUser({
    targetUserId: 25,
    deactivate: true,
    canBulkUpload: false,
    actorUserId: 7,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /pg_advisory_xact_lock/);
  assert.match(calls[2].sql, /token_version = CASE WHEN \$2::boolean OR \$11::boolean OR/);
  assert.match(calls[2].sql, /THEN token_version \+ 1/);
  assert.equal(calls[2].values[1], true);
  assert.equal(calls[2].values[2], false);
  assert.match(calls[3].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(calls[3].values[5].length, 100);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('activation restores an inactive account and revokes prior sessions transactionally', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('RETURNING user_id, first_name')) {
        return { rows: [{ user_id: 25, status: 'ACTIVE', can_bulk_upload: false }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createUsersRepository({
    async connect() {
      return client;
    },
  });

  const user = await repository.updateUser({
    targetUserId: 25,
    activate: true,
    actorUserId: 7,
    actorRole: 'ADMIN',
  });

  assert.equal(user.status, 'ACTIVE');
  assert.equal(calls[2].values[1], false);
  assert.equal(calls[2].values[10], true);
  assert.match(calls[2].sql, /status = CASE WHEN \$2::boolean THEN 'INACTIVE' WHEN \$11::boolean THEN 'ACTIVE'/);
  assert.match(calls[2].sql, /token_version = CASE WHEN \$2::boolean OR \$11::boolean OR/);
  assert.match(calls[2].sql, /THEN token_version \+ 1/);
  assert.match(calls[3].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(JSON.parse(calls[3].values[3]).status, 'ACTIVE');
  assert.equal(calls[4].sql, 'COMMIT');
});

test('deleteUser decouples operational records and deletes user without cascading onto persons or visits', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('DELETE FROM mams.app_user')) {
        return { rows: [{ user_id: 25, username: 'admin.x' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createUsersRepository({
    async connect() {
      return client;
    },
  });

  const deleted = await repository.deleteUser({
    targetUserId: 25,
    actorUserId: 1,
    actorRole: 'SUPER_ADMIN',
  });

  assert.deepEqual(deleted, { user_id: 25, username: 'admin.x' });
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /pg_advisory_xact_lock/);
  assert.ok(calls.some((c) => c.sql.includes('ALTER TABLE IF EXISTS mams.approval_history ALTER COLUMN acted_by DROP NOT NULL')));
  assert.ok(calls.some((c) => c.sql.includes('ck_person_consent_fields')));
  assert.ok(calls.some((c) => c.sql.includes('DELETE FROM mams.notification WHERE user_id = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.audit_log SET user_id = NULL WHERE user_id = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.person SET registered_by = NULL WHERE registered_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.person SET approved_by = NULL WHERE approved_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.person_location SET assigned_by = NULL WHERE assigned_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.approval_history SET acted_by = NULL WHERE acted_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.visit SET checkin_by = NULL WHERE checkin_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.blacklist SET added_by = NULL WHERE added_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.bulk_upload SET uploaded_by = NULL WHERE uploaded_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('UPDATE mams.app_user SET created_by = NULL WHERE created_by = $1')));
  assert.ok(calls.some((c) => c.sql.includes('DELETE FROM mams.app_user WHERE user_id = $1')));
  assert.ok(calls.some((c) => c.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
