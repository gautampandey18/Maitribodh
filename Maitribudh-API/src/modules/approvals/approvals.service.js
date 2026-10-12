import { ApiError } from '../../errors/ApiError.js';
import { paginatedResult } from '../../utils/pagination.js';

export function createApprovalsService({ repository }) {
  return {
    async listPending(pagination) {
      return paginatedResult(await repository.listPending(pagination), pagination);
    },

    async decide({ personId, decision, reason, actor }) {
      if (decision === 'REJECT' && (!reason || reason.trim().length < 10)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Rejection reason must contain at least 10 characters');
      }

      try {
        const result = await repository.decide({
          personId,
          decision,
          reason: reason?.trim() || null,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!result) {
          throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        }
        return result;
      } catch (error) {
        if (error.code === 'PERSON_NOT_PENDING') {
          throw new ApiError(409, error.code, error.message);
        }
        if (error.code === 'SUBMISSION_NOT_FOUND') {
          throw new ApiError(409, error.code, error.message);
        }
        if (error.code === 'SELF_APPROVAL_FORBIDDEN') {
          throw new ApiError(403, error.code, error.message);
        }
        throw error;
      }
    },

    async resubmit({ personId, actor }) {
      try {
        const person = await repository.resubmit({
          personId,
          actorUserId: actor.userId,
          actorRole: actor.role,
          ipAddress: actor.ipAddress,
          device: actor.device,
        });
        if (!person) {
          throw new ApiError(404, 'PERSON_NOT_FOUND', 'Person not found');
        }
        return person;
      } catch (error) {
        if (error.code === 'PERSON_NOT_REJECTED') {
          throw new ApiError(409, error.code, error.message);
        }
        if (error.code === 'RESUBMISSION_FORBIDDEN') {
          throw new ApiError(403, error.code, error.message);
        }
        throw error;
      }
    },
  };
}