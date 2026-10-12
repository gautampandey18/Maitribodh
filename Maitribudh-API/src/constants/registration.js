const field = (key, label, type = 'text', required = false, source = null, options = null) => ({ key, label, type, required, source, options });

export const REGISTRATION_SCHEMAS = {
  STAFF: { fields: [field('department_id', 'Department', 'select', true, 'DEPARTMENT'), field('job_role_id', 'Job Role', 'select', true, 'JOB_ROLE'), field('joining_date', 'Joining Date', 'date', true), field('employee_code', 'Employee ID'), field('employment_type', 'Employment Type', 'select', false, null, ['Permanent', 'Contract', 'Seasonal']), field('shift', 'Shift')], emergencyRequired: true, addressRequired: true },
  VISITOR: { fields: [field('purpose', 'Purpose of Visit', 'text', true), field('visit_date', 'Visit Date', 'date', true), field('city', 'City'), field('person_to_meet', 'Person / Department to Meet'), field('duration_hours', 'Expected Duration (hours)', 'number'), field('vehicle_number', 'Vehicle Number')] },
  VENDOR: { fields: [field('firm_name', 'Firm Name', 'text', true), field('services', 'Goods / Services Supplied', 'text', true), field('department_id', 'Receiving Department', 'select', true, 'DEPARTMENT'), field('gstin', 'GSTIN'), field('delivery_frequency', 'Delivery Frequency', 'select', false, null, ['Daily', 'Weekly', 'Occasional']), field('vehicle_number', 'Vehicle Number'), field('business_address', 'Business Address')] },
  CONTRACTOR: { fields: [field('agency_name', 'Agency Name', 'text', true), field('nature_of_work', 'Nature of Work', 'text', true), field('department_id', 'Supervising Department', 'select', true, 'DEPARTMENT'), field('start_date', 'Contract Start Date', 'date', true), field('end_date', 'Contract End Date', 'date', true), field('work_order', 'Work Order Number'), field('work_location_id', 'Work Location', 'select', false, 'AREA')] },
  PARTICIPANT: { fields: [field('program_batch_id', 'Program and Batch', 'select', true, 'PROGRAM_BATCH'), field('city', 'City'), field('accommodation', 'Accommodation'), field('medical_notes', 'Dietary / Medical Notes')], emergencyRequired: true },
  PARIVAR: { fields: [field('subcategory_id', 'Subcategory', 'select', true, 'SUBCATEGORY'), field('member_since', 'Member Since', 'date'), field('seva_area', 'Seva Area'), field('referred_by', 'Referred By')], emergencyRequired: true, addressRequired: true },
  GENERIC: { fields: [field('details', 'Purpose / Details')] },
};

export const REGISTRATION_LIMITS = { fileBytes: 5 * 1024 * 1024, photoBytes: 2 * 1024 * 1024, photoDimension: 600, documentCount: 12, draftDays: 7 };
export const CONSENT_NOTICE_VERSION = 'MAMS-REGISTRATION-1';
export const ID_PROOF_PATTERNS = { 'Aadhaar Card': /^[0-9]{12}$/, 'PAN Card': /^[A-Z]{5}[0-9]{4}[A-Z]$/, Passport: /^[A-Za-z0-9]{6,9}$/ };
export const schemaForCategory = (category) => Object.keys(category.form_schema ?? {}).length
  ? category.form_schema : REGISTRATION_SCHEMAS[category.form_type] ?? REGISTRATION_SCHEMAS.GENERIC;