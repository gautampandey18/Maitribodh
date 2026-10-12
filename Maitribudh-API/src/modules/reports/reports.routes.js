import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const reportRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER, ROLES.REGISTRATION_OFFICER, ROLES.VIEWER];
const dateSchema = z.iso.date();
const reportStatus = z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED']);

export function createReportsRouter({ reportsService, authenticate }) {
  const router = express.Router();

  router.get(
    '/visit-history',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const filters = parseDateRange(request.query);
      const categoryId = optionalPositiveInteger(request.query.categoryId, 'categoryId');
      const locationId = optionalPositiveInteger(request.query.locationId, 'locationId');
      response.status(200).json(await reportsService.visitHistory({
        filters: { ...filters, categoryId, locationId },
        actorRole: request.auth.role,
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/visit-history/export',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const filters = parseDateRange(request.query);
      const categoryId = optionalPositiveInteger(request.query.categoryId, 'categoryId');
      const locationId = optionalPositiveInteger(request.query.locationId, 'locationId');
      const rows = await reportsService.visitHistory({
        filters: { ...filters, categoryId, locationId },
        actorRole: request.auth.role,
      });
      await reportsService.recordVisitHistoryExport({
        filters: { ...filters, categoryId, locationId },
        rowCount: rows.length,
        actor: actorFromRequest(request),
      });
      response.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="visit-history.csv"',
        'Cache-Control': 'private, no-store',
      });
      response.status(200).send(toCsv(rows));
    }),
  );

  router.get(
    '/registrations',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const categoryId = optionalPositiveInteger(request.query.categoryId, 'categoryId');
      const status = request.query.status === undefined
        ? undefined
        : reportStatus.safeParse(request.query.status);
      if (status && !status.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report status');
      }
      response.status(200).json(await reportsService.registrations({
        filters: { categoryId, status: status?.data },
        actorRole: request.auth.role,
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/occupancy',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      response.status(200).json(await reportsService.occupancy({
        filters: parseDateRange(request.query),
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/staff',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      response.status(200).json(await reportsService.staff(parsePagination(request.query)));
    }),
  );

  router.get(
    '/approvals',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      response.status(200).json(await reportsService.approvals({
        filters: parseDateRange(request.query),
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/blacklist',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      response.status(200).json(await reportsService.blacklist(parsePagination(request.query)));
    }),
  );

  return router;
}

function parseDateRange(query) {
  const fromDate = query.fromDate === undefined ? undefined : dateSchema.safeParse(query.fromDate);
  const toDate = query.toDate === undefined ? undefined : dateSchema.safeParse(query.toDate);
  if (fromDate && !fromDate.success || toDate && !toDate.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Provide valid date filters');
  }
  if (fromDate?.success && toDate?.success && fromDate.data > toDate.data) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'fromDate cannot be after toDate');
  }
  return { fromDate: fromDate?.data, toDate: toDate?.data };
}

function optionalPositiveInteger(value, name) {
  if (value === undefined) return undefined;
  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', `Invalid ${name}`);
  return parsed.data;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const text = value instanceof Date ? value.toISOString() : String(value ?? '');
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [columns, ...rows.map((row) => columns.map((column) => row[column]))]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');
}

function actorFromRequest(request) {
  return {
    userId: request.auth.userId,
    role: request.auth.role,
    ipAddress: request.ip,
    device: request.get('user-agent'),
  };
}