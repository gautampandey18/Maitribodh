import { ROLES } from '../../constants/roles.js';
import { paginatedResult } from '../../utils/pagination.js';

const ADMIN_ROLES = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

export function createReportsService({ repository }) {
  return {
    async visitHistory({ filters, actorRole, pagination }) {
      const rows = await repository.visitHistory({ ...filters, pagination });
      const visibleRows = maskMobiles(rows, actorRole);
      return pagination ? paginatedResult(visibleRows, pagination) : visibleRows;
    },

    async registrations({ filters, actorRole, pagination }) {
      const rows = await repository.registrations({ ...filters, pagination });
      return paginatedResult(maskMobiles(rows, actorRole), pagination);
    },

    async occupancy({ filters, pagination }) {
      return paginatedResult(await repository.occupancy({ ...filters, pagination }), pagination);
    },

    async staff({ filters, pagination }) {
      return paginatedResult(await repository.staff({ ...filters, pagination }), pagination);
    },

    async approvals({ filters, pagination }) {
      return paginatedResult(await repository.approvals({ ...filters, pagination }), pagination);
    },

    async blacklist({ filters, pagination }) {
      return paginatedResult(await repository.blacklist({ ...filters, pagination }), pagination);
    },

    recordVisitHistoryExport({ filters, rowCount, actor }) {
      return repository.recordVisitHistoryExport({
        filters,
        rowCount,
        actorUserId: actor.userId,
        actorRole: actor.role,
        ipAddress: actor.ipAddress,
        device: actor.device,
      });
    },
  };
}

function maskMobiles(rows, actorRole) {
  if (ADMIN_ROLES.has(actorRole)) return rows;
  return rows.map((row) => ({
    ...row,
    mobile: row.mobile ? `${'*'.repeat(Math.max(0, row.mobile.length - 4))}${row.mobile.slice(-4)}` : null,
  }));
}