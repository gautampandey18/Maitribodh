import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';

const gateLookupSchema = z.object({
  qrPayload: z.string().min(1).max(256).optional(),
  mobile: z.union([z.string().regex(/^\d{10}$/), z.string().regex(/^\+[1-9]\d{7,14}$/)]).optional(),
  query: z.string().trim().min(1).max(100).optional(),
  locationId: z.number().int().positive(),
}).refine((input) => [input.qrPayload, input.mobile, input.query].filter(Boolean).length === 1);

export function createGateRouter({ gateService, authenticate }) {
  const router = express.Router();

  router.post(
    '/lookups',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER, ROLES.REGISTRATION_OFFICER, ROLES.SECURITY_GUARD),
    asyncHandler(async (request, response) => {
      const parsed = gateLookupSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide one QR code or mobile and an active location');
      }

      const result = await gateService.lookup({
        ...parsed.data,
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