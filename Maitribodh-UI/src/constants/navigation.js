import { getRoles, hasRole } from './roles.js';

export const NAVIGATION = [
  { path: '/dashboard', label: 'Dashboard', group: 'Overview', roles: ['SUPER_ADMIN', 'ADMIN', 'REG_OFFICER', 'APPROVER', 'VIEWER', 'SECURITY_GUARD'] },
  { path: '/persons', label: 'Person Management', group: 'Operations', roles: ['SUPER_ADMIN', 'ADMIN', 'REG_OFFICER', 'APPROVER'] },
  { path: '/register', label: 'Register Person', group: 'Operations', roles: ['SUPER_ADMIN', 'ADMIN', 'REG_OFFICER', 'APPROVER', 'SECURITY_GUARD'] },
  { path: '/approvals', label: 'Approval Center', group: 'Operations', roles: ['SUPER_ADMIN', 'ADMIN', 'APPROVER'] },
  { path: '/qr', label: 'QR / Identity', group: 'Operations', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/gate', label: 'Security Gate', group: 'Security', roles: ['SUPER_ADMIN', 'ADMIN', 'SECURITY_GUARD'] },
  { path: '/blacklist', label: 'Blacklist', group: 'Security', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/reports', label: 'Reports & Analytics', group: 'Analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'REG_OFFICER', 'APPROVER', 'VIEWER'] },
  { path: '/users', label: 'User Management', group: 'Administration', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/master', label: 'Master Data', group: 'Administration', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { path: '/audit', label: 'Audit & Compliance', group: 'Administration', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function landingPath(user) {
  return getRoles(user)[0] === 'SECURITY_GUARD' ? '/gate' : '/dashboard';
}

export function canAccessPath(user, path) {
  if (path === '/password') return getRoles(user).length > 0;
  if (path === '/locations' || path.startsWith('/locations/')) return hasRole(user, 'SUPER_ADMIN', 'ADMIN');
  if (path === '/categories' || path.startsWith('/categories/')) {
    return hasRole(user, 'SUPER_ADMIN', 'ADMIN');
  }
  const screen = NAVIGATION.find((item) => path === item.path || path.startsWith(`${item.path}/`));
  return screen ? hasRole(user, ...screen.roles) : false;
}
