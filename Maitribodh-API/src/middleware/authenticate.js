import { ApiError } from '../errors/ApiError.js';
import { asyncHandler } from './asyncHandler.js';

export function createAuthenticate({ verifyToken, getUserById }) {
  return asyncHandler(async (request, _response, next) => {
    const authorization = request.get('authorization');
    const match = typeof authorization === 'string' && authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required');
    }

    let claims;
    try {
      claims = await verifyToken(match[1]);
    } catch {
      throw new ApiError(401, 'INVALID_SESSION', 'Session is invalid or expired');
    }

    const userId = claims?.sub;
    const tokenVersion = claims?.tokenVersion;
    if (!userId || !Number.isInteger(tokenVersion)) {
      throw new ApiError(401, 'INVALID_SESSION', 'Session is invalid or expired');
    }

    const user = await getUserById(userId);
    if (!user || user.status !== 'ACTIVE' || user.token_version !== tokenVersion) {
      throw new ApiError(401, 'INVALID_SESSION', 'Session is invalid or expired');
    }

    const mustChangePassword = user.must_change_password === true;
    const isPasswordChange = request.method === 'PUT'
      && request.baseUrl === '/api/v1/auth'
      && request.path === '/password';
    const isLogout = request.method === 'POST'
      && request.baseUrl === '/api/v1/auth'
      && request.path === '/logout';

    if (mustChangePassword && !isPasswordChange && !isLogout) {
      throw new ApiError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your password before continuing');
    }

    request.auth = {
      userId: user.user_id,
      role: user.role,
      mustChangePassword,
    };
    next();
  });
}