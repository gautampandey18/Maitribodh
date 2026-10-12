import assert from 'node:assert/strict';
import test from 'node:test';
import { createLookupsRepository } from '../src/modules/lookups/lookups.repository.js';

test('lookup query filters subcategories by category and other values by parent', async () => {
  let queryInput;
  const repository = createLookupsRepository({
    async query(sql, values) {
      queryInput = { sql, values };
      return { rows: [{ lookup_id: 8, name: 'Example', extra: {} }] };
    },
  });

  const values = await repository.listValues('SUBCATEGORY', 4);

  assert.equal(values[0].lookup_id, 8);
  assert.match(queryInput.sql, /lookup_type = 'SUBCATEGORY' AND category_id = \$2/);
  assert.match(queryInput.sql, /lookup_type <> 'SUBCATEGORY' AND parent_id = \$2/);
  assert.match(queryInput.sql, /name ILIKE/);
  assert.deepEqual(queryInput.values, ['SUBCATEGORY', 4, false, '']);
});

test('unfiltered lookup list supplies a null parent', async () => {
  let queryValues;
  const repository = createLookupsRepository({
    async query(_sql, values) {
      queryValues = values;
      return { rows: [] };
    },
  });

  await repository.listValues('DEPARTMENT');

  assert.deepEqual(queryValues, ['DEPARTMENT', null, false, '']);
});

test('administrative lookup view includes inactive values explicitly', async () => {
  let queryValues;
  const repository = createLookupsRepository({ async query(_sql, values) { queryValues = values; return { rows: [] }; } });
  await repository.listValues('DEPARTMENT', undefined, true);
  assert.deepEqual(queryValues, ['DEPARTMENT', null, true, '']);
});

test('job-role values verify their parent is a department and audit atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('SELECT lookup_type')) return { rows: [{ lookup_type: 'DEPARTMENT' }] };
      if (sql.includes('RETURNING lookup_id')) {
        return { rows: [{ lookup_id: 17, lookup_type: 'JOB_ROLE', name: 'Coordinator' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createLookupsRepository({ async connect() { return client; } });

  const value = await repository.createValue({
    lookupType: 'JOB_ROLE',
    name: 'Coordinator',
    parentId: 4,
    categoryId: null,
    extra: {},
    actorUserId: 2,
    actorRole: 'ADMIN',
  });

  assert.equal(value.lookup_id, 17);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.deepEqual(calls[1].values, [4]);
  assert.match(calls[2].sql, /INSERT INTO mams\.lookup_value/);
  assert.match(calls[3].sql, /INSERT INTO mams\.audit_log/);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('job-role creation rejects a non-department parent', async () => {
  let inserted = false;
  const client = {
    async query(sql) {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('SELECT lookup_type')) return { rows: [{ lookup_type: 'JOB_ROLE' }] };
      inserted = true;
      return { rows: [] };
    },
    release() {},
  };
  const repository = createLookupsRepository({ async connect() { return client; } });

  await assert.rejects(
    repository.createValue({
      lookupType: 'JOB_ROLE', name: 'Coordinator', parentId: 4,
      categoryId: null, extra: {}, actorUserId: 2, actorRole: 'ADMIN',
    }),
    (error) => error.code === 'INVALID_LOOKUP_PARENT',
  );
  assert.equal(inserted, false);
});

test('lookup update preserves its type hierarchy and records old/new values', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ lookup_id: 6, lookup_type: 'DEPARTMENT', name: 'Operations', extra: {}, status: 'ACTIVE' }] };
      }
      if (sql.includes('UPDATE mams.lookup_value')) {
        return { rows: [{ lookup_id: 6, lookup_type: 'DEPARTMENT', name: 'Operations North', status: 'ACTIVE' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createLookupsRepository({ async connect() { return client; } });

  const result = await repository.updateValue({
    lookupType: 'DEPARTMENT',
    lookupId: 6,
    changes: { name: 'Operations North' },
    actorUserId: 2,
    actorRole: 'ADMIN',
    device: 'Browser '.padEnd(140, 'x'),
  });

  assert.equal(result.name, 'Operations North');
  assert.match(calls[1].sql, /lookup_id = \$1 AND lookup_type = \$2/);
  assert.match(calls[2].sql, /SET name = \$1, updated_at = now\(\)/);
  assert.deepEqual(calls[2].values, ['Operations North', 6, 'DEPARTMENT']);
  assert.deepEqual(JSON.parse(calls[3].values[3]), { name: 'Operations' });
  assert.deepEqual(JSON.parse(calls[3].values[4]), { name: 'Operations North' });
  assert.equal(calls[3].values[6].length, 100);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('lookup table pagination is opt-in and returns page metadata', async () => {
  let queryInput;
  const repository = createLookupsRepository({
    async query(sql, values) {
      queryInput = { sql, values };
      return { rows: [{ lookup_id: 3, name: 'Accounts', total: 31 }] };
    },
  });
  const page = await repository.listValues('DEPARTMENT', undefined, true, { page: 2, pageSize: 10, offset: 10 });

  assert.match(queryInput.sql, /LIMIT \$5 OFFSET \$6/);
  assert.deepEqual(queryInput.values, ['DEPARTMENT', null, true, '', 10, 10]);
  assert.deepEqual(page, { items: [{ lookup_id: 3, name: 'Accounts' }], total: 31, page: 2, pageSize: 10 });
});