import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import test from 'node:test';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createBlacklistRouter } from '../src/modules/blacklist/blacklist.routes.js';
import { createBlacklistRepository } from '../src/modules/blacklist/blacklist.repository.js';
import { createBlacklistService } from '../src/modules/blacklist/blacklist.service.js';

test('blacklist list applies name and category filters before pagination', async () => {
  let query;
  const repository = createBlacklistRepository({
    async query(sql, values) {
      query = { sql, values };
      return { rows: [] };
    },
  });

  await repository.listEntries({ pageSize: 10, offset: 10, name: 'Asha', category: 'Staff' });

  assert.match(query.sql, /p\.first_name \|\| ' ' \|\| p\.last_name ILIKE/);
  assert.match(query.sql, /c\.name ILIKE/);
  assert.match(query.sql, /LIMIT \$3 OFFSET \$4/);
  assert.deepEqual(query.values, ['Asha', 'Staff', 10, 10]);
});

test('blacklist add writes the entry and audit atomically after validating person and reason', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('SELECT person_id FROM mams.person')) return { rows: [{ person_id: 7 }] };
      if (sql.includes('FROM mams.lookup_value')) return { rows: [{ lookup_id: 11 }] };
      if (sql.includes('INSERT INTO mams.blacklist')) {
        return { rows: [{ blacklist_id: 4, person_id: 7, reason_id: 11, start_date: '2026-10-09' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createBlacklistRepository({ async connect() { return client; } });

  const entry = await repository.addEntry({
    personId: 7,
    reasonId: 11,
    remarks: 'Repeated policy violation',
    actorUserId: 2,
    actorRole: 'ADMIN',
    ipAddress: '127.0.0.1',
    device: 'Mobile browser '.padEnd(160, 'x'),
  });

  assert.equal(entry.blacklist_id, 4);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /FOR UPDATE/);
  assert.match(calls[2].sql, /lookup_type = 'BLACKLIST_REASON'/);
  assert.match(calls[3].sql, /INSERT INTO mams.blacklist/);
  assert.match(calls[4].sql, /INSERT INTO mams.audit_log/);
  assert.equal(calls[4].values[5].length, 100);
  assert.equal(calls[5].sql, 'COMMIT');
});

test('blacklist lift can close an expired unlifted entry and records audit atomically', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('FOR UPDATE')) {
        return { rows: [{ blacklist_id: 4, person_id: 7, reason_id: 11, remarks: 'Policy issue', end_date: '2026-10-08' }] };
      }
      if (sql.includes('UPDATE mams.blacklist')) {
        return { rows: [{ blacklist_id: 4, person_id: 7, lifted_by: 2, lifted_at: '2026-10-09T10:00:00Z', lift_note: 'Reviewed' }] };
      }
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const repository = createBlacklistRepository({ async connect() { return client; } });

  const entry = await repository.liftEntry({
    blacklistId: 4,
    liftNote: 'Reviewed',
    actorUserId: 2,
    actorRole: 'ADMIN',
  });

  assert.equal(entry.lift_note, 'Reviewed');
  assert.match(calls[1].sql, /lifted_at IS NULL/);
  assert.match(calls[2].sql, /lift_note = \$3/);
  assert.match(calls[3].sql, /INSERT INTO mams.audit_log/);
  assert.equal(calls[4].sql, 'COMMIT');
});

test('a second open blacklist entry becomes a conflict', async () => {
  const service = createBlacklistService({
    repository: {
      async addEntry() { throw { code: '23505' }; },
    },
  });

  await assert.rejects(
    service.addEntry({ input: { personId: 7, reasonId: 11, remarks: 'Repeated issue' }, actor: { userId: 2, role: 'ADMIN' } }),
    (error) => error.statusCode === 409 && error.code === 'ACTIVE_BLACKLIST_EXISTS',
  );
});

test('invalid blacklist date ranges map to a validation error', async () => {
  const service = createBlacklistService({
    repository: {
      async addEntry() { throw Object.assign(new Error('date constraint'), { code: '23514' }); },
    },
  });

  await assert.rejects(
    service.addEntry({ input: { personId: 7, reasonId: 11, remarks: 'Repeated issue' }, actor: { userId: 2, role: 'ADMIN' } }),
    (error) => error.statusCode === 400 && error.code === 'INVALID_DATE_RANGE',
  );
});

test('blacklist writes require Admin authorization and forward actor data', async () => {
  let received;
  const createRouter = (role) => createBlacklistRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 2, role };
      next();
    },
    blacklistService: {
      async addEntry(input) { received = input; return { blacklist_id: 4 }; },
      async listEntries() { return []; },
      async liftEntry() { return { blacklist_id: 4 }; },
    },
  });

  test('blacklist list route validates and forwards name and category filters', async () => {
    let received;
    const app = express();
    app.use('/api/v1/blacklist', createBlacklistRouter({
      authenticate(request_, _response, next) {
        request_.auth = { userId: 2, role: 'ADMIN' };
        next();
      },
      blacklistService: {
        async listEntries(input) { received = input; return { items: [], total: 0, page: input.page, pageSize: input.pageSize }; },
      },
    }));
    app.use(errorHandler);

    await request(app).get('/api/v1/blacklist?page=2&pageSize=10&name=Asha&category=Staff').expect(200);
    assert.deepEqual(received, { page: 2, pageSize: 10, offset: 10, name: 'Asha', category: 'Staff' });
    await request(app).get(`/api/v1/blacklist?name=${'x'.repeat(101)}`).expect(400);
  });
  const app = express();
  app.use(express.json());
  app.use('/api/v1/blacklist', createRouter('VIEWER'));
  app.use(errorHandler);

  const denied = await request(app).post('/api/v1/blacklist').send({
    personId: 7,
    reasonId: 11,
    remarks: 'Repeated issue',
  });
  assert.equal(denied.status, 403);

  const adminApp = express();
  adminApp.use(express.json());
  adminApp.use('/api/v1/blacklist', createRouter('ADMIN'));
  adminApp.use(errorHandler);
  const created = await request(adminApp).post('/api/v1/blacklist').send({
    personId: '7',
    reasonId: 11,
    remarks: 'Repeated issue',
  });
  assert.equal(created.status, 201);
  assert.equal(received.actor.userId, 2);
  assert.equal(received.input.personId, 7);
  assert.equal(received.input.remarks, 'Repeated issue');
});
