import { describe, expect, it } from 'vitest';
import { canAccessPath, landingPath, NAVIGATION } from './navigation.js';

describe('screen permissions', () => {
  it.each(['SUPER_ADMIN', 'ADMIN'])('%s can access every screen', (role) => {
    expect(NAVIGATION.every((screen) => canAccessPath(role, screen.path))).toBe(true);
  });
  it.each([
    ['SECURITY_GUARD', ['/register', '/gate']],
    ['VIEWER', ['/dashboard', '/reports']],
    ['REG_OFFICER', ['/dashboard', '/persons', '/register', '/reports']],
    ['APPROVER', ['/dashboard', '/persons', '/register', '/approvals', '/reports']],
  ])('%s has only its configured screens', (role, paths) => {
    expect(NAVIGATION.filter((screen) => canAccessPath(role, screen.path)).map((screen) => screen.path)).toEqual(paths);
  });
  it('routes guards to the gate and denies unknown screens and anonymous users', () => {
    expect(landingPath('SECURITY_GUARD')).toBe('/gate');
    expect(canAccessPath('ADMIN', '/unknown')).toBe(false);
    expect(canAccessPath(undefined, '/persons')).toBe(false);
    expect(canAccessPath('REG_OFFICER', '/persons/123')).toBe(true);
  });
});