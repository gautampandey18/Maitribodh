import { ROLES } from '../../constants/roles.js';

const ADMIN_ROLES = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

export function createPersonsService({ repository }) {
  return {
    async search({ query, categoryId, status, page, pageSize = 5, actorRole }) {
      const offset = (page - 1) * pageSize;
      const rows = await repository.search({ query, categoryId, status, offset, pageSize });
      const total = rows.length ? Number(rows[0].total) : 0;
      const items = rows.map(({ total: _total, mobile, ...person }) => ({
        ...person,
        mobile: ADMIN_ROLES.has(actorRole) ? mobile : maskMobile(mobile),
      }));

      return { items, total, page, pageSize };
    },
  };
}

function maskMobile(mobile) {
  if (!mobile) return null;
  return `${'*'.repeat(Math.max(0, mobile.length - 4))}${mobile.slice(-4)}`;
}