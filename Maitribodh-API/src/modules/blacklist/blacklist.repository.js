import { ApiError } from '../../errors/ApiError.js';

export function createBlacklistRepository(pool) {
  return {
    async listEntries({ pageSize, offset, name = '', category = '' }) {
      const result = await pool.query(
        `SELECT b.blacklist_id, b.person_id, p.person_code,
                p.first_name || ' ' || p.last_name AS name,
                p.mobile, c.name AS category, r.name AS reason,
                b.remarks, b.start_date, b.end_date, b.added_by,
                b.added_at, b.lifted_by, b.lifted_at, b.lift_note,
                CASE
                  WHEN b.lifted_at IS NOT NULL THEN 'LIFTED'
                  WHEN b.start_date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'SCHEDULED'
                  WHEN b.end_date IS NOT NULL
                    AND b.end_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'EXPIRED'
                  ELSE 'ACTIVE'
                END AS status,
                count(*) OVER()::int AS total
           FROM mams.blacklist AS b
           JOIN mams.person AS p ON p.person_id = b.person_id
           JOIN mams.category AS c ON c.category_id = p.category_id
           JOIN mams.lookup_value AS r ON r.lookup_id = b.reason_id
           WHERE ($1 = '' OR p.first_name || ' ' || p.last_name ILIKE '%' || $1 || '%')
             AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
             AND b.lifted_at IS NULL
             AND b.start_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
             AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
           ORDER BY b.added_at DESC, b.blacklist_id DESC
           LIMIT $3 OFFSET $4`,
        [name, category, pageSize, offset],
      );
      return result.rows;
    },

    async addEntry({ personId, reasonId, remarks, startDate, endDate, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const personResult = await client.query(
          'SELECT person_id FROM mams.person WHERE person_id = $1 FOR UPDATE',
          [personId],
        );
        if (!personResult.rows[0]) {
          await client.query('ROLLBACK');
          return null;
        }

        const reasonResult = await client.query(
          `SELECT lookup_id
             FROM mams.lookup_value
            WHERE lookup_id = $1
              AND lookup_type = 'BLACKLIST_REASON'
              AND status = 'ACTIVE'`,
          [reasonId],
        );
        if (!reasonResult.rows[0]) {
          throw new ApiError(400, 'INVALID_BLACKLIST_REASON', 'Select an active blacklist reason');
        }

        const result = await client.query(
          `INSERT INTO mams.blacklist
             (person_id, reason_id, remarks, start_date, end_date, added_by)
           VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5::date, $6)
           RETURNING blacklist_id, person_id, reason_id, remarks, start_date,
                     end_date, added_by, added_at, lifted_at`,
          [personId, reasonId, remarks, startDate ?? null, endDate ?? null, actorUserId],
        );
        const entry = result.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'BLACKLIST', 'BLACKLIST_ADDED', 'BLACKLIST', $3,
                   NULL, $4::jsonb, $5, $6)`,
          [
            actorUserId,
            actorRole,
            entry.blacklist_id,
            JSON.stringify({
              person_id: personId,
              reason_id: reasonId,
              remarks,
              start_date: entry.start_date,
              end_date: entry.end_date,
            }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return entry;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async liftEntry({ blacklistId, liftNote, actorUserId, actorRole, ipAddress, device }) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const currentResult = await client.query(
          `SELECT blacklist_id, person_id, reason_id, remarks, start_date, end_date
             FROM mams.blacklist
            WHERE blacklist_id = $1
              AND lifted_at IS NULL
            FOR UPDATE`,
          [blacklistId],
        );
        const current = currentResult.rows[0];
        if (!current) {
          await client.query('ROLLBACK');
          return null;
        }

        const result = await client.query(
          `UPDATE mams.blacklist
              SET lifted_by = $2, lifted_at = now(), lift_note = $3
            WHERE blacklist_id = $1 AND lifted_at IS NULL
          RETURNING blacklist_id, person_id, reason_id, remarks, start_date,
                    end_date, lifted_by, lifted_at, lift_note`,
          [blacklistId, actorUserId, liftNote],
        );
        const entry = result.rows[0];
        await client.query(
          `INSERT INTO mams.audit_log
             (user_id, user_role, module, activity, entity_type, entity_id,
              old_value, new_value, ip_address, device)
           VALUES ($1, $2, 'BLACKLIST', 'BLACKLIST_LIFTED', 'BLACKLIST', $3,
                   $4::jsonb, $5::jsonb, $6, $7)`,
          [
            actorUserId,
            actorRole,
            blacklistId,
            JSON.stringify({ lifted_at: null, lift_note: null }),
            JSON.stringify({ lifted_at: entry.lifted_at, lift_note: entry.lift_note }),
            ipAddress ?? null,
            device?.slice(0, 100) ?? null,
          ],
        );
        await client.query('COMMIT');
        return entry;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}