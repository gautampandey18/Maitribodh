import bcrypt from 'bcrypt';
import { createDatabasePool } from '../src/config/database.js';

const databaseUrl = process.env.DATABASE_URL;
const bootstrapPassword = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;

function validateEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local Super Admin bootstrap is disabled in production');
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(databaseUrl);
  if (url.hostname !== '127.0.0.1' || url.username !== 'postgres' || url.pathname !== '/postgres') {
    throw new Error('Super Admin bootstrap only supports 127.0.0.1, database postgres, and user postgres');
  }
  if (
    typeof bootstrapPassword !== 'string'
    || bootstrapPassword.length < 10
    || bootstrapPassword.length > 256
    || !/[A-Za-z]/.test(bootstrapPassword)
    || !/\d/.test(bootstrapPassword)
  ) {
    throw new Error('Temporary password must be 10-256 characters and contain a letter and a digit');
  }
}

async function createSuperAdmin() {
  validateEnvironment();
  const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
  const pool = createDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [1296126532]);

    const superAdmin = await client.query(
      "SELECT user_id FROM mams.app_user WHERE role = 'SUPER_ADMIN' LIMIT 1",
    );
    if (superAdmin.rowCount) {
      throw new Error('A Super Admin already exists; no rows were changed');
    }

    const duplicate = await client.query(
      `SELECT user_id FROM mams.app_user
        WHERE lower(username) = lower($1)
           OR lower(email) = lower($2)
           OR mobile = $3
        LIMIT 1`,
      ['aditya.d', 'adityasharma@gmail.com', '6230607027'],
    );
    if (duplicate.rowCount) {
      throw new Error('The requested username, email, or mobile number already exists; no rows were changed');
    }

    const result = await client.query(
      `INSERT INTO mams.app_user
         (first_name, last_name, mobile, email, username, role, status,
          password_hash, must_change_password, temporary_password_expires_at)
       VALUES ('Aditya', 'Sharma', '6230607027', 'adityasharma@gmail.com', 'aditya.d',
               'SUPER_ADMIN', 'ACTIVE', $1, true, now() + interval '24 hours')
       RETURNING user_id`,
      [passwordHash],
    );

    await client.query('COMMIT');
    console.log(`Created Super Admin aditya.d (user id ${result.rows[0].user_id}). Temporary password expires in 24 hours and must be changed at first login.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSuperAdmin().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});