import { describe, expect, it } from 'vitest';
import { canAccessPath, landingPath, NAVIGATION } from './navigation.js';

describe('screen permissions', () => {
  it.each(['SUPER_ADMIN', 'ADMIN'])('%s can access every screen', (role) => {
    expect(NAVIGATION.every((screen) => canAccessPath(role, screen.path))).toBe(true);
  });
  it.each([
    ['SECURITY_GUARD', ['/dashboard', '/register', '/gate']],
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
  it('keeps Categories available only to administrators without a sidebar entry', () => {
    expect(NAVIGATION.some((screen) => screen.path === '/categories')).toBe(false);
    expect(canAccessPath('ADMIN', '/categories')).toBe(true);
    expect(canAccessPath('SUPER_ADMIN', '/categories')).toBe(true);
    expect(canAccessPath('REG_OFFICER', '/categories')).toBe(false);
  });
  it('keeps Areas and Gates inside Master Data instead of the sidebar', () => {
    expect(NAVIGATION.some((screen) => screen.path === '/locations')).toBe(false);
    expect(canAccessPath('ADMIN', '/locations')).toBe(true);
    expect(canAccessPath('SUPER_ADMIN', '/locations')).toBe(true);
    expect(canAccessPath('REG_OFFICER', '/locations')).toBe(false);
  });
});