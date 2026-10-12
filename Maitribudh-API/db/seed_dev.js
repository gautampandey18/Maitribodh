import bcrypt from 'bcrypt';
import { createDatabasePool } from '../src/config/database.js';

const seedMarker = 'DEV_TEST_FIXTURE_SEEDED';
const databaseUrl = process.env.DATABASE_URL;
const bootstrapPassword = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;

function validateEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed is disabled in production');
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(databaseUrl);
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) {
    throw new Error('Development seed only supports a loopback PostgreSQL host');
  }
  if (decodeURIComponent(url.pathname.slice(1)) !== 'postgres') {
    throw new Error('Development seed only supports the local postgres database');
  }
  if (
    typeof bootstrapPassword !== 'string'
    || bootstrapPassword.length < 10
    || bootstrapPassword.length > 256
    || !/[A-Za-z]/.test(bootstrapPassword)
    || !/\d/.test(bootstrapPassword)
  ) {
    throw new Error('Bootstrap password must be 10-256 characters and contain a letter and a digit');
  }
}

async function createLookup(client, lookupType, name, { parentId = null, categoryId = null } = {}) {
  const result = await client.query(
    `INSERT INTO mams.lookup_value (lookup_type, name, parent_id, category_id)
     VALUES ($1, $2, $3, $4)
     RETURNING lookup_id`,
    [lookupType, name, parentId, categoryId],
  );
  return result.rows[0].lookup_id;
}

async function createCategory(client, { name, formType, requiresApproval, permissionLevelId, overstayCutoff = null }) {
  const result = await client.query(
    `INSERT INTO mams.category (name, form_type, approval_required, permission_level_id, overstay_cutoff)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING
     RETURNING category_id`,
    [name, formType, requiresApproval, permissionLevelId, overstayCutoff],
  );
  if (result.rows[0]) return result.rows[0].category_id;
  const existing = await client.query('SELECT category_id FROM mams.category WHERE lower(name) = lower($1)', [name]);
  return existing.rows[0].category_id;
}

async function createLocation(client, { name, type, restricted = false, departmentId = null }) {
  const result = await client.query(
    `INSERT INTO mams.location (name, location_type, is_restricted, department_id)
     VALUES ($1, $2, $3, $4)
     RETURNING location_id`,
    [name, type, restricted, departmentId],
  );
  return result.rows[0].location_id;
}

async function createPerson(client, {
  categoryId,
  firstName,
  lastName,
  mobile,
  status,
  source = 'MANUAL',
  permissionLevelId,
  registeredBy,
  requiresApproval = false,
  categoryDetails = {},
}) {
  const active = status === 'ACTIVE';
  const result = await client.query(
    `INSERT INTO mams.person
       (category_id, first_name, last_name, mobile, gender, resident_status,
        photo_key, permission_level_id, category_details, status, source, qr_version,
        consent_at, consent_notice_version, consent_captured_by, registered_by,
        approved_by, approved_at, remarks)
     VALUES ($1, $2, $3, $4, 'OTHER', 'RESIDENT', $5, $6, $7::jsonb, $8, $9, $10,
             now(), 'DEV-TEST-ONLY', $11, $11, $12, $13,
             'Synthetic dev fixture; photo object is not provisioned')
     RETURNING person_id`,
    [
      categoryId,
      firstName,
      lastName,
      mobile,
      `dev-seed/no-object-${firstName.toLowerCase()}.jpg`,
      permissionLevelId,
      JSON.stringify(categoryDetails),
      status,
      source,
      active ? 1 : 0,
      registeredBy,
      active && requiresApproval ? registeredBy : null,
      active && requiresApproval ? new Date() : null,
    ],
  );
  return result.rows[0].person_id;
}

async function addApprovalHistory(client, personId, action, actorUserId, reason = null) {
  await client.query(
    `INSERT INTO mams.approval_history (person_id, action, reason, acted_by)
     VALUES ($1, $2, $3, $4)`,
    [personId, action, reason, actorUserId],
  );
}

async function runSeed() {
  validateEnvironment();
  const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
  const pool = createDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [1296126540]);

    const marker = await client.query(
      `SELECT audit_id FROM mams.audit_log
        WHERE module = 'DEV_SEED' AND activity = $1
        LIMIT 1`,
      [seedMarker],
    );
    if (marker.rowCount) {
      throw new Error('Development fixtures already exist; no rows were changed');
    }

    const counts = await client.query(
      `SELECT
         (SELECT count(*)::int FROM mams.app_user) AS users,
         (SELECT count(*)::int FROM mams.lookup_value
           WHERE NOT (
             (lookup_type = 'DEPARTMENT' AND name IN ('Gurukul','Goushala','Accounts','Housekeeping','Security')) OR
             (lookup_type = 'JOB_ROLE' AND name IN ('Teacher','Admin','Helper','Guard','Driver','Supervisor','Worker','Housekeeper','Gardener','Head of Security')) OR
             (lookup_type = 'SUBCATEGORY' AND name IN ('Sevak','Matri')) OR
             (lookup_type = 'PERMISSION_LEVEL' AND name = 'Access level to confirm') OR
             (lookup_type = 'ID_PROOF_TYPE' AND name IN ('Aadhaar Card','PAN Card','Driving Licence','Voter ID','Passport')) OR
             (lookup_type = 'BLACKLIST_REASON' AND name = 'Repeated policy violation')
           )) AS custom_lookups,
         (SELECT count(*)::int FROM mams.category
           WHERE name NOT IN ('Staff','Parivar Member','Visitor','Vendor','Contractor','Participant')) AS custom_categories,
         (SELECT count(*)::int FROM mams.location
           WHERE name NOT IN ('Main Gate','Goushala Gate','Kitchen','Goushala','Hostel','Admin Office','Gurukul')) AS custom_locations,
         (SELECT count(*)::int FROM mams.bulk_upload) AS bulk_uploads,
         (SELECT count(*)::int FROM mams.person) AS persons,
         (SELECT count(*)::int FROM mams.person_location) AS person_locations,
         (SELECT count(*)::int FROM mams.approval_history) AS approval_history,
         (SELECT count(*)::int FROM mams.blacklist) AS blacklist,
         (SELECT count(*)::int FROM mams.visit) AS visits,
         (SELECT count(*)::int FROM mams.notification) AS notifications`,
    );
    const existingData = Object.values(counts.rows[0]).some((count) => count > 0);
    if (existingData) {
      throw new Error('Operational or custom master data already exists; no rows were changed');
    }

    const superAdminResult = await client.query(
      `INSERT INTO mams.app_user
         (first_name, last_name, mobile, email, username, role, status,
          password_hash, must_change_password, temporary_password_expires_at)
       VALUES ('P.', 'Gotam', '9407420156', 'gotam.pandey@yash.com',
               'gotam.pandey', 'SUPER_ADMIN', 'ACTIVE', $1, true, now() + interval '24 hours')
       RETURNING user_id`,
      [passwordHash],
    );
    const superAdminId = superAdminResult.rows[0].user_id;

    const departmentId = await createLookup(client, 'DEPARTMENT', 'Test Operations');
    const jobRoleId = await createLookup(client, 'JOB_ROLE', 'Test Coordinator', { parentId: departmentId });
    const reasonId = await createLookup(client, 'BLACKLIST_REASON', 'Test policy violation');
    const permissionLevelId = await createLookup(client, 'PERMISSION_LEVEL', 'Test Standard Access');
    await createLookup(client, 'ID_PROOF_TYPE', 'Test Identity Document');

    const categoryIds = {};
    for (const category of [
      { name: 'Staff', formType: 'STAFF', requiresApproval: true },
      { name: 'Parivar Member', formType: 'PARIVAR', requiresApproval: true },
      { name: 'Visitor', formType: 'VISITOR', requiresApproval: false, overstayCutoff: '22:00' },
      { name: 'Vendor', formType: 'VENDOR', requiresApproval: false },
      { name: 'Contractor', formType: 'CONTRACTOR', requiresApproval: false, overstayCutoff: '22:00' },
      { name: 'Participant', formType: 'PARTICIPANT', requiresApproval: false },
    ]) {
      categoryIds[category.name] = await createCategory(client, { ...category, permissionLevelId });
    }
    const parivarSubcategoryId = await createLookup(client, 'SUBCATEGORY', 'Test Sevak', {
      categoryId: categoryIds['Parivar Member'],
    });

    const gateId = await createLocation(client, { name: 'Test Main Gate', type: 'GATE' });
    const openAreaId = await createLocation(client, { name: 'Test Assembly Hall', type: 'AREA' });
    const restrictedAreaId = await createLocation(client, {
      name: 'Test Workshop',
      type: 'AREA',
      restricted: true,
      departmentId,
    });

    const bulkUploadResult = await client.query(
      `INSERT INTO mams.bulk_upload
         (file_name, file_key, status, total_rows, success_rows, error_rows, errors, uploaded_by, completed_at)
       VALUES ('dev-seed-failed-upload.csv', 'dev-seed/no-object.csv', 'FAILED', 1, 0, 1,
               $1::jsonb, $2, now())
       RETURNING bulk_upload_id`,
      [JSON.stringify([{ row: 2, reason: 'Synthetic validation-failure fixture; no object was uploaded' }]), superAdminId],
    );

    const activeStaffId = await createPerson(client, {
      categoryId: categoryIds.Staff,
      firstName: 'Asha',
      lastName: 'Demo',
      mobile: '9410000001',
      status: 'ACTIVE',
      permissionLevelId,
      registeredBy: superAdminId,
      requiresApproval: true,
      categoryDetails: { department_id: departmentId, job_role_id: jobRoleId, joining_date: '2024-01-01' },
    });
    const visitorOneId = await createPerson(client, {
      categoryId: categoryIds.Visitor,
      firstName: 'Maitri',
      lastName: 'Demo',
      mobile: '9410000000',
      status: 'ACTIVE',
      permissionLevelId,
      registeredBy: superAdminId,
      categoryDetails: { purpose: 'Development smoke test' },
    });
    const visitorTwoId = await createPerson(client, {
      categoryId: categoryIds.Visitor,
      firstName: 'Anya',
      lastName: 'Demo',
      mobile: '9410000000',
      status: 'ACTIVE',
      permissionLevelId,
      registeredBy: superAdminId,
      categoryDetails: { purpose: 'Duplicate mobile fixture' },
    });
    const pendingStaffId = await createPerson(client, {
      categoryId: categoryIds.Staff,
      firstName: 'Ravi',
      lastName: 'Pending',
      mobile: '9410000002',
      status: 'PENDING',
      permissionLevelId,
      registeredBy: superAdminId,
      requiresApproval: true,
      categoryDetails: { department_id: departmentId, job_role_id: jobRoleId, joining_date: '2025-01-01' },
    });
    const rejectedStaffId = await createPerson(client, {
      categoryId: categoryIds.Staff,
      firstName: 'Nisha',
      lastName: 'Rejected',
      mobile: '9410000003',
      status: 'REJECTED',
      permissionLevelId,
      registeredBy: superAdminId,
      requiresApproval: true,
      categoryDetails: { department_id: departmentId, job_role_id: jobRoleId, joining_date: '2025-02-01' },
    });
    const blacklistedVendorId = await createPerson(client, {
      categoryId: categoryIds.Vendor,
      firstName: 'Dev',
      lastName: 'Blacklisted',
      mobile: '9410000004',
      status: 'ACTIVE',
      permissionLevelId,
      registeredBy: superAdminId,
      categoryDetails: { firm_name: 'Synthetic Test Vendor' },
    });
    const parivarId = await createPerson(client, {
      categoryId: categoryIds['Parivar Member'],
      firstName: 'Test',
      lastName: 'Parivar',
      mobile: '9410000005',
      status: 'ACTIVE',
      permissionLevelId,
      registeredBy: superAdminId,
      requiresApproval: true,
      categoryDetails: { subcategory_id: parivarSubcategoryId },
    });

    await client.query(
      `INSERT INTO mams.person_location (person_id, location_id, assigned_by)
       VALUES ($1, $2, $3), ($4, $5, $3), ($6, $5, $3), ($7, $5, $3)`,
      [activeStaffId, restrictedAreaId, superAdminId, visitorOneId, openAreaId, parivarId, visitorTwoId],
    );

    await addApprovalHistory(client, activeStaffId, 'SUBMITTED', superAdminId);
    await addApprovalHistory(client, activeStaffId, 'APPROVED', superAdminId);
    await addApprovalHistory(client, pendingStaffId, 'SUBMITTED', superAdminId);
    await addApprovalHistory(client, rejectedStaffId, 'SUBMITTED', superAdminId);
    await addApprovalHistory(client, rejectedStaffId, 'REJECTED', superAdminId, 'Missing required test document');
    await addApprovalHistory(client, parivarId, 'SUBMITTED', superAdminId);
    await addApprovalHistory(client, parivarId, 'APPROVED', superAdminId);

    await client.query(
      `INSERT INTO mams.blacklist (person_id, reason_id, remarks, start_date, end_date, added_by)
       VALUES ($1, $2, 'Synthetic active blacklist fixture', CURRENT_DATE, CURRENT_DATE + 30, $3)`,
      [blacklistedVendorId, reasonId, superAdminId],
    );

    await client.query(
      `INSERT INTO mams.visit
         (person_id, status, checkin_at, checkin_gate_id, checkin_location_id, checkin_by,
          checkin_device, accompanying_count, accompanying_names, checkout_at,
          checkout_gate_id, checkout_location_id, checkout_by, checkout_device)
       VALUES ($1, 'OPEN', now() - interval '20 minutes', $2, $3, $4, 'DEV-SEED',
               1, '["Test companion"]'::jsonb, NULL, NULL, NULL, NULL, NULL),
              ($5, 'CLOSED', now() - interval '2 hours', $2, $6, $4, 'DEV-SEED',
               0, '[]'::jsonb, now() - interval '1 hour', $2, $6, $4, 'DEV-SEED')`,
      [visitorOneId, gateId, openAreaId, superAdminId, activeStaffId, restrictedAreaId],
    );

    await client.query(
      `INSERT INTO mams.notification (user_id, type, title, body, entity_type, entity_id)
       VALUES ($1, 'DEV_SEED_READY', 'Test data ready', 'Synthetic local test fixtures are available.', 'SYSTEM', NULL)`,
      [superAdminId],
    );
    await client.query(
      `INSERT INTO mams.audit_log (user_id, user_role, module, activity, entity_type, new_value)
       VALUES ($1, 'SUPER_ADMIN', 'DEV_SEED', $2, 'SYSTEM', $3::jsonb)`,
      [superAdminId, seedMarker, JSON.stringify({ user_id: superAdminId, bulk_upload_id: bulkUploadResult.rows[0].bulk_upload_id })],
    );

    await client.query('COMMIT');
    console.info('Development test fixtures seeded.');
    console.info(`Super Admin username: ${BOOTSTRAP_USERNAME}`);
    console.info('Bootstrap credential expires in 24 hours and requires password change on first login.');
    console.info('Seeded 12 MAMS tables with synthetic records; no production data or real object files were added.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const BOOTSTRAP_USERNAME = 'gotam.pandey';

runSeed().catch((error) => {
  console.error('Development seed failed:', error.message);
  process.exitCode = 1;
});
