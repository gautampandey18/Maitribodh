import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistrationRepository } from '../src/modules/persons/registration.repository.js';
import { registrationInputSchema } from '../src/modules/persons/registration.validation.js';

const input = registrationInputSchema.parse({ categoryId: 1, firstName: 'Asha', lastName: 'Patel', mobile: '9820000000', gender: 'OTHER', consent: true, categoryDetails: { purpose: 'Meeting', visit_date: '2026-10-09' } });
const category = { category_id: 1, form_type: 'VISITOR', status: 'ACTIVE', approval_required: false, name: 'Visitor' };
test('registration creates a versioned active profile, audit and notifications in one transaction', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('INSERT INTO mams.person')) return { rows: [{ person_id: 8, person_code: 'MB-000008', status: 'ACTIVE', qr_version: 1 }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const person = await repository.create({ input, category, photoKey: 'private-photo.jpg', documents: [], passportEncrypted: null, actor: { userId: 9, role: 'ADMIN', device: 'Browser '.padEnd(140, 'x') } });
  assert.equal(person.qr_version, 1);
  assert.equal(calls[0].sql, 'BEGIN');
  const insertCall = calls.find((call) => call.sql.includes('INSERT INTO mams.person'));
  assert.doesNotMatch(insertCall.sql, /permission_level_id/);
  assert.deepEqual(JSON.parse(insertCall.values[15]), input.categoryDetails);
  const auditCall = calls.find((call) => call.sql.includes('INSERT INTO mams.audit_log'));
  assert.ok(auditCall);
  assert.equal(auditCall.values[7].length, 100);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.notification')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('registration category options omit legacy category hierarchy fields', async () => {
  const repository = createRegistrationRepository({
    async query(sql) {
      if (sql.includes('mams.category')) return { rows: [{ ...category, is_broad: false, broad_category_id: null }] };
      return { rows: [] };
    },
  });

  const options = await repository.options();

  assert.equal('is_broad' in options.categories[0], false);
  assert.equal('broad_category_id' in options.categories[0], false);
});
test('text category fields are not treated as integer master-data references', async () => {
  const calls = [];
  const categoryWithTextField = {
    ...category,
    form_schema: { fields: [{ key: 'approval_note', label: 'Approval note', type: 'text', required: true, source: 'DEPARTMENT' }] },
  };
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR SHARE')) return { rows: [categoryWithTextField] };
      if (sql.includes('INSERT INTO mams.person')) return { rows: [{ person_id: 8, person_code: 'MB-000008', status: 'ACTIVE', qr_version: 1 }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const inputWithTextValue = registrationInputSchema.parse({
    ...input,
    categoryDetails: { approval_note: 'approved' },
  });

  await repository.create({
    input: inputWithTextValue,
    category: categoryWithTextField,
    photoKey: 'private-photo.jpg',
    documents: [],
    passportEncrypted: null,
    actor: { userId: 9, role: 'ADMIN' },
  });

  assert.equal(calls.some(({ sql }) => sql.includes('FROM mams.lookup_value WHERE lookup_id')), false);
  const insertCall = calls.find(({ sql }) => sql.includes('INSERT INTO mams.person'));
  assert.deepEqual(JSON.parse(insertCall.values[15]), { approval_note: 'approved' });
});
test('draft list excludes drafts whose categories are inactive or deleted', async () => {
  let call;
  const repository = createRegistrationRepository({
    async query(sql, values) {
      call = { sql, values };
      return { rows: [{ person_id: 12, draft_data: { categoryId: 1 }, updated_at: '2026-10-20T10:00:00Z' }] };
    },
  });

  const drafts = await repository.drafts(9);

  assert.deepEqual(drafts, [{ person_id: 12, draft_data: { categoryId: 1 }, updated_at: '2026-10-20T10:00:00Z' }]);
  assert.match(call.sql, /JOIN mams\.category c ON c\.category_id = p\.category_id AND c\.status = 'ACTIVE'/);
  assert.deepEqual(call.values, [9]);
});
test('draft persistence drops obsolete permission-level input', async () => {
  let call;
  const client = {
    async query(sql, values) {
      if (sql.includes('INSERT INTO mams.person')) call = { sql, values };
      return { rows: [{ person_id: 12 }], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });

  await repository.saveDraft({ draftId: undefined, input: { categoryId: 1, permissionLevelId: 2 }, actor: { userId: 9 } });

  assert.deepEqual(JSON.parse(call.values[2]), { categoryId: 1, passportNumber: '', idProofNumber: '' });
});
test('profile updates commit the edited fields and audit the change', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT p.*, c.form_type')) return { rows: [{ first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000', status: 'ACTIVE', qr_version: 1, form_type: 'VISITOR' }] };
      if (sql.includes('UPDATE mams.person SET first_name')) return { rows: [{ person_id: 8, person_code: 'MB-000008', first_name: 'Anya', last_name: 'Patel', mobile: '+919820000000', status: 'ACTIVE', qr_version: 1 }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.update({
    personId: 8,
    changes: { firstName: 'Anya', lastName: 'Patel', mobile: '+919820000000', alternateMobile: '', email: '', address: '', emergencyName: '', emergencyMobile: '' },
    actor: { userId: 9, role: 'ADMIN' },
  });
  assert.equal(result.first_name, 'Anya');
  const updateCall = calls.find((call) => call.sql.includes('UPDATE mams.person SET first_name'));
  assert.match(updateCall.sql, /mobile = \$4::varchar\(16\)/);
  assert.match(updateCall.sql, /mobile IS DISTINCT FROM \$11::varchar\(16\)/);
  assert.equal(updateCall.values[10], '+919820000000');
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('non-visitor profiles cannot be updated with an international mobile number', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('SELECT p.*, c.form_type')) return { rows: [{ form_type: 'STAFF' }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(repository.update({
    personId: 8,
    changes: { firstName: 'Asha', lastName: 'Patel', mobile: '+14155552671' },
    actor: { userId: 9, role: 'ADMIN' },
  }), /Only Visitor profiles can use a non-Indian mobile number/);
});
test('person deletion removes linked visits and blacklist history and audits the deletion transactionally', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT person_id, first_name')) {
        return { rows: [{ person_id: 8, first_name: 'Asha', last_name: 'Patel', status: 'ACTIVE', photo_key: 'photo.jpg', documents: [{ key: 'id.pdf' }] }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.delete({ personId: 8, actor: { userId: 9, role: 'ADMIN' } });

  assert.deepEqual(result, { photo_key: 'photo.jpg', documents: [{ key: 'id.pdf' }] });
  const visitDelete = calls.findIndex((call) => call.sql.includes('DELETE FROM mams.visit'));
  const blacklistDelete = calls.findIndex((call) => call.sql.includes('DELETE FROM mams.blacklist'));
  const personDelete = calls.findIndex((call) => call.sql.includes('DELETE FROM mams.person'));
  assert.ok(visitDelete > 0);
  assert.ok(blacklistDelete > visitDelete);
  assert.ok(personDelete > blacklistDelete);
  const auditCall = calls.find((call) => call.sql.includes('INSERT INTO mams.audit_log'));
  assert.equal(auditCall.values[2], 'DELETE');
  assert.equal(auditCall.values[3], 8);
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('first profile photo is attached to an active person and audited transactionally', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT p.photo_key, p.status')) return { rows: [{ photo_key: null, status: 'ACTIVE', form_type: 'VISITOR' }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.capturePhoto({ personId: 10, photoKey: 'capture.jpg', actor: { userId: 9, role: 'SECURITY_GUARD' } });
  assert.deepEqual(result, { photo_key: 'capture.jpg', previous_photo_key: null });
  assert.ok(calls.some((call) => call.sql.includes('UPDATE mams.person SET photo_key')));
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('registration rolls back the profile when audit insertion fails', async () => {
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('INSERT INTO mams.person')) return { rows: [{ person_id: 8 }] };
      if (sql.includes('INSERT INTO mams.audit_log')) throw new Error('audit unavailable');
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(repository.create({ input, category, photoKey: 'photo.jpg', documents: [], actor: { userId: 9, role: 'ADMIN' } }), /audit unavailable/);
  assert.equal(calls.at(-1), 'ROLLBACK');
  assert.equal(calls.includes('COMMIT'), false);
});
test('guard can repair only the missing photo reference checked by the server', async () => {
  const calls = [];
  const currentKey = 'dev-seed/no-object-asha.jpg';
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: sql.includes('SELECT p.photo_key, p.status') ? [{ photo_key: currentKey, status: 'ACTIVE', form_type: 'VISITOR' }] : [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const actor = { userId: 9, role: 'SECURITY_GUARD' };
  await assert.rejects(repository.capturePhoto({ personId: 10, photoKey: 'new.jpg', actor }), (error) => error.code === 'PHOTO_ALREADY_EXISTS');
  await assert.rejects(repository.capturePhoto({ personId: 10, photoKey: 'new.jpg', expectedMissingPhotoKey: 'different.jpg', actor }), (error) => error.code === 'PHOTO_ALREADY_EXISTS');
  const result = await repository.capturePhoto({ personId: 10, photoKey: 'new.jpg', expectedMissingPhotoKey: currentKey, actor });
  assert.equal(result.previous_photo_key, currentKey);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('pending persons cannot be deactivated and later reactivated to bypass approval', async () => {
  const client = { async query(sql) { return { rows: sql.includes('FOR UPDATE') ? [{ status: 'PENDING' }] : [] }; }, release() {} };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(repository.setStatus({ personId: 8, status: 'DEACTIVATED', reason: 'test', actor: { userId: 9, role: 'ADMIN' } }), (error) => error.code === 'INVALID_STATE');
});
test('access updates replace area links and write an audit record', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT p.expires_on')) return { rows: [{ expires_on: null, form_type: 'VISITOR' }] };
      if (sql.includes('SELECT location_id')) return { rows: [{ location_id: 4 }, { location_id: 5 }], rowCount: 2 };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.updateAccess({ personId: 8, changes: { locationIds: [4, 5, 4], expiresOn: '2026-12-31' }, actor: { userId: 9, role: 'ADMIN' } });
  assert.deepEqual(result, { location_ids: [4, 5], expires_on: '2026-12-31' });
  assert.equal(calls.filter((call) => call.sql.includes('INSERT INTO mams.person_location')).length, 2);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});


test('registration rejects duplicate mobile within the same category', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('SELECT person_id FROM mams.person')) {
        return { rows: [{ person_id: 101 }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(
    repository.create({
      input,
      category,
      photoKey: 'photo.jpg',
      documents: [],
      actor: { userId: 9, role: 'ADMIN' },
    }),
    (error) => error.code === 'DUPLICATE_REGISTRATION' && error.statusCode === 409 && error.message.includes('already registered under this category'),
  );
});

test('registration allows the same mobile number in a different category', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('SELECT person_id FROM mams.person')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO mams.person')) {
        return { rows: [{ person_id: 8, person_code: 'MB-000008', status: 'ACTIVE', qr_version: 1 }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.create({
    input,
    category,
    photoKey: 'photo.jpg',
    documents: [],
    actor: { userId: 9, role: 'ADMIN' },
  });
  assert.equal(result.person_id, 8);
  const duplicateQuery = calls.find((c) => c.sql.includes('SELECT person_id FROM mams.person'));
  assert.ok(duplicateQuery);
  assert.deepEqual(duplicateQuery.values, [input.categoryId, input.mobile]);
});

test('registration catches database unique constraint violation and returns DUPLICATE_REGISTRATION', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('SELECT person_id FROM mams.person')) return { rows: [] };
      if (sql.includes('INSERT INTO mams.person')) {
        const error = new Error('duplicate key value violates unique constraint "ux_person_mobile_category"');
        error.code = '23505';
        error.constraint = 'ux_person_mobile_category';
        throw error;
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(
    repository.create({
      input,
      category,
      photoKey: 'photo.jpg',
      documents: [],
      actor: { userId: 9, role: 'ADMIN' },
    }),
    (error) => error.code === 'DUPLICATE_REGISTRATION' && error.statusCode === 409,
  );
});

test('profile update rejects duplicate mobile number within the same category', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('SELECT p.*, c.form_type')) {
        return { rows: [{ person_id: 8, category_id: 1, mobile: '+919820000000', form_type: 'VISITOR', status: 'ACTIVE', qr_version: 1 }] };
      }
      if (sql.includes('SELECT person_id FROM mams.person')) {
        return { rows: [{ person_id: 99 }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(
    repository.update({
      personId: 8,
      changes: { firstName: 'Asha', lastName: 'Patel', mobile: '+919876543210' },
      actor: { userId: 9, role: 'ADMIN' },
    }),
    (error) => error.code === 'DUPLICATE_REGISTRATION' && error.statusCode === 409,
  );
});


test('checkMobile identifies existing registration in same category as unavailable', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('SELECT person_id, person_code')) {
        return { rows: [{ person_id: 101, person_code: 'MB-000101', name: 'Asha Patel', status: 'ACTIVE' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository(client);
  const result = await repository.checkMobile({ mobile: '9820000000', categoryId: 1 });
  assert.equal(result.available, false);
  assert.match(result.message, /already registered under this category/);
  assert.equal(result.existingPerson.personId, 101);
});

test('checkMobile returns available true when no person has that mobile in the category', async () => {
  const client = {
    async query() {
      return { rows: [] };
    },
    release() {},
  };
  const repository = createRegistrationRepository(client);
  const result = await repository.checkMobile({ mobile: '9820000000', categoryId: 1 });
  assert.equal(result.available, true);
});
