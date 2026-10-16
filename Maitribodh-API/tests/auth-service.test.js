import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLES } from '../src/constants/roles.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';

test('login issues a Security Guard token with the approved 12-hour expiry', async () => {
  const issued = [];
  const service = createAuthService({
    repository: createRepository({ role: ROLES.SECURITY_GUARD }),
    comparePassword: async () => true,
    issueToken: async (user, expiresIn) => {
      issued.push({ user, expiresIn });
      return 'signed-token';
    },
  });

  const result = await service.login({ username: 'guard', password: 'valid-password' });

  assert.equal(issued[0].expiresIn, 43200);
  assert.equal(result.accessToken, 'signed-token');
  assert.equal(result.expiresIn, 43200);
});

test('login issues other roles tokens with the approved 30-minute expiry', async () => {
  const issued = [];
  const service = createAuthService({
    repository: createRepository({ role: ROLES.ADMIN }),
    comparePassword: async () => true,
    issueToken: async (_user, expiresIn) => {
      issued.push(expiresIn);
      return 'signed-token';
    },
  });

  const result = await service.login({ username: 'admin', password: 'valid-password' });

  assert.equal(issued[0], 1800);
  assert.equal(result.expiresIn, 1800);
});

test('first login consumes a valid temporary password and requires password change', async () => {
  const expiresAt = new Date('2026-10-10T00:00:00.000Z');
  let issuedUser;
  const service = createAuthService({
    repository: createRepository({
      role: ROLES.ADMIN,
      userOverrides: {
        must_change_password: true,
        temporary_password_expires_at: expiresAt,
        temporary_password_used_at: null,
      },
      loginOverrides: { must_change_password: true },
    }),
    comparePassword: async () => true,
    issueToken: async (user) => {
      issuedUser = user;
      return 'temporary-session';
    },
    clock: () => new Date('2026-10-09T12:00:00.000Z'),
  });

  const result = await service.login({ username: 'admin', password: 'temporary-secret' });

  assert.equal(result.mustChangePassword, true);
  assert.equal(issuedUser.must_change_password, true);
});

test('expired or already-used temporary passwords are rejected before comparison', async () => {
  for (const userOverrides of [
    {
      must_change_password: true,
      temporary_password_expires_at: new Date('2026-10-09T11:59:59.000Z'),
      temporary_password_used_at: null,
    },
    {
      must_change_password: true,
      temporary_password_expires_at: new Date('2026-10-10T00:00:00.000Z'),
      temporary_password_used_at: new Date('2026-10-09T11:00:00.000Z'),
    },
  ]) {
    let passwordCompared = false;
    const service = createAuthService({
      repository: createRepository({ role: ROLES.ADMIN, userOverrides }),
      comparePassword: async () => {
        passwordCompared = true;
        return true;
      },
      issueToken: async () => 'unused',
      clock: () => new Date('2026-10-09T12:00:00.000Z'),
    });

    await assert.rejects(
      service.login({ username: 'admin', password: 'temporary-secret' }),
      (error) => error.code === 'INVALID_CREDENTIALS',
    );
    assert.equal(passwordCompared, false);
  }
});

test('failed passwords update the lockout counter and return a generic error', async () => {
  let recordedUserId;
  const service = createAuthService({
    repository: {
      ...createRepository(),
      async recordFailedLogin(userId) {
        recordedUserId = userId;
      },
    },
    comparePassword: async () => false,
    issueToken: async () => 'unused',
  });

  await assert.rejects(
    service.login({ username: 'admin', password: 'wrong-password' }),
    (error) => error.code === 'INVALID_CREDENTIALS',
  );
  assert.equal(recordedUserId, 12);
});

test('deactivated accounts return an administrator guidance error only after a valid password', async () => {
  let completedLogin = false;
  let recordedFailure = false;
  const service = createAuthService({
    repository: {
      ...createRepository({ userOverrides: { status: 'INACTIVE' } }),
      async completeLogin() {
        completedLogin = true;
        return null;
      },
      async recordFailedLogin() {
        recordedFailure = true;
      },
    },
    comparePassword: async (_password, passwordHash) => passwordHash === 'stored-hash',
    issueToken: async () => 'unused',
  });

  await assert.rejects(
    service.login({ username: 'inactive-user', password: 'valid-password' }),
    (error) => error.statusCode === 403
      && error.code === 'ACCOUNT_DEACTIVATED'
      && error.message === 'Your account is deactivated. Contact the administrator to restore access.',
  );
  assert.equal(completedLogin, false);
  assert.equal(recordedFailure, false);
});

test('invalid password for a deactivated account keeps the generic credentials error', async () => {
  const service = createAuthService({
    repository: {
      ...createRepository({ userOverrides: { status: 'INACTIVE' } }),
      async recordFailedLogin() {},
    },
    comparePassword: async () => false,
    issueToken: async () => 'unused',
  });

  await assert.rejects(
    service.login({ username: 'inactive-user', password: 'wrong-password' }),
    (error) => error.statusCode === 401
      && error.code === 'INVALID_CREDENTIALS'
      && error.message === 'Invalid username or password',
  );
});

test('logout revokes sessions through the repository', async () => {
  let revokedUserId;
  const service = createAuthService({
    repository: {
      ...createRepository(),
      async revokeSessions(userId) {
        revokedUserId = userId;
        return true;
      },
    },
    comparePassword: async () => true,
    hashPassword: async () => 'unused',
    issueToken: async () => 'unused',
  });

  await service.logout(12);

  assert.equal(revokedUserId, 12);
});

test('password change verifies the current password, hashes at cost 12, and persists it', async () => {
  let savedPassword;
  let hashRounds;
  const service = createAuthService({
    repository: {
      ...createRepository(),
      async findCredentialsById() {
        return { user_id: 12, status: 'ACTIVE', password_hash: 'old-hash' };
      },
      async updatePassword(_userId, passwordHash) {
        savedPassword = passwordHash;
        return true;
      },
    },
    comparePassword: async (password, hash) => password === 'current-password' && hash === 'old-hash',
    hashPassword: async (password, rounds) => {
      hashRounds = rounds;
      return `hash:${password}`;
    },
    issueToken: async () => 'unused',
  });

  await service.changePassword({
    userId: 12,
    currentPassword: 'current-password',
    newPassword: 'new-password-123',
  });

  assert.equal(hashRounds, 12);
  assert.equal(savedPassword, 'hash:new-password-123');
});

test('Admin reset stores only a hash and returns a 24-hour temporary password once', async () => {
  let resetInput;
  let hashRounds;
  const service = createAuthService({
    repository: {
      ...createRepository(),
      async setTemporaryPassword(input) {
        resetInput = input;
        return true;
      },
    },
    comparePassword: async () => true,
    hashPassword: async (password, rounds) => {
      hashRounds = rounds;
      return `bcrypt:${password}`;
    },
    issueToken: async () => 'unused',
    clock: () => new Date('2026-10-09T12:00:00.000Z'),
  });

  const result = await service.issueTemporaryPassword({
    targetUserId: 12,
    adminUserId: 3,
    adminRole: ROLES.SUPER_ADMIN,
  });

  assert.equal(hashRounds, 12);
  assert.equal(result.temporaryPassword.length, 32);
  assert.equal(result.expiresAt.toISOString(), '2026-10-10T12:00:00.000Z');
  assert.equal(resetInput.passwordHash, `bcrypt:${result.temporaryPassword}`);
  assert.equal(resetInput.temporaryPassword, undefined);
});

function createRepository({ role = ROLES.ADMIN, userOverrides = {}, loginOverrides = {} } = {}) {
  const user = {
    user_id: 12,
    role,
    status: 'ACTIVE',
    password_hash: 'stored-hash',
    locked_until: null,
    token_version: 0,
    must_change_password: false,
    temporary_password_expires_at: null,
    temporary_password_used_at: null,
    ...userOverrides,
  };
  return {
    async findByUsername() {
      return user;
    },
    async recordFailedLogin() {},
    async completeLogin() {
      return {
        user_id: user.user_id,
        role: user.role,
        token_version: user.token_version,
        must_change_password: user.must_change_password,
        ...loginOverrides,
      };
    },
  };
}