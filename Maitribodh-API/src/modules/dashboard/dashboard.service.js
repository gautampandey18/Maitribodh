import { ROLES } from '../../constants/roles.js';

const ADMIN_ROLES = new Set([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

export function createDashboardService({ repository }) {
  return {
    async summary() {
      const [counts, checkinTrend, categoryMix, recentActivity, securityAlerts] = await Promise.all([
        repository.summary(),
        repository.checkinTrend(),
        repository.categoryMix(),
        repository.recentActivity(),
        repository.securityAlerts(),
      ]);
      return { ...counts, checkin_trend: checkinTrend, category_mix: categoryMix, recent_activity: recentActivity, security_alerts: securityAlerts };
    },

    async inside({ actorRole, page, pageSize, offset }) {
      const result = await repository.inside({ pageSize, offset });
      const items = ADMIN_ROLES.has(actorRole) ? result.items : result.items.map((row) => ({
        ...row,
        mobile: row.mobile ? `${'*'.repeat(Math.max(0, row.mobile.length - 4))}${row.mobile.slice(-4)}` : null,
      }));
      return { ...result, items, page, pageSize };
    },
  };
}