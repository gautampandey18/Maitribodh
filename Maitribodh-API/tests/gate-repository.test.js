import assert from 'node:assert/strict';
import test from 'node:test';
import { createGateRepository } from '../src/modules/gate/gate.repository.js';

test('gate candidate query uses active location and checks blacklist, open visit, and assignments', async () => {
  let queryInput;
  const repository = createGateRepository({
    async query(sql, values) {
      queryInput = { sql, values };
      return { rows: [{ person_id: 7, is_blacklisted: false, location_warning: false }] };
    },
  });

  await repository.findCandidates({ personCode: null, mobile: '9876543210', locationId: 3 });

  assert.match(queryInput.sql, /l\.status = 'ACTIVE'/);
  assert.match(queryInput.sql, /b\.lifted_at IS NULL/);
  assert.match(queryInput.sql, /v\.status = 'OPEN'/);
  assert.match(queryInput.sql, /mams\.person_location/);
  assert.match(queryInput.sql, /AS assigned_area_ids/);
  assert.match(queryInput.sql, /c\.form_type = 'PARTICIPANT'/);
  assert.match(queryInput.sql, /program\.extra->>'end_date'/);
  assert.match(queryInput.sql, /AS event_expired/);
  assert.match(queryInput.sql, /future_checkin_access' = 'YES'/);
  assert.match(queryInput.sql, /program\.lookup_id::text = p\.category_details->>'program_batch_id'/);
  assert.match(queryInput.sql, /p\.mobile = \$2/);
    assert.deepEqual(queryInput.values, [null, '9876543210', 3, null]);
});

test('gate lookup audit stores a masked mobile and outcome data', async () => {
  let auditInput;
  const repository = createGateRepository({
    async query(_sql, values) {
      auditInput = values;
      return { rowCount: 1 };
    },
  });

  await repository.recordLookup({
    actorUserId: 8,
    actorRole: 'SECURITY_GUARD',
    resultCount: 1,
    outcomes: ['ELIGIBLE'],
    mobileMasked: '******3210',
    ipAddress: '127.0.0.1',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.deepEqual(JSON.parse(auditInput[3]), { mobile_masked: '******3210' });
  assert.deepEqual(JSON.parse(auditInput[4]), { matches: 1, outcomes: ['ELIGIBLE'] });
  assert.equal(auditInput[6].length, 100);
});

test('gate lookup audit stores matched and blocked person ids for report filtering', async () => {
  let auditInput;
  const repository = createGateRepository({
    async query(_sql, values) {
      auditInput ??= values;
      return { rowCount: 1 };
    },
  });

  await repository.recordLookup({
    actorUserId: 8,
    actorRole: 'SECURITY_GUARD',
    resultCount: 2,
    outcomes: ['BLOCKED_BLACKLIST', 'ELIGIBLE'],
    personIds: ['11', '12'],
    blockedPersonIds: ['11'],
  });

  assert.deepEqual(JSON.parse(auditInput[4]), {
    matches: 2,
    outcomes: ['BLOCKED_BLACKLIST', 'ELIGIBLE'],
    person_ids: [11, 12],
    blocked_person_ids: [11],
  });
});

test('blacklist alerts are sent to active Admin and Super Admin users', async () => {
  const queries = [];
  const repository = createGateRepository({
    async query(sql) {
      queries.push(sql);
      return { rowCount: 1 };
    },
  });

  await repository.recordLookup({
    actorUserId: 8,
    actorRole: 'SECURITY_GUARD',
    resultCount: 1,
    outcomes: ['BLOCKED_BLACKLIST'],
  });

  assert.equal(queries.length, 2);
  assert.match(queries[1], /roles && ARRAY\['ADMIN', 'SUPER_ADMIN'\]::varchar\[\]/);
  assert.doesNotMatch(queries[1], /is_security_head/);
});