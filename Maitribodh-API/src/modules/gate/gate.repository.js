export function createGateRepository(pool) {
  return {
    async isActiveLocation(locationId) {
      const result = await pool.query(
        `SELECT location_id
           FROM mams.location
          WHERE location_id = $1 AND status = 'ACTIVE'`,
        [locationId],
      );
      return result.rowCount > 0;
    },

    async findCandidates({ personCode, mobile, query, locationId }) {
      const result = await pool.query(
        `SELECT p.person_id, p.person_code, p.first_name, p.last_name,
                c.name AS category, p.status, p.qr_version, p.photo_key, p.mobile,
                p.expires_on < (now() AT TIME ZONE 'Asia/Kolkata')::date AS access_expired,
                p.photo_key IS NOT NULL AS has_photo,
                COALESCE(v.accompanying_count, p.accompanying_count) AS accompanying_count, p.accompanying,
                ARRAY(SELECT pl.location_id FROM mams.person_location AS pl
                    WHERE pl.person_id = p.person_id ORDER BY pl.location_id) AS assigned_area_ids,
                EXISTS (
                  SELECT 1 FROM mams.blacklist AS b
                   WHERE b.person_id = p.person_id
                     AND b.lifted_at IS NULL
                     AND b.start_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
                     AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
                ) AS is_blacklisted,
                v.visit_id AS open_visit_id, v.checkin_at AS inside_since,
                (l.is_restricted AND NOT EXISTS (
                  SELECT 1 FROM mams.person_location AS pl
                   WHERE pl.person_id = p.person_id AND pl.location_id = l.location_id
                )) AS location_warning
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
           LEFT JOIN mams.visit AS v ON v.person_id = p.person_id AND v.status = 'OPEN'
           JOIN mams.location AS l ON l.location_id = $3 AND l.status = 'ACTIVE'
          WHERE p.status <> 'DRAFT'
            AND (($1::varchar IS NOT NULL AND p.person_code = upper($1))
                OR ($2::varchar IS NOT NULL AND (p.mobile = $2 OR ($2 ~ '^[0-9]{10}$' AND p.mobile = '+91' || $2)))
                OR ($4::varchar IS NOT NULL AND (lower(p.person_code) = lower($4) OR p.mobile = $4 OR ($4 ~ '^[0-9]{10}$' AND p.mobile = '+91' || $4) OR lower(p.first_name || ' ' || p.last_name) = lower($4))))
          ORDER BY p.created_at DESC`,
              [personCode ?? null, mobile ?? null, locationId, query ?? null],
      );
      return result.rows;
    },

    async recordLookup({ actorUserId, actorRole, resultCount, outcomes, mobileMasked, ipAddress, device }) {
      const hasBlacklistedMatch = outcomes.includes('BLOCKED_BLACKLIST');
      await pool.query(
        `INSERT INTO mams.audit_log
           (user_id, user_role, module, activity, entity_type, old_value,
            new_value, ip_address, device)
         VALUES ($1, $2, 'GATE', $3, 'PERSON', $4::jsonb, $5::jsonb, $6, $7)`,
        [
          actorUserId,
          actorRole,
          hasBlacklistedMatch ? 'GATE_BLOCKED_BLACKLIST' : 'GATE_LOOKUP',
          JSON.stringify({ mobile_masked: mobileMasked ?? null }),
          JSON.stringify({ matches: resultCount, outcomes }),
          ipAddress ?? null,
          device?.slice(0, 100) ?? null,
        ],
      );
      if (hasBlacklistedMatch) {
        await pool.query(`INSERT INTO mams.notification (user_id, type, title, body, entity_type)
          SELECT user_id, 'BLACKLIST_ALERT', 'Blacklist Alert', 'Blacklisted match blocked at the security gate', 'PERSON'
          FROM mams.app_user WHERE status = 'ACTIVE' AND (role IN ('ADMIN', 'SUPER_ADMIN') OR is_security_head = true)`);
      }
    },
  };
}