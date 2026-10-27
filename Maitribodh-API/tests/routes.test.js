import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import test from 'node:test';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createUsersRouter } from '../src/modules/users/users.routes.js';
import { createCategoriesRouter } from '../src/modules/categories/categories.routes.js';
import { createLookupsRouter } from '../src/modules/lookups/lookups.routes.js';
import { createLocationsRouter } from '../src/modules/locations/locations.routes.js';
import { createLocationsService } from '../src/modules/locations/locations.service.js';
import { createPersonsRouter } from '../src/modules/persons/persons.routes.js';
import { createApprovalsRouter } from '../src/modules/approvals/approvals.routes.js';
import { createQrService } from '../src/modules/qr/qr.service.js';
import { createPublicQrRouter } from '../src/modules/qr/public-qr.routes.js';
import { createGateRouter } from '../src/modules/gate/gate.routes.js';
import { createVisitsRouter } from '../src/modules/visits/visits.routes.js';

test('user creation route requires an authorized role', async () => {
  let created = false;
  const app = createRouteApp(
    '/api/v1/users',
    createUsersRouter({
      authService: {},
      usersService: {
        async createUser() {
          created = true;
          return { user_id: 1 };
        },
      },
      authenticate: authenticateAs('VIEWER'),
    }),
  );

  const response = await request(app).post('/api/v1/users').send({
    firstName: 'A',
    lastName: 'B',
    mobile: '1234567890',
    username: 'viewer',
    role: 'VIEWER',
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
  assert.equal(created, false);
});

test('admin can delete another user through the user route', async () => {
  let deletedInput;
  const app = createRouteApp(
    '/api/v1/users',
    createUsersRouter({
      authService: {},
      usersService: {
        async deleteUser(input) {
          deletedInput = input;
        },
      },
      authenticate: authenticateAs('ADMIN'),
    }),
  );

  const response = await request(app).delete('/api/v1/users/25');

  assert.equal(response.status, 204);
  assert.deepEqual(deletedInput, {
    targetUserId: 25,
    actor: { userId: 7, role: 'ADMIN', ipAddress: '::ffff:127.0.0.1', device: undefined },
  });
});

test('admin can activate an inactive user through the user route', async () => {
  let updateInput;
  const app = createRouteApp(
    '/api/v1/users',
    createUsersRouter({
      authenticate: authenticateAs('ADMIN'),
      usersService: {
        async updateUser(input) {
          updateInput = input;
          return { user_id: input.targetUserId, status: 'ACTIVE' };
        },
      },
      authService: {},
    }),
  );

  const response = await request(app).patch('/api/v1/users/25').send({ activate: true });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ACTIVE');
  assert.equal(updateInput.input.activate, true);
});

test('user status actions reject simultaneous activation and deactivation', async () => {
  let updated = false;
  const app = createRouteApp(
    '/api/v1/users',
    createUsersRouter({
      authenticate: authenticateAs('ADMIN'),
      usersService: {
        async updateUser() {
          updated = true;
        },
      },
      authService: {},
    }),
  );

  const response = await request(app).patch('/api/v1/users/25').send({ activate: true, deactivate: true });

  assert.equal(response.status, 400);
  assert.equal(updated, false);
});

test('admin temporary password route preserves issuer identity separately from reset target', async () => {
  let resetInput;
  const app = createRouteApp(
    '/api/v1/users',
    createUsersRouter({
      authenticate: authenticateAs('ADMIN'),
      authService: {
        async issueTemporaryPassword(input) {
          resetInput = input;
          return { temporaryPassword: 'one-time-secret' };
        },
      },
      usersService: {},
    }),
  );

  const response = await request(app).post('/api/v1/users/25/password-reset');

  assert.equal(response.status, 201);
  assert.deepEqual(resetInput, {
    targetUserId: 25,
    adminUserId: 7,
    adminRole: 'ADMIN',
    ipAddress: '::ffff:127.0.0.1',
    device: undefined,
  });
});

test('admin list routes validate and forward user, master, category, and location filters', async () => {
  const requests = [];
  const app = express();
  app.use(express.json());
  app.use('/api/v1/users', createUsersRouter({
    authenticate: authenticateAs('ADMIN'),
    authService: {},
    usersService: { async listUsers(input) { requests.push(['users', input]); return { items: [], total: 0, page: input.page, pageSize: input.pageSize }; } },
  }));
  app.use('/api/v1/categories', createCategoriesRouter({
    authenticate: authenticateAs('ADMIN'),
    categoriesService: { async listCategories(input) { requests.push(['categories', input]); return { items: [], total: 0, page: input.page, pageSize: input.pageSize }; } },
  }));
  app.use('/api/v1/lookups', createLookupsRouter({
    authenticate: authenticateAs('ADMIN'),
    lookupsService: { async listValues(type, parentId, includeInactive, pagination, query) { requests.push(['lookups', { type, parentId, includeInactive, pagination, query }]); return { items: [], total: 0, page: pagination.page, pageSize: pagination.pageSize }; } },
  }));
  app.use('/api/v1/locations', createLocationsRouter({
    authenticate: authenticateAs('ADMIN'),
    locationsService: { async listActiveLocations(input) { requests.push(['locations', input]); return { items: [], total: 0, page: input.page, pageSize: input.pageSize }; } },
  }));
  app.use(errorHandler);

  await request(app).get('/api/v1/users?query=alex&role=ADMIN&status=ACTIVE&page=2&pageSize=10').expect(200);
  await request(app).get('/api/v1/categories?query=visitor&formType=VISITOR&status=ACTIVE').expect(200);
  await request(app).get('/api/v1/lookups/DEPARTMENT?query=operations&includeInactive=true&page=1&pageSize=5').expect(200);
  await request(app).get('/api/v1/lookups/PERMISSION_LEVEL').expect(400);
  await request(app).get('/api/v1/locations?query=north&locationType=GATE&page=1&pageSize=5').expect(200);

  assert.deepEqual(requests[0], ['users', { query: 'alex', role: 'ADMIN', status: 'ACTIVE', page: 2, pageSize: 10, offset: 10 }]);
  assert.deepEqual(requests[1], ['categories', { query: 'visitor', formType: 'VISITOR', status: 'ACTIVE', page: 1, pageSize: 5, offset: 0 }]);
  assert.deepEqual(requests[2], ['lookups', { type: 'DEPARTMENT', parentId: undefined, includeInactive: true, pagination: { page: 1, pageSize: 5, offset: 0 }, query: 'operations' }]);
  assert.deepEqual(requests[3], ['locations', { query: 'north', locationType: 'GATE', page: 1, pageSize: 5, offset: 0 }]);
});

test('category create route validates and forwards normalized fields', async () => {
  let receivedInput;
  const app = createRouteApp(
    '/api/v1/categories',
    createCategoriesRouter({
      authenticate: authenticateAs('ADMIN'),
      categoriesService: {
        async createCategory({ input }) {
          receivedInput = input;
          return { category_id: 4, name: input.name };
        },
      },
    }),
  );

  const response = await request(app).post('/api/v1/categories').send({ name: 'Visitor' });

  assert.equal(response.status, 201);
  assert.equal(response.body.category_id, 4);
  assert.equal(receivedInput.formType, 'GENERIC');
  assert.equal('overstayCutoff' in receivedInput, false);
});

test('category delete route forwards actor and returns no content', async () => {
  let received;
  const app = createRouteApp(
    '/api/v1/categories',
    createCategoriesRouter({
      authenticate: authenticateAs('ADMIN'),
      categoriesService: { async deleteCategory(input) { received = input; } },
    }),
  );

  const response = await request(app).delete('/api/v1/categories/4');

  assert.equal(response.status, 204);
  assert.deepEqual(received, {
    categoryId: 4,
    actor: { userId: 7, role: 'ADMIN', ipAddress: '::ffff:127.0.0.1', device: undefined },
  });
});

test('lookup delete route normalizes type and forwards actor', async () => {
  let received;
  const app = createRouteApp(
    '/api/v1/lookups',
    createLookupsRouter({
      authenticate: authenticateAs('SUPER_ADMIN'),
      lookupsService: { async deleteValue(input) { received = input; } },
    }),
  );

  const response = await request(app).delete('/api/v1/lookups/subcategory/12');

  assert.equal(response.status, 204);
  assert.deepEqual(received, {
    lookupType: 'SUBCATEGORY',
    lookupId: 12,
    actor: { userId: 7, role: 'SUPER_ADMIN', ipAddress: '::ffff:127.0.0.1', device: undefined },
  });
});

test('lookup route normalizes lookup type and parses parent ID', async () => {
  let received;
  const app = createRouteApp(
    '/api/v1/lookups',
    createLookupsRouter({
      authenticate: authenticateAs('REG_OFFICER'),
      lookupsService: {
        async listValues(type, parentId) {
          received = { type, parentId };
          return [{ lookup_id: 5, name: 'Operations' }];
        },
      },
    }),
  );

  const response = await request(app).get('/api/v1/lookups/job_role?parentId=3');

  assert.equal(response.status, 200);
  assert.deepEqual(received, { type: 'JOB_ROLE', parentId: 3 });
  assert.equal(response.body.items[0].lookup_id, 5);
});

test('location route rejects a restricted gate before persistence', async () => {
  let inserted = false;
  const locationsService = createLocationsService({
    repository: {
      async createLocation() {
        inserted = true;
      },
    },
  });
  const app = createRouteApp(
    '/api/v1/locations',
    createLocationsRouter({
      authenticate: authenticateAs('ADMIN'),
      locationsService,
    }),
  );

  const response = await request(app).post('/api/v1/locations').send({
    name: 'Restricted Gate',
    locationType: 'GATE',
    isRestricted: true,
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_LOCATION');
  assert.equal(inserted, false);
});

test('person search route accepts registration roles and forwards filters', async () => {
  let searchInput;
  const app = createRouteApp(
    '/api/v1/persons',
    createPersonsRouter({
      authenticate: authenticateAs('REG_OFFICER'),
      personsService: {
        async search(input) {
          searchInput = input;
          return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        },
      },
    }),
  );

  const response = await request(app).get('/api/v1/persons?q=Visitor&page=2&categoryId=5&status=ACTIVE');

  assert.equal(response.status, 200);
  assert.deepEqual(searchInput, {
    query: 'Visitor',
    categoryId: 5,
    status: 'ACTIVE',
    page: 2,
    pageSize: 5,
    actorRole: 'REG_OFFICER',
  });
});

test('person search route allows an omitted query to list all registrations', async () => {
  let searchInput;
  const app = createRouteApp(
    '/api/v1/persons',
    createPersonsRouter({
      authenticate: authenticateAs('ADMIN'),
      personsService: {
        async search(input) {
          searchInput = input;
          return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        },
      },
    }),
  );

  const response = await request(app).get('/api/v1/persons?page=1&pageSize=10&categoryId=5');

  assert.equal(response.status, 200);
  assert.deepEqual(searchInput, {
    query: '',
    categoryId: 5,
    status: undefined,
    page: 1,
    pageSize: 10,
    actorRole: 'ADMIN',
  });
});

test('location list forwards page and page size and defaults to five rows', async () => {
  const requests = [];
  const app = createRouteApp(
    '/api/v1/locations',
    createLocationsRouter({
      authenticate: authenticateAs('ADMIN'),
      locationsService: {
        async listActiveLocations(input) {
          requests.push(input);
          return {
            items: input.page === 2 ? [{ location_id: 11 }, { location_id: 12 }] : Array.from({ length: input.pageSize }, (_, index) => ({ location_id: index + 1 })),
            total: 12,
            page: input.page,
            pageSize: input.pageSize,
          };
        },
      },
    }),
  );

  const secondPage = await request(app).get('/api/v1/locations?page=2&pageSize=10');
  assert.equal(secondPage.status, 200);
  assert.equal(secondPage.body.items.length, 2);
  assert.equal(secondPage.body.total, 12);
  assert.deepEqual(requests[0], { page: 2, pageSize: 10, offset: 10, query: '' });

  const defaultPage = await request(app).get('/api/v1/locations');
  assert.equal(defaultPage.body.pageSize, 5);
  assert.deepEqual(requests[1], { page: 1, pageSize: 5, offset: 0, query: '' });
});

test('pending approval queue allows Approver and rejects Viewer', async () => {
  const approvalsService = { async listPending(input) { return { items: [{ person_id: 1 }], total: 1, page: input.page, pageSize: input.pageSize }; } };
  const approverApp = createRouteApp(
    '/api/v1/approvals',
    createApprovalsRouter({ approvalsService, authenticate: authenticateAs('APPROVER') }),
  );
  const viewerApp = createRouteApp(
    '/api/v1/approvals',
    createApprovalsRouter({ approvalsService, authenticate: authenticateAs('VIEWER') }),
  );
  const superAdminApp = createRouteApp(
    '/api/v1/approvals',
    createApprovalsRouter({ approvalsService, authenticate: authenticateAs('SUPER_ADMIN') }),
  );

  const allowed = await request(approverApp).get('/api/v1/approvals');
  const superAdminAllowed = await request(superAdminApp).get('/api/v1/approvals');
  const denied = await request(viewerApp).get('/api/v1/approvals');

  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.items[0].person_id, 1);
  assert.equal(superAdminAllowed.status, 200);
  assert.equal(denied.status, 403);
});

test('approval decision route forwards actor and valid rejection reason', async () => {
  let decisionInput;
  const app = createRouteApp(
    '/api/v1/approvals',
    createApprovalsRouter({
      authenticate: authenticateAs('APPROVER'),
      approvalsService: {
        async decide(input) {
          decisionInput = input;
          return { person_id: input.personId, status: 'REJECTED' };
        },
      },
    }),
  );

  const response = await request(app)
    .post('/api/v1/approvals/25/decisions')
    .send({ decision: 'REJECT', reason: 'Incomplete documents' });

  assert.equal(response.status, 200);
  assert.equal(decisionInput.personId, 25);
  assert.equal(decisionInput.actor.role, 'APPROVER');
});

test('approval queue route forwards approved and rejected status filters', async () => {
  const requests = [];
  const app = createRouteApp(
    '/api/v1/approvals',
    createApprovalsRouter({
      authenticate: authenticateAs('APPROVER'),
      approvalsService: {
        async listPending(input) { requests.push({ status: 'PENDING', ...input }); return { items: [], total: 0 }; },
        async listByStatus(input) { requests.push(input); return { items: [], total: 0 }; },
      },
    }),
  );

  const approved = await request(app).get('/api/v1/approvals?status=ACTIVE&page=2&pageSize=10&name=Asha&category=Staff');
  const rejected = await request(app).get('/api/v1/approvals?status=REJECTED');
  const invalidFilter = await request(app).get(`/api/v1/approvals?name=${'x'.repeat(101)}`);

  assert.equal(approved.status, 200);
  assert.equal(rejected.status, 200);
  assert.equal(invalidFilter.status, 400);
  assert.deepEqual(requests, [
    { status: 'ACTIVE', page: 2, pageSize: 10, offset: 10, name: 'Asha', category: 'Staff' },
    { status: 'REJECTED', page: 1, pageSize: 5, offset: 0, name: '', category: '' },
  ]);
});

test('Super Admin may submit an approval decision', async () => {
  let decisionInput;
  const app = createRouteApp(
    '/api/v1/approvals',
    createApprovalsRouter({
      authenticate: authenticateAs('SUPER_ADMIN'),
      approvalsService: {
        async decide(input) {
          decisionInput = input;
          return { person_id: input.personId, status: 'ACTIVE' };
        },
      },
    }),
  );

  const response = await request(app)
    .post('/api/v1/approvals/25/decisions')
    .send({ decision: 'APPROVE' });

  assert.equal(response.status, 200);
  assert.equal(decisionInput.actor.role, 'SUPER_ADMIN');
});

test('person resubmission route forwards the original caller identity', async () => {
  let submissionInput;
  const app = createRouteApp(
    '/api/v1/persons',
    createPersonsRouter({
      authenticate: authenticateAs('REG_OFFICER'),
      personsService: {},
      approvalsService: {
        async resubmit(input) {
          submissionInput = input;
          return { person_id: input.personId, status: 'PENDING' };
        },
      },
    }),
  );

  const response = await request(app).post('/api/v1/persons/31/resubmissions').send({});

  assert.equal(response.status, 200);
  assert.equal(submissionInput.personId, 31);
  assert.equal(submissionInput.actor.role, 'REG_OFFICER');
});

test('person QR route returns a private PNG to an authorized role', async () => {
  const qrService = createQrService({
    repository: { async getActivePersonQr() { return { person_code: 'MB-000012', qr_version: 1 }; } },
    hmacSecret: 'qr-test-secret-that-is-long-enough-for-tests',
    async toBuffer() { return Buffer.from('png-data'); },
  });
  const app = createRouteApp(
    '/api/v1/persons',
    createPersonsRouter({
      authenticate: authenticateAs('SECURITY_GUARD'),
      personsService: {},
      approvalsService: {},
      qrService,
    }),
  );

  const response = await request(app).get('/api/v1/persons/12/qr');

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /image\/png/);
  assert.match(response.headers['cache-control'], /no-store/);
  assert.equal(response.headers['x-qr-version'], '1');
  assert.equal(response.body.toString(), 'png-data');
});

test('person QR route denies Viewer access', async () => {
  const app = createRouteApp(
    '/api/v1/persons',
    createPersonsRouter({
      authenticate: authenticateAs('VIEWER'),
      personsService: {},
      approvalsService: {},
      qrService: { async generatePersonQr() { throw new Error('must not be called'); } },
    }),
  );

  const response = await request(app).get('/api/v1/persons/12/qr');

  assert.equal(response.status, 403);
});

test('public QR lookup is unauthenticated and returns a uniform empty result', async () => {
  let lookup;
  const app = createRouteApp(
    '/api/v1/public',
    createPublicQrRouter({
      qrService: {
        async generatePublicLookup(input) { lookup = input; return { limited: false, items: [] }; },
      },
    }),
  );

  const response = await request(app).post('/api/v1/public/qr-lookups').send({ mobile: '9876543210' });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { items: [] });
  assert.equal(lookup.mobile, '+919876543210');

  await request(app).post('/api/v1/public/qr-lookups').send({ mobile: '+14155552671' }).expect(200);
  assert.equal(lookup.mobile, '+14155552671');
});

test('public QR lookup returns 429 and Retry-After when limited', async () => {
  const app = createRouteApp(
    '/api/v1/public',
    createPublicQrRouter({
      qrService: {
        async generatePublicLookup() { return { limited: true, window: 'MINUTE', retryAfterSeconds: 60 }; },
      },
    }),
  );

  const response = await request(app).post('/api/v1/public/qr-lookups').send({ mobile: '9876543210' });

  assert.equal(response.status, 429);
  assert.equal(response.headers['retry-after'], '60');
  assert.equal(response.body.error.code, 'RATE_LIMITED');
});

test('gate lookup allows Security Guard and forwards validated location', async () => {
  let lookupInput;
  const app = createRouteApp(
    '/api/v1/gate',
    createGateRouter({
      authenticate: authenticateAs('SECURITY_GUARD'),
      gateService: {
        async lookup(input) {
          lookupInput = input;
          return { items: [{ personId: 3, outcome: 'ELIGIBLE' }] };
        },
      },
    }),
  );

  const response = await request(app).post('/api/v1/gate/lookups').send({
    mobile: '9876543210',
    locationId: 4,
  });

  assert.equal(response.status, 200);
  assert.equal(lookupInput.locationId, 4);
  assert.equal(lookupInput.actor.role, 'SECURITY_GUARD');
});

test('checkout route accepts gate roles and forwards visit and location IDs', async () => {
  let checkoutInput;
  const app = createRouteApp(
    '/api/v1/visits',
    createVisitsRouter({
      authenticate: authenticateAs('SECURITY_GUARD'),
      visitsService: {
        async checkOut(input) {
          checkoutInput = input;
          return { visit_id: input.visitId, status: 'CLOSED' };
        },
      },
    }),
  );

  const response = await request(app).post('/api/v1/visits/4/check-outs').send({
    checkoutGateId: 2,
    checkoutLocationId: 3,
  });

  assert.equal(response.status, 200);
  assert.equal(checkoutInput.visitId, 4);
  assert.equal(checkoutInput.actor.role, 'SECURITY_GUARD');
});

test('check-in route validates the registered person payload and forwards the actor', async () => {
  let checkinInput;
  const app = createRouteApp(
    '/api/v1/visits',
    createVisitsRouter({
      authenticate: authenticateAs('SECURITY_GUARD'),
      visitsService: {
        async checkIn(input) {
          checkinInput = input;
          return { visit_id: 9, status: 'OPEN', locationWarning: true };
        },
      },
    }),
  );

  const response = await request(app).post('/api/v1/visits').send({
    personId: 8,
    checkinGateId: 2,
    checkinLocationId: 3,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.locationWarning, true);
  assert.equal(checkinInput.personId, 8);
  assert.equal(checkinInput.actor.role, 'SECURITY_GUARD');
});

function createRouteApp(prefix, router) {
  const app = express();
  app.use(express.json());
  app.use(prefix, router);
  app.use(errorHandler);
  return app;
}

function authenticateAs(role) {
  return function setTestIdentity(request, _response, next) {
    request.auth = { userId: 7, role, mustChangePassword: false };
    next();
  };
}