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
      const visibleRows = maskMobiles(rows, actorRole);
      return pagination ? paginatedResult(visibleRows, pagination) : visibleRows;
    },

    async occupancy({ filters, pagination }) {
      const rows = await repository.occupancy({ ...filters, pagination });
      return pagination ? paginatedResult(rows, pagination) : rows;
    },

    async staff({ filters, pagination }) {
      const rows = await repository.staff({ ...filters, pagination });
      return pagination ? paginatedResult(rows, pagination) : rows;
    },

    async approvals({ filters, pagination }) {
      const rows = await repository.approvals({ ...filters, pagination });
      return pagination ? paginatedResult(rows, pagination) : rows;
    },

    async blacklist({ filters, pagination }) {
      const rows = await repository.blacklist({ ...filters, pagination });
      return pagination ? paginatedResult(rows, pagination) : rows;
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