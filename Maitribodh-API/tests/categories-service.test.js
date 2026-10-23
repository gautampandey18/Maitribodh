import assert from 'node:assert/strict';
import test from 'node:test';
import { createCategoriesService } from '../src/modules/categories/categories.service.js';

test('category list returns repository rows with pagination metadata', async () => {
  const categories = [{ category_id: 1, name: 'Visitor', total: 1 }];
  const service = createCategoriesService({
    repository: { async listCategories() { return categories; } },
  });

  assert.deepEqual(await service.listCategories({ page: 1, pageSize: 25 }), {
    items: [{ category_id: 1, name: 'Visitor' }], total: 1, page: 1, pageSize: 25,
  });
});

test('duplicate category names become a safe conflict response', async () => {
  const service = createCategoriesService({
    repository: {
      async createCategory() {
        throw { code: '23505' };
      },
    },
  });

  await assert.rejects(
    service.createCategory({ input: {}, actor: { userId: 1, role: 'ADMIN' } }),
    (error) => error.statusCode === 409 && error.code === 'CATEGORY_ALREADY_EXISTS',
  );
});

test('invalid lookup references become a validation response', async () => {
  const service = createCategoriesService({
    repository: {
      async createCategory() {
        throw { code: '23503' };
      },
    },
  });

  await assert.rejects(
    service.createCategory({ input: {}, actor: { userId: 1, role: 'ADMIN' } }),
    (error) => error.statusCode === 400 && error.code === 'INVALID_MASTER_REFERENCE',
  );
});

test('category deletion reports when records still reference the category', async () => {
  const service = createCategoriesService({
    repository: { async deleteCategory() { throw { code: '23503' }; } },
  });

  await assert.rejects(
    service.deleteCategory({ categoryId: 4, actor: { userId: 1, role: 'ADMIN' } }),
    (error) => error.statusCode === 409
      && error.code === 'MASTER_DATA_IN_USE'
      && error.message === 'This category is in use and cannot be deleted. Deactivate it instead.',
  );
});