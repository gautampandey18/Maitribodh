import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createRegistrationRouter } from '../src/modules/persons/registration.routes.js';
import { createPersonsRouter } from '../src/modules/persons/persons.routes.js';

const input = { categoryId: 1, firstName: 'Asha', lastName: 'Patel', mobile: '9820000000', gender: 'OTHER', consent: true, categoryDetails: { purpose: 'Meeting', visit_date: '2026-10-09' } };
function appFor(role, repository) {
  const authenticate = (req, _res, next) => { req.auth = { role, userId: 9 }; next(); };
  return createApp({ personsRouter: createRegistrationRouter({ repository, authenticate, encryptionSecret: 'test-secret-not-for-production' }) });
}
test('viewer cannot access registration options or submit', async () => {
  await request(appFor('VIEWER', {})).get('/api/v1/persons/registration/options').expect(403);
  await request(appFor('VIEWER', {})).post('/api/v1/persons').expect(403);
});
test('guard cannot register staff even with a valid common profile', async () => {
  const repository = { async category() { return { form_type: 'STAFF', status: 'ACTIVE', approval_required: true }; } };
  await request(appFor('SECURITY_GUARD', repository)).post('/api/v1/persons').field('metadata', JSON.stringify(input)).expect(403);
});
test('invalid image bytes are rejected before persistence', async () => {
  let written = false;
  const repository = {
    async category() { return { form_type: 'VISITOR', status: 'ACTIVE', approval_required: false }; },
    async create() { written = true; },
  };
  await request(appFor('ADMIN', repository)).post('/api/v1/persons').field('metadata', JSON.stringify(input))
    .attach('photo', Buffer.from('not a real image'), { filename: 'photo.jpg', contentType: 'image/jpeg' }).expect(400);
  assert.equal(written, false);
});
test('valid photograph is resized and international passport encrypted before persistence', async () => {
  let saved;
  const repository = {
    async category() { return { form_type: 'VISITOR', status: 'ACTIVE', approval_required: false }; },
    async create(value) { saved = value; return { person_id: 1, person_code: 'MB-000001', status: 'ACTIVE' }; },
  };
  const image = await sharp({ create: { width: 900, height: 700, channels: 3, background: '#f7d327' } }).png().toBuffer();
  try {
    const response = await request(appFor('ADMIN', repository)).post('/api/v1/persons')
      .field('metadata', JSON.stringify({ ...input, residentStatus: 'NON_RESIDENT', passportNumber: 'A1234567' }))
      .attach('photo', image, { filename: 'photo.png', contentType: 'image/png' }).expect(201);
    assert.equal(response.body.status, 'ACTIVE');
    assert.equal(saved.input.mobile, '+919820000000');
    assert.equal(saved.passportEncrypted.includes('A1234567'), false);
    assert.equal(saved.passportEncrypted.split('.').length, 3);
    const metadata = await sharp(path.resolve('./private-uploads', saved.photoKey)).metadata();
    assert.equal(metadata.width, 600);
    assert.ok(metadata.height <= 600);
  } finally { if (saved) await unlink(path.resolve('./private-uploads', saved.photoKey)); }
});
test('registration rejects a missing photograph', async () => {
  let saved = false;
  const repository = {
    async category() { return { form_type: 'VISITOR', status: 'ACTIVE', approval_required: false }; },
    async create() { saved = true; return { person_id: 10, person_code: 'MB-000010', status: 'ACTIVE' }; },
  };
  await request(appFor('ADMIN', repository)).post('/api/v1/persons')
    .field('metadata', JSON.stringify(input)).expect(400);
  assert.equal(saved, false);
});
test('security guard can save a valid first profile photo', async () => {
  let captured;
  const repository = { async get() { return { photo_key: null }; }, async capturePhoto(value) { captured = value; return { photo_key: value.photoKey }; } };
  const image = await sharp({ create: { width: 320, height: 240, channels: 3, background: '#f7d327' } }).png().toBuffer();
  try {
    const response = await request(appFor('SECURITY_GUARD', repository)).post('/api/v1/persons/10/photo')
      .attach('photo', image, { filename: 'person.png', contentType: 'image/png' }).expect(200);
    assert.equal(response.body.photo_key, captured.photoKey);
    assert.equal(captured.personId, 10);
    assert.equal(captured.actor.role, 'SECURITY_GUARD');
    const metadata = await sharp(path.resolve('./private-uploads', captured.photoKey)).metadata();
    assert.equal(metadata.format, 'jpeg');
  } finally { if (captured) await unlink(path.resolve('./private-uploads', captured.photoKey)); }
});
test('guard can recover a seed profile with a missing photo and fetch the saved photograph', async () => {
  let captured;
  let photoKey = 'dev-seed/no-object-asha.jpg';
  const repository = {
    async get() { return { photo_key: photoKey, documents: [] }; },
    async capturePhoto(value) { captured = value; const previous = photoKey; photoKey = value.photoKey; return { photo_key: photoKey, previous_photo_key: previous }; },
  };
  const app = appFor('SECURITY_GUARD', repository);
  const image = await sharp({ create: { width: 160, height: 160, channels: 3, background: '#f7d327' } }).png().toBuffer();
  try {
    const missing = await request(app).get(`/api/v1/persons/10/files/${encodeURIComponent(photoKey)}`).expect(404);
    assert.equal(missing.body.error.code, 'FILE_NOT_FOUND');
    await request(app).post('/api/v1/persons/10/photo').attach('photo', image, { filename: 'photo.png', contentType: 'image/png' }).expect(200);
    assert.equal(captured.expectedMissingPhotoKey, 'dev-seed/no-object-asha.jpg');
    const response = await request(app).get(`/api/v1/persons/10/files/${photoKey}`).expect(200);
    assert.match(response.headers['content-type'], /image\/jpeg/);
    const metadata = await sharp(response.body).metadata();
    assert.equal(metadata.width, 160);
  } finally { if (captured) await unlink(path.join('./private-uploads', captured.photoKey)); }
});

test('registration options expose active categories, schemas and master data', async () => {
  const expected = { categories: [{ category_id: 1, name: 'Visitor', schema: { fields: [] } }], lookups: [], locations: [] };
  const repository = { async options() { return expected; } };
  const response = await request(appFor('REG_OFFICER', repository)).get('/api/v1/persons/registration/options').expect(200);
  assert.deepEqual(response.body, expected);
});
test('person access updates forward validated assignments and expiry', async () => {
  let saved;
  const repository = { async updateAccess(value) { saved = value; return { location_ids: [4], expires_on: '2026-12-31' }; } };
  const response = await request(appFor('ADMIN', repository)).patch('/api/v1/persons/8/access')
    .send({ permissionLevelId: 2, locationIds: [4], expiresOn: '2026-12-31' }).expect(200);
  assert.deepEqual(saved.changes, { locationIds: [4], expiresOn: '2026-12-31' });
  assert.equal(saved.actor.userId, 9);
  assert.equal(response.body.expires_on, '2026-12-31');
});
test('management roles can delete a person and the route supplies audit actor details', async () => {
  let deleted;
  const repository = {
    async delete(value) {
      deleted = value;
      return { photo_key: null, documents: [] };
    },
  };
  await request(appFor('ADMIN', repository)).delete('/api/v1/persons/8').expect(204);
  assert.equal(deleted.personId, 8);
  assert.equal(deleted.actor.userId, 9);
  assert.equal(deleted.actor.role, 'ADMIN');
});
test('person DELETE is available through the production nested persons router mount', async () => {
  let deletedId;
  const registrationRouter = createRegistrationRouter({
    authenticate: (req, _res, next) => { req.auth = { role: 'ADMIN', userId: 9 }; next(); },
    encryptionSecret: 'test-secret-not-for-production',
    repository: {
      async delete({ personId }) {
        deletedId = personId;
        return { photo_key: null, documents: [] };
      },
    },
  });
  const personsRouter = createPersonsRouter({
    authenticate: (req, _res, next) => { req.auth = { role: 'ADMIN', userId: 9 }; next(); },
    personsService: {},
    approvalsService: {},
    qrService: {},
    registrationRouter,
  });

  await request(createApp({ personsRouter })).delete('/api/v1/persons/5').expect(204);
  assert.equal(deletedId, 5);
});
test('person deletion reports a conflict when an unhandled database reference prevents deletion', async () => {
  const repository = { async delete() { throw { code: '23503' }; } };
  const response = await request(appFor('ADMIN', repository)).delete('/api/v1/persons/8').expect(409);
  assert.equal(response.body.error.code, 'PERSON_IN_USE');
  assert.equal(response.body.error.message, 'The person still has linked records that could not be safely removed.');
});
test('profile update rejects email values longer than the database column', async () => {
  let saved = false;
  const repository = { async update() { saved = true; } };
  await request(appFor('ADMIN', repository)).patch('/api/v1/persons/8').send({
    firstName: 'Asha', lastName: 'Patel', mobile: '9820000000', email: `${'a'.repeat(140)}@example.com`,
  }).expect(400);
  assert.equal(saved, false);
});
test('person document upload rejects invalid file bytes before saving', async () => {
  let saved = false;
  const repository = { async addDocuments() { saved = true; } };
  await request(appFor('ADMIN', repository)).post('/api/v1/persons/8/files')
    .attach('documents', Buffer.from('not a document'), { filename: 'scan.jpg', contentType: 'image/jpeg' }).expect(400);
  assert.equal(saved, false);
});


test('check-mobile route forwards mobile and categoryId and returns availability result', async () => {
  let captured;
  const repository = {
    async checkMobile(args) {
      captured = args;
      return { available: false, message: 'This mobile number is already registered under this category.' };
    },
  };
  const response = await request(appFor('ADMIN', repository))
    .get('/api/v1/persons/registration/check-mobile')
    .query({ mobile: '9820000000', categoryId: '1' })
    .expect(200);
  assert.equal(response.body.available, false);
  assert.equal(captured.mobile, '9820000000');
  assert.equal(captured.categoryId, 1);
});

test('check-mobile route validates required query parameters', async () => {
  const repository = { async checkMobile() {} };
  await request(appFor('ADMIN', repository))
    .get('/api/v1/persons/registration/check-mobile')
    .expect(400);
});
