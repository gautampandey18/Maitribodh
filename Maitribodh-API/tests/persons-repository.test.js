import assert from 'node:assert/strict';
import test from 'node:test';
import { createPersonsRepository } from '../src/modules/persons/persons.repository.js';

test('person search uses the documented filters, preserves duplicates, and accepts the page size', async () => {
  let queryInput;
  const repository = createPersonsRepository({
    async query(sql, values) {
      queryInput = { sql, values };
      return { rows: [{ person_id: 1, total: '26' }] };
    },
  });

  const rows = await repository.search({ query: 'MB-000001', categoryId: 4, status: 'ACTIVE', offset: 25, pageSize: 50 });

  assert.equal(rows[0].person_id, 1);
  assert.match(queryInput.sql, /LIMIT \$5 OFFSET \$4/);
  assert.match(queryInput.sql, /\$1 = '' OR p\.person_code/);
  assert.match(queryInput.sql, /p\.mobile = \$1/);
  assert.match(queryInput.sql, /identity\.qr_code AS identity_qr_code, identity\.qr_version/);
  assert.match(queryInput.sql, /regexp_replace\(p\.mobile/);
  assert.doesNotMatch(queryInput.sql, /DISTINCT/);
  assert.doesNotMatch(queryInput.sql, /photo_key/);
  assert.deepEqual(queryInput.values, ['MB-000001', 4, 'ACTIVE', 25, 50]);
});

test('person search with pending status requires category approval', async () => {
  let queryInput;
  const repository = createPersonsRepository({
    async query(sql, values) {
      queryInput = { sql, values };
      return { rows: [] };
    },
  });

  await repository.search({ query: '', categoryId: null, status: 'PENDING', offset: 0, pageSize: 10 });

  assert.match(queryInput.sql, /c\.approval_required = true/);
  assert.match(queryInput.sql, /CASE WHEN c\.approval_required = false AND p\.status = 'PENDING' THEN 'ACTIVE'/);
});