import assert from 'node:assert/strict';
import test from 'node:test';
import { createGateService } from '../src/modules/gate/gate.service.js';

test('gate decisions follow blacklist, status, inside, and location precedence', async () => {
  const rows = [
    { person_id: 1, status: 'ACTIVE', is_blacklisted: true, open_visit_id: null, location_warning: false },
    { person_id: 2, status: 'PENDING', is_blacklisted: false, open_visit_id: null, location_warning: false },
    { person_id: 3, status: 'ACTIVE', is_blacklisted: false, open_visit_id: 4, location_warning: true },
    { person_id: 4, status: 'ACTIVE', is_blacklisted: false, open_visit_id: null, location_warning: true },
    { person_id: 5, status: 'ACTIVE', is_blacklisted: false, open_visit_id: null, location_warning: false, assigned_area_ids: [2] },
  ];
  let audit;
  const service = createGateService({
    repository: {
      async isActiveLocation() { return true; },
      async findCandidates() { return rows; },
      async recordLookup(input) { audit = input; },
    },
    qrService: { verifyQrPayload() { return null; } },
  });

  const result = await service.lookup({
    mobile: '9876543210',
    locationId: 2,
    actor: { userId: 8, role: 'SECURITY_GUARD' },
  });

  assert.deepEqual(result.items.map((item) => item.outcome), [
    'BLOCKED_BLACKLIST', 'NOT_ACTIVE', 'ALREADY_INSIDE', 'LOCATION_WARNING', 'ELIGIBLE',
  ]);
  assert.equal(audit.mobileMasked, '******3210');
  assert.deepEqual(audit.personIds, [1, 2, 3, 4, 5]);
  assert.deepEqual(audit.blockedPersonIds, [1]);
  assert.deepEqual(result.items[4].assignedAreaIds, [2]);
});

test('completed events require explicit future access and preserve gate restrictions', async () => {
  const base = { status: 'ACTIVE', open_visit_id: null, event_expired: true, future_checkin_access: false };
  const rows = [
    base,
    { ...base, future_checkin_access: true },
    { ...base, future_checkin_access: true, location_warning: true },
    { ...base, future_checkin_access: true, is_blacklisted: true },
    { ...base, future_checkin_access: true, status: 'DEACTIVATED' },
    { ...base, event_expired: false },
    { ...base, future_checkin_access: undefined },
    { ...base, future_checkin_access: true, access_expired: true },
    { ...base, future_checkin_access: true, open_visit_id: 4 },
  ].map((row, index) => ({ ...row, person_id: index + 1 }));
  const service = createGateService({
    repository: {
      async isActiveLocation() { return true; },
      async findCandidates() { return rows; },
      async recordLookup() {},
    },
    qrService: {},
  });
  const result = await service.lookup({ mobile: '9876543210', locationId: 2, actor: { userId: 8 } });
  assert.deepEqual(result.items.map((item) => item.outcome), [
    'EVENT_ACCESS_EXPIRED', 'ELIGIBLE', 'LOCATION_WARNING', 'BLOCKED_BLACKLIST',
    'NOT_ACTIVE', 'ELIGIBLE', 'EVENT_ACCESS_EXPIRED', 'NOT_ACTIVE', 'ALREADY_INSIDE',
  ]);
  assert.deepEqual(result.items.map((item) => item.eventWarning), [false, true, true, false, false, false, false, false, true]);
});

test('invalid QR is audited and rejected before person lookup', async () => {
  let candidateQuery = false;
  let audit;
  const service = createGateService({
    repository: {
      async isActiveLocation() { return true; },
      async findCandidates() { candidateQuery = true; return []; },
      async recordLookup(input) { audit = input; },
    },
    qrService: { verifyQrPayload() { return null; } },
  });

  await assert.rejects(
    service.lookup({
      qrPayload: 'tampered',
      locationId: 2,
      actor: { userId: 8, role: 'SECURITY_GUARD' },
    }),
    (error) => error.code === 'INVALID_QR',
  );
  assert.equal(candidateQuery, false);
  assert.deepEqual(audit.outcomes, ['INVALID_QR']);
});

test('mobile lookup returns a uniform not-found outcome and audits masked input', async () => {
  let audit;
  const service = createGateService({
    repository: {
      async isActiveLocation() { return true; },
      async findCandidates() { return []; },
      async recordLookup(input) { audit = input; },
    },
    qrService: {},
  });

  const result = await service.lookup({
    mobile: '9876543210',
    locationId: 2,
    actor: { userId: 8, role: 'SECURITY_GUARD' },
  });

  assert.deepEqual(result, { items: [], outcome: 'NOT_FOUND' });
  assert.equal(audit.mobileMasked, '******3210');
});