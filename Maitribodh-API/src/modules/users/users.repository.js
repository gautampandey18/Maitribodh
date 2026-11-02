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

    async updateUser({ targetUserId, firstName, lastName, mobile, email, username, role, isSecurityHead, deactivate = false, activate = false, canBulkUpload, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [adminMembershipLockId]);
        const result = await client.query(
            `UPDATE mams.app_user
              SET first_name = COALESCE($4, first_name), last_name = COALESCE($5, last_name),
                mobile = COALESCE($6, mobile), email = COALESCE($7, email),
                username = COALESCE($8, username), role = COALESCE($9, role),
                is_security_head = COALESCE($10::boolean, is_security_head),
                status = CASE WHEN $2::boolean THEN 'INACTIVE' WHEN $11::boolean THEN 'ACTIVE' ELSE status END,
                can_bulk_upload = COALESCE($3::boolean, can_bulk_upload),
                token_version = CASE WHEN $2::boolean OR $11::boolean THEN token_version + 1 ELSE token_version END,
                  updated_at = now()
            WHERE user_id = $1
          RETURNING user_id, first_name, last_name, mobile, email, username,
                    role, is_security_head, can_bulk_upload, status, updated_at`,
          [targetUserId, deactivate, canBulkUpload ?? null, firstName ?? null, lastName ?? null, mobile ?? null, email ?? null, username ?? null, role ?? null, isSecurityHead ?? null, activate],
        );
        const user = result.rows[0];
        if (!user) {
          await client.query('ROLLBACK');
          return null;
        }

        const changes = {};
        for (const [key, value] of Object.entries({ firstName, lastName, mobile, email, username, role, isSecurityHead, canBulkUpload })) {
          if (value !== undefined) changes[key] = value;
        }
        if (deactivate) changes.status = 'INACTIVE';
        if (activate) changes.status = 'ACTIVE';

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

    async deleteUser({ targetUserId, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [adminMembershipLockId]);

        // Relax legacy schema constraints so records decouple cleanly even on unmigrated databases
        await client.query(`
          ALTER TABLE IF EXISTS mams.person ALTER COLUMN registered_by DROP NOT NULL;
          ALTER TABLE IF EXISTS mams.visit ALTER COLUMN checkin_by DROP NOT NULL;
          ALTER TABLE IF EXISTS mams.approval_history ALTER COLUMN acted_by DROP NOT NULL;
          ALTER TABLE IF EXISTS mams.blacklist ALTER COLUMN added_by DROP NOT NULL;
          ALTER TABLE IF EXISTS mams.bulk_upload ALTER COLUMN uploaded_by DROP NOT NULL;
          ALTER TABLE IF EXISTS mams.person DROP CONSTRAINT IF EXISTS ck_person_consent_fields;
          ALTER TABLE IF EXISTS mams.person ADD CONSTRAINT ck_person_consent_fields CHECK (
            (consent_at IS NULL AND consent_notice_version IS NULL AND consent_captured_by IS NULL) OR
            (consent_at IS NOT NULL AND consent_notice_version IS NOT NULL)
          );
          ALTER TABLE IF EXISTS mams.person DROP CONSTRAINT IF EXISTS ck_person_registration_consent;
          ALTER TABLE IF EXISTS mams.person ADD CONSTRAINT ck_person_registration_consent CHECK (
            status = 'DRAFT' OR source = 'BULK_UPLOAD' OR
            (consent_at IS NOT NULL AND consent_notice_version IS NOT NULL)
          );
        `);

        // 1. Remove user personal notifications
        await client.query('DELETE FROM mams.notification WHERE user_id = $1', [targetUserId]);

        // 2. Decouple audit_log (keep audit records but unlink user_id)
        await client.query('UPDATE mams.audit_log SET user_id = NULL WHERE user_id = $1', [targetUserId]);

        // 3. Preserve registered persons: detach user references without changing person status or permissions
        await client.query('UPDATE mams.person SET registered_by = NULL WHERE registered_by = $1', [targetUserId]);
        await client.query('UPDATE mams.person SET approved_by = NULL WHERE approved_by = $1', [targetUserId]);
        await client.query('UPDATE mams.person SET consent_captured_by = NULL WHERE consent_captured_by = $1', [targetUserId]);
        await client.query('UPDATE mams.person SET updated_by = NULL WHERE updated_by = $1', [targetUserId]);

        // 4. Preserve person location permissions
        await client.query('UPDATE mams.person_location SET assigned_by = NULL WHERE assigned_by = $1', [targetUserId]);

        // 5. Preserve approval history: decouple acted_by
        await client.query('UPDATE mams.approval_history SET acted_by = NULL WHERE acted_by = $1', [targetUserId]);

        // 6. Preserve visits: decouple checkin_by and checkout_by
        await client.query('UPDATE mams.visit SET checkin_by = NULL WHERE checkin_by = $1', [targetUserId]);
        await client.query('UPDATE mams.visit SET checkout_by = NULL WHERE checkout_by = $1', [targetUserId]);

        // 7. Preserve blacklist entries: decouple added_by and lifted_by
        await client.query('UPDATE mams.blacklist SET added_by = NULL WHERE added_by = $1', [targetUserId]);
        await client.query('UPDATE mams.blacklist SET lifted_by = NULL WHERE lifted_by = $1', [targetUserId]);

        // 8. Preserve bulk upload history: decouple uploaded_by
        await client.query('UPDATE mams.bulk_upload SET uploaded_by = NULL WHERE uploaded_by = $1', [targetUserId]);

        // 9. Preserve other app_users created by this user: decouple created_by
        await client.query('UPDATE mams.app_user SET created_by = NULL WHERE created_by = $1', [targetUserId]);

        // 10. Delete the target user
        const result = await client.query('DELETE FROM mams.app_user WHERE user_id = $1 RETURNING user_id, username', [targetUserId]);
        if (!result.rows[0]) {
          await client.query('ROLLBACK');
          return null;
        }

        // 11. Record audit log of deletion
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id, new_value, ip_address, device)
           VALUES ($1, $2, 'USER', 'USER_DELETED', 'APP_USER', $3, $4::jsonb, $5, $6)`,
          [actorUserId, actorRole, targetUserId, JSON.stringify({ username: result.rows[0].username }), ipAddress ?? null, device?.slice(0, 100) ?? null],
        );
        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}