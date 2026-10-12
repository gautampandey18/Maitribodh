import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisitsService } from '../src/modules/visits/visits.service.js';

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