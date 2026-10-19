import express from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { parsePagination } from '../../utils/pagination.js';

export function createDashboardRouter({ dashboardService, authenticate }) {
  const router = express.Router();
  const roles = Object.values(ROLES);

  router.get(
    '/',
    authenticate,
    authorize(...roles),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await dashboardService.summary());
    }),
  );

  router.get(
    '/recent-activity',
    authenticate,
    authorize(...roles),
    asyncHandler(async (request, response) => {
      response.status(200).json(await dashboardService.recentActivity(parsePagination(request.query)));
    }),
  );

  router.get(
    '/inside',
    authenticate,
    authorize(...roles),
    asyncHandler(async (request, response) => {
      response.status(200).json(await dashboardService.inside({ actorRole: request.auth.role, ...parsePagination(request.query) }));
    }),
  );

  return router;
}