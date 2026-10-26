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

export function landingPath(role) {
  return role === 'SECURITY_GUARD' ? '/gate' : '/dashboard';
}

export function canAccessPath(role, path) {
  if (path === '/password') return Boolean(role);
  if (path === '/locations' || path.startsWith('/locations/')) return role === 'SUPER_ADMIN' || role === 'ADMIN';
  if (path === '/categories' || path.startsWith('/categories/')) {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }
  const screen = NAVIGATION.find((item) => path === item.path || path.startsWith(`${item.path}/`));
  return screen?.roles.includes(role) ?? false;
}