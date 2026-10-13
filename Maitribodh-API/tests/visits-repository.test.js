import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisitsRepository } from '../src/modules/visits/visits.repository.js';

test('check-in permits assigned location access and audits it atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FROM mams.person AS p')) {
        return {
          rows: [{
            person_id: 8,
            status: 'ACTIVE',
            accompanying_count: 1,
            accompanying: [{ name: 'Guest' }],
            gate_valid: true,
            area_valid: true,
            is_blacklisted: false,
            already_inside: false,
            location_warning: false,
          }],
        };
      }
      if (sql.includes('INSERT INTO mams.visit')) {
        return {
          rows: [{
            visit_id: 4,
            person_id: 8,
            status: 'OPEN',
            accompanying_count: 1,
            accompanying_names: [{ name: 'Guest' }],
            location_override: false,
          }],
        };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createVisitsRepository({ async connect() { return client; } });

  const visit = await repository.checkIn({
    personId: 8,
    checkinGateId: 2,
    checkinLocationId: 3,
    actorUserId: 7,
    actorRole: 'SECURITY_GUARD',
    device: 'guard-device',
    ipAddress: '127.0.0.1',
  });

  assert.equal(visit.locationWarning, false);
  assert.equal(visit.location_override, false);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE OF p/);
  assert.match(calls[2].sql, /location_override\)\s+VALUES .*\$8/s);
  assert.equal(calls[2].values[7], false);
  assert.match(calls[3].sql, /INSERT INTO mams.audit_log/);
  assert.match(calls[3].values[3], /"location_warning":false/);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('check-in rejects blacklisted people without inserting a visit', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      if (sql.includes('FROM mams.person AS p')) {
        return {
          rows: [{
            person_id: 8,
            status: 'ACTIVE',
            gate_valid: true,
            area_valid: true,
            is_blacklisted: true,
            already_inside: false,
            location_warning: false,
          }],
        };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createVisitsRepository({ async connect() { return client; } });

  await assert.rejects(
    repository.checkIn({
      personId: 8,
      checkinGateId: 2,
      checkinLocationId: 3,
      actorUserId: 7,
      actorRole: 'SECURITY_GUARD',
    }),
    (error) => error.statusCode === 409 && error.code === 'BLOCKED_BLACKLIST',
  );
  assert.equal(calls.some((sql) => sql.includes('INSERT INTO mams.visit')), false);
  assert.equal(calls.at(-1), 'ROLLBACK');
});

test('checkout locks and closes the open visit with an audit row atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ visit_id: 4, person_id: 8, status: 'OPEN', checkin_at: '2026-10-09T08:00:00Z' }] };
      }
      if (sql.includes('UPDATE mams.visit')) {
        return { rows: [{ visit_id: 4, person_id: 8, status: 'CLOSED', checkout_at: '2026-10-09T09:00:00Z' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createVisitsRepository({ async connect() { return client; } });

  const visit = await repository.checkOut({
    visitId: 4,
    checkoutGateId: 2,
    checkoutLocationId: 3,
    actorUserId: 7,
    actorRole: 'SECURITY_GUARD',
    device: 'guard-device',
  });

  assert.equal(visit.status, 'CLOSED');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE/);
  assert.match(calls[2].sql, /status = 'CLOSED'/);
  assert.match(calls[3].sql, /INSERT INTO mams.audit_log/);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('check-in records a location override for an unassigned restricted area', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FROM mams.person AS p')) {
        return { rows: [{ person_id: 8, status: 'ACTIVE', gate_valid: true, area_valid: true, location_warning: true, is_blacklisted: false, already_inside: false }] };
      }
      if (sql.includes('INSERT INTO mams.visit')) return { rows: [{ visit_id: 4, person_id: 8, status: 'OPEN', location_override: true }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createVisitsRepository({ async connect() { return client; } });
  const visit = await repository.checkIn({ personId: 8, checkinGateId: 2, checkinLocationId: 3, actorUserId: 7, actorRole: 'SECURITY_GUARD' });

  assert.equal(visit.locationWarning, true);
  const insert = calls.find((call) => call.sql.includes('INSERT INTO mams.visit'));
  assert.equal(insert.values[7], true);
  assert.equal(calls.at(-1).sql, 'COMMIT');
});

test('check-in still blocks expired access without a visit', async () => {
  for (const [flags, code] of [[{ access_expired: true }, 'NOT_ACTIVE']]) {
    const calls = [];
    const client = {
      async query(sql) {
        calls.push(sql);
        return sql.includes('FROM mams.person AS p') ? { rows: [{ status: 'ACTIVE', gate_valid: true, area_valid: true, ...flags }] } : { rows: [] };
      },
      release() {},
    };
    const repository = createVisitsRepository({ async connect() { return client; } });
    await assert.rejects(repository.checkIn({ personId: 8, checkinGateId: 2, checkinLocationId: 3 }), (error) => error.code === code);
    assert.equal(calls.some((sql) => sql.includes('INSERT INTO mams.visit')), false);
    assert.equal(calls.at(-1), 'ROLLBACK');
  }
});

test('admin reconciliation closes one open visit and records the required audit note atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE OF v')) return { rows: [{ visit_id: 4, person_id: 8, name: 'Asha Patel', location: 'Assembly Hall' }] };
      if (sql.includes('UPDATE mams.visit')) return { rows: [{ visit_id: 4, person_id: 8, status: 'CLOSED_BY_ADMIN', admin_note: 'Verified left site' }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createVisitsRepository({ async connect() { return client; } });
  const visit = await repository.reconcile({ visitId: 4, note: 'Verified left site', actorUserId: 2, actorRole: 'ADMIN', ipAddress: '127.0.0.1', device: 'Browser '.padEnd(140, 'x') });
  assert.equal(visit.status, 'CLOSED_BY_ADMIN');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE OF v/);
  assert.match(calls[2].sql, /checkout_at = now\(\)/);
  assert.match(calls[3].sql, /MANUAL_VISIT_RECONCILIATION/);
  assert.equal(calls[3].values[4], JSON.stringify({ status: 'CLOSED_BY_ADMIN', reason: 'Verified left site' }));
  assert.equal(calls[3].values[6].length, 100);
  assert.equal(calls.at(-1).sql, 'COMMIT');
});