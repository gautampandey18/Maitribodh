import express from 'express';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const reportRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER, ROLES.REGISTRATION_OFFICER, ROLES.VIEWER];
const dateSchema = z.iso.date();
const reportStatus = z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED']);
const textFilter = z.string().trim().max(100).default('');
const MASKED_MOBILE_REPORTS = new Set(['visit-history', 'registrations']);

const REPORT_SERVICE_METHODS = {
  'visit-history': 'visitHistory',
  registrations: 'registrations',
  occupancy: 'occupancy',
  staff: 'staff',
  approvals: 'approvals',
  blacklist: 'blacklist',
};

const ANALYTICS_TAB_REPORTS = {
  visits: 'visit-history',
  registrations: 'registrations',
  occupancy: 'occupancy',
  staff: 'staff',
  approvals: 'approvals',
  blacklist: 'blacklist',
};

export function createReportsRouter({ reportsService, authenticate }) {
  const router = express.Router();

  router.get(
    '/options',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await reportsService.options());
    }),
  );

  router.get(
    '/analytics',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const tab = request.query.tab || 'visits';
      const reportKey = ANALYTICS_TAB_REPORTS[tab];
      if (typeof tab !== 'string' || !reportKey) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report tab for analytics');
      }
      response.status(200).json(await reportsService.analytics({
        tab,
        filters: parseReportFilters(reportKey, request.query),
      }));
    }),
  );

  for (const [reportKey, method] of Object.entries(REPORT_SERVICE_METHODS)) {
    router.get(
      `/${reportKey}`,
      authenticate,
      authorize(...reportRoles),
      asyncHandler(async (request, response) => {
        response.status(200).json(await reportsService[method]({
          filters: parseReportFilters(reportKey, request.query),
          ...(MASKED_MOBILE_REPORTS.has(reportKey) ? { actorRole: request.auth.role } : {}),
          pagination: parsePagination(request.query),
        }));
      }),
    );
  }

  router.get(
    '/:reportKey/export',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const { reportKey } = request.params;
      const method = Object.hasOwn(REPORT_SERVICE_METHODS, reportKey) ? REPORT_SERVICE_METHODS[reportKey] : null;
      if (!method) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
      const filters = parseReportFilters(reportKey, request.query);
      const rows = await reportsService[method]({
        filters,
        ...(MASKED_MOBILE_REPORTS.has(reportKey) ? { actorRole: request.auth.role } : {}),
      });
      if (reportKey === 'visit-history') {
        await reportsService.recordVisitHistoryExport({
          filters,
          rowCount: rows.length,
          actor: actorFromRequest(request),
        });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Maitribodh AMS';
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet(reportKey.slice(0, 31));
      const columns = rows.length ? Object.keys(rows[0]) : [];
      if (reportKey === 'visit-history' && rows.length) {
        const remainingColumns = columns.filter((key) => key !== 'checkin_at' && key !== 'checkout_at');
        columns.splice(0, columns.length, 'checkin_at', 'checkin_time', 'checkout_at', 'checkout_time', ...remainingColumns);
      }
      worksheet.columns = columns.map((key) => ({
        header: columnLabel(key),
        key,
        width: Math.min(Math.max(columnLabel(key).length + 2, 14), 32),
      }));
      for (const row of rows) {
        const exportRow = { ...row };
        if (reportKey === 'registrations' && typeof row.approval_required === 'boolean') {
          exportRow.approval_required = row.approval_required ? 'Yes' : 'No';
        }
        if (reportKey === 'visit-history') {
          const checkin = formatIstDateTime(row.checkin_at);
          const checkout = formatIstDateTime(row.checkout_at);
          exportRow.checkin_at = checkin.date;
          exportRow.checkin_time = checkin.time;
          exportRow.checkout_at = checkout.date;
          exportRow.checkout_time = checkout.time;
        }
        worksheet.addRow(exportRow);
      }
      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      const buffer = await workbook.xlsx.writeBuffer();

      response.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportKey}.xlsx"`,
        'Cache-Control': 'private, no-store',
      });
      response.status(200).send(Buffer.from(buffer));
    }),
  );

  return router;
}

/**
 * Parses the filters a report accepts. The table, Excel export, and analytics all use this,
 * so KPIs and charts always describe the same records as the table.
 * @param {string} reportKey Report route key, for example `visit-history`.
 * @param {object} query Express query object.
 * @returns {object} Validated filters for the report.
 */
export function parseReportFilters(reportKey, query) {
  const search = optionalText(query.search, 'search');
  if (reportKey === 'visit-history') {
    return {
      ...parseDateRange(query),
      categoryId: optionalPositiveInteger(query.categoryId, 'categoryId'),
      locationId: optionalPositiveInteger(query.locationId, 'locationId'),
      search,
    };
  }
  if (reportKey === 'registrations') {
    return {
      ...parseDateRange(query),
      categoryId: optionalPositiveInteger(query.categoryId, 'categoryId'),
      status: optionalStatus(query.status),
      search,
    };
  }
  if (reportKey === 'occupancy') {
    return { ...parseDateRange(query), search };
  }
  if (reportKey === 'staff') {
    return {
      ...parseDateRange(query),
      name: optionalText(query.name, 'name'),
      jobRole: optionalText(query.jobRole, 'jobRole'),
      search,
    };
  }
  if (reportKey === 'approvals') {
    return { ...parseDateRange(query), user: optionalText(query.user, 'user'), search };
  }
  if (reportKey === 'blacklist') {
    return {
      ...parseDateRange(query),
      name: optionalText(query.name, 'name'),
      category: optionalText(query.category, 'category'),
      search,
    };
  }
  throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
}

function parseDateRange(query) {
  const fromDate = (query.fromDate === undefined || query.fromDate === '') ? undefined : dateSchema.safeParse(query.fromDate);
  const toDate = (query.toDate === undefined || query.toDate === '') ? undefined : dateSchema.safeParse(query.toDate);
  if ((fromDate && !fromDate.success) || (toDate && !toDate.success)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Provide valid date filters');
  }
  if (fromDate?.success && toDate?.success && fromDate.data > toDate.data) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'fromDate cannot be after toDate');
  }
  return { fromDate: fromDate?.data, toDate: toDate?.data };
}

function optionalPositiveInteger(value, name) {
  if (value === undefined || value === '') return undefined;
  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', `Invalid ${name}`);
  return parsed.data;
}

function optionalText(value, name) {
  const parsed = textFilter.safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', `Invalid ${name} filter`);
  return parsed.data;
}

function optionalStatus(value) {
  if (value === undefined || value === '') return undefined;
  const parsed = reportStatus.safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report status');
  return parsed.data;
}

function columnLabel(value) {
  const labels = {
    checkin_at: 'Check-In At',
    checkin_time: 'Check-In Time',
    checkout_at: 'Check-Out At',
    checkout_time: 'Check-Out Time',
  };
  if (labels[value]) return labels[value];
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatIstDateTime(value) {
  if (value === null || value === undefined) return { date: null, time: null };
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { date: String(value), time: null };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).map(({ type, value: part }) => [type, part]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

function actorFromRequest(request) {
  return {
    userId: request.auth.userId,
    role: request.auth.role,
    ipAddress: request.ip,
    device: request.get('user-agent'),
  };
}
