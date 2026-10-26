import assert from 'node:assert/strict';
import test from 'node:test';
import { createCategoriesRepository } from '../src/modules/categories/categories.repository.js';

test('category list applies name, form type, and status filters before pagination', async () => {
  let call;
  const repository = createCategoriesRepository({
    async query(sql, values) { call = { sql, values }; return { rows: [] }; },
  });

  await repository.listCategories({ pageSize: 10, offset: 10, query: 'visitor', formType: 'VISITOR', status: 'ACTIVE' });

  assert.match(call.sql, /c\.name ILIKE/);
  assert.match(call.sql, /c\.form_type = \$2/);
  assert.match(call.sql, /c\.status = \$3/);
  assert.match(call.sql, /LIMIT \$4 OFFSET \$5/);
  assert.deepEqual(call.values, ['visitor', 'VISITOR', 'ACTIVE', 10, 10]);
});
test('category list omits legacy category hierarchy fields', async () => {
  const repository = createCategoriesRepository({
    async query(sql) {
      assert.doesNotMatch(sql, /lookup_value/);
      return { rows: [{ category_id: 1, name: 'Visitor', is_broad: false, broad_category_id: null, total: 1 }] };
    },
  });

  const categories = await repository.listCategories({ pageSize: 10, offset: 0 });

  assert.equal('is_broad' in categories[0], false);
  assert.equal('broad_category_id' in categories[0], false);
});

test('category creation persists approved fields and audit atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('RETURNING category_id')) {
        return {
          rows: [{ category_id: 8, name: 'Helper', form_type: 'GENERIC' }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createCategoriesRepository({
    async connect() { return client; },
    async query() { return { rows: [] }; },
  });

  const category = await repository.createCategory({
    name: 'Helper',
    formType: 'GENERIC',
    approvalRequired: false,
    overstayCutoff: null,
    actorUserId: 3,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(category.category_id, 8);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /INSERT INTO mams\.category/);
  assert.doesNotMatch(calls[1].sql, /permission_level_id/);
  assert.doesNotMatch(calls[1].sql, /is_broad|broad_category_id/);
  assert.match(calls[2].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(calls[2].values[5].length, 100);
  assert.equal(calls[3].sql, 'COMMIT');
});

test('category update uses whitelisted columns and audits old/new values atomically', async () => {
  const calls = [];
  const current = {
    category_id: 8,
    name: 'Helper',
    form_type: 'GENERIC',
    approval_required: false,
    overstay_cutoff: null,
    is_broad: false,
    broad_category_id: null,
  };
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE')) return { rows: [current], rowCount: 1 };
      if (sql.includes('UPDATE mams.category')) {
        return { rows: [{ ...current, name: values[0] }], rowCount: 1 };
      }
      if (sql.includes('SELECT * FROM mams.category')) {
        return { rows: [{ ...current, name: 'Helper Updated' }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createCategoriesRepository({
    async connect() { return client; },
  });

  const updated = await repository.updateCategory({
    categoryId: 8,
    changes: { name: 'Helper Updated' },
    actorUserId: 3,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(updated.name, 'Helper Updated');
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE/);
  assert.match(calls[2].sql, /SET name = \$1, updated_at = now\(\)/);
  assert.deepEqual(calls[2].values, ['Helper Updated', 8]);
  assert.match(calls[3].sql, /old_value, new_value/);
  assert.deepEqual(JSON.parse(calls[3].values[3]), { name: 'Helper' });
  assert.deepEqual(JSON.parse(calls[3].values[4]), { name: 'Helper Updated' });
  assert.equal(calls[3].values[6].length, 100);
  assert.equal(calls[5].sql, 'COMMIT');
  assert.equal('is_broad' in updated, false);
  assert.equal('broad_category_id' in updated, false);
});

test('category deletion locks the row and audits the deletion atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE')) return { rows: [{ category_id: 8, name: 'Visitor', form_type: 'VISITOR' }] };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createCategoriesRepository({ async connect() { return client; } });

  const deleted = await repository.deleteCategory({ categoryId: 8, actorUserId: 3, actorRole: 'ADMIN' });

  assert.equal(deleted.category_id, 8);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FROM mams\.category WHERE category_id = \$1 FOR UPDATE/);
  assert.deepEqual(calls[1].values, [8]);
  assert.match(calls[2].sql, /DELETE FROM mams\.category/);
  assert.match(calls[3].sql, /CATEGORY_DELETED/);
  assert.equal(calls[4].sql, 'COMMIT');
});