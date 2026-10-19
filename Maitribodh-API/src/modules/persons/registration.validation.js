import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { ApiError } from '../../errors/ApiError.js';
import { schemaForCategory } from '../../constants/registration.js';

const mobile = z.union([
  z.string().regex(/^[6-9]\d{9}$/).transform((value) => `+91${value}`),
  z.string().regex(/^\+[1-9]\d{7,14}$/),
]).refine((value) => isValidPhoneNumber(value), 'Enter a valid mobile number with country code');
const indianMobile = z.string().regex(/^[6-9]\d{9}$/);
const optionalText = (max) => z.string().trim().max(max).optional().default('');
export const registrationInputSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  firstName: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{M} -]+$/u),
  lastName: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{M} -]+$/u),
  mobile,
  alternateMobile: z.union([indianMobile, z.literal('')]).optional().default(''),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  residentStatus: z.enum(['RESIDENT', 'NON_RESIDENT']).default('RESIDENT'),
  passportNumber: optionalText(9),
  idProofTypeId: z.coerce.number().int().positive().nullable().optional().default(null),
  idProofNumber: optionalText(50),
  dateOfBirth: z.union([z.iso.date(), z.literal('')]).optional().default(''),
  address: optionalText(500), email: z.union([z.email().max(150), z.literal('')]).optional().default(''),
  emergencyName: optionalText(100), emergencyMobile: z.union([indianMobile, z.literal('')]).optional().default(''),
  permissionLevelId: z.coerce.number().int().positive().nullable().optional().default(null),
  locationIds: z.array(z.coerce.number().int().positive()).max(100).default([]),
  accompanyingCount: z.coerce.number().int().min(0).max(32767).default(0),
  remarks: optionalText(500), categoryDetails: z.record(z.string(), z.union([z.string().max(500), z.number()])).default({}),
  consent: z.literal(true), source: z.enum(['MANUAL', 'WALK_IN']).default('MANUAL'),
});

export function validateCategoryDetails(input, category, role, today = new Date().toISOString().slice(0, 10)) {
  if (category.status !== 'ACTIVE') throw new ApiError(409, 'CATEGORY_INACTIVE', 'Select an active category');
  if (category.approval_required === null) throw new ApiError(409, 'APPROVAL_UNCONFIRMED', 'Submission is paused until the category approval rule is confirmed.');
  if (role === 'SECURITY_GUARD' && category.form_type !== 'VISITOR') throw new ApiError(403, 'FORBIDDEN', 'Security Guard can register Visitor only');
  if (input.residentStatus === 'NON_RESIDENT' && !/^[A-Za-z0-9]{6,9}$/.test(input.passportNumber)) throw new ApiError(400, 'VALIDATION_ERROR', 'Enter a passport number using 6 to 9 letters or digits.');
  if (category.form_type !== 'VISITOR' && !input.mobile.startsWith('+91')) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Use an Indian mobile number for this category.');
  }
  if (input.dateOfBirth && input.dateOfBirth > today) throw new ApiError(400, 'VALIDATION_ERROR', 'Date of birth cannot be in the future');
  const schema = schemaForCategory(category);
  if (input.idProofNumber && !input.idProofTypeId) throw new ApiError(400, 'VALIDATION_ERROR', 'Select an ID Proof Type');
  if (schema.addressRequired && !input.address) throw new ApiError(400, 'VALIDATION_ERROR', 'Residential Address is required');
  if (schema.emergencyRequired && (!input.emergencyName || !input.emergencyMobile)) throw new ApiError(400, 'VALIDATION_ERROR', 'Emergency contact name and mobile are required');
  for (const field of schema.fields ?? []) {
    const value = input.categoryDetails[field.key];
    if (field.required && (value === undefined || String(value).trim() === '')) throw new ApiError(400, 'VALIDATION_ERROR', `${field.label} is required`);
    if (value !== undefined && String(value) !== '') {
      if (field.type === 'date' && !z.iso.date().safeParse(value).success) throw new ApiError(400, 'VALIDATION_ERROR', `${field.label} must be a valid date`);
      if (field.type === 'number' && (!Number.isInteger(Number(value)) || Number(value) < 1)) throw new ApiError(400, 'VALIDATION_ERROR', `${field.label} must be a positive whole number`);
      if (field.options?.length && !field.options.includes(value)) throw new ApiError(400, 'VALIDATION_ERROR', `Select a valid ${field.label}`);
    }
  }
  const details = input.categoryDetails;
  if (category.form_type === 'VISITOR') {
    if (details.driver_available && !['YES', 'NO'].includes(details.driver_available)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Select Yes or No for driver availability');
    }
    if (details.driver_available !== 'YES' && (details.driver_name || details.driver_mobile)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Driver details can only be provided when a driver is available');
    }
    if (details.driver_name && details.driver_name.trim().length > 100) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Driver name must be 100 characters or fewer');
    }
    if (details.driver_mobile && !/^[6-9]\d{9}$/.test(details.driver_mobile)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Driver contact number must be a valid 10-digit mobile number');
    }
  }
  if (details.start_date && details.end_date && details.end_date < details.start_date) throw new ApiError(400, 'VALIDATION_ERROR', 'Contract End Date cannot be before Contract Start Date.');
  if (details.joining_date > today || details.member_since > today) throw new ApiError(400, 'VALIDATION_ERROR', 'Joining or membership date cannot be in the future');
  if (details.gstin && !/^[0-9A-Z]{15}$/.test(details.gstin)) throw new ApiError(400, 'VALIDATION_ERROR', 'GSTIN must contain 15 uppercase letters or digits');
  return schema;
}