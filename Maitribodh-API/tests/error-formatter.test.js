import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import {
  formatFieldLabel,
  formatZodError,
  formatDatabaseError,
  getOperationDescription,
} from '../src/utils/errorFormatter.js';

test('formatFieldLabel converts field and column names to friendly labels', () => {
  assert.equal(formatFieldLabel('firstName'), 'First name');
  assert.equal(formatFieldLabel('first_name'), 'First name');
  assert.equal(formatFieldLabel('mobile'), 'Mobile number');
  assert.equal(formatFieldLabel('reason'), 'Rejection reason');
  assert.equal(formatFieldLabel('remarks'), 'Remarks');
  assert.equal(formatFieldLabel('note'), 'Reconciliation note');
  assert.equal(formatFieldLabel('acted_by'), 'Acting user');
  assert.equal(formatFieldLabel('unknownField'), 'Unknown field');
});

test('getOperationDescription identifies the API operation from request path and method', () => {
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/approvals/12/decisions' }), 'approval decision');
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/users' }), 'user creation');
  assert.equal(getOperationDescription({ method: 'PATCH', originalUrl: '/api/v1/users/5' }), 'user update');
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/visits' }), 'gate check-in');
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/visits/10/check-outs' }), 'gate check-out');
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/blacklist' }), 'blacklist entry creation');
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/categories' }), 'category creation');
  assert.equal(getOperationDescription({ method: 'POST', originalUrl: '/api/v1/locations' }), 'location creation');
});

test('formatZodError produces operation-specific error messages for min/max/required fields', () => {
  const schema = z.object({
    username: z.string().min(3),
    firstName: z.string().min(1),
    reason: z.string().min(10),
    email: z.string().email(),
  });

  const emptyResult = schema.safeParse({ username: 'ab', firstName: '', reason: 'short', email: 'notanemail' });
  assert.equal(emptyResult.success, false);

  const usernameError = formatZodError(schema.safeParse({ username: 'a', firstName: 'John', reason: 'valid reason text', email: 'a@b.com' }).error, 'user creation');
  assert.match(usernameError, /Username must contain at least 3 characters for this user creation/);

  const firstNameError = formatZodError(schema.safeParse({ username: 'valid', firstName: '', reason: 'valid reason text', email: 'a@b.com' }).error, 'user creation');
  assert.match(firstNameError, /First name is required to complete this user creation/);

  const reasonError = formatZodError(schema.safeParse({ username: 'valid', firstName: 'John', reason: 'too short', email: 'a@b.com' }).error, 'approval decision');
  assert.match(reasonError, /Rejection reason must contain at least 10 characters for this approval decision/);

  const emailError = formatZodError(schema.safeParse({ username: 'valid', firstName: 'John', reason: 'valid reason text', email: 'bad' }).error, 'user creation');
  assert.match(emailError, /Please enter a valid email address for this user creation/);
});

test('formatDatabaseError translates Postgres error codes to operation-specific messages', () => {
  const request = { method: 'POST', originalUrl: '/api/v1/approvals/10/decisions' };

  // 22001 value too long
  const lenError = { code: '22001', column: 'reason', message: 'value too long for type character varying(500)' };
  const formattedLen = formatDatabaseError(lenError, request);
  assert.equal(formattedLen.statusCode, 400);
  assert.equal(formattedLen.code, 'VALIDATION_ERROR');
  assert.match(formattedLen.message, /Rejection reason exceeds the allowed length \(maximum 500 characters\) for this approval decision/);

  // 23502 not null
  const notNullError = { code: '23502', column: 'acted_by' };
  const formattedNotNull = formatDatabaseError(notNullError, request);
  assert.equal(formattedNotNull.statusCode, 400);
  assert.match(formattedNotNull.message, /authenticated user identity is required/);

  // 23505 unique violation
  const uniqueReq = { method: 'POST', originalUrl: '/api/v1/users' };
  const uniqueError = { code: '23505', constraint: 'ux_user_username' };
  const formattedUnique = formatDatabaseError(uniqueError, uniqueReq);
  assert.equal(formattedUnique.statusCode, 409);
  assert.match(formattedUnique.message, /Username already exists for this user creation/);

  // 23514 check constraint
  const consentReq = { method: 'POST', originalUrl: '/api/v1/persons/registration' };
  const consentError = { code: '23514', constraint: 'ck_person_consent_fields' };
  const formattedConsent = formatDatabaseError(consentError, consentReq);
  assert.equal(formattedConsent.statusCode, 400);
  assert.match(formattedConsent.message, /Applicant consent is required to register or update this person record/);
});

