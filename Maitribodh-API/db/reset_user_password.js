import bcrypt from 'bcrypt';
import { createDatabasePool } from '../src/config/database.js';

const databaseUrl = process.env.DATABASE_URL;
const targetUsername = process.env.RESET_TARGET_USERNAME;
const temporaryPassword = process.env.RESET_TEMPORARY_PASSWORD;

function validateEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local password reset is disabled in production');
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const url = new URL(databaseUrl);
  if (url.hostname !== '127.0.0.1' || url.username !== 'postgres' || url.pathname !== '/postgres') {
    throw new Error('Password reset only supports 127.0.0.1, database postgres, and user postgres');
  }
  if (typeof targetUsername !== 'string' || !targetUsername.trim() || targetUsername.length > 50) {
    throw new Error('A valid account username is required');
  }
  if (
    typeof temporaryPassword !== 'string'
    || temporaryPassword.length < 10
    || temporaryPassword.length > 256
    || !/[A-Za-z]/.test(temporaryPassword)
    || !/\d/.test(temporaryPassword)
  ) {
    throw new Error('Temporary password must be 10-256 characters and contain a letter and a digit');
  }
}

async function resetUserPassword() {
  validateEnvironment();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const pool = createDatabasePool();
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const targetResult = await client.query(
      `SELECT user_id, username, role
         FROM mams.app_user
        WHERE lower(username) = lower($1)
          AND role IN ('ADMIN', 'SUPER_ADMIN')
          AND status = 'ACTIVE'
        FOR UPDATE`,
      [targetUsername.trim()],
    );
    const target = targetResult.rows[0];
    if (!target) {
      throw new Error('No active Admin or Superadmin account matches that username; no rows were changed');
    }

    await client.query(
      `UPDATE mams.app_user
          SET password_hash = $2,
              token_version = token_version + 1,
              failed_login_count = 0,
              failed_login_window_started_at = NULL,
              locked_until = NULL,
              must_change_password = true,
              temporary_password_expires_at = now() + interval '24 hours',
              temporary_password_used_at = NULL,
              updated_at = now()
        WHERE user_id = $1`,
      [target.user_id, passwordHash],
    );
    await client.query(
      `INSERT INTO mams.audit_log
         (user_role, module, activity, entity_type, entity_id, new_value)
       VALUES (NULL, 'SECURITY', 'USER_PASSWORD_RESET', 'APP_USER', $1, $2::jsonb)`,
      [
        target.user_id,
        JSON.stringify({
          initiated_by: 'LOCAL_BREAK_GLASS',
          must_change_password: true,
          temporary_password_expires_in_hours: 24,
        }),
      ],
    );

    await client.query('COMMIT');
    console.log(`Reset password for ${target.role} account ${target.username}. The temporary password expires in 24 hours and must be changed at first login.`);
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

resetUserPassword().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
