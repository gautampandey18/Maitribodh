import { ApiError } from '../../errors/ApiError.js';

export function createVisitsService({ repository }) {
  return {
    async checkIn({ personId, checkinGateId, checkinLocationId, actor }) {
      return repository.checkIn({
        personId,
        checkinGateId,
        checkinLocationId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        device: actor.device,
        ipAddress: actor.ipAddress,
      });
    },

    async checkOut({ visitId, checkoutGateId, checkoutLocationId, actor }) {
      const visit = await repository.checkOut({
        visitId,
        checkoutGateId,
        checkoutLocationId,
        actorUserId: actor.userId,
        actorRole: actor.role,
        device: actor.device,
        ipAddress: actor.ipAddress,
      });
      if (!visit) {
        throw new ApiError(409, 'NO_ACTIVE_CHECKIN', 'No active check-in found');
      }
      return visit;
    },

    async reconcile({ visitId, note, actor }) {
      const visit = await repository.reconcile({
        visitId, note, actorUserId: actor.userId, actorRole: actor.role,
        ipAddress: actor.ipAddress, device: actor.device,
      });
      if (!visit) throw new ApiError(409, 'NO_ACTIVE_CHECKIN', 'No active check-in found for reconciliation');
      return visit;
    },
  };
}