export function createGateRepository(pool) {
  return {
    async isActiveLocation(locationId) {
      const result = await pool.query(
        `SELECT location_id
           FROM mams.location
        WHERE location_id = $1 AND location_type = 'AREA' AND status = 'ACTIVE'`,
        [locationId],
      );
      return result.rowCount > 0;
    },

    async findCandidates({ personCode, mobile, query, locationId }) {
      const result = await pool.query(
        `SELECT p.person_id, p.person_code, p.first_name, p.last_name,
                c.name AS category, p.status, identity.qr_version, p.photo_key, p.mobile,
                p.expires_on < (now() AT TIME ZONE 'Asia/Kolkata')::date AS access_expired,
                (c.form_type = 'PARTICIPANT' AND NULLIF(program.extra->>'end_date', '')::date
                  < (now() AT TIME ZONE 'Asia/Kolkata')::date) AS event_expired,
                p.category_details->>'future_checkin_access' = 'YES' AS future_checkin_access,
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
           JOIN mams.person_identity AS identity USING (identity_id)
           JOIN mams.category AS c ON c.category_id = p.category_id
           LEFT JOIN mams.lookup_value AS program ON program.lookup_type = 'PROGRAM_BATCH'
             AND program.lookup_id::text = p.category_details->>'program_batch_id'
           LEFT JOIN mams.visit AS v ON v.person_id = p.person_id AND v.status = 'OPEN'
           JOIN mams.location AS l ON l.location_id = $3 AND l.status = 'ACTIVE'
          WHERE p.status <> 'DRAFT'
            AND (($1::varchar IS NOT NULL AND (identity.qr_code = upper($1) OR p.person_code = upper($1)))
                OR ($2::varchar IS NOT NULL AND (p.mobile = $2 OR ($2 ~ '^[0-9]{10}$' AND p.mobile = '+91' || $2)))
                OR ($4::varchar IS NOT NULL AND (lower(p.person_code) = lower($4) OR p.mobile = $4 OR ($4 ~ '^[0-9]{10}$' AND p.mobile = '+91' || $4))))
          ORDER BY p.created_at DESC`,
        [personCode ?? null, mobile ?? null, locationId, query ?? null],
      );
      return result.rows;
    },

    async getAreaOccupancy(locationId) {
      const result = await pool.query(
        `SELECT location.max_occupancy,
                COALESCE((SELECT sum(1 + visit.accompanying_count)::int
                            FROM mams.visit AS visit
                           WHERE visit.checkin_location_id = location.location_id
                             AND visit.status = 'OPEN'), 0) AS current_occupancy
           FROM mams.location AS location
          WHERE location.location_id = $1
            AND location.location_type = 'AREA'
            AND location.status = 'ACTIVE'`,
        [locationId],
      );
      return result.rows[0] ?? null;
    },

    async recordLookup({
      actorUserId, actorRole, resultCount, outcomes, personIds = [], blockedPersonIds = [], mobileMasked, ipAddress, device,
    }) {
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
          JSON.stringify({
            matches: resultCount,
            outcomes,
            // Person IDs let reports attribute screenings and blocked attempts to a searched person.
            ...(personIds.length ? { person_ids: personIds.map(Number) } : {}),
            ...(blockedPersonIds.length ? { blocked_person_ids: blockedPersonIds.map(Number) } : {}),
          }),
          ipAddress ?? null,
          device?.slice(0, 100) ?? null,
        ],
      );
      if (hasBlacklistedMatch) {
        await pool.query(`INSERT INTO mams.notification (user_id, type, title, body, entity_type)
          SELECT user_id, 'BLACKLIST_ALERT', 'Blacklist Alert', 'Blacklisted match blocked at the security gate', 'PERSON'
          FROM mams.app_user WHERE status = 'ACTIVE' AND (roles && ARRAY['ADMIN', 'SUPER_ADMIN']::varchar[] OR is_security_head = true)`);
      }
    },
  };
}