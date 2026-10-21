import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import test from 'node:test';
import ExcelJS from 'exceljs';
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
  await repository.staff({ pagination });
  await repository.approvals({ fromDate: '2026-10-01', toDate: '2026-10-09', pagination });
  await repository.blacklist({ pagination });

  assert.equal(calls.length, 6);
  for (const call of calls) {
    assert.match(call.sql, /count\(\*\) OVER\(\)::int AS total/);
    assert.match(call.sql, /LIMIT \$/);
    assert.match(call.sql, /OFFSET \$/);
    assert.deepEqual(call.values.slice(-2), [10, 10]);
  }
});

test('blacklist report filters by person name and category before pagination', async () => {
  let call;
  const repository = createReportsRepository({
    async query(sql, values) { call = { sql, values }; return { rows: [] }; },
  });

  await repository.blacklist({
    name: 'Asha',
    category: 'Staff',
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });

  assert.match(call.sql, /p\.first_name \|\| ' ' \|\| p\.last_name ILIKE/);
  assert.match(call.sql, /c\.name ILIKE/);
  assert.match(call.sql, /LIMIT \$3 OFFSET \$4/);
  assert.deepEqual(call.values, ['Asha', 'Staff', 10, 10]);
});

test('staff report filters by person name and job role before pagination', async () => {
  let call;
  const repository = createReportsRepository({
    async query(sql, values) { call = { sql, values }; return { rows: [] }; },
  });

  await repository.staff({
    name: 'Asha',
    jobRole: 'Coordinator',
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });

  assert.match(call.sql, /p\.first_name \|\| ' ' \|\| p\.last_name ILIKE/);
  assert.match(call.sql, /j\.name ILIKE/);
  assert.match(call.sql, /LIMIT \$3 OFFSET \$4/);
  assert.deepEqual(call.values, ['Asha', 'Coordinator', 10, 10]);
});

test('approvals report filters by acting username before pagination', async () => {
  let call;
  const repository = createReportsRepository({
    async query(sql, values) { call = { sql, values }; return { rows: [] }; },
  });

  await repository.approvals({
    fromDate: '2026-10-01',
    toDate: '2026-10-09',
    user: 'approver',
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });

  assert.match(call.sql, /u\.username ILIKE/);
  assert.match(call.sql, /LIMIT \$4 OFFSET \$5/);
  assert.deepEqual(call.values, ['2026-10-01', '2026-10-09', 'approver', 10, 10]);
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
    device: 'test-client'.padEnd(140, 'x'),
  });

  assert.match(auditCall.sql, /VISIT_HISTORY_EXPORT/);
  assert.equal(auditCall.values[0], 4);
  assert.match(auditCall.values[2], /"row_count":3/);
  assert.equal(auditCall.values[3], '127.0.0.1');
  assert.equal(auditCall.values[4].length, 100);
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

test('report service returns unpaginated rows for exports and paginates table requests', async () => {
  const row = { person_code: 'MB-000001', mobile: '9876543210', total: 1 };
  const repository = Object.fromEntries([
    'visitHistory',
    'registrations',
    'occupancy',
    'staff',
    'approvals',
    'blacklist',
  ].map((method) => [method, async () => [row]]));
  const service = createReportsService({ repository });
  const filters = { fromDate: undefined, toDate: undefined };

  const unpaginated = await Promise.all([
    service.visitHistory({ filters, actorRole: 'VIEWER' }),
    service.registrations({ filters, actorRole: 'VIEWER' }),
    service.occupancy({ filters }),
    service.staff({ filters }),
    service.approvals({ filters }),
    service.blacklist({ filters }),
  ]);

  assert.deepEqual(unpaginated[0], [{ ...row, mobile: '******3210' }]);
  assert.deepEqual(unpaginated[1], [{ ...row, mobile: '******3210' }]);
  for (const result of unpaginated.slice(2)) assert.deepEqual(result, [row]);

  const pagination = { page: 1, pageSize: 5, offset: 0 };
  const paginated = await service.registrations({ filters, actorRole: 'ADMIN', pagination });
  assert.deepEqual(paginated, {
    items: [{ person_code: 'MB-000001', mobile: '9876543210' }],
    total: 1,
    page: 1,
    pageSize: 5,
  });
});

test('report routes load without date filters, validate supplied ranges, and export Visit History to Excel', async () => {
  let visitFilters;
  const router = createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 3, role: 'VIEWER' };
      next();
    },
    reportsService: {
      async blacklist(input) {
        visitFilters = input;
        return { items: [], total: 0, page: input.pagination.page, pageSize: input.pagination.pageSize };
      },
      async approvals(input) {
        visitFilters = input;
        return { items: [], total: 0, page: input.pagination.page, pageSize: input.pagination.pageSize };
      },
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

  const blacklist = await request(app).get('/api/v1/reports/blacklist')
    .query({ name: 'Asha', category: 'Staff', page: 2, pageSize: 10 });
  assert.equal(blacklist.status, 200);
  assert.deepEqual(visitFilters, {
    filters: { name: 'Asha', category: 'Staff' },
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });
  const invalidBlacklistFilter = await request(app).get('/api/v1/reports/blacklist')
    .query({ name: 'x'.repeat(101) });
  assert.equal(invalidBlacklistFilter.status, 400);

  const approvals = await request(app).get('/api/v1/reports/approvals')
    .query({ user: 'approver', fromDate: '2026-10-01', toDate: '2026-10-09', page: 2, pageSize: 10 });
  assert.equal(approvals.status, 200);
  assert.deepEqual(visitFilters, {
    filters: { fromDate: '2026-10-01', toDate: '2026-10-09', user: 'approver' },
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });
  const invalidApprovalsUser = await request(app).get('/api/v1/reports/approvals')
    .query({ user: 'x'.repeat(101) });
  assert.equal(invalidApprovalsUser.status, 400);

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
    .query({ fromDate: '2026-10-01', toDate: '2026-10-09' })
    .buffer(true)
    .parse(parseBuffer);

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /spreadsheetml\.sheet/);
  assert.match(response.headers['content-disposition'], /visit-history\.xlsx/);
  assert.equal(visitFilters.actorRole, 'VIEWER');
  assert.equal(visitFilters.exportAudit.rowCount, 1);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(response.body);
  assert.equal(workbook.worksheets[0].getCell('A1').value, 'Name');
  assert.equal(workbook.worksheets[0].getCell('A2').value, '=HYPERLINK("https://example.invalid")');
});

test('every report has an unpaginated Excel export endpoint', async () => {
  const calls = [];
  const reportsService = Object.fromEntries([
    ['visitHistory', 'visit-history'],
    ['registrations', 'registrations'],
    ['occupancy', 'occupancy'],
    ['staff', 'staff'],
    ['approvals', 'approvals'],
    ['blacklist', 'blacklist'],
  ].map(([method, report]) => [method, async (input) => {
    calls.push({ report, input });
    return [{ report }];
  }]));
  reportsService.recordVisitHistoryExport = async () => {};
  const app = express();
  app.use('/api/v1/reports', createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 3, role: 'ADMIN' };
      next();
    },
    reportsService,
  }));
  app.use(errorHandler);

  const exports = [
    ['visit-history', { fromDate: '2026-10-01', categoryId: 2, locationId: 4 }, { filters: { fromDate: '2026-10-01', toDate: undefined, categoryId: 2, locationId: 4 }, actorRole: 'ADMIN' }],
    ['registrations', { categoryId: 3, status: 'ACTIVE' }, { filters: { categoryId: 3, status: 'ACTIVE' }, actorRole: 'ADMIN' }],
    ['occupancy', { toDate: '2026-10-15' }, { filters: { fromDate: undefined, toDate: '2026-10-15' } }],
    ['staff', { name: 'Asha', jobRole: 'Coordinator' }, { filters: { name: 'Asha', jobRole: 'Coordinator' } }],
    ['approvals', { fromDate: '2026-10-01', user: 'approver' }, { filters: { fromDate: '2026-10-01', toDate: undefined, user: 'approver' } }],
    ['blacklist', { name: 'Asha', category: 'Staff' }, { filters: { name: 'Asha', category: 'Staff' } }],
  ];
  for (const [report, query, expectedInput] of exports) {
    const response = await request(app).get(`/api/v1/reports/${report}/export`).query(query).buffer(true).parse(parseBuffer);
    assert.equal(response.status, 200, `${report} should export`);
    assert.match(response.headers['content-type'], /spreadsheetml\.sheet/);
    assert.match(response.headers['content-disposition'], new RegExp(`${report}\\.xlsx`));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body);
    assert.equal(workbook.worksheets[0].getRow(2).getCell(1).value, report);
    assert.deepEqual(calls.at(-1).input, expectedInput);
  }
  assert.deepEqual(calls.map(({ report }) => report), ['visit-history', 'registrations', 'occupancy', 'staff', 'approvals', 'blacklist']);
  assert.ok(calls.every(({ input }) => !input.pagination));
  await request(app).get('/api/v1/reports/unknown/export').expect(404);
});

function parseBuffer(response, callback) {
  const chunks = [];
  response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}

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

test('staff report route validates and forwards name and job-role filters', async () => {
  let received;
  const app = express();
  app.use('/api/v1/reports', createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 3, role: 'VIEWER' };
      next();
    },
    reportsService: {
      async staff(input) {
        received = input;
        return { items: [], total: 0, page: input.pagination.page, pageSize: input.pagination.pageSize };
      },
    },
  }));
  app.use(errorHandler);

  await request(app).get('/api/v1/reports/staff')
    .query({ name: 'Asha', jobRole: 'Coordinator', page: 2, pageSize: 10 })
    .expect(200);
  assert.deepEqual(received, {
    filters: { name: 'Asha', jobRole: 'Coordinator' },
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });
  await request(app).get('/api/v1/reports/staff')
    .query({ jobRole: 'x'.repeat(101) })
    .expect(400);
});
