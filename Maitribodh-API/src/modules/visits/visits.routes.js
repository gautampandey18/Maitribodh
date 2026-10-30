import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';

const checkoutSchema = z.object({
  checkoutGateId: z.number().int().positive(),
  checkoutLocationId: z.number().int().positive(),
  device: z.string().trim().max(100).optional(),
});

const checkinSchema = z.object({
  personId: z.number().int().positive(),
  checkinGateId: z.number().int().positive(),
  checkinLocationId: z.number().int().positive(),
  accompanyingCount: z.coerce.number().int().min(0).max(32767).optional().default(0),
  device: z.string().trim().max(100).optional(),
});

export function createVisitsRouter({ visitsService, authenticate }) {
  const router = express.Router();

  router.post(
    '/:visitId/reconciliation',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const visitId = z.coerce.number().int().positive().safeParse(request.params.visitId);
      const input = z.object({ note: z.string().trim().min(1).max(500) }).safeParse(request.body);
      if (!visitId.success) throw new ApiError(404, 'NO_ACTIVE_CHECKIN', 'No active check-in found');
      if (!input.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Provide an admin reconciliation note');
      const visit = await visitsService.reconcile({
        visitId: visitId.data,
        ...input.data,
        actor: { userId: request.auth.userId, role: request.auth.role, ipAddress: request.ip, device: request.get('user-agent') },
      });
      response.status(200).json(visit);
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize(ROLES.SECURITY_GUARD, ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const input = checkinSchema.safeParse(request.body);
      if (!input.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a valid person, gate, and area');
      }

      const visit = await visitsService.checkIn({
        ...input.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: input.data.device ?? request.get('user-agent'),
        },
      });
      response.status(201).json(visit);
    }),
  );

  router.post(
    '/:visitId/check-outs',
    authenticate,
    authorize(ROLES.SECURITY_GUARD, ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const visitId = z.coerce.number().int().positive().safeParse(request.params.visitId);
      const input = checkoutSchema.safeParse(request.body);
      if (!visitId.success) {
        throw new ApiError(404, 'NO_ACTIVE_CHECKIN', 'No active check-in found');
      }
      if (!input.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a valid checkout gate and location');
      }

      const visit = await visitsService.checkOut({
        visitId: visitId.data,
        ...input.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: input.data.device ?? request.get('user-agent'),
        },
      });
      response.status(200).json(visit);
    }),
  );

  return router;
}