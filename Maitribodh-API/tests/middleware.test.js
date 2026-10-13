import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../src/errors/ApiError.js';
import { asyncHandler } from '../src/middleware/asyncHandler.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';

test('notFoundHandler forwards a typed 404 error', () => {
  const request = { method: 'GET', path: '/missing' };
  let forwardedError;

  notFoundHandler(request, {}, (error) => {
    forwardedError = error;
  });

  assert.ok(forwardedError instanceof ApiError);
  assert.equal(forwardedError.statusCode, 404);
  assert.equal(forwardedError.code, 'NOT_FOUND');
});

test('errorHandler returns a typed JSON error without exposing internals', () => {
  const request = { log: { error() {} } };
  const response = createResponse();

  errorHandler(new ApiError(409, 'CONFLICT', 'Already exists'), request, response, () => {});

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, {
    error: { code: 'CONFLICT', message: 'Already exists' },
  });
});

test('errorHandler hides unexpected error details', () => {
  const request = { log: { error() {} } };
  const response = createResponse();

  errorHandler(new Error('database password leaked'), request, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

test('errorHandler exposes bounded diagnostics only in local development when enabled', () => {
  const previousMode = process.env.NODE_ENV;
  const previousDebug = process.env.MAMS_DEBUG_API_ERRORS;
  process.env.NODE_ENV = 'development';
  process.env.MAMS_DEBUG_API_ERRORS = 'true';
  try {
    const request = { log: { error() {} }, socket: { remoteAddress: '127.0.0.1' } };
    const response = createResponse();
    const error = Object.assign(new Error('column length exceeded'), { code: '22001', column: 'email', table: 'person' });

    errorHandler(error, request, response, () => {});

    assert.deepEqual(response.body, {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      debug: { name: 'Error', message: 'column length exceeded', code: '22001', column: 'email', table: 'person' },
    });
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    if (previousDebug === undefined) delete process.env.MAMS_DEBUG_API_ERRORS;
    else process.env.MAMS_DEBUG_API_ERRORS = previousDebug;
  }
});

test('asyncHandler forwards rejected promises to the error middleware', async () => {
  const expectedError = new Error('request failed');
  let forwardedError;
  const handleRequest = asyncHandler(async () => {
    throw expectedError;
  });

  await handleRequest({}, {}, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, expectedError);
});

function createResponse() {
  return {
    statusCode: undefined,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}