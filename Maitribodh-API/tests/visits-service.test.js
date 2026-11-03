import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisitsService } from '../src/modules/visits/visits.service.js';

test('check-in service forwards event acknowledgement to the transaction', async () => {
  let received;
  const service = createVisitsService({ repository: {
    async checkIn(input) { received = input; return { visit_id: 4 }; },
  } });
  await service.checkIn({
    personId: 8, checkinGateId: 1, checkinLocationId: 2, eventAcknowledged: true,
    actor: { userId: 7, role: 'SECURITY_GUARD' },
  });
  assert.equal(received.eventAcknowledged, true);
  assert.equal(received.actorUserId, 7);
});

test('checkout without an open visit maps to a conflict', async () => {
  const service = createVisitsService({
    repository: { async checkOut() { return null; } },
  });

  await assert.rejects(
    service.checkOut({
      visitId: 4,
      checkoutGateId: 1,
      checkoutLocationId: 2,
      actor: { userId: 7, role: 'SECURITY_GUARD' },
    }),
    (error) => error.statusCode === 409 && error.code === 'NO_ACTIVE_CHECKIN',
  );
});