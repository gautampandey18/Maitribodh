import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegistrationRepository } from '../src/modules/persons/registration.repository.js';
import { registrationInputSchema } from '../src/modules/persons/registration.validation.js';

const input = registrationInputSchema.parse({ categoryId: 1, firstName: 'Asha', lastName: 'Patel', mobile: '9820000000', email: 'asha@example.com', gender: 'OTHER', consent: true, categoryDetails: { purpose: 'Meeting', visit_date: '2026-10-09' } });
const category = { category_id: 1, form_type: 'VISITOR', status: 'ACTIVE', approval_required: false, name: 'Visitor' };
test('person details return the selected registration category and only active identity categories', async () => {
  let query;
  const repository = createRegistrationRepository({
    async query(sql, values) {
      query = { sql, values };
      return { rows: [{ person_id: 8, registration_category: 'Visitor', category: 'Visitor, Vendor', active_category: 'Visitor', identity_qr_code: 'MB-000008', identity_qr_version: 2 }] };
    },
  });

  const person = await repository.get(8);

  assert.equal(person.registration_category, 'Visitor');
  assert.equal(person.category, 'Visitor, Vendor');
  assert.equal(person.active_category, 'Visitor');
  assert.equal(person.identity_qr_code, 'MB-000008');
  assert.equal(person.identity_qr_version, 2);
  assert.match(query.sql, /membership\.status = 'ACTIVE'/);
  assert.doesNotMatch(query.sql, /membership\.status = 'PENDING'/);
  assert.match(query.sql, /\) AS category_summary ON true/);
  assert.deepEqual(query.values, [8]);
});

test('registration creates a versioned active profile, audit and notifications in one transaction', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('FROM mams.person_identity')) return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 1 }] };
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
  assert.equal(insertCall.values[1], 14);
  assert.deepEqual(JSON.parse(insertCall.values[2]), input.categoryDetails);
  const auditCall = calls.find((call) => call.sql.includes('INSERT INTO mams.audit_log'));
  assert.ok(auditCall);
  assert.equal(auditCall.values[7].length, 100);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.notification')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('adding multiple categories reuses the identity and commits category registrations together', async () => {
  const calls = [];
  const profile = {
    person_id: 8, identity_id: 14, first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000',
    alternate_mobile: null, gender: 'OTHER', resident_status: 'RESIDENT', date_of_birth: null,
    address: null, email: 'asha@example.com', emergency_contact_name: null, emergency_contact_mobile: null,
    photo_key: 'shared.jpg', id_proof_type_id: null, id_proof_number_enc: null, id_proof_last4: null,
    passport_number_enc: null, passport_last4: null, documents: [], identity_qr_code: 'MB-000008',
    identity_qr_version: 2,
  };
  const categories = [
    { ...category, category_id: 2, name: 'Dynamic A', form_type: 'GENERIC', approval_required: true },
    { ...category, category_id: 3, name: 'Dynamic B', form_type: 'GENERIC', approval_required: false },
  ];
  let insertedId = 20;
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FROM mams.person AS p') && sql.includes('FOR UPDATE OF p, identity')) return { rows: [profile] };
      if (sql.includes('FROM mams.category WHERE category_id = ANY')) return { rows: categories };
      if (sql.includes('SELECT person_id FROM mams.person')) return { rows: [] };
      if (sql.includes('INSERT INTO mams.person\n')) {
        insertedId += 1;
        return { rows: [{ person_id: insertedId, person_code: `MB-${insertedId}`, status: insertedId === 21 ? 'PENDING' : 'ACTIVE' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.addCategories({
    personId: 8,
    registrations: [
      { categoryId: 2, categoryDetails: { details: 'One' }, locationIds: [], accompanyingCount: 0 },
      { categoryId: 3, categoryDetails: { details: 'Two' }, locationIds: [], accompanyingCount: 0 },
    ],
    actor: { userId: 9, role: 'ADMIN' },
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.identity_qr_code, 'MB-000008');
  const membershipInserts = calls.filter((call) => call.sql.includes('INSERT INTO mams.person\n'));
  assert.equal(membershipInserts.length, 2);
  assert.equal(membershipInserts[0].values[1], profile.identity_id);
  assert.equal(membershipInserts[1].values[1], profile.identity_id);
  assert.equal(calls.filter((call) => call.sql === 'COMMIT').length, 1);
});
test('category assignment profile query joins category through the registration row', async () => {
  let query;
  const repository = createRegistrationRepository({
    async query(sql, values) {
      query = { sql, values };
      return { rowCount: 1, rows: [{ person_id: 8, categories: [] }] };
    },
  });

  await repository.categoryAssignments(8);

  assert.match(query.sql, /LEFT JOIN mams\.category AS c ON c\.category_id = registration\.category_id/);
  assert.doesNotMatch(query.sql, /LEFT JOIN mams\.category AS c USING \(category_id\)/);
  assert.deepEqual(query.values, [8]);
});
test('a different category reuses the existing mobile identity and QR code', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('FOR SHARE')) return { rows: [{ ...category, category_id: 2, name: 'Another Visitor' }] };
      if (sql.includes('FROM mams.person_identity')) {
        return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 3 }] };
      }
      if (sql.includes('INSERT INTO mams.person')) {
        return { rows: [{ person_id: 9, person_code: 'MB-000009', status: 'ACTIVE', qr_version: 3 }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });

  const person = await repository.create({
    input: { ...input, categoryId: 2 },
    category: { ...category, category_id: 2, name: 'Another Visitor' },
    photoKey: 'participant.jpg',
    documents: [],
    passportEncrypted: null,
    actor: { userId: 9, role: 'ADMIN' },
  });

  const insertCall = calls.find((call) => call.sql.includes('INSERT INTO mams.person'));
  assert.equal(insertCall.values[1], 14);
  assert.equal(person.person_code, 'MB-000008');
  assert.equal(calls.some((call) => call.sql.includes('INSERT INTO mams.person_identity')), false);
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('participant registration persists future access without changing its active QR', async () => {
  for (const permission of [undefined, 'YES', 'NO']) {
    let insertedDetails;
    const participant = { ...category, form_type: 'PARTICIPANT', name: 'Participant' };
    const client = {
      async query(sql, values) {
        if (sql.includes('FOR SHARE')) return { rows: [participant] };
        if (sql.includes('FROM mams.person_identity')) return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 1 }] };
        if (sql.includes('FROM mams.lookup_value')) return { rows: [{ lookup_id: 1 }], rowCount: 1 };
        if (sql.includes('INSERT INTO mams.person')) {
          insertedDetails = JSON.parse(values[2]);
          return { rows: [{ person_id: 8, person_code: 'MB-000008', status: 'ACTIVE', qr_version: 1 }] };
        }
        return { rows: [], rowCount: 1 };
      },
      release() {},
    };
    const repository = createRegistrationRepository({ async connect() { return client; } });
    const categoryDetails = { program_batch_id: 1, ...(permission ? { future_checkin_access: permission } : {}) };
    const person = await repository.create({
      input: { ...input, categoryDetails, emergencyName: 'Ravi', emergencyMobile: '+919876543210' },
      category: participant, photoKey: 'participant.jpg', documents: [],
      actor: { userId: 9, role: 'ADMIN' },
    });
    assert.deepEqual(insertedDetails, categoryDetails);
    assert.equal(person.status, 'ACTIVE');
    assert.equal(person.qr_version, 1);
  }
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
      if (sql.includes('FROM mams.person_identity')) return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 1 }] };
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
  assert.deepEqual(JSON.parse(insertCall.values[2]), { approval_note: 'approved' });
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
      if (sql.includes('SELECT p.*, c.form_type')) return { rows: [{ identity_id: 14, first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000', status: 'ACTIVE', qr_version: 1, form_type: 'VISITOR' }] };
      if (sql.includes('UPDATE mams.person_identity')) return { rows: [{ identity_id: 14, person_code: 'MB-000008', first_name: 'Anya', last_name: 'Patel', mobile: '+919820000000', status: 'ACTIVE', qr_version: 1 }] };
      if (sql.includes('UPDATE mams.person SET')) return { rows: [{ person_id: 8, status: 'ACTIVE' }] };
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
  const updateCall = calls.find((call) => call.sql.includes('UPDATE mams.person_identity'));
  assert.match(updateCall.sql, /mobile = \$4::varchar\(16\)/);
  assert.match(updateCall.sql, /mobile IS DISTINCT FROM \$4::varchar\(16\)/);
  assert.equal(updateCall.values[3], '+919820000000');
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('admins can grant or revoke participant future entry without replacing event details', async () => {
  for (const futureCheckinAccess of [undefined, true, false]) {
    const calls = [];
    const client = {
      async query(sql, values) {
        calls.push({ sql, values });
        if (sql.includes('SELECT p.*, c.form_type')) return { rows: [{
          identity_id: 14, first_name: 'Asha', last_name: 'Patel', mobile: '+919820000000', status: 'ACTIVE', qr_version: 1,
          form_type: 'PARTICIPANT', mobile: '+919820000000',
          category_details: { program_batch_id: 7, future_checkin_access: 'NO' },
        }] };
        if (sql.includes('UPDATE mams.person_identity')) return { rows: [{ identity_id: 14, person_code: 'MB-000008', qr_version: 1 }] };
        if (sql.includes('UPDATE mams.person SET')) return { rows: [{ person_id: 8, status: 'ACTIVE' }] };
        return { rows: [], rowCount: 1 };
      },
      release() {},
    };
    const repository = createRegistrationRepository({ async connect() { return client; } });
    await repository.update({ personId: 8, changes: {
      firstName: 'Asha', lastName: 'Patel', mobile: '+919820000000', futureCheckinAccess,
    }, actor: { userId: 9, role: 'ADMIN' } });
    const update = calls.find((call) => call.sql.includes('UPDATE mams.person SET'));
    assert.equal(update.values[1], futureCheckinAccess ?? null);
    assert.match(update.sql, /jsonb_set\(COALESCE\(category_details/);
    assert.match(update.sql, /WHEN \$2::boolean IS NULL THEN category_details/);
    const audit = calls.find((call) => call.sql.includes('INSERT INTO mams.audit_log'));
    if (futureCheckinAccess !== undefined) {
      const after = JSON.parse(audit.values[5]);
      assert.equal(after.identity_id, 14);
      assert.equal(after.person_code, 'MB-000008');
      assert.equal(after.future_checkin_access, futureCheckinAccess ? 'YES' : 'NO');
    }
    assert.equal(calls.at(-1).sql, 'COMMIT');
  }
});

test('future entry changes are restricted to admins and participant profiles', async () => {
  for (const [role, formType, code] of [
    ['REG_OFFICER', 'PARTICIPANT', 'FORBIDDEN'],
    ['APPROVER', 'PARTICIPANT', 'FORBIDDEN'],
    ['ADMIN', 'VISITOR', 'VALIDATION_ERROR'],
  ]) {
    let updated = false;
    const client = {
      async query(sql) {
        if (sql.includes('SELECT p.*, c.form_type')) return { rows: [{ form_type: formType }] };
        if (sql.includes('UPDATE mams.person')) updated = true;
        return { rows: [] };
      },
      release() {},
    };
    const repository = createRegistrationRepository({ async connect() { return client; } });
    await assert.rejects(repository.update({ personId: 8, changes: { futureCheckinAccess: true },
      actor: { userId: 9, role } }), (error) => error.code === code);
    assert.equal(updated, false);
  }
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
      if (sql.includes('SELECT person.person_id, person.identity_id')) {
        return { rows: [{ person_id: 8, identity_id: 14, first_name: 'Asha', last_name: 'Patel', status: 'ACTIVE', photo_key: 'photo.jpg', documents: [{ key: 'id.pdf' }] }] };
      }
      if (sql.includes('SELECT person_id FROM mams.person')) return { rows: [], rowCount: 0 };
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
test('deleting one category keeps files that are still referenced by another category', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('SELECT person.person_id, person.identity_id')) {
        return { rows: [{
          person_id: 8, identity_id: 14, first_name: 'Asha', last_name: 'Patel', status: 'ACTIVE',
          photo_key: 'shared.jpg', documents: [{ key: 'shared.pdf' }, { key: 'unused.pdf' }],
        }] };
      }
      if (sql.includes('SELECT person_id FROM mams.person')) return { rows: [{ person_id: 9 }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.delete({ personId: 8, actor: { userId: 9, role: 'ADMIN' } });

  assert.deepEqual(result, { photo_key: null, documents: [] });
});
test('first profile photo is attached to an active person and audited transactionally', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT identity.photo_key, p.status')) return { rows: [{ identity_id: 14, photo_key: null, status: 'ACTIVE', form_type: 'VISITOR' }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.capturePhoto({ personId: 10, photoKey: 'capture.jpg', actor: { userId: 9, role: 'SECURITY_GUARD' } });
  assert.deepEqual(result, { photo_key: 'capture.jpg', previous_photo_key: null });
  assert.ok(calls.some((call) => call.sql.includes('UPDATE mams.person_identity SET photo_key')));
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
      return { rows: sql.includes('SELECT identity.photo_key, p.status') ? [{ identity_id: 14, photo_key: currentKey, status: 'ACTIVE', form_type: 'VISITOR' }] : [], rowCount: 1 };
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
      if (sql.includes('SELECT * FROM mams.person_identity')) {
        return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 1 }] };
      }
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
      if (sql.includes('SELECT * FROM mams.person_identity')) {
        return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 1 }] };
      }
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
  assert.deepEqual(duplicateQuery.values, [14, input.categoryId]);
});

test('registration catches database unique constraint violation and returns DUPLICATE_REGISTRATION', async () => {
  const client = {
    async query(sql) {
      if (sql.includes('FOR SHARE')) return { rows: [category] };
      if (sql.includes('SELECT * FROM mams.person_identity')) {
        return { rows: [{ identity_id: 14, qr_code: 'MB-000008', qr_version: 1 }] };
      }
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
        return { rows: [{ person_id: 8, identity_id: 14, category_id: 1, mobile: '+919820000000', form_type: 'VISITOR', status: 'ACTIVE', qr_version: 1 }] };
      }
      if (sql.includes('FROM mams.person AS person') && sql.includes('identity.mobile = $2')) {
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
      if (sql.includes('identity.qr_code AS person_code')) {
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
