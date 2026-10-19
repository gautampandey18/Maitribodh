import { ApiError } from '../../errors/ApiError.js';

export function createLookupsService({ repository }) {
  return {
    listValues(lookupType, parentId, includeInactive, pagination, query = '') {
      return repository.listValues(lookupType, parentId, includeInactive, pagination, query);
    },

    async createValue({ input, actor }) {
      const needsParent = input.lookupType === 'JOB_ROLE';
      const needsCategory = input.lookupType === 'SUBCATEGORY';
      if (
        (needsParent && (!input.parentId || input.categoryId !== null))
        || (needsCategory && (!input.categoryId || input.parentId !== null))
        || (!needsParent && input.parentId !== null)
        || (!needsCategory && input.categoryId !== null)
      ) {
        throw new ApiError(400, 'INVALID_LOOKUP_RELATION', 'The lookup parent/category relationship is invalid');
      }

      try {
        return await repository.createValue({
          ...input,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'LOOKUP_ALREADY_EXISTS', 'A lookup value with this name already exists');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_LOOKUP_RELATION', 'The selected parent or category is invalid');
        }
        if (error.code === 'INVALID_LOOKUP_PARENT') {
          throw new ApiError(400, 'INVALID_LOOKUP_RELATION', error.message);
        }
        throw error;
      }
    },

    async updateValue({ lookupType, lookupId, changes, actor }) {
      try {
        const value = await repository.updateValue({
          lookupType,
          lookupId,
          changes,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!value) {
          throw new ApiError(404, 'LOOKUP_NOT_FOUND', 'Lookup value not found');
        }
        return value;
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'LOOKUP_ALREADY_EXISTS', 'A lookup value with this name already exists');
        }
        throw error;
      }
    },

    async deleteValue({ lookupType, lookupId, actor }) {
      try {
        const value = await repository.deleteValue({
          lookupType,
          lookupId,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!value) {
          throw new ApiError(404, 'LOOKUP_NOT_FOUND', 'Lookup value not found');
        }
        return value;
      } catch (error) {
        if (error.code === '23503') {
          throw new ApiError(409, 'MASTER_DATA_IN_USE', 'This master value is referenced by other records and cannot be deleted. Deactivate it instead.');
        }
        throw error;
      }
    },
  };
}