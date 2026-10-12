import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLES } from '../src/constants/roles.js';
import { createPersonsService } from '../src/modules/persons/persons.service.js';

test('person search masks mobile for Registration Officers and omits internal fields', async () => {
  const service = createPersonsService({
    repository: {
      async search() {
        return [{
          person_id: 2,
          person_code: 'MB-000002',
          name: 'Maitri User',
          category: 'Visitor',
          mobile: '9876543210',
          status: 'ACTIVE',
          total: '3',
          photo_key: undefined,
        }];
      },
    },
  });

  const result = await service.search({
    query: '9876543210',
    page: 1,
    actorRole: ROLES.REGISTRATION_OFFICER,
  });

  assert.equal(result.items[0].mobile, '******3210');
  assert.equal(result.total, 3);
  assert.equal(result.items[0].total, undefined);
  assert.equal(result.items[0].photo_key, undefined);
});

test('person search returns mobile to Admin roles', async () => {
  const service = createPersonsService({
    repository: {
      async search() {
        return [{ person_id: 2, mobile: '9876543210', total: 1 }];
      },
    },
  });

  const result = await service.search({ query: 'MB-000002', page: 1, actorRole: ROLES.ADMIN });

  assert.equal(result.items[0].mobile, '9876543210');
});