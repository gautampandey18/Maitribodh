import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import test from 'node:test';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createReportsRouter } from '../src/modules/reports/reports.routes.js';
import { createReportsService } from '../src/modules/reports/reports.service.js';
import { createReportsRepository } from '../src/modules/reports/reports.repository.js';

test('visit history uses the approved date, category, and location filters', async () => {
  let call;
  const repository = createReportsRepository({
    async query(sql, values) {
      call = { sql, values };
      return { rows: [] };
    },
  });

  await repository.visitHistory({ fromDate: '2026-10-01', toDate: '2026-10-09', categoryId: 3, locationId: 5 });

  assert.match(call.sql, /AT TIME ZONE 'Asia\/Kolkata'/);
  assert.match(call.sql, /p\.category_id = \$3/);
  assert.match(call.sql, /v\.checkin_location_id = \$4/);
  assert.deepEqual(call.values, ['2026-10-01', '2026-10-09', 3, 5]);
});

test('date-based reports accept no dates and return unbounded rows', async () => {
  const calls = [];
  const repository = createReportsRepository({
    async query(sql, values) { calls.push({ sql, values }); return { rows: [] }; },
  });

  await repository.visitHistory({});
  await repository.occupancy({});
  await repository.approvals({});

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.match(call.sql, /\$1::date IS NULL/);
    assert.match(call.sql, /\$2::date IS NULL/);
    assert.deepEqual(call.values.slice(0, 2), [undefined, undefined]);
  }
});

test('report table queries apply page limits and return window totals', async () => {
  const calls = [];
  const repository = createReportsRepository({
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: [] };
    },
  });
  const pagination = { page: 2, pageSize: 10, offset: 10 };

  await repository.visitHistory({ fromDate: '2026-10-01', toDate: '2026-10-09', pagination });
  await repository.registrations({ pagination });
  await repository.occupancy({ fromDate: '2026-10-01', toDate: '2026-10-09', pagination });
  await repository.staff(pagination);
  await repository.approvals({ fromDate: '2026-10-01', toDate: '2026-10-09', pagination });
  await repository.blacklist(pagination);

  assert.equal(calls.length, 6);
  for (const call of calls) {
    assert.match(call.sql, /count\(\*\) OVER\(\)::int AS total/);
    assert.match(call.sql, /LIMIT \$/);
    assert.match(call.sql, /OFFSET \$/);
    assert.deepEqual(call.values.slice(-2), [10, 10]);
  }
});

test('Visit History export audit records actor, filters, and row count', async () => {
  let auditCall;
  const repository = createReportsRepository({
    async query(sql, values) { auditCall = { sql, values }; return { rows: [] }; },
  });

  await repository.recordVisitHistoryExport({
    filters: { fromDate: '2026-10-01', toDate: '2026-10-09', categoryId: null, locationId: null },
    rowCount: 3,
    actorUserId: 4,
    actorRole: 'REG_OFFICER',
    ipAddress: '127.0.0.1',
    device: 'test-client',
  });

  assert.match(auditCall.sql, /VISIT_HISTORY_EXPORT/);
  assert.equal(auditCall.values[0], 4);
  assert.match(auditCall.values[2], /"row_count":3/);
  assert.equal(auditCall.values[3], '127.0.0.1');
});

test('report service masks mobile numbers for non-Admin roles', async () => {
  const service = createReportsService({
    repository: {
      async visitHistory() { return [{ person_code: 'MB-000001', mobile: '9876543210' }]; },
    },
  });

  const registrationOfficerRows = await service.visitHistory({
    filters: { fromDate: '2026-10-01', toDate: '2026-10-09' },
    actorRole: 'REG_OFFICER',
  });
  const adminRows = await service.visitHistory({
    filters: { fromDate: '2026-10-01', toDate: '2026-10-09' },
    actorRole: 'ADMIN',
  });

  assert.equal(registrationOfficerRows[0].mobile, '******3210');
  assert.equal(adminRows[0].mobile, '9876543210');
});

test('report routes load without date filters, validate supplied ranges, and export formula-safe CSV', async () => {
  let visitFilters;
  const router = createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 3, role: 'VIEWER' };
      next();
    },
    reportsService: {
      async visitHistory(input) {
        visitFilters = input;
        return input.pagination
          ? { items: [{ name: 'Asha Patel', mobile: '******3210' }], total: 31, page: input.pagination.page, pageSize: input.pagination.pageSize }
          : [{ name: '=HYPERLINK("https://example.invalid")', mobile: '******3210' }];
      },
      async recordVisitHistoryExport(input) { visitFilters.exportAudit = input; },
    },
  });
  const app = express();
  app.use('/api/v1/reports', router);
  app.use(errorHandler);

  const unfiltered = await request(app).get('/api/v1/reports/visit-history');
  assert.equal(unfiltered.status, 200);
  assert.deepEqual(visitFilters.filters, { fromDate: undefined, toDate: undefined, categoryId: undefined, locationId: undefined });

  const invalidRange = await request(app).get('/api/v1/reports/visit-history')
    .query({ fromDate: '2026-10-10', toDate: '2026-10-09' });
  assert.equal(invalidRange.status, 400);

  const singleDate = await request(app).get('/api/v1/reports/visit-history')
    .query({ fromDate: '2026-10-01' });
  assert.equal(singleDate.status, 200);
  assert.deepEqual(visitFilters.filters, { fromDate: '2026-10-01', toDate: undefined, categoryId: undefined, locationId: undefined });

  const page = await request(app).get('/api/v1/reports/visit-history')
    .query({ fromDate: '2026-10-01', toDate: '2026-10-09', page: 2, pageSize: 10 });
  assert.equal(page.status, 200);
  assert.deepEqual(page.body, {
    items: [{ name: 'Asha Patel', mobile: '******3210' }],
    total: 31,
    page: 2,
    pageSize: 10,
  });
  assert.equal(visitFilters.pagination.offset, 10);

  const response = await request(app).get('/api/v1/reports/visit-history/export')
    .query({ fromDate: '2026-10-01', toDate: '2026-10-09' });

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /text\/csv/);
  assert.match(response.headers['content-disposition'], /visit-history\.csv/);
  assert.match(response.text, /'=HYPERLINK/);
  assert.equal(visitFilters.actorRole, 'VIEWER');
  assert.equal(visitFilters.exportAudit.rowCount, 1);
});

test('report routes reject roles without report access', async () => {
  const router = createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 9, role: 'SECURITY_GUARD' };
      next();
    },
    reportsService: { async registrations() { throw new Error('must not be called'); } },
  });
  const app = express();
  app.use('/api/v1/reports', router);
  app.use(errorHandler);

  const response = await request(app).get('/api/v1/reports/registrations');

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
});
