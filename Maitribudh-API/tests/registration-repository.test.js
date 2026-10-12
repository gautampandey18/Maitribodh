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
  const auditCall = calls.find((call) => call.sql.includes('INSERT INTO mams.audit_log'));
  assert.ok(auditCall);
  assert.equal(auditCall.values[7].length, 100);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.notification')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});
test('profile updates commit the edited fields and audit the change', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT p.*, c.form_type')) return { rows: [{ first_name: 'Asha', last_name: 'Patel', mobile: '9820000000', status: 'ACTIVE', qr_version: 1, form_type: 'VISITOR' }] };
      if (sql.includes('UPDATE mams.person SET first_name')) return { rows: [{ person_id: 8, person_code: 'MB-000008', first_name: 'Anya', last_name: 'Patel', mobile: '9820000000', status: 'ACTIVE', qr_version: 1 }] };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.update({
    personId: 8,
    changes: { firstName: 'Anya', lastName: 'Patel', mobile: '9820000000', alternateMobile: '', email: '', address: '', emergencyName: '', emergencyMobile: '' },
    actor: { userId: 9, role: 'ADMIN' },
  });
  assert.equal(result.first_name, 'Anya');
  const updateCall = calls.find((call) => call.sql.includes('UPDATE mams.person SET first_name'));
  assert.match(updateCall.sql, /mobile = \$4::varchar\(10\)/);
  assert.match(updateCall.sql, /mobile IS DISTINCT FROM \$11::varchar\(10\)/);
  assert.equal(updateCall.values[10], '9820000000');
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
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
test('pending persons cannot be deactivated and later reactivated to bypass approval', async () => {
  const client = { async query(sql) { return { rows: sql.includes('FOR UPDATE') ? [{ status: 'PENDING' }] : [] }; }, release() {} };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  await assert.rejects(repository.setStatus({ personId: 8, status: 'DEACTIVATED', reason: 'test', actor: { userId: 9, role: 'ADMIN' } }), (error) => error.code === 'INVALID_STATE');
});
test('access updates validate assignments, replace area links and write an audit record', async () => {
  const calls = [];
  const client = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes('SELECT p.permission_level_id')) return { rows: [{ permission_level_id: 1, expires_on: null, form_type: 'VISITOR' }] };
      if (sql.includes('lookup_value')) return { rows: [{ lookup_id: 2 }], rowCount: 1 };
      if (sql.includes('SELECT location_id')) return { rows: [{ location_id: 4 }, { location_id: 5 }], rowCount: 2 };
      return { rows: [], rowCount: 1 };
    }, release() {},
  };
  const repository = createRegistrationRepository({ async connect() { return client; } });
  const result = await repository.updateAccess({ personId: 8, changes: { permissionLevelId: 2, locationIds: [4, 5, 4], expiresOn: '2026-12-31' }, actor: { userId: 9, role: 'ADMIN' } });
  assert.deepEqual(result, { permission_level_id: 2, location_ids: [4, 5], expires_on: '2026-12-31' });
  assert.equal(calls.filter((call) => call.sql.includes('INSERT INTO mams.person_location')).length, 2);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO mams.audit_log')));
  assert.equal(calls.at(-1).sql, 'COMMIT');
});