import { ApiError } from '../../errors/ApiError.js';
import { paginatedResult } from '../../utils/pagination.js';

export function createLocationsService({ repository }) {
  return {
    async listActiveLocations(pagination) {
      return paginatedResult(await repository.listActiveLocations(pagination), pagination);
    },

    async getLocation(locationId) {
      const location = await repository.getLocation(locationId);
      if (!location) {
        throw new ApiError(404, 'LOCATION_NOT_FOUND', 'Location not found');
      }
      return location;
    },

    async createLocation({ input, actor }) {
      if (input.locationType === 'GATE' && input.isRestricted) {
        throw new ApiError(400, 'INVALID_LOCATION', 'A gate cannot be restricted');
      }
      if (input.locationType === 'GATE' && input.maxOccupancy != null) {
        throw new ApiError(400, 'INVALID_LOCATION', 'Maximum occupancy can only be set for an area');
      }

      try {
        return await repository.createLocation({
          ...input,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'LOCATION_ALREADY_EXISTS', 'A location with this name already exists');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_MASTER_REFERENCE', 'The selected department is invalid');
        }
        if (error.code === '23514') {
          throw new ApiError(400, 'INVALID_LOCATION', 'A gate cannot be restricted');
        }
        throw error;
      }
    },

    async updateLocation({ locationId, changes, actor }) {
      if (changes.locationType === 'GATE' && changes.maxOccupancy != null) {
        throw new ApiError(400, 'INVALID_LOCATION', 'Maximum occupancy can only be set for an area');
      }
      try {
        const location = await repository.updateLocation({
          locationId,
          changes: changes.locationType === 'GATE' ? { ...changes, maxOccupancy: null } : changes,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!location) {
          throw new ApiError(404, 'LOCATION_NOT_FOUND', 'Location not found');
        }
        return location;
      } catch (error) {
        if (error.code === '23505') {
          throw new ApiError(409, 'LOCATION_ALREADY_EXISTS', 'A location with this name already exists');
        }
        if (error.code === '23503') {
          throw new ApiError(400, 'INVALID_MASTER_REFERENCE', 'The selected department is invalid');
        }
        if (error.code === '23514') {
          throw new ApiError(400, 'INVALID_LOCATION', 'A gate cannot be restricted');
        }
        throw error;
      }
    },
  };
}