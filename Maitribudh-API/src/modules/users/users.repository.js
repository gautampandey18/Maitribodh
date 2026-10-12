export function createUsersRepository(pool) {
  const adminMembershipLockId = 1296126532;

  return {
    async listUsers({ pageSize, offset, query = '', role, status }) {
      const result = await pool.query(
        `SELECT user_id, first_name, last_name, mobile, email, username, role,
                is_security_head, can_bulk_upload, status, created_at, updated_at,
                count(*) OVER()::int AS total
           FROM mams.app_user
          WHERE ($1 = '' OR first_name || ' ' || last_name ILIKE '%' || $1 || '%'
            OR username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%'
            OR mobile ILIKE '%' || $1 || '%')
            AND ($2::varchar IS NULL OR role = $2)
            AND ($3::varchar IS NULL OR status = $3)
          ORDER BY last_name, first_name, user_id
          LIMIT $4 OFFSET $5`,
        [query, role ?? null, status ?? null, pageSize, offset],
      );
      return result.rows;
    },

    async getUser(targetUserId) {
      const result = await pool.query(
        `SELECT user_id, first_name, last_name, mobile, email, username, role,
                is_security_head, can_bulk_upload, status, created_at, updated_at
           FROM mams.app_user
          WHERE user_id = $1`,
        [targetUserId],
      );
      return result.rows[0] ?? null;
    },

    async createUser({
      firstName,
      lastName,
      mobile,
      email,
      username,
      role,
      isSecurityHead,
      canBulkUpload,
      createdBy,
      actorRole,
      ipAddress,
      device,
    }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [adminMembershipLockId]);
        const result = await client.query(
          `INSERT INTO mams.app_user
             (first_name, last_name, mobile, email, username, role,
              is_security_head, can_bulk_upload, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING user_id, first_name, last_name, mobile, email, username,
                     role, is_security_head, can_bulk_upload, status, created_at`,
          [
            firstName,
            lastName,
            mobile,
            email,
            username,
            role,
            isSecurityHead,
            canBulkUpload,
            createdBy,
          ],
        );
        const user = result.rows[0];

        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              new_value, ip_address, device)
           VALUES ($1, $2, 'USER', 'USER_CREATED', 'APP_USER', $3, $4::jsonb, $5, $6)`,
          [
            createdBy,
            actorRole,
            user.user_id,
            JSON.stringify({ username: user.username, role: user.role }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );

        await client.query('COMMIT');
        return user;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async updateUser({ targetUserId, deactivate, canBulkUpload, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [adminMembershipLockId]);
        const result = await client.query(
          `UPDATE mams.app_user
              SET status = CASE WHEN $2::boolean THEN 'INACTIVE' ELSE status END,
                  can_bulk_upload = COALESCE($3::boolean, can_bulk_upload),
                  token_version = CASE WHEN $2::boolean THEN token_version + 1 ELSE token_version END,
                  updated_at = now()
            WHERE user_id = $1 AND status = 'ACTIVE'
          RETURNING user_id, first_name, last_name, mobile, email, username,
                    role, is_security_head, can_bulk_upload, status, updated_at`,
          [targetUserId, deactivate, canBulkUpload ?? null],
        );
        const user = result.rows[0];
        if (!user) {
          await client.query('ROLLBACK');
          return null;
        }

        const changes = {};
        if (deactivate) changes.status = 'INACTIVE';
        if (canBulkUpload !== undefined) changes.can_bulk_upload = canBulkUpload;

        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              new_value, ip_address, device)
           VALUES ($1, $2, 'USER', 'USER_UPDATED', 'APP_USER', $3, $4::jsonb, $5, $6)`,
          [actorUserId, actorRole, targetUserId, JSON.stringify(changes), ipAddress ?? null, device?.slice(0, 100) ?? null],
        );
        await client.query('COMMIT');
        return user;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}