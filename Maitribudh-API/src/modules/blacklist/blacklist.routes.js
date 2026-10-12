import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const entrySchema = z.object({
  personId: z.coerce.number().int().positive(),
  reasonId: z.number().int().positive(),
  remarks: z.string().trim().min(1).max(500),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
}).refine((input) => !input.startDate || !input.endDate || input.endDate >= input.startDate);
const liftSchema = z.object({ liftNote: z.string().trim().min(1).max(500) });
const blacklistIdSchema = z.coerce.number().int().positive();

export function createBlacklistRouter({ blacklistService, authenticate }) {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      response.status(200).json(await blacklistService.listEntries(parsePagination(request.query)));
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const input = entrySchema.safeParse(request.body);
      if (!input.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a person, active reason, remarks, and valid dates');
      }
      const entry = await blacklistService.addEntry({
        input: input.data,
        actor: actorFromRequest(request),
      });
      response.status(201).json(entry);
    }),
  );

  router.post(
    '/:blacklistId/lifts',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const blacklistId = blacklistIdSchema.safeParse(request.params.blacklistId);
      const input = liftSchema.safeParse(request.body);
      if (!blacklistId.success) {
        throw new ApiError(404, 'BLACKLIST_NOT_OPEN', 'No open blacklist entry found');
      }
      if (!input.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a reason for lifting the blacklist');
      }
      const entry = await blacklistService.liftEntry({
        blacklistId: blacklistId.data,
        liftNote: input.data.liftNote,
        actor: actorFromRequest(request),
      });
      response.status(200).json(entry);
    }),
  );

  return router;
}

function actorFromRequest(request) {
  return {
    userId: request.auth.userId,
    role: request.auth.role,
    ipAddress: request.ip,
    device: request.get('user-agent'),
  };
}