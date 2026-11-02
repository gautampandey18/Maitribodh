import { ApiError } from '../errors/ApiError.js';
import { hasRole } from '../constants/roles.js';

export function authorize(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new TypeError('At least one role must be allowed');
  }

  return function authorizeRequest(request, _response, next) {
    if (!request.auth) {
      return next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required'));
    }

    if (request.auth.mustChangePassword) {
      return next(new ApiError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your password before continuing'));
    }

    if (!hasRole(request.auth, ...allowedRoles)) {
      return next(new ApiError(403, 'FORBIDDEN', 'You are not authorized to perform this action'));
    }

    return next();
  };
}