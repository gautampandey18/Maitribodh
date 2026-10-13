import express from 'express';
import { z } from 'zod';
import { ApiError } from '../../errors/ApiError.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import { categoryFormSchema } from '../../constants/category-schema.js';
import { parsePagination } from '../../utils/pagination.js';

const categorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  icon: z.string().trim().min(1).max(50).optional().default('fa-user'),
  description: z.string().trim().max(300).optional().default(''),
  formType: z.enum(['STAFF', 'PARIVAR', 'VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT', 'GENERIC']).optional().default('GENERIC'),
  approvalRequired: z.boolean().nullable().optional().default(false),
  overstayCutoff: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/), z.null()]).optional().default(null),
  permissionLevelId: z.number().int().positive().nullable().optional().default(null),
  isBroad: z.boolean().optional().default(false),
  broadCategoryId: z.number().int().positive().nullable().optional().default(null),
});
const categoryIdSchema = z.coerce.number().int().positive();
const categoryPatchSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  icon: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(300).optional(),
  formType: z.enum(['STAFF', 'PARIVAR', 'VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT', 'GENERIC']).optional(),
  approvalRequired: z.boolean().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  formSchema: categoryFormSchema.optional(),
  overstayCutoff: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/), z.null()]).optional(),
  permissionLevelId: z.number().int().positive().nullable().optional(),
  isBroad: z.boolean().optional(),
  broadCategoryId: z.number().int().positive().nullable().optional(),
}).refine((changes) => Object.keys(changes).length > 0);

export function createCategoriesRouter({ categoriesService, authenticate }) {
  const router = express.Router();

  router.get(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const filters = z.object({
        query: z.string().trim().max(100).default(''),
        formType: z.enum(['STAFF', 'PARIVAR', 'VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT', 'GENERIC']).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      }).safeParse(request.query);
      if (!filters.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid category filters');
      response.status(200).json(await categoriesService.listCategories({ ...parsePagination(request.query), ...filters.data }));
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsed = categorySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid category details');
      }

      const category = await categoriesService.createCategory({
        input: {
          ...parsed.data,
          overstayCutoff: parsed.data.overstayCutoff?.length === 5
            ? `${parsed.data.overstayCutoff}:00`
            : parsed.data.overstayCutoff,
        },
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(201).json(category);
    }),
  );

  router.get(
    '/:categoryId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedId = categoryIdSchema.safeParse(request.params.categoryId);
      if (!parsedId.success) {
        throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }

      response.status(200).json(await categoriesService.getCategory(parsedId.data));
    }),
  );

  router.patch(
    '/:categoryId',
    authenticate,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    asyncHandler(async (request, response) => {
      const parsedId = categoryIdSchema.safeParse(request.params.categoryId);
      const parsedChanges = categoryPatchSchema.safeParse(request.body);
      if (!parsedId.success) {
        throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
      if (!parsedChanges.success) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Provide valid category fields to update');
      }

      const changes = { ...parsedChanges.data };
      if (changes.overstayCutoff?.length === 5) {
        changes.overstayCutoff = `${changes.overstayCutoff}:00`;
      }
      const category = await categoriesService.updateCategory({
        categoryId: parsedId.data,
        changes,
        actor: {
          userId: request.auth.userId,
          role: request.auth.role,
          ipAddress: request.ip,
          device: request.get('user-agent'),
        },
      });
      response.status(200).json(category);
    }),
  );

  return router;
}