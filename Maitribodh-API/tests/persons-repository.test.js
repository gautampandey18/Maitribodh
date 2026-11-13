import assert from 'node:assert/strict';
import test from 'node:test';
import { createPersonsRepository } from '../src/modules/persons/persons.repository.js';

test('active QR lookup allows approval-exempt pending memberships', async () => {
  let query;
  const repository = createPersonsRepository({
    async query(sql, values) {
      query = { sql, values };
      return { rows: [{ person_code: 'MB-000008', qr_version: 2 }] };
    },
  });

  const qr = await repository.getActivePersonQr(8);

  assert.deepEqual(qr, { person_code: 'MB-000008', qr_version: 2 });
  assert.match(query.sql, /category\.approval_required = false/);
  assert.deepEqual(query.values, [8]);
});

test('person search groups registrations by identity and accepts the page size', async () => {
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
  assert.match(queryInput.sql, /\$1 = '' OR identity\.qr_code/);
  assert.match(queryInput.sql, /identity\.mobile = \$1/);
  assert.match(queryInput.sql, /identity\.qr_code AS identity_qr_code, identity\.qr_version/);
  assert.match(queryInput.sql, /regexp_replace\(identity\.mobile/);
  assert.match(queryInput.sql, /identity\.identity_id AS user_id/);
  assert.match(queryInput.sql, /DISTINCT ON \(COALESCE\(identity_id, -person_id\)\)/);
  assert.match(queryInput.sql, /array_agg\(DISTINCT c\.name ORDER BY c\.name\)/);
  assert.match(queryInput.sql, /AS active_categories/);
  assert.match(queryInput.sql, /AS registration_category/);
  assert.match(queryInput.sql, /array_to_string\(COALESCE\(category_summary\.categories/);
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