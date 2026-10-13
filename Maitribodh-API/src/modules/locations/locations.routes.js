import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const locationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  locationType: z.enum(['GATE', 'AREA']),
  isRestricted: z.boolean().optional().default(false),
  departmentId: z.number().int().positive().nullable().optional().default(null),
});
const locationIdSchema = z.coerce.number().int().positive();
const locationPatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  locationType: z.enum(['GATE', 'AREA']).optional(),
  isRestricted: z.boolean().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).refine((changes) => Object.keys(changes).length > 0);

export function createLocationsRouter({ locationsService, authenticate }) {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const filters = z.object({
        query: z.string().trim().max(100).default(''),
        locationType: z.enum(['GATE', 'AREA']).optional(),
      }).safeParse(request.query);
      if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid location filters');
      response.status(200).json(await locationsService.listActiveLocations({ ...parsePagination(request.query), ...filters.data }));
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsed = locationSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid location details');
      }

      const location = await locationsService.createLocation({
        input: parsed.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(201).json(location);
    }),
  );

  router.get(
    '/:locationId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedId = locationIdSchema.safeParse(request.params.locationId);
      if (!parsedId.success) {
        throw new ApiError(404, 'LOCATION_NOT_FOUND', 'Location not found');
      }
      response.status(200).json(await locationsService.getLocation(parsedId.data));
    }),
  );

  router.patch(
    '/:locationId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedId = locationIdSchema.safeParse(request.params.locationId);
      const parsedChanges = locationPatchSchema.safeParse(request.body);
      if (!parsedId.success) {
        throw new ApiError(404, 'LOCATION_NOT_FOUND', 'Location not found');
      }
      if (!parsedChanges.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide valid location fields to update');
      }

      const location = await locationsService.updateLocation({
        locationId: parsedId.data,
        changes: parsedChanges.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(200).json(location);
    }),
  );

  return router;
}