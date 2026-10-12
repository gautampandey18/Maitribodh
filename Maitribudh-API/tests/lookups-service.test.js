import assert from 'node:assert/strict';
import test from 'node:test';
import { createLookupsService } from '../src/modules/lookups/lookups.service.js';

test('lookup creation requires the schema-specific relation', async () => {
  const service = createLookupsService({ repository: { async createValue() {} } });

  await assert.rejects(
    service.createValue({
      input: { lookupType: 'SUBCATEGORY', name: 'Group', parentId: 1, categoryId: null, extra: {} },
      actor: { userId: 1, role: 'ADMIN' },
    }),
    (error) => error.code === 'INVALID_LOOKUP_RELATION',
  );
});

test('subcategory creation accepts category linkage and nullable parent', async () => {
  let persisted;
  const service = createLookupsService({
    repository: {
      async createValue(input) {
        persisted = input;
        return { lookup_id: 20 };
      },
    },
  });

  const value = await service.createValue({
    input: { lookupType: 'SUBCATEGORY', name: 'Group', parentId: null, categoryId: 3, extra: {} },
    actor: { userId: 1, role: 'ADMIN' },
  });

  assert.equal(value.lookup_id, 20);
  assert.equal(persisted.categoryId, 3);
});

test('lookup update returns not found when type and ID do not match', async () => {
  const service = createLookupsService({
    repository: { async updateValue() { return null; } },
  });

  await assert.rejects(
    service.updateValue({
      lookupType: 'DEPARTMENT',
      lookupId: 4,
      changes: { status: 'INACTIVE' },
      actor: { userId: 1, role: 'ADMIN' },
    }),
    (error) => error.statusCode === 404 && error.code === 'LOOKUP_NOT_FOUND',
  );
});