export function createReportsRepository(pool) {
  return {
    async visitHistory({ fromDate, toDate, categoryId, locationId, pagination }) {
      const result = await pool.query(
        `SELECT v.checkin_at, v.checkout_at, p.person_code,
                p.first_name || ' ' || p.last_name AS name, p.mobile,
                c.name AS category, gi.name AS checkin_gate, li.name AS checkin_location,
                go.name AS checkout_gate, lo.name AS checkout_location,
                v.status, v.accompanying_count${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.visit AS v
           JOIN mams.person AS p ON p.person_id = v.person_id
           JOIN mams.category AS c ON c.category_id = p.category_id
           JOIN mams.location AS gi ON gi.location_id = v.checkin_gate_id
           JOIN mams.location AS li ON li.location_id = v.checkin_location_id
           LEFT JOIN mams.location AS go ON go.location_id = v.checkout_gate_id
           LEFT JOIN mams.location AS lo ON lo.location_id = v.checkout_location_id
          WHERE ($1::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date)
            AND ($2::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date <= $2::date)
            AND ($3::smallint IS NULL OR p.category_id = $3)
            AND ($4::smallint IS NULL OR v.checkin_location_id = $4)
          ORDER BY v.checkin_at, v.visit_id${pagination ? ' LIMIT $5 OFFSET $6' : ''}`,
        pagination
          ? [fromDate, toDate, categoryId ?? null, locationId ?? null, pagination.pageSize, pagination.offset]
          : [fromDate, toDate, categoryId ?? null, locationId ?? null],
      );
      return result.rows;
    },

    async registrations({ categoryId, status, pagination }) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, p.mobile, p.status, p.created_at${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE p.status <> 'DRAFT'
            AND ($1::smallint IS NULL OR p.category_id = $1)
            AND ($2::varchar IS NULL OR p.status = $2)
          ORDER BY p.created_at DESC, p.person_id${pagination ? ' LIMIT $3 OFFSET $4' : ''}`,
        pagination
          ? [categoryId ?? null, status ?? null, pagination.pageSize, pagination.offset]
          : [categoryId ?? null, status ?? null],
      );
      return result.rows;
    },

    async occupancy({ fromDate, toDate, pagination }) {
      const result = await pool.query(
        `SELECT (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date AS day,
                l.name AS location, count(*) AS checkins,
                count(v.checkout_at) AS checkouts,
                count(*) FILTER (WHERE v.status = 'OPEN') AS still_inside${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.visit AS v
           JOIN mams.location AS l ON l.location_id = v.checkin_location_id
          WHERE ($1::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date)
            AND ($2::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date <= $2::date)
          GROUP BY 1, 2
          ORDER BY 1, 2${pagination ? ' LIMIT $3 OFFSET $4' : ''}`,
        pagination ? [fromDate, toDate, pagination.pageSize, pagination.offset] : [fromDate, toDate],
      );
      return result.rows;
    },

    async staff({ name = '', jobRole = '', pagination } = {}) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                d.name AS department, j.name AS job_role,
                p.category_details ->> 'joining_date' AS joining_date, p.status${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.person AS p
           JOIN mams.category AS c
             ON c.category_id = p.category_id AND c.form_type = 'STAFF'
           LEFT JOIN mams.lookup_value AS d
             ON d.lookup_id = (p.category_details ->> 'department_id')::int
           LEFT JOIN mams.lookup_value AS j
             ON j.lookup_id = (p.category_details ->> 'job_role_id')::int
          WHERE p.status <> 'DRAFT'
            AND ($1 = '' OR p.first_name || ' ' || p.last_name ILIKE '%' || $1 || '%')
            AND ($2 = '' OR j.name ILIKE '%' || $2 || '%')
          ORDER BY p.created_at DESC, p.person_id${pagination ? ' LIMIT $3 OFFSET $4' : ''}`,
        pagination
          ? [name, jobRole, pagination.pageSize, pagination.offset]
          : [name, jobRole],
      );
      return result.rows;
    },

    async approvals({ fromDate, toDate, user = '', pagination }) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                h.action, h.reason, u.username AS by_user, h.acted_at${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.approval_history AS h
           JOIN mams.person AS p ON p.person_id = h.person_id
           JOIN mams.app_user AS u ON u.user_id = h.acted_by
          WHERE ($1::date IS NULL OR (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date)
            AND ($2::date IS NULL OR (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date <= $2::date)
            AND ($3 = '' OR u.username ILIKE '%' || $3 || '%')
          ORDER BY h.acted_at DESC, h.approval_id${pagination ? ' LIMIT $4 OFFSET $5' : ''}`,
        pagination
          ? [fromDate, toDate, user, pagination.pageSize, pagination.offset]
          : [fromDate, toDate, user],
      );
      return result.rows;
    },

    async blacklist({ name = '', category = '', pagination } = {}) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, r.name AS reason, b.remarks, b.start_date, b.end_date,
                CASE
                  WHEN b.lifted_at IS NOT NULL THEN 'LIFTED'
                  WHEN b.end_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'EXPIRED'
                  ELSE 'ACTIVE'
                END AS state${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.blacklist AS b
           JOIN mams.person AS p ON p.person_id = b.person_id
           JOIN mams.category AS c ON c.category_id = p.category_id
           JOIN mams.lookup_value AS r ON r.lookup_id = b.reason_id
          WHERE ($1 = '' OR p.first_name || ' ' || p.last_name ILIKE '%' || $1 || '%')
            AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
          ORDER BY b.added_at DESC, b.blacklist_id${pagination ? ' LIMIT $3 OFFSET $4' : ''}`,
        pagination
          ? [name, category, pagination.pageSize, pagination.offset]
          : [name, category],
      );
      return result.rows;
    },

    async recordVisitHistoryExport({ filters, rowCount, actorUserId, actorRole, ipAddress, device }) {
      await pool.query(
        `INSERT INTO mams.audit_log
           (user_id, user_role, module, activity, entity_type,
            new_value, ip_address, device)
         VALUES ($1, $2, 'REPORT', 'VISIT_HISTORY_EXPORT', 'REPORT', $3::jsonb, $4, $5)`,
        [
          actorUserId,
          actorRole,
          JSON.stringify({ report: 'VISIT_HISTORY', filters, row_count: rowCount }),
          ipAddress ?? null,
          device?.slice(0, 100) ?? null,
        ],
      );
    },
  };
}