export function createAuthRepository(pool) {
  return {
    async findCredentialsById(userId) {
      const result = await pool.query(
        `SELECT user_id, status, password_hash
           FROM mams.app_user
          WHERE user_id = $1`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async getUserById(userId) {
      const result = await pool.query(
        `SELECT user_id, role, status, token_version, must_change_password
           FROM mams.app_user
          WHERE user_id = $1`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async revokeSessions(userId) {
      const result = await pool.query(
        `UPDATE mams.app_user
            SET token_version = token_version + 1,
                updated_at = now()
          WHERE user_id = $1 AND status = 'ACTIVE'
        RETURNING user_id`,
        [userId],
      );
      return result.rowCount > 0;
    },

    async updatePassword(userId, passwordHash) {
      const result = await pool.query(
        `UPDATE mams.app_user
            SET password_hash = $2,
                token_version = token_version + 1,
                must_change_password = false,
                temporary_password_expires_at = NULL,
                temporary_password_used_at = NULL,
                updated_at = now()
          WHERE user_id = $1 AND status = 'ACTIVE'
        RETURNING user_id`,
        [userId, passwordHash],
      );
      return result.rowCount > 0;
    },

    async findByUsername(username) {
      const result = await pool.query(
        `SELECT user_id, role, status, password_hash, locked_until,
                failed_login_count, failed_login_window_started_at, token_version,
                must_change_password, temporary_password_expires_at, temporary_password_used_at
           FROM mams.app_user
          WHERE lower(username) = lower($1)`,
        [username],
      );
      return result.rows[0] ?? null;
    },

    async recordFailedLogin(userId, failedAt) {
      return pool.query(
        `WITH attempt_state AS (
           SELECT user_id,
                  CASE
                    WHEN failed_login_window_started_at IS NULL
                      OR failed_login_window_started_at <= $2::timestamptz - interval '15 minutes'
                    THEN 0 ELSE failed_login_count
                  END AS previous_count,
                  CASE
                    WHEN failed_login_window_started_at IS NULL
                      OR failed_login_window_started_at <= $2::timestamptz - interval '15 minutes'
                    THEN NULL ELSE failed_login_window_started_at
                  END AS window_started
             FROM mams.app_user
            WHERE user_id = $1 AND status = 'ACTIVE'
            FOR UPDATE
         )
         UPDATE mams.app_user AS account
            SET failed_login_count = attempt_state.previous_count + 1,
                failed_login_window_started_at = COALESCE(attempt_state.window_started, $2::timestamptz),
                locked_until = CASE
                  WHEN attempt_state.previous_count + 1 >= 5
                  THEN $2::timestamptz + interval '15 minutes'
                  ELSE NULL
                END,
                updated_at = $2::timestamptz
           FROM attempt_state
          WHERE account.user_id = attempt_state.user_id`,
        [userId, failedAt],
      );
    },

    async completeLogin(userId, loggedInAt) {
      const result = await pool.query(
        `UPDATE mams.app_user
            SET failed_login_count = 0,
                failed_login_window_started_at = NULL,
                locked_until = NULL,
                last_login_at = $2,
                temporary_password_used_at = CASE
                  WHEN must_change_password THEN $2
                  ELSE temporary_password_used_at
                END,
                updated_at = $2
          WHERE user_id = $1
            AND status = 'ACTIVE'
            AND (locked_until IS NULL OR locked_until <= $2)
            AND (
              must_change_password = false
              OR (temporary_password_expires_at > $2 AND temporary_password_used_at IS NULL)
            )
        RETURNING user_id, role, token_version, must_change_password`,
        [userId, loggedInAt],
      );
      return result.rows[0] ?? null;
    },

    async setTemporaryPassword({
      targetUserId,
      passwordHash,
      expiresAt,
      adminUserId,
      adminRole,
      ipAddress,
      device,
    }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const targetResult = await client.query(
          `SELECT user_id, role
             FROM mams.app_user
            WHERE user_id = $1 AND status = 'ACTIVE'
            FOR UPDATE`,
          [targetUserId],
        );
        const target = targetResult.rows[0];
        if (!target) {
          await client.query('ROLLBACK');
          return false;
        }

        await client.query(
          `UPDATE mams.app_user
              SET password_hash = $2,
                  token_version = token_version + 1,
                  failed_login_count = 0,
                  failed_login_window_started_at = NULL,
                  locked_until = NULL,
                  must_change_password = true,
                  temporary_password_expires_at = $3,
                  temporary_password_used_at = NULL,
                  updated_at = now()
            WHERE user_id = $1`,
          [targetUserId, passwordHash, expiresAt],
        );
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              new_value, ip_address, device)
           VALUES ($1, $2, 'SECURITY', 'USER_PASSWORD_RESET', 'APP_USER', $3,
                   $4::jsonb, $5, $6)`,
          [
            adminUserId,
            adminRole,
            targetUserId,
            JSON.stringify({ must_change_password: true, temporary_password_expires_at: expiresAt.toISOString() }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}