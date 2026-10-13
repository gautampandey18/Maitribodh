import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

const statuses = ['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED'];

export function createPersonsRouter({ personsService, approvalsService, qrService, authenticate, registrationRouter }) {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER, ROLES.REGISTRATION_OFFICER),
    asyncHandler(async (request, response) => {
      const query = z.string().trim().max(100).default('').safeParse(request.query.q);
      const categoryId = request.query.categoryId === undefined
        ? { success: true, data: undefined }
        : z.coerce.number().int().positive().safeParse(request.query.categoryId);
      const status = request.query.status === undefined
        ? { success: true, data: undefined }
        : z.enum(statuses).safeParse(request.query.status);
      const pagination = parsePagination(request.query);

      if (!query.success || !categoryId.success || !status.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid person search parameters');
      }

      const result = await personsService.search({
        query: query.data,
        categoryId: categoryId.data,
        status: status.data,
        page: pagination.page,
        pageSize: pagination.pageSize,
        actorRole: request.auth.role,
      });
      response.status(200).json(result);
    }),
  );

  router.get(
    '/:personId/qr',
    authenticate,
    authorize(
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.APPROVER,
      ROLES.REGISTRATION_OFFICER,
      ROLES.SECURITY_GUARD,
    ),
    asyncHandler(async (request, response) => {
      const personId = z.coerce.number().int().positive().safeParse(request.params.personId);
      if (!personId.success) {
        throw new ApiError(404, 'QR_NOT_AVAILABLE', 'QR is not available for this person');
      }
      const qr = await qrService.generatePersonQr(personId.data);
      response.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store',
        'X-Person-Code': qr.personCode,
        'X-QR-Version': String(qr.version),
      });
      response.status(200).send(qr.image);
    }),
  );

  router.post(
    '/:personId/resubmissions',
    authenticate,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.APPROVER, ROLES.REGISTRATION_OFFICER),
    asyncHandler(async (request, response) => {
      const personId = z.coerce.number().int().positive().safeParse(request.params.personId);
      if (!personId.success) {
        throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
      }
      const person = await approvalsService.resubmit({
        personId: personId.data,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(200).json(person);
    }),
  );

  if (registrationRouter) router.use(registrationRouter);
  return router;
}