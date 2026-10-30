import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import test from 'node:test';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createDashboardRouter } from '../src/modules/dashboard/dashboard.routes.js';
import { createDashboardService } from '../src/modules/dashboard/dashboard.service.js';
import { createDashboardRepository } from '../src/modules/dashboard/dashboard.repository.js';

test('dashboard summary uses open visits and local-day activity counts', async () => {
  let sql;
  const repository = createDashboardRepository({
    async query(query) {
      sql = query;
      return { rows: [{ active_persons: 4, open_visits: 1 }] };
    },
  });

  const summary = await repository.summary();

  assert.match(sql, /status = 'OPEN'/);
  assert.match(sql, /AT TIME ZONE 'Asia\/Kolkata'/);
  assert.match(sql, /status IN \('ACTIVE', 'PENDING'\)\) AS total_users/);
  assert.equal(summary.active_persons, 4);
});

test('dashboard inside counts open visits and accompanying members', async () => {
  const repository = createDashboardRepository({
    async query(query) {
      if (query.includes('coalesce(sum(v.accompanying_count), 0)')) {
        return { rows: [{ total: 2, accompanying_total: 3 }] };
      }
      return { rows: [] };
    },
  });

  const result = await repository.inside({ pageSize: 10, offset: 0 });
  assert.equal(result.total, 2);
  assert.equal(result.accompanyingTotal, 3);
});

test('dashboard inside masks mobile for non-Admin roles', async () => {
  const service = createDashboardService({
    repository: {
      async inside() { return { items: [{ person_code: 'MB-000001', mobile: '9876543210' }], total: 1, byLocation: [], byCategory: [] }; },
    },
  });

  const viewerItems = await service.inside({ actorRole: 'VIEWER', page: 1, pageSize: 25, offset: 0 });
  const adminItems = await service.inside({ actorRole: 'ADMIN', page: 1, pageSize: 25, offset: 0 });

  assert.equal(viewerItems.items[0].mobile, '******3210');
  assert.equal(adminItems.items[0].mobile, '9876543210');
  assert.equal(viewerItems.total, 1);
});

test('dashboard recent activity returns a stable paginated result', async () => {
  const queries = [];
  const repository = createDashboardRepository({
    async query(query, values) {
      queries.push({ query, values });
      if (query.includes('count(*)')) return { rows: [{ total: 7 }] };
      return { rows: [{ activity: 'CHECK_IN' }] };
    },
  });

  const result = await repository.recentActivity({ pageSize: 5, offset: 5 });

  assert.deepEqual(result, { items: [{ activity: 'CHECK_IN' }], total: 7 });
  const rowsQuery = queries.find(({ query }) => query.includes('ORDER BY a.occurred_at'));
  assert.match(rowsQuery.query, /ORDER BY a\.occurred_at DESC, a\.audit_id DESC/);
  assert.match(rowsQuery.query, /LIMIT \$1 OFFSET \$2/);
  assert.deepEqual(rowsQuery.values, [5, 5]);
});

test('dashboard service includes recent activity pagination metadata', async () => {
  let receivedPagination;
  const service = createDashboardService({
    repository: {
      async recentActivity(pagination) {
        receivedPagination = pagination;
        return { items: [{ activity: 'CHECK_IN' }], total: 6 };
      },
    },
  });

  const result = await service.recentActivity({ page: 2, pageSize: 5, offset: 5 });

  assert.deepEqual(receivedPagination, { pageSize: 5, offset: 5 });
  assert.deepEqual(result, { items: [{ activity: 'CHECK_IN' }], total: 6, page: 2, pageSize: 5 });
});

test('dashboard routes allow Viewer reads and forward role to inside projection', async () => {
  let receivedRole;
  const router = createDashboardRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 4, role: 'VIEWER' };
      next();
    },
    dashboardService: {
      async summary() { return { active_persons: 3, open_visits: 0 }; },
      async inside(input) { receivedRole = input.actorRole; return { items: [], total: 0, page: input.page, pageSize: input.pageSize, byLocation: [], byCategory: [] }; },
      async recentActivity(input) { return { items: [{ activity: 'CHECK_IN' }], total: 6, page: input.page, pageSize: input.pageSize }; },
    },
  });
  const app = express();
  app.use('/api/v1/dashboard', router);
  app.use(errorHandler);

  const summary = await request(app).get('/api/v1/dashboard');
  const inside = await request(app).get('/api/v1/dashboard/inside?page=2&pageSize=50');
  const recentActivity = await request(app).get('/api/v1/dashboard/recent-activity?page=2&pageSize=5');

  assert.equal(summary.status, 200);
  assert.equal(summary.body.active_persons, 3);
  assert.equal(inside.status, 200);
  assert.deepEqual(inside.body, { items: [], total: 0, page: 2, pageSize: 50, byLocation: [], byCategory: [] });
  assert.deepEqual(recentActivity.body, { items: [{ activity: 'CHECK_IN' }], total: 6, page: 2, pageSize: 5 });
  assert.equal(receivedRole, 'VIEWER');
});
