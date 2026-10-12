import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(256),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(10).max(256).regex(/[A-Za-z]/).regex(/\d/),
});

export function createAuthRouter({ authService, loginRateLimiter, authenticate }) {
  const router = express.Router();

  router.post(
    '/login',
    loginRateLimiter,
    asyncHandler(async (request, response) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Username and password are required');
      }

      const session = await authService.login(parsed.data);
      response.status(200).json(session);
    }),
  );

  router.post(
    '/logout',
    authenticate,
    asyncHandler(async (request, response) => {
      await authService.logout(request.auth.userId);
      response.status(204).end();
    }),
  );

  router.put(
    '/password',
    authenticate,
    asyncHandler(async (request, response) => {
      const parsed = passwordChangeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Password must contain at least 10 characters, a letter, and a digit');
      }

      await authService.changePassword({ userId: request.auth.userId, ...parsed.data });
      response.status(204).end();
    }),
  );

  return router;
}