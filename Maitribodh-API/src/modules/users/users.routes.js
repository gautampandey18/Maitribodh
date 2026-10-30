import express from 'express';
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const userIdSchema = z.coerce.number().int().positive();
const userMobile = z.union([
  z.string().regex(/^[6-9]\d{9}$/),
  z.string().regex(/^\+[1-9]\d{7,14}$/),
]).refine((value) => isValidPhoneNumber(value.startsWith('+') ? value : `+91${value}`), 'Enter a valid mobile number');

const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  mobile: userMobile,
  email: z.union([z.string().trim().email().max(150), z.literal('')]).optional(),
  username: z.string().trim().min(1).max(50),
  role: z.enum(Object.values(ROLES)),
  isSecurityHead: z.boolean().optional().default(false),
  canBulkUpload: z.boolean().optional().default(false),
});
const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  mobile: userMobile.optional(),
  email: z.union([z.string().trim().email().max(150), z.literal('')]).optional(),
  username: z.string().trim().min(1).max(50).optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  isSecurityHead: z.boolean().optional(),
  deactivate: z.literal(true).optional(),
  activate: z.literal(true).optional(),
  canBulkUpload: z.boolean().optional(),
}).refine((input) => Object.keys(input).length > 0 && !(input.activate && input.deactivate));

export function createUsersRouter({ authService, usersService, authenticate }) {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const filters = z.object({
        query: z.string().trim().max(100).default(''),
        role: z.enum(Object.values(ROLES)).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      }).safeParse(request.query);
      if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid user filters');
      response.status(200).json(await usersService.listUsers({ ...parsePagination(request.query), ...filters.data }));
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsed = createUserSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid user details');
      }

      const user = await usersService.createUser({
        input: { ...parsed.data, email: parsed.data.email || null },
        actor: actorFromRequest(request),
      });
      response.status(201).json(user);
    }),
  );

  router.post(
    '/:userId/password-reset',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedUserId = userIdSchema.safeParse(request.params.userId);
      if (!parsedUserId.success) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'Active user not found');
      }

      const temporaryCredential = await authService.issueTemporaryPassword({
        targetUserId: parsedUserId.data,
        adminUserId: request.auth.userId,
        adminRole: request.auth.role,
        ipAddress: request.ip,
        device: request.get('user-agent'),
      });
      response.set({
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      });
      response.status(201).json(temporaryCredential);
    }),
  );

  router.get(
    '/:userId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedId = z.coerce.number().int().positive().safeParse(request.params.userId);
      if (!parsedId.success) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }
      response.status(200).json(await usersService.getUser(parsedId.data));
    }),
  );

  router.patch(
    '/:userId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedUserId = userIdSchema.safeParse(request.params.userId);
      const parsedInput = updateUserSchema.safeParse(request.body);
      if (!parsedUserId.success) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'Active user not found');
      }
      if (!parsedInput.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide user details or an account action');
      }

      const user = await usersService.updateUser({
        targetUserId: parsedUserId.data,
        input: parsedInput.data,
        actor: actorFromRequest(request),
      });
      response.status(200).json(user);
    }),
  );

  router.delete(
    '/:userId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedUserId = userIdSchema.safeParse(request.params.userId);
      if (!parsedUserId.success) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      if (parsedUserId.data === request.auth.userId) throw new ApiError(400, 'SELF_DELETE_FORBIDDEN', 'You cannot delete your own account');
      try {
        await usersService.deleteUser({ targetUserId: parsedUserId.data, actor: actorFromRequest(request) });
      } catch (error) {
        if (error.code === '23503') throw new ApiError(409, 'USER_IN_USE', 'This user is referenced by audit or operational records and cannot be deleted. Deactivate the user instead.');
        throw error;
      }
      response.status(204).send();
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
