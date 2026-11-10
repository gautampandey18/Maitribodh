const FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  mobile: 'Mobile number',
  alternateMobile: 'Alternate mobile number',
  email: 'Email address',
  username: 'Username',
  role: 'User role',
  canBulkUpload: 'Bulk upload permission',
  currentPassword: 'Current password',
  newPassword: 'New password',
  password: 'Password',
  name: 'Name',
  icon: 'Icon',
  reason: 'Rejection reason',
  reasonId: 'Reason ID',
  remarks: 'Remarks',
  note: 'Reconciliation note',
  liftNote: 'Lift remarks',
  gateId: 'Entry gate',
  areaId: 'Area location',
  locationId: 'Location',
  categoryId: 'Category',
  categoryDetails: 'Category details',
  personId: 'Person ID',
  auditIds: 'Audit records',
  status: 'Status',
  formType: 'Form type',
  approvalRequired: 'Approval required setting',
  fromDate: 'From date',
  toDate: 'To date',
  query: 'Search query',
  q: 'Search query',
  gender: 'Gender',
  residentStatus: 'Resident status',
  passportNumber: 'Passport number',
  idProofTypeId: 'ID proof type',
  idProofNumber: 'ID proof number',
  dateOfBirth: 'Date of birth',
  address: 'Residential address',
  emergencyName: 'Emergency contact name',
  emergencyMobile: 'Emergency contact mobile',
  locationIds: 'Assigned locations',
  accompanyingCount: 'Accompanying visitor count',
  consent: 'Applicant consent',
  qrPayload: 'QR code data',
  pageSize: 'Page size',
  page: 'Page number',
};

const COLUMN_TO_FIELD = {
  first_name: 'firstName',
  last_name: 'lastName',
  mobile: 'mobile',
  email: 'email',
  username: 'username',
  role: 'role',
  reason: 'reason',
  remarks: 'remarks',
  note: 'note',
  gate_id: 'gateId',
  area_id: 'areaId',
  location_id: 'locationId',
  category_id: 'categoryId',
  person_id: 'personId',
  person_code: 'Person code',
  status: 'status',
  form_type: 'formType',
  passport_number: 'passportNumber',
  id_proof_number: 'idProofNumber',
  date_of_birth: 'dateOfBirth',
  address: 'address',
  emergency_name: 'emergencyName',
  emergency_mobile: 'emergencyMobile',
  accompanying_count: 'accompanyingCount',
  acted_by: 'Acting user',
  registered_by: 'Registering user',
  approved_by: 'Approving user',
};

export function formatFieldLabel(fieldName) {
  if (!fieldName) return 'Field';
  if (FIELD_LABELS[fieldName]) return FIELD_LABELS[fieldName];
  if (COLUMN_TO_FIELD[fieldName]) {
    const mapped = COLUMN_TO_FIELD[fieldName];
    return FIELD_LABELS[mapped] || mapped;
  }
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[._-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function getOperationDescription(request) {
  if (!request) return 'operation';
  const method = String(request.method || '').toUpperCase();
  const url = String(request.originalUrl || request.baseUrl || request.path || '');

  if (url.includes('/approvals')) {
    if (url.includes('/decisions')) return 'approval decision';
    return 'approval queue operation';
  }
  if (url.includes('/users')) {
    if (method === 'POST') return 'user creation';
    if (method === 'PATCH') return 'user update';
    if (method === 'DELETE') return 'user deletion';
    if (url.includes('password-reset')) return 'password reset';
    return 'user management';
  }
  if (url.includes('/registration') || url.includes('/persons')) {
    if (url.includes('/resubmissions')) return 'registration resubmission';
    if (method === 'POST') return 'person registration';
    if (method === 'PATCH') return 'person profile update';
    if (method === 'DELETE') return 'person record deletion';
    return 'person registration';
  }
  if (url.includes('/categories')) {
    if (method === 'POST') return 'category creation';
    if (method === 'PATCH') return 'category update';
    if (method === 'DELETE') return 'category deletion';
    return 'category management';
  }
  if (url.includes('/locations')) {
    if (method === 'POST') return 'location creation';
    if (method === 'PATCH') return 'location update';
    if (method === 'DELETE') return 'location deletion';
    return 'gate and area management';
  }
  if (url.includes('/blacklist')) {
    if (url.includes('/lifts')) return 'lifting blacklist entry';
    if (method === 'POST') return 'blacklist entry creation';
    return 'blacklist management';
  }
  if (url.includes('/visits')) {
    if (url.includes('/check-outs')) return 'gate check-out';
    if (url.includes('/reconcile')) return 'visit reconciliation';
    if (method === 'POST') return 'gate check-in';
    return 'visitor gate access';
  }
  if (url.includes('/auth')) {
    if (url.includes('/login')) return 'user login';
    if (url.includes('/password-change')) return 'password change';
    return 'authentication';
  }
  if (url.includes('/lookups')) return 'master data management';
  if (url.includes('/audit')) return 'audit log operation';
  if (url.includes('/reports')) return 'reports & analytics';

  return 'operation';
}

export function formatZodError(zodError, operationName = 'operation') {
  if (!zodError || !zodError.issues || zodError.issues.length === 0) {
    return `Invalid request data provided for this ${operationName}.`;
  }

  const issue = zodError.issues[0];
  const rawField = issue.path[issue.path.length - 1] || issue.path[0] || '';
  const fieldLabel = formatFieldLabel(rawField);
  const issueType = issue.type || issue.origin || '';

  if (issue.code === 'too_small') {
    if (issueType === 'string' || !issueType) {
      if (issue.minimum === 1) {
        return `${fieldLabel} is required to complete this ${operationName}.`;
      }
      return `${fieldLabel} must contain at least ${issue.minimum} characters for this ${operationName}.`;
    }
    if (issueType === 'array') {
      return `Please select at least ${issue.minimum} ${fieldLabel.toLowerCase()} for this ${operationName}.`;
    }
    if (issueType === 'number') {
      return `${fieldLabel} must be at least ${issue.minimum} for this ${operationName}.`;
    }
    return `${fieldLabel} must contain at least ${issue.minimum} characters for this ${operationName}.`;
  }

  if (issue.code === 'too_big') {
    if (issueType === 'string' || !issueType) {
      return `${fieldLabel} cannot exceed ${issue.maximum} characters for this ${operationName}.`;
    }
    if (issueType === 'array') {
      return `You cannot select more than ${issue.maximum} ${fieldLabel.toLowerCase()} for this ${operationName}.`;
    }
    if (issueType === 'number') {
      return `${fieldLabel} cannot exceed ${issue.maximum} for this ${operationName}.`;
    }
    return `${fieldLabel} cannot exceed ${issue.maximum} characters for this ${operationName}.`;
  }

  if (issue.code === 'invalid_type') {
    if (issue.received === 'undefined' || issue.received === 'null') {
      return `${fieldLabel} is required to complete this ${operationName}.`;
    }
    return `${fieldLabel} must be a valid ${issue.expected} for this ${operationName}.`;
  }

  if (issue.code === 'invalid_enum_value') {
    const options = Array.isArray(issue.options) ? issue.options.join(', ') : 'valid options';
    return `Please select a valid ${fieldLabel.toLowerCase()} (${options}) for this ${operationName}.`;
  }

  if (issue.code === 'invalid_format' || issue.code === 'invalid_string') {
    if (issue.format === 'email' || issue.validation === 'email' || rawField === 'email') {
      return `Please enter a valid email address for this ${operationName}.`;
    }
    if (issue.validation === 'regex' || issue.code === 'invalid_format') {
      if (rawField === 'mobile' || rawField === 'emergencyMobile') {
        return `Mobile number must be a valid 10-digit number or international phone number with country code for this ${operationName}.`;
      }
      return `Please enter a valid ${fieldLabel.toLowerCase()} format for this ${operationName}.`;
    }
    return `Please enter a valid ${fieldLabel.toLowerCase()} for this ${operationName}.`;
  }

  if (issue.code === 'custom' && issue.message) {
    if (issue.message.toLowerCase().includes('rejection') || rawField === 'reason') {
      return `Rejection requires an explanatory reason with at least 10 characters for this ${operationName}.`;
    }
    return issue.message.endsWith('.') ? issue.message : `${issue.message} for this ${operationName}.`;
  }

  return issue.message || `Invalid ${fieldLabel.toLowerCase()} provided for this ${operationName}.`;
}

export function formatDatabaseError(error, request) {
  if (!error || typeof error !== 'object') return null;
  const op = getOperationDescription(request);
  const code = String(error.code || '');

  // 22001: String data right truncation (value too long)
  if (code === '22001') {
    const match = String(error.message || '').match(/character varying\((\d+)\)/i);
    const maxChars = match ? match[1] : null;
    const col = error.column || matchColumnFromSql(error) || 'input value';
    const label = formatFieldLabel(col);
    const limitText = maxChars ? ` (maximum ${maxChars} characters)` : '';
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: `The value entered for ${label} exceeds the allowed length${limitText} for this ${op}.`,
    };
  }

  // 23502: NOT NULL violation (required field missing)
  if (code === '23502') {
    const col = error.column || 'required field';
    const label = formatFieldLabel(col);
    if (col === 'acted_by') {
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `An authenticated user identity is required to complete this ${op}.`,
      };
    }
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: `Required field '${label}' is missing to complete this ${op}.`,
    };
  }

  // 23505: Unique constraint violation
  if (code === '23505') {
    const constraint = String(error.constraint || '');
    let label = 'record';
    if (constraint.includes('username')) label = 'Username';
    else if (constraint.includes('email')) label = 'Email address';
    else if (constraint.includes('mobile')) label = 'Mobile number';
    else if (constraint.includes('person_code')) label = 'Person ID code';
    else if (constraint.includes('category')) label = 'Category name';
    else if (constraint.includes('location')) label = 'Location name';
    else if (error.detail) {
      const match = error.detail.match(/Key \((.*?)\)=/);
      if (match) label = formatFieldLabel(match[1]);
    }
    return {
      statusCode: 409,
      code: 'CONFLICT',
      message: `A record with this ${label} already exists for this ${op}. Please provide a unique value.`,
    };
  }

  // 23514: Check constraint violation
  if (code === '23514') {
    const constraint = String(error.constraint || '');
    if (constraint.includes('consent')) {
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `Applicant consent is required to register or update this person record.`,
      };
    }
    if (constraint.includes('approval_history') || constraint.includes('reason')) {
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `Rejection requires an explanatory reason with at least 10 characters for this ${op}.`,
      };
    }
    if (constraint.includes('remarks')) {
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `Explanatory remarks are required for this ${op}.`,
      };
    }
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: `The submitted details violate validation rules for this ${op}.`,
    };
  }

  // 23503: Foreign key constraint violation
  if (code === '23503') {
    const table = error.table ? formatFieldLabel(error.table) : 'referenced record';
    return {
      statusCode: 400,
      code: 'REFERENCE_ERROR',
      message: `The referenced ${table.toLowerCase()} does not exist or has been removed for this ${op}.`,
    };
  }

  // 42P01: Undefined table / relation does not exist
  if (code === '42P01') {
    const table = error.table || (String(error.message || '').match(/relation "(.*?)"/i) || [])[1] || 'required table';
    return {
      statusCode: 503,
      code: 'DATABASE_TABLE_MISSING',
      message: `Database table '${table}' required for this ${op} is not available. Please ensure database migrations are run.`,
    };
  }

  return null;
}

function matchColumnFromSql(error) {
  const msg = String(error.message || '');
  const match = msg.match(/column "(.*?)"/i);
  return match ? match[1] : null;
}
