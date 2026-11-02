export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'APPROVER', 'REG_OFFICER', 'SECURITY_GUARD', 'VIEWER'];

/**
 * Returns a user's distinct roles in precedence order, including legacy single-role accounts.
 * @param {object|string|string[]} subject User or assigned roles.
 * @returns {string[]} Recognized roles.
 */
export function getRoles(subject) {
  const assigned = Array.isArray(subject) ? subject
    : typeof subject === 'string' ? [subject]
      : subject?.roles ?? [subject?.role];
  return USER_ROLES.filter((role) => assigned.includes(role));
}

/**
 * Tests a permission against all roles, without requiring the user to switch roles.
 * @param {object|string|string[]} subject User or assigned roles.
 * @param {...string} allowedRoles Roles that grant the permission.
 * @returns {boolean} Whether a role grants access.
 */
export function hasRole(subject, ...allowedRoles) {
  return getRoles(subject).some((role) => allowedRoles.includes(role));
}
