import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocationsService } from '../src/modules/locations/locations.service.js';

test('a gate cannot be created as restricted', async () => {
  let inserted = false;
  const service = createLocationsService({
    repository: {
      async createLocation() { inserted = true; },
    },
  });

  await assert.rejects(
    service.createLocation({
      input: { locationType: 'GATE', isRestricted: true },
      actor: { userId: 1, role: 'ADMIN' },
    }),
    (error) => error.code === 'INVALID_LOCATION',
  );
  assert.equal(inserted, false);
});

test('an area may be restricted', async () => {
  let inserted;
  const service = createLocationsService({
    repository: {
      async createLocation(input) {
        inserted = input;
        return { location_id: 4, location_type: input.locationType, is_restricted: input.isRestricted };
      },
    },
  });

  const location = await service.createLocation({
    input: { name: 'Quiet Area', locationType: 'AREA', isRestricted: true },
    actor: { userId: 1, role: 'ADMIN' },
  });

  assert.equal(location.is_restricted, true);
  assert.equal(inserted.actorUserId, 1);
});

test('a database gate constraint failure becomes a safe validation error', async () => {
  const service = createLocationsService({
    repository: {
      async updateLocation() {
        throw { code: '23514' };
      },
    },
  });

  await assert.rejects(
    service.updateLocation({
      locationId: 4,
      changes: { isRestricted: true },
      actor: { userId: 1, role: 'ADMIN' },
    }),
    (error) => error.statusCode === 400 && error.code === 'INVALID_LOCATION',
  );
});