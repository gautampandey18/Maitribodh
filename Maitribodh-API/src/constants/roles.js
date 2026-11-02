export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  APPROVER: 'APPROVER',
  REGISTRATION_OFFICER: 'REG_OFFICER',
  SECURITY_GUARD: 'SECURITY_GUARD',
  VIEWER: 'VIEWER',
});

/**
 * Returns assigned roles in precedence order, accepting legacy single-role accounts.
 * The first role remains the representative role for audit records and legacy workflows.
 * @param {object|string|string[]} subject User, auth context, or roles.
 * @returns {string[]} Recognized, distinct roles in precedence order.
 */
export function getRoles(subject) {
  const assigned = Array.isArray(subject) ? subject
    : typeof subject === 'string' ? [subject]
      : subject?.roles ?? [subject?.role];
  return Object.values(ROLES).filter((role) => assigned.includes(role));
}

/**
 * Checks whether any assigned role grants the requested permission.
 * @param {object|string|string[]} subject User, auth context, or roles.
 * @param {...string} allowedRoles Roles permitted to perform the action.
 * @returns {boolean} Whether at least one role is allowed.
 */
export function hasRole(subject, ...allowedRoles) {
  return getRoles(subject).some((role) => allowedRoles.includes(role));
}