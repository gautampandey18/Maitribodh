import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createActivityRouter } from '../src/modules/activity/activity.routes.js';

function appFor(role, calls) {
  const pool = { async query(sql, values) { calls.push({ sql, values }); return { rows: sql.includes('AS count') ? [{ count: 2 }] : [] }; } };
  const authenticate = (req, _res, next) => { req.auth = { role, userId: 9 }; next(); };
  return createApp({ activityRouter: createActivityRouter({ pool, authenticate }) });
}
test('viewers cannot browse audit logs', async () => {
  const calls = [];
  await request(appFor('VIEWER', calls)).get('/api/v1/audit').expect(403);
  assert.equal(calls.length, 0);
});
test('notification reads are scoped to the authenticated user', async () => {
  const calls = [];
  const response = await request(appFor('VIEWER', calls)).get('/api/v1/notifications').expect(200);
  assert.equal(response.body.unreadCount, 2);
  assert.deepEqual(calls[0].values, [9]);
  await request(appFor('VIEWER', calls)).post('/api/v1/notifications/read').send({ userId: 1 }).expect(200);
  assert.deepEqual(calls.at(-1).values, [9]);
});
test('audit rejects malformed filters before querying the database', async () => {
  const calls = [];
  await request(appFor('ADMIN', calls)).get('/api/v1/audit?page=0').expect(400);
  assert.equal(calls.length, 0);
});

test('audit pagination forwards page size and offset to the database', async () => {
  const calls = [];
  const response = await request(appFor('ADMIN', calls))
    .get('/api/v1/audit?page=2&pageSize=10')
    .expect(200);

  assert.match(calls[0].sql, /LIMIT \$5 OFFSET \$6/);
  assert.deepEqual(calls[0].values, ['', null, null, null, 10, 10]);
  assert.deepEqual(response.body, { items: [], total: 0, page: 2, pageSize: 10, actions: [], users: [] });
});

test('audit free-text search covers visible actor, action, module, entity and person fields', async () => {
  const calls = [];
  const response = await request(appFor('ADMIN', calls))
    .get('/api/v1/audit?query=security&page=1&pageSize=5')
    .expect(200);

  assert.match(calls[0].sql, /a\.module ILIKE/);
  assert.match(calls[0].sql, /a\.activity ILIKE/);
  assert.match(calls[0].sql, /a\.entity_type ILIKE/);
  assert.match(calls[0].sql, /a\.entity_id::text ILIKE/);
  assert.match(calls[0].sql, /u\.username ILIKE/);
  assert.match(calls[0].sql, /p\.mobile ILIKE/);
  assert.match(calls[0].sql, /p\.first_name \|\| ' ' \|\| p\.last_name ILIKE/);
  assert.equal(calls[0].values[0], 'security');
  assert.equal(response.body.total, 0);
});