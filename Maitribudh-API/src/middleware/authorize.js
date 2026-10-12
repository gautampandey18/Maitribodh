import { ApiError } from '../errors/ApiError.js';

export function authorize(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new TypeError('At least one role must be allowed');
  }

  const roleSet = new Set(allowedRoles);
  return function authorizeRequest(request, _response, next) {
    if (!request.auth) {
      return next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required'));
    }

    if (request.auth.mustChangePassword) {
      return next(new ApiError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your password before continuing'));
    }

    if (!roleSet.has(request.auth.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'You are not authorized to perform this action'));
    }

    return next();
  };
}