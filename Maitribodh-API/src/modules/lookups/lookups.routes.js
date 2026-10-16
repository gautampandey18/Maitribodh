import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const lookupTypes = [
  'DEPARTMENT',
  'JOB_ROLE',
  'SUBCATEGORY',
  'PROGRAM_BATCH',
  'ID_PROOF_TYPE',
  'BLACKLIST_REASON',
  'PERMISSION_LEVEL',
];
const createLookupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  parentId: z.number().int().positive().nullable().optional().default(null),
  categoryId: z.number().int().positive().nullable().optional().default(null),
  extra: z.record(z.string(), z.unknown()).optional().default({}),
});
const updateLookupSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).refine((changes) => Object.keys(changes).length > 0);

export function createLookupsRouter({ lookupsService, authenticate }) {
  const router = express.Router();

  router.get(
    '/:lookupType',
    authenticate,
    asyncHandler(async (request, response) => {
      const lookupType = z.enum(lookupTypes).safeParse(request.params.lookupType.toUpperCase());
      const parentId = request.query.parentId === undefined
        ? { success: true, data: undefined }
        : z.coerce.number().int().positive().safeParse(request.query.parentId);
      const query = z.string().trim().max(100).default('').safeParse(request.query.query);

      if (!lookupType.success || !parentId.success || !query.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid lookup type or parent ID');
      }

      const includeInactive = request.query.includeInactive === 'true';
      if (includeInactive && ![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(request.auth.role)) throw new ApiError(403, 'FORBIDDEN', 'Inactive master data is restricted to administrators');
      const hasPagination = request.query.page !== undefined || request.query.pageSize !== undefined;
      const pagination = hasPagination ? parsePagination(request.query) : null;
      const result = await lookupsService.listValues(lookupType.data, parentId.data, includeInactive, pagination, query.data);
      response.status(200).json(Array.isArray(result) ? { items: result } : result);
    }),
  );

  router.post(
    '/:lookupType',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const lookupType = z.enum(lookupTypes).safeParse(request.params.lookupType.toUpperCase());
      const parsedInput = createLookupSchema.safeParse(request.body);
      if (!lookupType.success || !parsedInput.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid lookup details');
      }

      const value = await lookupsService.createValue({
        input: { lookupType: lookupType.data, ...parsedInput.data },
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(201).json(value);
    }),
  );

  router.patch(
    '/:lookupType/:lookupId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const lookupType = z.enum(lookupTypes).safeParse(request.params.lookupType.toUpperCase());
      const lookupId = z.coerce.number().int().positive().safeParse(request.params.lookupId);
      const changes = updateLookupSchema.safeParse(request.body);
      if (!lookupType.success || !lookupId.success) {
        throw new ApiError(404, 'LOOKUP_NOT_FOUND', 'Lookup value not found');
      }
      if (!changes.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide valid lookup fields to update');
      }

      const value = await lookupsService.updateValue({
        lookupType: lookupType.data,
        lookupId: lookupId.data,
        changes: changes.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(200).json(value);
    }),
  );

  router.delete(
    '/:lookupType/:lookupId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const lookupType = z.enum(lookupTypes).safeParse(request.params.lookupType.toUpperCase());
      const lookupId = z.coerce.number().int().positive().safeParse(request.params.lookupId);
      if (!lookupType.success || !lookupId.success) {
        throw new ApiError(404, 'LOOKUP_NOT_FOUND', 'Lookup value not found');
      }

      await lookupsService.deleteValue({
        lookupType: lookupType.data,
        lookupId: lookupId.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(204).end();
    }),
  );

  return router;
}