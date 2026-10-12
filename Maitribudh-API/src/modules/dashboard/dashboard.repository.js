export function createDashboardRepository(pool) {
  return {
    async summary() {
      const result = await pool.query(
        `SELECT
           (SELECT count(*)::int FROM mams.person WHERE status = 'ACTIVE') AS active_persons,
           (SELECT count(*)::int FROM mams.person
             WHERE status <> 'DRAFT'
               AND (created_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
           ) AS registrations_today,
           (SELECT count(*)::int FROM mams.visit
             WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
           ) AS checkins_today,
           (SELECT count(*)::int FROM mams.visit
             WHERE checkout_at IS NOT NULL
               AND (checkout_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
           ) AS checkouts_today,
           (SELECT count(*)::int FROM mams.person WHERE status = 'PENDING') AS pending_approvals,
           (SELECT count(*)::int FROM mams.audit_log
             WHERE module = 'GATE' AND activity = 'GATE_BLOCKED_BLACKLIST'
               AND (occurred_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
           ) AS blacklist_attempts_today,
           (SELECT count(*)::int FROM mams.visit WHERE status = 'OPEN') AS open_visits`,
      );
      return result.rows[0];
    },

    async checkinTrend() {
      const result = await pool.query(
        `SELECT days.day::date AS day, count(v.visit_id)::int AS checkins
           FROM generate_series(
                  (now() AT TIME ZONE 'Asia/Kolkata')::date - 6,
                  (now() AT TIME ZONE 'Asia/Kolkata')::date,
                  interval '1 day'
                ) AS days(day)
           LEFT JOIN mams.visit AS v
             ON (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date = days.day::date
          GROUP BY days.day
          ORDER BY days.day`,
      );
      return result.rows;
    },

    async categoryMix() {
      const result = await pool.query(
        `SELECT c.name AS category, count(p.person_id)::int AS active_persons
           FROM mams.category AS c
           LEFT JOIN mams.person AS p
             ON p.category_id = c.category_id AND p.status = 'ACTIVE'
          WHERE c.status = 'ACTIVE'
          GROUP BY c.category_id, c.name
          ORDER BY c.name`,
      );
      return result.rows;
    },

    async recentActivity() {
      const result = await pool.query(
        `SELECT a.occurred_at, coalesce(u.username, 'system') AS actor,
                nullif(trim(concat_ws(' ', p.first_name, p.last_name)), '') AS person_name,
                c.name AS category, l.name AS location, a.module, a.activity
           FROM mams.audit_log AS a
           LEFT JOIN mams.app_user AS u ON u.user_id = a.user_id
           LEFT JOIN mams.visit AS v ON a.entity_type = 'VISIT' AND v.visit_id = a.entity_id
           LEFT JOIN mams.person AS p ON p.person_id = CASE
             WHEN a.entity_type = 'PERSON' THEN a.entity_id
             WHEN a.entity_type = 'VISIT' THEN v.person_id END
           LEFT JOIN mams.category AS c ON c.category_id = p.category_id
           LEFT JOIN mams.location AS l ON l.location_id = CASE
             WHEN a.activity = 'CHECK_OUT' THEN v.checkout_location_id
             WHEN a.entity_type = 'VISIT' THEN v.checkin_location_id END
          ORDER BY a.occurred_at DESC
          LIMIT 5`,
      );
      return result.rows;
    },

    async securityAlerts() {
      const result = await pool.query(
        `SELECT count(*)::int AS total_today, max(occurred_at) AS latest_at
           FROM mams.audit_log
          WHERE module = 'GATE'
            AND activity = 'GATE_BLOCKED_BLACKLIST'
            AND (occurred_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date`,
      );
      return result.rows[0];
    },

    async inside({ pageSize, offset }) {
      const [result, count, byLocation, byCategory] = await Promise.all([
        pool.query(
        `SELECT v.visit_id, p.person_id, p.person_code,
                p.first_name || ' ' || p.last_name AS name,
                p.mobile, p.photo_key IS NOT NULL AS has_photo,
                c.name AS category, gi.name AS gate, li.name AS location,
                v.checkin_at, v.accompanying_count, v.accompanying_names,
                u.first_name || ' ' || u.last_name AS checked_in_by,
                v.checkin_device
           FROM mams.visit AS v
           JOIN mams.person AS p ON p.person_id = v.person_id
           JOIN mams.category AS c ON c.category_id = p.category_id
           JOIN mams.location AS gi ON gi.location_id = v.checkin_gate_id
           JOIN mams.location AS li ON li.location_id = v.checkin_location_id
           JOIN mams.app_user AS u ON u.user_id = v.checkin_by
          WHERE v.status = 'OPEN'
           ORDER BY v.checkin_at
          LIMIT $1 OFFSET $2`,
        [pageSize, offset],
        ),
        pool.query("SELECT count(*)::int AS total FROM mams.visit WHERE status = 'OPEN'"),
        pool.query(`SELECT l.name AS name, count(*)::int AS count
          FROM mams.visit AS v JOIN mams.location AS l ON l.location_id = v.checkin_location_id
          WHERE v.status = 'OPEN' GROUP BY l.location_id, l.name ORDER BY l.name`),
        pool.query(`SELECT c.name AS name, count(*)::int AS count
          FROM mams.visit AS v JOIN mams.person AS p ON p.person_id = v.person_id
          JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE v.status = 'OPEN' GROUP BY c.category_id, c.name ORDER BY c.name`),
      ]);
      return {
        items: result.rows,
        total: count.rows[0].total,
        byLocation: byLocation.rows,
        byCategory: byCategory.rows,
      };
    },
  };
}