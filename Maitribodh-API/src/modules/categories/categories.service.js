import { ApiError } from '../../errors/ApiError.js';
import { paginatedResult } from '../../utils/pagination.js';

export function createCategoriesService({ repository }) {
  return {
    async listCategories(pagination) {
      return paginatedResult(await repository.listCategories(pagination), pagination);
    },

    async getCategory(categoryId) {
      const category = await repository.getCategory(categoryId);
      if (!category) {
        throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
      return category;
    },

    async createCategory({ input, actor }) {
      try {
        return await repository.createCategory({
          ...input,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'CATEGORY_ALREADY_EXISTS', 'A category with this name already exists');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_MASTER_REFERENCE', 'The selected permission level is invalid');
        }
        throw error;
      }
    },

    async updateCategory({ categoryId, changes, actor }) {
      try {
        const category = await repository.updateCategory({
          categoryId,
          changes,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!category) {
          throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
        }
        return category;
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'CATEGORY_ALREADY_EXISTS', 'A category with this name already exists');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_MASTER_REFERENCE', 'The selected permission level is invalid');
        }
        throw error;
      }
    },

    async deleteCategory({ categoryId, actor }) {
      try {
        const category = await repository.deleteCategory({
          categoryId,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!category) {
          throw new ApiError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
        }
        return category;
      } catch (error) {
        if (error.code === '23503') {
          throw new ApiError(409, 'MASTER_DATA_IN_USE', 'This category is in use and cannot be deleted. Deactivate it instead.');
        }
        throw error;
      }
    },
  };
}