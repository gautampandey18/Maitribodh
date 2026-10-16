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
  const queueStatusSchema = z.enum(['PENDING', 'ACTIVE', 'REJECTED']).default('PENDING');
  const filterSchema = z.object({
    name: z.string().trim().max(100).default(''),
    category: z.string().trim().max(100).default(''),
  });

  router.get(
    '/',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER),
    asyncHandler(async (request, response) => {
      const status = queueStatusSchema.safeParse(request.query.status);
      if (!status.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid approval queue status');
      const filters = filterSchema.safeParse({
        name: request.query.name ?? '',
        category: request.query.category ?? '',
      });
      if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid approval queue filters');
      const pagination = parsePagination(request.query);
      const result = status.data === 'PENDING'
        ? await approvalsService.listPending({ ...pagination, ...filters.data })
        : await approvalsService.listByStatus({ status: status.data, ...pagination, ...filters.data });
      response.status(200).json(result);
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