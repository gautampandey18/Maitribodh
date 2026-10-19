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
      const filters = z.object({
        name: z.string().trim().max(100).default(''),
        jobRole: z.string().trim().max(100).default(''),
      }).safeParse(request.query);
      if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid staff report filters');
      response.status(200).json(await reportsService.staff({
        filters: filters.data,
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/approvals',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const userFilter = z.string().trim().max(100).default('').safeParse(request.query.user);
      if (!userFilter.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report user filter');
      response.status(200).json(await reportsService.approvals({
        filters: { ...parseDateRange(request.query), user: userFilter.data },
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/blacklist',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const filters = z.object({
        name: z.string().trim().max(100).default(''),
        category: z.string().trim().max(100).default(''),
      }).safeParse(request.query);
      if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report filters');
      response.status(200).json(await reportsService.blacklist({
        filters: filters.data,
        pagination: parsePagination(request.query),
      }));
    }),
  );

  router.get(
    '/:reportKey/export',
    authenticate,
    authorize(...reportRoles),
    asyncHandler(async (request, response) => {
      const { reportKey } = request.params;
      const rows = await exportRowsForReport(reportKey, request, reportsService);
      if (reportKey === 'visit-history') {
        const filters = {
          ...parseDateRange(request.query),
          categoryId: optionalPositiveInteger(request.query.categoryId, 'categoryId'),
          locationId: optionalPositiveInteger(request.query.locationId, 'locationId'),
        };
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
      worksheet.columns = columns.map((key) => ({
        header: columnLabel(key),
        key,
        width: Math.min(Math.max(columnLabel(key).length + 2, 14), 32),
      }));
      for (const row of rows) worksheet.addRow(row);
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

async function exportRowsForReport(reportKey, request, reportsService) {
  if (reportKey === 'visit-history') {
    const filters = {
      ...parseDateRange(request.query),
      categoryId: optionalPositiveInteger(request.query.categoryId, 'categoryId'),
      locationId: optionalPositiveInteger(request.query.locationId, 'locationId'),
    };
    return reportsService.visitHistory({ filters, actorRole: request.auth.role });
  }
  if (reportKey === 'registrations') {
    const categoryId = optionalPositiveInteger(request.query.categoryId, 'categoryId');
    const status = request.query.status === undefined ? undefined : reportStatus.safeParse(request.query.status);
    if (status && !status.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report status');
    return reportsService.registrations({
      filters: { categoryId, status: status?.data },
      actorRole: request.auth.role,
    });
  }
  if (reportKey === 'occupancy') {
    return reportsService.occupancy({ filters: parseDateRange(request.query) });
  }
  if (reportKey === 'staff') {
    const filters = z.object({
      name: z.string().trim().max(100).default(''),
      jobRole: z.string().trim().max(100).default(''),
    }).safeParse(request.query);
    if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid staff report filters');
    return reportsService.staff({ filters: filters.data });
  }
  if (reportKey === 'approvals') {
    const user = z.string().trim().max(100).default('').safeParse(request.query.user);
    if (!user.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report user filter');
    return reportsService.approvals({ filters: { ...parseDateRange(request.query), user: user.data } });
  }
  if (reportKey === 'blacklist') {
    const filters = z.object({
      name: z.string().trim().max(100).default(''),
      category: z.string().trim().max(100).default(''),
    }).safeParse(request.query);
    if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid report filters');
    return reportsService.blacklist({ filters: filters.data });
  }
  throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
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

function columnLabel(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function actorFromRequest(request) {
  return {
    userId: request.auth.userId,
    role: request.auth.role,
    ipAddress: request.ip,
    device: request.get('user-agent'),
  };
}