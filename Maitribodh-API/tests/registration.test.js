import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationInputSchema, validateCategoryDetails } from '../src/modules/persons/registration.validation.js';
import { categoryFieldSchema, categoryFormSchema } from '../src/constants/category-schema.js';

const rawInput = { categoryId: 1, firstName: 'Asha', lastName: 'Patel', mobile: '9820000000', gender: 'OTHER', consent: true, categoryDetails: { purpose: 'Meeting', visit_date: '2026-10-09' } };
const input = registrationInputSchema.parse(rawInput);
const category = { form_type: 'VISITOR', status: 'ACTIVE', approval_required: false };
test('registration validates names, consent and mobile', () => {
  assert.equal(registrationInputSchema.safeParse(input).success, true);
  assert.equal(registrationInputSchema.parse({ ...rawInput, mobile: '+14155552671' }).mobile, '+14155552671');
  assert.equal(input.mobile, '+919820000000');
  assert.equal(registrationInputSchema.safeParse({ ...input, mobile: '+123' }).success, false);
  for (const change of [{ mobile: '123' }, { firstName: 'Asha1' }, { consent: false }, { dateOfBirth: 'invalid' }]) assert.equal(registrationInputSchema.safeParse({ ...rawInput, ...change }).success, false);
});
test('required dynamic fields and unconfirmed approval block registration', () => {
  assert.throws(() => validateCategoryDetails({ ...input, categoryDetails: {} }, category, 'ADMIN'), /Purpose of Visit is required/);
  assert.throws(() => validateCategoryDetails(input, { ...category, approval_required: null }, 'ADMIN'), /paused/);
});
test('visitor driver details are optional but validated when supplied', () => {
  const visitorDetails = { purpose: 'Meeting', visit_date: '2026-10-09' };
  assert.doesNotThrow(() => validateCategoryDetails({ ...input, categoryDetails: visitorDetails }, category, 'ADMIN'));
  assert.doesNotThrow(() => validateCategoryDetails({ ...input, categoryDetails: { ...visitorDetails, driver_available: 'NO' } }, category, 'ADMIN'));
  assert.doesNotThrow(() => validateCategoryDetails({ ...input, categoryDetails: { ...visitorDetails, driver_available: 'YES', driver_name: 'Ravi', driver_mobile: '9876543210' } }, category, 'ADMIN'));
  assert.throws(() => validateCategoryDetails({ ...input, categoryDetails: { ...visitorDetails, driver_available: 'MAYBE' } }, category, 'ADMIN'), /Yes or No/);
  assert.throws(() => validateCategoryDetails({ ...input, categoryDetails: { ...visitorDetails, driver_available: 'YES', driver_mobile: '123' } }, category, 'ADMIN'), /valid 10-digit mobile/);
  assert.throws(() => validateCategoryDetails({ ...input, categoryDetails: { ...visitorDetails, driver_available: 'NO', driver_name: 'Ravi' } }, category, 'ADMIN'), /only be provided when a driver is available/);
});
test('guards can register visitors only', () => {
  assert.doesNotThrow(() => validateCategoryDetails(input, category, 'SECURITY_GUARD'));
  assert.throws(() => validateCategoryDetails(input, { ...category, form_type: 'STAFF' }, 'SECURITY_GUARD'), /Visitor only/);
});
test('international profiles need a valid passport', () => {
  assert.throws(() => validateCategoryDetails({ ...input, residentStatus: 'NON_RESIDENT', passportNumber: '' }, category, 'ADMIN'), /passport/);
});
test('staff requires address and emergency contact and valid job role fields', () => {
  assert.throws(() => validateCategoryDetails(input, { ...category, form_type: 'STAFF' }, 'ADMIN'), /Address/);
});
test('contract dates must be ordered', () => {
  assert.throws(() => validateCategoryDetails({ ...input, categoryDetails: { agency_name: 'Agency', nature_of_work: 'Repairs', department_id: 1, start_date: '2026-10-10', end_date: '2026-10-09' } }, { ...category, form_type: 'CONTRACTOR' }, 'ADMIN'), /End Date/);
});

test('category schemas reject duplicate keys and unknown master sources', () => {
  const field = { key: 'purpose', label: 'Purpose', type: 'text', required: true };
  assert.equal(categoryFormSchema.safeParse({ fields: [field] }).success, true);
  assert.equal(categoryFormSchema.safeParse({ fields: [field, field] }).success, false);
  assert.equal(categoryFormSchema.safeParse({ fields: [{ ...field, type: 'select', source: 'UNKNOWN' }] }).success, false);
});

test('only select category fields can have dropdown sources or options', () => {
  const textField = { key: 'approval_note', label: 'Approval note', type: 'text', required: true };
  assert.equal(categoryFieldSchema.safeParse({ ...textField, source: 'DEPARTMENT' }).success, false);
  assert.equal(categoryFieldSchema.safeParse({ ...textField, options: ['approved'] }).success, false);
  assert.equal(categoryFieldSchema.safeParse({ ...textField, type: 'select', source: 'DEPARTMENT' }).success, true);
});

test('ID-proof values need a selected proof type', () => {
  assert.throws(() => validateCategoryDetails({ ...input, idProofNumber: 'ABC' }, category, 'ADMIN'), /ID Proof Type/);
});

test('registration accepts null optional permission and ID-proof master IDs', () => {
  const parsed = registrationInputSchema.safeParse({ ...input, permissionLevelId: null, idProofTypeId: null });
  assert.equal(parsed.success, true);
});