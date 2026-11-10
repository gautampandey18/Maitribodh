import { randomInt } from 'node:crypto';
import { ApiError } from '../../errors/ApiError.js';
import { getRoles } from '../../constants/roles.js';

export function createAuthService({
  repository,
  comparePassword,
  hashPassword,
  issueToken,
  clock = () => new Date(),
}) {
  return {
    async login({ username, password }) {
      const user = await repository.findByUsername(username);
      const now = clock();

      if (
        !user
        || isLocked(user.locked_until, now)
        || !user.password_hash
        || isTemporaryPasswordUnavailable(user, now)
      ) {
        throw invalidCredentials();
      }

      const passwordMatches = await comparePassword(password, user.password_hash);
      if (!passwordMatches) {
        await repository.recordFailedLogin(user.user_id, now);
        throw invalidCredentials();
      }

      if (user.status !== 'ACTIVE') {
        throw new ApiError(403, 'ACCOUNT_DEACTIVATED', 'Your account is deactivated. Contact the administrator to restore access.');
      }

      const authenticatedUser = await repository.completeLogin(user.user_id, now);
      if (!authenticatedUser) {
        throw invalidCredentials();
      }

      const accessToken = await issueToken(authenticatedUser);

      return {
        accessToken,
        tokenType: 'Bearer',
        user: {
          id: authenticatedUser.user_id,
          username: authenticatedUser.username ?? user.username ?? username,
          role: getRoles(authenticatedUser)[0],
          roles: getRoles(authenticatedUser),
        },
        mustChangePassword: authenticatedUser.must_change_password === true,
      };
    },

    async logout(userId) {
      const revoked = await repository.revokeSessions(userId);
      if (!revoked) {
        throw new ApiError(401, 'INVALID_SESSION', 'Session is invalid or expired');
      }
    },

    async changePassword({ userId, currentPassword, newPassword }) {
      if (!isStrongPassword(newPassword)) {
        throw new ApiError(400, 'WEAK_PASSWORD', 'Password must contain at least 10 characters, a letter, and a digit');
      }

      const user = await repository.findCredentialsById(userId);
      if (
        !user
        || user.status !== 'ACTIVE'
        || !user.password_hash
        || !(await comparePassword(currentPassword, user.password_hash))
      ) {
        throw new ApiError(400, 'CURRENT_PASSWORD_INVALID', 'Current password is incorrect');
      }

      const passwordHash = await hashPassword(newPassword, 12);
      const updated = await repository.updatePassword(userId, passwordHash);
      if (!updated) {
        throw new ApiError(401, 'INVALID_SESSION', 'Session is invalid or expired');
      }
    },

    async issueTemporaryPassword({ targetUserId, adminUserId, adminRole, ipAddress, device }) {
      const temporaryPassword = generateTemporaryPassword();
      const expiresAt = new Date(clock().getTime() + 24 * 60 * 60 * 1000);
      const passwordHash = await hashPassword(temporaryPassword, 12);
      const reset = await repository.setTemporaryPassword({
        targetUserId,
        passwordHash,
        expiresAt,
        adminUserId,
        adminRole,
        ipAddress,
        device,
      });

      if (!reset) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'Active user not found');
      }

      return { temporaryPassword, expiresAt };
    },
  };
}

function generateTemporaryPassword() {
  const consonants = 'bcdfghjkmnpqrstvwz';
  const vowels = 'aeou';
  const word = () => Array.from({ length: 2 }, () => (
    consonants[randomInt(consonants.length)] + vowels[randomInt(vowels.length)]
  )).join('');
  const words = Array.from({ length: 2 }, word);
  const digits = Array.from({ length: 2 }, () => '23456789'[randomInt(8)]).join('');
  return `${words.join('-')}-${digits}`;
}

function isLocked(lockedUntil, now) {
  return lockedUntil !== null && lockedUntil !== undefined && new Date(lockedUntil) > now;
}

function isTemporaryPasswordUnavailable(user, now) {
  if (user.must_change_password !== true) {
    return false;
  }

  return (user.temporary_password_used_at !== null && user.temporary_password_used_at !== undefined)
    || !user.temporary_password_expires_at
    || new Date(user.temporary_password_expires_at) <= now;
}

function invalidCredentials() {
  return new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
}

function isStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 10
    && password.length <= 256
    && /[A-Za-z]/.test(password)
    && /\d/.test(password);
}