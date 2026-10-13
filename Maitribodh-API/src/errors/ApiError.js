export class ApiError extends Error {
  constructor(statusCode, code, message, options = {}) {
    super(message, options);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}