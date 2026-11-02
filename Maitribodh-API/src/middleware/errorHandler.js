import { ApiError } from '../errors/ApiError.js';
import { formatDatabaseError } from '../utils/errorFormatter.js';

export function notFoundHandler(request, _response, next) {
  next(new ApiError(404, 'NOT_FOUND', `No route for ${request.method} ${request.path}`));
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const isExpected = error instanceof ApiError;
  const hasRouteContext = Boolean(request.originalUrl || request.path || request.baseUrl);
  const dbError = !isExpected && hasRouteContext ? formatDatabaseError(error, request) : null;

  const statusCode = isExpected ? error.statusCode : (dbError ? dbError.statusCode : 500);
  const code = isExpected ? error.code : (dbError ? dbError.code : 'INTERNAL_ERROR');
  const message = isExpected ? error.message : (dbError ? dbError.message : 'An unexpected error occurred');

  const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket?.remoteAddress);
  const debug = (!isExpected || error.debug) && isLoopback && process.env.NODE_ENV === 'development' && process.env.MAMS_DEBUG_API_ERRORS === 'true'
    ? { debug: {
      name: error.name,
      message: String(error.message ?? '').slice(0, 500),
      ...(error.code ? { code: error.code } : {}),
      ...(error.constraint ? { constraint: error.constraint } : {}),
      ...(error.column ? { column: error.column } : {}),
      ...(error.table ? { table: error.table } : {}),
    } }
    : {};

  request.log?.error({ err: error, code, statusCode }, 'Request failed');

  return response.status(statusCode).json({
    error: { code, message },
    ...debug,
  });
}
