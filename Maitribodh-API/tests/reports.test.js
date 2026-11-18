import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createReportsRouter } from '../src/modules/reports/reports.routes.js';
import { createReportsService } from '../src/modules/reports/reports.service.js';
import { createReportsRepository } from '../src/modules/reports/reports.repository.js';
import {
  buildApprovalsAnalytics,
  buildBlacklistAnalytics,
  buildOccupancyAnalytics,
  buildRegistrationsAnalytics,
  buildStaffAnalytics,
  buildVisitsAnalytics,
  formatDelta,
  getIstDateRange,
} from '../src/modules/reports/reports.analytics.js';

test('percentage comparisons preserve normal changes and cap growth at 100 percent', () => {
  const cases = [
    [11, 4, '+100%'],
    [200, 1, '+100%'],
    [8, 4, '+100%'],
    [7, 4, '+75%'],
    [4, 4, '+0%'],
    [1, 4, '-75%'],
    [0, 4, '-100%'],
    [4, 0, '+100%'],
    [0, 0, '0%'],
    ['7', '4', '+75%'],
    [2, 3, '-33%'],
  ];
  for (const [current, previous, expected] of cases) {
    assert.equal(formatDelta(current, previous), `${expected} vs previous period`);
  }
});

test('all period-comparison cards cap percentages and preserve comparison labels', () => {
  for (const days of [1, 14]) {
    const dateRange = getIstDateRange({ fromDate: '2026-10-01', toDate: `2026-10-${String(days).padStart(2, '0')}` });
    const label = days === 1 ? 'vs previous day' : 'vs previous 14 days';
    const visits = buildVisitsAnalytics({ summary: { current_visits: 11, prev_visits: 4 }, dateRange });
    const registrations = buildRegistrationsAnalytics({
      summary: { current_registrations: 11, prev_registrations: 4 }, dateRange,
    });
    const approvals = buildApprovalsAnalytics({ summary: { total_requests: 11, prev_requests: 4 }, dateRange });
    assert.equal(visits.kpis[0].delta, `+100% ${label}`);
    assert.equal(registrations.kpis[0].delta, `+100% ${label}`);
    assert.deepEqual(approvals.kpis[0].lines[1], { label: `Change ${label}`, value: '+100%' });
    assert.equal(visits.kpis[0].value, '11');
    assert.equal(registrations.kpis[0].value, '11');
    assert.equal(approvals.kpis[0].value, '11');
  }
});

test('report share and attendance percentages stay within zero to 100 without changing counts', () => {
  const dateRange = getIstDateRange();
  for (const [count, expected] of [[11, 100], [3, 75], [0, 0]]) {
    const byCategory = [{ category_name: 'Visitor', count }];
    const visits = buildVisitsAnalytics({ summary: { current_visits: 4 }, byCategory, dateRange });
    const registrations = buildRegistrationsAnalytics({
      summary: { current_registrations: 4, visitor_count: count }, byCategory, dateRange,
    });
    const staff = buildStaffAnalytics({ summary: { active_staff: 4, present_today: count }, dateRange });
    assert.equal(visits.chartRight.segments[0].percentage, expected);
    assert.equal(visits.chartRight.segments[0].count, count);
    assert.equal(registrations.chartRight.segments[0].percentage, expected);
    assert.equal(registrations.kpis[1].delta, `${expected}% of new`);
    assert.equal(staff.kpis[1].lines[1].value, `${expected}%`);
    assert.equal(staff.kpis[1].value, String(count));
  }
  const staff = buildStaffAnalytics({ summary: { active_staff: 0, present_today: 0 }, dateRange });
  assert.equal(staff.kpis[1].lines[1].value, '0%');
  const approvals = buildApprovalsAnalytics({
    summary: { approved_count: 3, rejected_count: 1 },
    byOutcome: [{ action: 'APPROVED', count: 3 }, { action: 'REJECTED', count: 1 }],
    dateRange,
  });
  assert.equal(approvals.kpis[1].lines[1].value, '75%');
  assert.deepEqual(approvals.chartRight.segments.map(({ percentage }) => percentage), [75, 25]);
});

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
  assert.deepEqual(call.values, ['2026-10-01', '2026-10-09', 3, 5, '']);
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

  assert.match(call.sql, /identity\.first_name \|\| ' ' \|\| identity\.last_name ILIKE/);
  assert.match(call.sql, /c\.name ILIKE/);
  assert.match(call.sql, /LIMIT \$4 OFFSET \$5/);
  assert.deepEqual(call.values, ['Asha', 'Staff', '', 10, 10]);
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

  assert.match(call.sql, /identity\.first_name \|\| ' ' \|\| identity\.last_name ILIKE/);
  assert.match(call.sql, /j\.name ILIKE/);
  assert.match(call.sql, /LIMIT \$4 OFFSET \$5/);
  assert.deepEqual(call.values, ['Asha', 'Coordinator', '', 10, 10]);
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
  assert.match(call.sql, /LIMIT \$5 OFFSET \$6/);
  assert.deepEqual(call.values, ['2026-10-01', '2026-10-09', 'approver', '', 10, 10]);
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
          : [{
            checkin_at: new Date('2026-11-04T11:30:00.000Z'),
            checkout_at: new Date('2026-11-04T12:15:00.000Z'),
            name: '=HYPERLINK("https://example.invalid")',
            mobile: '******3210',
          }];
      },
      async recordVisitHistoryExport(input) { visitFilters.exportAudit = input; },
    },
  });
  const app = express();
  app.use('/api/v1/reports', router);
  app.use(errorHandler);

  const unfiltered = await request(app).get('/api/v1/reports/visit-history');
  assert.equal(unfiltered.status, 200);
  assert.deepEqual(visitFilters.filters, { fromDate: undefined, toDate: undefined, categoryId: undefined, locationId: undefined, search: '' });

  const invalidRange = await request(app).get('/api/v1/reports/visit-history')
    .query({ fromDate: '2026-10-10', toDate: '2026-10-09' });
  assert.equal(invalidRange.status, 400);

  const singleDate = await request(app).get('/api/v1/reports/visit-history')
    .query({ fromDate: '2026-10-01' });
  assert.equal(singleDate.status, 200);
  assert.deepEqual(visitFilters.filters, { fromDate: '2026-10-01', toDate: undefined, categoryId: undefined, locationId: undefined, search: '' });

  const blacklist = await request(app).get('/api/v1/reports/blacklist')
    .query({ name: 'Asha', category: 'Staff', page: 2, pageSize: 10 });
  assert.equal(blacklist.status, 200);
  assert.deepEqual(visitFilters, {
    filters: { fromDate: undefined, toDate: undefined, name: 'Asha', category: 'Staff', search: '' },
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });
  const invalidBlacklistFilter = await request(app).get('/api/v1/reports/blacklist')
    .query({ name: 'x'.repeat(101) });
  assert.equal(invalidBlacklistFilter.status, 400);

  const approvals = await request(app).get('/api/v1/reports/approvals')
    .query({ user: 'approver', fromDate: '2026-10-01', toDate: '2026-10-09', page: 2, pageSize: 10 });
  assert.equal(approvals.status, 200);
  assert.deepEqual(visitFilters, {
    filters: { fromDate: '2026-10-01', toDate: '2026-10-09', user: 'approver', search: '' },
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
  const worksheet = workbook.worksheets[0];
  assert.equal(worksheet.getCell('A1').value, 'Check-In At');
  const nameColumn = worksheet.getRow(1).values.indexOf('Name');
  assert.equal(worksheet.getRow(2).getCell(nameColumn).value, '=HYPERLINK("https://example.invalid")');
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
    if (report === 'visit-history') {
      return [{
        report,
        checkin_at: new Date('2026-11-04T11:30:00.000Z'),
        checkout_at: new Date('2026-11-04T12:15:00.000Z'),
      }, {
        report,
        checkin_at: new Date('2026-11-04T13:00:00.000Z'),
        checkout_at: null,
      }];
    }
    if (report === 'registrations') {
      return [
        { report, approval_required: true },
        { report, approval_required: false },
      ];
    }
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
    ['visit-history', { fromDate: '2026-10-01', categoryId: 2, locationId: 4 }, { filters: { fromDate: '2026-10-01', toDate: undefined, categoryId: 2, locationId: 4, search: '' }, actorRole: 'ADMIN' }],
    ['registrations', { categoryId: 3, status: 'ACTIVE' }, { filters: { fromDate: undefined, toDate: undefined, categoryId: 3, status: 'ACTIVE', search: '' }, actorRole: 'ADMIN' }],
    ['occupancy', { toDate: '2026-10-15' }, { filters: { fromDate: undefined, toDate: '2026-10-15', search: '' } }],
    ['staff', { name: 'Asha', jobRole: 'Coordinator' }, { filters: { fromDate: undefined, toDate: undefined, name: 'Asha', jobRole: 'Coordinator', search: '' } }],
    ['approvals', { fromDate: '2026-10-01', user: 'approver' }, { filters: { fromDate: '2026-10-01', toDate: undefined, user: 'approver', search: '' } }],
    ['blacklist', { name: 'Asha', category: 'Staff', search: 'MB-0001' }, { filters: { fromDate: undefined, toDate: undefined, name: 'Asha', category: 'Staff', search: 'MB-0001' } }],
  ];
  for (const [report, query, expectedInput] of exports) {
    const response = await request(app).get(`/api/v1/reports/${report}/export`).query(query).buffer(true).parse(parseBuffer);
    assert.equal(response.status, 200, `${report} should export`);
    assert.match(response.headers['content-type'], /spreadsheetml\.sheet/);
    assert.match(response.headers['content-disposition'], new RegExp(`${report}\\.xlsx`));
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body);
    if (report === 'visit-history') {
      const worksheet = workbook.worksheets[0];
      assert.deepEqual(worksheet.getRow(1).values.slice(1, 5), [
        'Check-In At', 'Check-In Time', 'Check-Out At', 'Check-Out Time',
      ]);
      assert.deepEqual(worksheet.getRow(2).values.slice(1, 5), [
        '2026-11-04', '17:00:00', '2026-11-04', '17:45:00',
      ]);
      assert.deepEqual(
        Array.from(worksheet.getRow(3).values.slice(1, 5), (value) => value ?? null),
        ['2026-11-04', '18:30:00', null, null],
      );
    } else {
      assert.equal(workbook.worksheets[0].getRow(2).getCell(1).value, report);
    }
    if (report === 'registrations') {
      const worksheet = workbook.worksheets[0];
      assert.equal(worksheet.getRow(1).getCell(2).value, 'Approval Required');
      assert.equal(worksheet.getRow(2).getCell(2).value, 'Yes');
      assert.equal(worksheet.getRow(3).getCell(2).value, 'No');
    }
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
    filters: { fromDate: undefined, toDate: undefined, name: 'Asha', jobRole: 'Coordinator', search: '' },
    pagination: { page: 2, pageSize: 10, offset: 10 },
  });
  await request(app).get('/api/v1/reports/staff')
    .query({ jobRole: 'x'.repeat(101) })
    .expect(400);
});

test('analytics route validates tab and date range, and forwards to reportsService', async () => {
  let received;
  const mockAnalytics = {
    subtitle: 'Last 14 days · times in IST',
    kpis: [{ label: 'Total visits', value: '10' }],
    chartLeft: { type: 'stacked-bar', title: 'Daily check-ins', xLabels: ['1'], yMax: 4, yTicks: [0, 1, 2, 3, 4], series: [] },
    chartRight: { type: 'donut', title: 'Visits by category', totalValue: '10', totalLabel: 'visits', segments: [] },
  };

  const app = express();
  app.use('/api/v1/reports', createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 1, role: 'ADMIN' };
      next();
    },
    reportsService: {
      async analytics(input) {
        received = input;
        return mockAnalytics;
      },
    },
  }));
  app.use(errorHandler);

  const res = await request(app).get('/api/v1/reports/analytics')
    .query({ tab: 'visits', fromDate: '2026-10-01', toDate: '2026-10-14' })
    .expect(200);

  assert.deepEqual(received, {
    tab: 'visits',
    filters: { fromDate: '2026-10-01', toDate: '2026-10-14', categoryId: undefined, locationId: undefined, search: '' },
  });
  assert.equal(res.body.subtitle, mockAnalytics.subtitle);

  // Invalid tab
  await request(app).get('/api/v1/reports/analytics')
    .query({ tab: 'invalid_tab' })
    .expect(400);

  // Invalid date range (fromDate > toDate)
  await request(app).get('/api/v1/reports/analytics')
    .query({ tab: 'visits', fromDate: '2026-10-20', toDate: '2026-10-10' })
    .expect(400);
});

test('reports repository analytics generates structured config for each tab', async () => {
  const repository = createReportsRepository({
    async query(sql) {
      if (sql.includes('FROM mams.visit') && sql.includes('current_visits')) {
        return {
          rows: [{
            current_visits: 12,
            prev_visits: 10,
            inside_now: 2,
            open_over_24h: 1,
            accompanying: 4,
          }],
        };
      }
      return { rows: [] };
    },
  });

  const analytics = await repository.analytics({ tab: 'visits', fromDate: '2026-10-01', toDate: '2026-10-14' });
  assert.equal(typeof analytics.subtitle, 'string');
  assert.equal(analytics.kpis.length, 3);
  assert.deepEqual(analytics.kpis[2], { label: 'Accompanying guests', value: '4' });
  assert.equal(analytics.chartLeft.type, 'stacked-bar');
  assert.equal(analytics.chartRight.type, 'donut');
});


test('every report table query applies the person search', async () => {
  const calls = [];
  const repository = createReportsRepository({
    async query(sql, values) { calls.push({ sql, values }); return { rows: [] }; },
  });

  await repository.visitHistory({ search: 'MB-0001' });
  await repository.registrations({ search: 'MB-0001' });
  await repository.occupancy({ search: 'MB-0001' });
  await repository.staff({ search: 'MB-0001' });
  await repository.approvals({ search: 'MB-0001' });
  await repository.blacklist({ search: 'MB-0001' });

  assert.equal(calls.length, 6);
  for (const call of calls) {
    assert.match(call.sql, /profile\.qr_code = upper\(\$\d+\)/);
    assert.ok(call.values.includes('MB-0001'));
  }
});

test('analytics queries are scoped by person search and tab filters', async () => {
  const tabs = {
    visits: { categoryId: 3, locationId: 5 },
    registrations: { categoryId: 3, status: 'ACTIVE' },
    occupancy: {},
    staff: { name: 'Asha', jobRole: 'Coordinator' },
    approvals: { user: 'approver' },
    blacklist: { name: 'Asha', category: 'Staff' },
  };
  for (const [tab, filters] of Object.entries(tabs)) {
    const calls = [];
    const repository = createReportsRepository({
      async query(sql, values) { calls.push({ sql, values }); return { rows: [] }; },
    });

    const analytics = await repository.analytics({ tab, fromDate: '2026-10-01', toDate: '2026-10-14', search: 'MB-0001', ...filters });

    assert.ok(calls.length > 0, `${tab} should query`);
    for (const call of calls) {
      assert.ok(call.values.includes('MB-0001'), `${tab} query should include the person search`);
      assert.match(call.sql, /profile\.qr_code = upper\(\$\d+\)/);
      // Pending registrations have no acting user yet, so only that count ignores the user filter.
      const isPendingCount = tab === 'approvals' && call.sql.includes('pending_count');
      for (const value of Object.values(filters)) {
        if (isPendingCount) continue;
        assert.ok(call.values.includes(value), `${tab} query should include ${value}`);
      }
    }
    assert.equal(analytics.kpis.length, ['registrations', 'staff'].includes(tab) ? 4 : 3);
  }
  await assert.rejects(createReportsRepository({ async query() { return { rows: [] }; } }).analytics({ tab: 'nope' }), { statusCode: 400 });
});

test('report routes forward person search to tables and analytics, and expose filter options', async () => {
  const received = {};
  const app = express();
  app.use('/api/v1/reports', createReportsRouter({
    authenticate(request_, _response, next) {
      request_.auth = { userId: 3, role: 'VIEWER' };
      next();
    },
    reportsService: {
      async registrations(input) { received.registrations = input; return { items: [], total: 0, page: 1, pageSize: 20 }; },
      async analytics(input) { received.analytics = input; return { kpis: [] }; },
      async options() { return { categories: [{ category_id: 1, name: 'Staff', status: 'ACTIVE' }], locations: [] }; },
    },
  }));
  app.use(errorHandler);

  await request(app).get('/api/v1/reports/registrations')
    .query({ search: '  Asha  ', fromDate: '2026-10-01', toDate: '2026-10-14', categoryId: '' })
    .expect(200);
  assert.deepEqual(received.registrations.filters, {
    fromDate: '2026-10-01', toDate: '2026-10-14', categoryId: undefined, status: undefined, search: 'Asha',
  });

  await request(app).get('/api/v1/reports/analytics')
    .query({ tab: 'staff', search: 'MB-0001', name: 'Asha', jobRole: 'Coordinator' })
    .expect(200);
  assert.deepEqual(received.analytics, {
    tab: 'staff',
    filters: { fromDate: undefined, toDate: undefined, name: 'Asha', jobRole: 'Coordinator', search: 'MB-0001' },
  });

  await request(app).get('/api/v1/reports/visit-history').query({ search: 'x'.repeat(101) }).expect(400);
  await request(app).get('/api/v1/reports/analytics').query({ tab: 'visits', search: 'x'.repeat(101) }).expect(400);

  const options = await request(app).get('/api/v1/reports/options').expect(200);
  assert.equal(options.body.categories[0].name, 'Staff');
});

test('visit analytics zero-fill empty days and use one color per category in both charts', () => {
  const dateRange = getIstDateRange({ fromDate: '2026-10-01', toDate: '2026-10-03' });
  const analytics = buildVisitsAnalytics({
    summary: { current_visits: 3 },
    daily: [
      { day: '2026-10-01', category_name: 'Visitor', checkin_count: 2 },
      { day: '2026-10-03', category_name: 'Retired Category', checkin_count: 1 },
    ],
    byCategory: [{ category_name: 'Visitor', count: 2 }, { category_name: 'Retired Category', count: 1 }],
    dateRange,
  });

  assert.deepEqual(analytics.chartLeft.xLabels, ['1', '2', '3']);
  const visitor = analytics.chartLeft.series.find((series) => series.name === 'Visitor');
  const retired = analytics.chartLeft.series.find((series) => series.name === 'Retired Category');
  assert.deepEqual(visitor.values, [2, 0, 0]);
  assert.deepEqual(retired.values, [0, 0, 1]);
  for (const segment of analytics.chartRight.segments) {
    assert.equal(segment.color, analytics.chartLeft.series.find((series) => series.name === segment.label).color);
  }
  assert.equal(analytics.kpis[0].value, '3');
});

test('approval analytics compute the rate from decisions only', () => {
  const analytics = buildApprovalsAnalytics({
    summary: { total_requests: 10, approved_count: 3, rejected_count: 1, pending_count: 2, waiting_over_1h: 1, avg_decision_min: 90 },
    byOutcome: [{ action: 'SUBMITTED', count: 10 }, { action: 'APPROVED', count: 3 }, { action: 'REJECTED', count: 1 }],
    dateRange: getIstDateRange({ fromDate: '2026-10-01', toDate: '2026-10-02' }),
  });

  assert.deepEqual(analytics.kpis[1].lines[1], { label: 'Approval rate', value: '75%' });
  assert.equal(analytics.kpis.length, 3);
  assert.deepEqual(analytics.kpis[2], { label: 'Pending request', value: '2' });
  assert.equal(analytics.chartRight.totalValue, '14');
});

test('occupancy analytics describe a past day instead of live data', () => {
  const analytics = buildOccupancyAnalytics({
    summary: { checked_in_day: 4, still_inside_from_day: 1 },
    hourly: [{ hour: 0, count: 0 }, { hour: 9, count: 3 }],
    byLocation: [{ name: 'Main Hall', count: 3 }],
    dateRange: getIstDateRange({ fromDate: '2026-10-01', toDate: '2026-10-01' }),
  });

  assert.equal(analytics.subtitle, '1 Oct 2026 · times in IST');
  assert.deepEqual(analytics.chartLeft.xLabels, ['12a', '9a']);
  assert.equal(analytics.chartLeft.peakLabel, 'Peak 3 at 9a');
  assert.equal(analytics.kpis[0].label, 'Currently Inside');
  assert.equal(analytics.kpis[1].label, 'Busiest Location');
  assert.equal(analytics.kpis[1].value, 'Main Hall');
  assert.equal(analytics.kpis[1].delta, '3 Checked In');
  assert.equal(analytics.kpis[2].label, 'Checked In on 1 Oct');
  assert.equal(analytics.kpis[2].delta, "1 of This Day's Check-ins Still Inside");
  assert.equal(analytics.chartRight.title, 'Check-ins by location');
});

test('occupancy cards use clear current-day labels and meaningful zero-state details', () => {
  const dateRange = { ...getIstDateRange(), endStr: '2026-10-01', todayStr: '2026-10-01' };
  const empty = buildOccupancyAnalytics({ dateRange });
  assert.deepEqual(empty.kpis[1], {
    label: 'Most Occupied Location', value: 'None', delta: 'No Occupancy Recorded',
  });
  assert.deepEqual(empty.kpis[2], {
    label: 'Checked In Today', value: '0', delta: "0 of Today's Check-ins Still Inside",
  });
  const populated = buildOccupancyAnalytics({
    summary: { on_campus_now: 5, checked_in_day: 8, still_inside_from_day: 3 },
    byLocation: [{ name: 'Main Hall', count: 4 }], dateRange,
  });
  assert.equal(populated.kpis[0].label, 'Currently Inside');
  assert.equal(populated.kpis[0].value, '5');
  assert.deepEqual(populated.kpis[1], {
    label: 'Most Occupied Location', value: 'Main Hall', delta: '4 Currently Inside',
  });
  assert.deepEqual(populated.kpis[2], {
    label: 'Checked In Today', value: '8', delta: "3 of Today's Check-ins Still Inside",
  });
  const historical = buildOccupancyAnalytics({
    dateRange: { ...dateRange, todayStr: '2026-10-02' },
  });
  assert.equal(historical.kpis[1].delta, 'No Check-ins Recorded');
});

test('accompanying guests sum open visits independently of check-in dates and retain person filters', async () => {
  const calls = [];
  const repository = createReportsRepository({
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: sql.includes('AS accompanying') ? [{ accompanying: 7 }] : [] };
    },
  });
  const analytics = await repository.analytics({
    tab: 'visits', fromDate: '2026-10-01', toDate: '2026-10-02',
    search: 'Asha', categoryId: 3, locationId: 5,
  });
  const summary = calls.find(({ sql }) => sql.includes('AS accompanying'));
  assert.match(summary.sql, /sum\(v\.accompanying_count\) FILTER \(WHERE v\.status = 'OPEN'\), 0\)::int AS accompanying/);
  assert.doesNotMatch(summary.sql, /prev_accompanying/);
  assert.match(summary.sql, /p\.category_id = \$6/);
  assert.match(summary.sql, /v\.checkin_location_id = \$7/);
  assert.deepEqual(summary.values.slice(4), ['Asha', 3, 5]);
  assert.deepEqual(analytics.kpis[2], { label: 'Accompanying guests', value: '7' });

  const empty = buildVisitsAnalytics({ dateRange: getIstDateRange() });
  assert.deepEqual(empty.kpis[2], { label: 'Accompanying guests', value: '0' });
});

test('Visit History labels the people inside and dynamically counts stays over 24 hours', () => {
  for (const [inside, overdue] of [[5, 3], [2, 0], [0, 0]]) {
    const analytics = buildVisitsAnalytics({
      summary: { inside_now: inside, open_over_24h: overdue },
      dateRange: getIstDateRange(),
    });
    assert.deepEqual(analytics.kpis[1], {
      label: 'People Inside Premises',
      value: String(inside),
      delta: `${overdue} Present for More Than 24 Hours`,
    });
  }
});

test('report cards omit removed metrics and use the requested staff labels', () => {
  const dateRange = getIstDateRange();
  const registrations = buildRegistrationsAnalytics({
    summary: { pending_approvals: 4, oldest_pending_days: 3 }, dateRange,
  });
  assert.deepEqual(registrations.kpis[3], { label: 'Pending approvals', value: '4' });
  const occupancy = buildOccupancyAnalytics({ summary: { open_over_24h: 4 }, dateRange });
  assert.equal(occupancy.kpis.length, 3);
  assert.ok(occupancy.kpis.every(({ label }) => label !== 'Open > 24 h'));
  const blacklist = buildBlacklistAnalytics({ summary: { gate_screenings: 51, blocked_attempts: 3 }, dateRange });
  assert.equal(blacklist.kpis.length, 3);
  assert.deepEqual(blacklist.kpis[2], { label: 'Blocked entry attempts', value: '3' });
  const staff = buildStaffAnalytics({ summary: { avg_hours: 20.5, completed_visits: 4 }, dateRange });
  assert.equal(staff.kpis[2].label, 'Average Visit Duration');
  assert.deepEqual(staff.kpis[2].lines, [
    { label: 'Average Visit Duration', value: '20.5 h' },
    { label: 'Staff Visits Completed', value: '4' },
  ]);
});
