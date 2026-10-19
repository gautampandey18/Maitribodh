import { ApiError } from '../../errors/ApiError.js';
import { ROLES } from '../../constants/roles.js';
import { paginatedResult } from '../../utils/pagination.js';

export function createUsersService({ repository }) {
  return {
    async listUsers(pagination) {
      return paginatedResult(await repository.listUsers(pagination), pagination);
    },

    async getUser(targetUserId) {
      const user = await repository.getUser(targetUserId);
      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }
      return user;
    },

    async createUser({ input, actor }) {
      if (input.role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'FORBIDDEN', 'Only a Super Admin can assign the Super Admin role');
      }

      try {
        return await repository.createUser({
          ...input,
          createdBy: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'USER_ALREADY_EXISTS', 'A user with these account details already exists');
        }
        throw error;
      }
    },

    async updateUser({ targetUserId, input, actor }) {
      try {
        const user = await repository.updateUser({
          targetUserId,
          ...input,
          deactivate: input.deactivate === true,
          activate: input.activate === true,
          canBulkUpload: input.canBulkUpload,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });

        if (!user) {
          throw new ApiError(404, 'USER_NOT_FOUND', 'Active user not found');
        }
        return user;
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'USER_ALREADY_EXISTS', 'A user with these account details already exists');
        }
        throw error;
      }
    },

    async deleteUser({ targetUserId, actor }) {
      const deleted = await repository.deleteUser({
        targetUserId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        ipAddress: actor.ipAddress,
        device: actor.device,
      });
      if (!deleted) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      return deleted;
    },
  };
}