import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAuthConfig } from '../src/config/auth.js';

test('auth config requires a strong secret and explicit positive IP limits', () => {
  const config = loadAuthConfig({
    JWT_SECRET: 's'.repeat(32),
    LOGIN_RATE_LIMIT_WINDOW_MS: '900000',
    LOGIN_RATE_LIMIT_MAX: '8',
  });

  assert.deepEqual(config, {
    jwtSecret: 's'.repeat(32),
    loginRateLimitWindowMs: 900000,
    loginRateLimitMax: 8,
  });
});

test('auth config rejects weak secrets and unspecified limits', () => {
  assert.throws(() => loadAuthConfig({}), /JWT_SECRET/);
  assert.throws(() => loadAuthConfig({
    JWT_SECRET: 's'.repeat(32),
    LOGIN_RATE_LIMIT_WINDOW_MS: '0',
    LOGIN_RATE_LIMIT_MAX: '8',
  }), /LOGIN_RATE_LIMIT_WINDOW_MS/);
});