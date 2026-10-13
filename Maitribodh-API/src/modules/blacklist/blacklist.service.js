import { ApiError } from '../../errors/ApiError.js';
import { paginatedResult } from '../../utils/pagination.js';

export function createBlacklistService({ repository }) {
  return {
    async listEntries(pagination) {
      return paginatedResult(await repository.listEntries(pagination), pagination);
    },

    async addEntry({ input, actor }) {
      try {
        const entry = await repository.addEntry({
          ...input,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!entry) {
          throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person record not found');
        }
        return entry;
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'ACTIVE_BLACKLIST_EXISTS', 'Person already has an open blacklist entry');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_BLACKLIST_REFERENCE', 'The selected person or reason is invalid');
        }
        if (error.code === '23514') {
          throw new ApiError(400, 'INVALID_DATE_RANGE', 'End date cannot be before start date');
        }
        throw error;
      }
    },

    async liftEntry({ blacklistId, liftNote, actor }) {
      const entry = await repository.liftEntry({
        blacklistId,
        liftNote,
        actorUserId: actor.userId,
        actorRole: actor.role,
        ipAddress: actor.ipAddress,
        device: actor.device,
      });
      if (!entry) {
        throw new ApiError(409, 'BLACKLIST_NOT_OPEN', 'No open blacklist entry found');
      }
      return entry;
    },
  };
}