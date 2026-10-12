import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

export function createApprovalsRouter({ approvalsService, authenticate }) {
  const router = express.Router();
  const decisionSchema = z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().max(500).optional(),
  }).refine((input) => input.decision !== 'REJECT' || Boolean(input.reason?.trim() && input.reason.trim().length >= 10));

  router.get(
    '/',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER),
    asyncHandler(async (request, response) => {
      response.status(200).json(await approvalsService.listPending(parsePagination(request.query)));
    }),
  );

  router.post(
    '/:personId/decisions',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER),
    asyncHandler(async (request, response) => {
      const personId = z.coerce.number().int().positive().safeParse(request.params.personId);
      const input = decisionSchema.safeParse(request.body);
      if (!personId.success) {
        throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
      }
      if (!input.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a valid decision and rejection reason');
      }

      const result = await approvalsService.decide({
        personId: personId.data,
        ...input.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(200).json(result);
    }),
  );

  return router;
}