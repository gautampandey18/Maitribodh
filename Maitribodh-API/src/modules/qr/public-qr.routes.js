import express from 'express';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const lookupSchema = z.object({
  mobile: z.union([
    z.string().regex(/^\+[1-9]\d{7,14}$/),
    z.string().regex(/^\d{10}$/).transform((value) => `+91${value}`),
  ]).refine((value) => isValidPhoneNumber(value)),
});

export function createPublicQrRouter({ qrService }) {
  const router = express.Router();

  router.post(
    '/qr-lookups',
    asyncHandler(async (request, response) => {
      const parsed = lookupSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide a valid registered mobile number');
      }

      const result = await qrService.generatePublicLookup({
        mobile: parsed.data.mobile,
        clientIp: request.ip,
      });
      if (result.limited) {
        request.log?.warn(
          { event: 'PUBLIC_QR_RATE_LIMITED', window: result.window },
          'Public QR lookup rate limit exceeded',
        );
        response.set('Retry-After', String(result.retryAfterSeconds));
        response.status(429).json({
          error: { code: 'RATE_LIMITED', message: 'Too many lookup requests' },
        });
        return;
      }

      response.status(200).json({ items: result.items });
    }),
  );

  return router;
}