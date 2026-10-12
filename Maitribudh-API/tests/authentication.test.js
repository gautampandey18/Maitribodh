import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLES } from '../src/constants/roles.js';
import { createAuthenticate } from '../src/middleware/authenticate.js';
import { authorize } from '../src/middleware/authorize.js';

test('authentication rejects a stale token version', async () => {
  const request = createRequest('Bearer valid-token');
  let forwardedError;
  const middleware = createAuthenticate({
    verifyToken: async () => ({ sub: '12', tokenVersion: 2 }),
    getUserById: async () => ({
      user_id: 12,
      role: ROLES.ADMIN,
      status: 'ACTIVE',
      token_version: 3,
    }),
  });

  await middleware(request, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError.code, 'INVALID_SESSION');
});

test('authentication attaches the verified active user', async () => {
  const request = createRequest('Bearer valid-token');
  let forwardedError;
  const middleware = createAuthenticate({
    verifyToken: async () => ({ sub: '12', tokenVersion: 3 }),
    getUserById: async () => ({
      user_id: 12,
      role: ROLES.ADMIN,
      status: 'ACTIVE',
      token_version: 3,
    }),
  });

  await middleware(request, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, undefined);
  assert.deepEqual(request.auth, {
    userId: 12,
    role: ROLES.ADMIN,
    mustChangePassword: false,
  });
});

test('authentication blocks temporary sessions outside password change or logout', async () => {
  const request = createRequest('Bearer temporary-token');
  request.method = 'GET';
  request.baseUrl = '/api/v1/users';
  request.path = '/12';
  let forwardedError;
  const middleware = createAuthenticate({
    verifyToken: async () => ({ sub: '12', tokenVersion: 3 }),
    getUserById: async () => ({
      user_id: 12,
      role: ROLES.ADMIN,
      status: 'ACTIVE',
      token_version: 3,
      must_change_password: true,
    }),
  });

  await middleware(request, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError.statusCode, 403);
  assert.equal(forwardedError.code, 'PASSWORD_CHANGE_REQUIRED');
});

test('authorization rejects a role outside the allowed set', () => {
  const middleware = authorize(ROLES.ADMIN);
  let forwardedError;

  middleware({ auth: { role: ROLES.VIEWER } }, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError.statusCode, 403);
  assert.equal(forwardedError.code, 'FORBIDDEN');
});

test('authorization blocks forced-change sessions from protected operations', () => {
  const middleware = authorize(ROLES.ADMIN);
  let forwardedError;

  middleware({ auth: { role: ROLES.ADMIN, mustChangePassword: true } }, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError.statusCode, 403);
  assert.equal(forwardedError.code, 'PASSWORD_CHANGE_REQUIRED');
});

function createRequest(authorization) {
  return {
    auth: undefined,
    get(name) {
      return name === 'authorization' ? authorization : undefined;
    },
  };
}