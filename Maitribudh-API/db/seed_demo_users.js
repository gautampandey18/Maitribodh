import bcrypt from 'bcrypt';
import { createDatabasePool } from '../src/config/database.js';

const databaseUrl = process.env.DATABASE_URL;
const demoPassword = process.env.DEMO_USERS_PASSWORD;
const demoUsers = [
  { firstName: 'S.', lastName: 'Iyer', username: 's.iyer', mobile: '9460000001', role: 'ADMIN' },
  { firstName: 'Rakesh', lastName: 'Sharma', username: 'r.sharma', mobile: '9460000002', role: 'SECURITY_GUARD' },
  { firstName: 'Arjun', lastName: 'Verma', username: 'a.verma', mobile: '9460000003', role: 'REG_OFFICER' },
  { firstName: 'Neha', lastName: 'Das', username: 'n.das', mobile: '9460000004', role: 'APPROVER' },
  { firstName: 'Kavita', lastName: 'Rao', username: 'k.rao', mobile: '9460000005', role: 'VIEWER' },
];
const seedMarker = 'DEV_ROLE_USERS_SEEDED';

function validateEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo user seed is disabled in production');
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  const url = new URL(databaseUrl);
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) {
    throw new Error('Demo user seed only supports a loopback PostgreSQL host');
  }
  if (decodeURIComponent(url.pathname.slice(1)) !== 'postgres') {
    throw new Error('Demo user seed only supports the local postgres database');
  }
  if (
    typeof demoPassword !== 'string'
    || demoPassword.length < 10
    || demoPassword.length > 256
    || !/[A-Za-z]/.test(demoPassword)
    || !/\d/.test(demoPassword)
  ) {
    throw new Error('Demo password must be 10-256 characters and contain a letter and a digit');
  }
}

async function seedDemoUsers() {
  validateEnvironment();
  const pool = createDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [1296126541]);

    const superAdmin = await client.query(
      `SELECT user_id FROM mams.app_user WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE'`,
    );
    if (superAdmin.rowCount !== 1) {
      throw new Error('Create exactly one active Super Admin before seeding demo users');
    }
    const superAdminId = superAdmin.rows[0].user_id;

    const existingMarker = await client.query(
      `SELECT audit_id FROM mams.audit_log
        WHERE module = 'DEV_SEED' AND activity = $1
        LIMIT 1`,
      [seedMarker],
    );
    if (existingMarker.rowCount) {
      await client.query('ROLLBACK');
      console.info('Mockup role demo users are already seeded; no rows were changed.');
      return;
    }

    const usernames = demoUsers.map((user) => user.username);
    const existingUsers = await client.query(
      'SELECT username FROM mams.app_user WHERE lower(username) = ANY($1::text[])',
      [usernames],
    );
    if (existingUsers.rowCount) {
      throw new Error(`Demo usernames already exist without a seed marker: ${existingUsers.rows.map((user) => user.username).join(', ')}`);
    }

    const createdUsers = [];
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(demoPassword, 12);
      const result = await client.query(
        `INSERT INTO mams.app_user
           (first_name, last_name, mobile, username, role, status,
            password_hash, must_change_password, temporary_password_expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, true, now() + interval '24 hours', $7)
         RETURNING user_id, username, role`,
        [user.firstName, user.lastName, user.mobile, user.username, user.role, passwordHash, superAdminId],
      );
      const createdUser = result.rows[0];
      createdUsers.push(createdUser);
      await client.query(
        `INSERT INTO mams.audit_log
           (user_id, user_role, module, activity, entity_type, entity_id, new_value, device)
         VALUES ($1, 'SUPER_ADMIN', 'DEV_SEED', 'DEV_ROLE_USER_CREATED', 'APP_USER', $2, $3::jsonb, 'DEV-SEED')`,
        [superAdminId, createdUser.user_id, JSON.stringify({ username: createdUser.username, role: createdUser.role })],
      );
    }

    await client.query(
      `INSERT INTO mams.audit_log
         (user_id, user_role, module, activity, entity_type, new_value, device)
       VALUES ($1, 'SUPER_ADMIN', 'DEV_SEED', $2, 'SYSTEM', $3::jsonb, 'DEV-SEED')`,
      [superAdminId, seedMarker, JSON.stringify({ usernames: createdUsers.map((user) => user.username) })],
    );

    await client.query('COMMIT');
    console.info('Mockup role demo users seeded:');
    createdUsers.forEach((user) => console.info(`${user.role}: ${user.username} (user_id ${user.user_id})`));
    console.info('All demo accounts share the entered one-time development password, expire in 24 hours, and require password change on first login.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoUsers().catch((error) => {
  console.error('Demo user seed failed:', error.message);
  process.exitCode = 1;
});
