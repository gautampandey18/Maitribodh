import { ApiError } from '../../errors/ApiError.js';
import {
  buildApprovalsAnalytics,
  buildBlacklistAnalytics,
  buildOccupancyAnalytics,
  buildRegistrationsAnalytics,
  buildStaffAnalytics,
  buildVisitsAnalytics,
  getIstDateRange,
} from './reports.analytics.js';

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
           LEFT JOIN mams.location AS gi ON gi.location_id = v.checkin_gate_id
           LEFT JOIN mams.location AS li ON li.location_id = v.checkin_location_id
           LEFT JOIN mams.location AS go ON go.location_id = v.checkout_gate_id
           LEFT JOIN mams.location AS lo ON lo.location_id = v.checkout_location_id
          WHERE ($1::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date)
            AND ($2::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date <= $2::date)
            AND ($3::smallint IS NULL OR p.category_id = $3)
            AND ($4::smallint IS NULL OR v.checkin_location_id = $4)
          ORDER BY v.checkin_at DESC, v.visit_id DESC${pagination ? ' LIMIT $5 OFFSET $6' : ''}`,
        pagination
          ? [fromDate, toDate, categoryId ?? null, locationId ?? null, pagination.pageSize, pagination.offset]
          : [fromDate, toDate, categoryId ?? null, locationId ?? null],
      );
      return result.rows;
    },

    async registrations({ categoryId, status, pagination }) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, c.approval_required, p.mobile,
                CASE WHEN c.approval_required = false AND p.status = 'PENDING' THEN 'ACTIVE' ELSE p.status END AS status,
                p.created_at${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE p.status <> 'DRAFT'
            AND ($1::smallint IS NULL OR p.category_id = $1)
            AND ($2::varchar IS NULL OR ($2 = 'PENDING' AND p.status = 'PENDING' AND c.approval_required = true) OR ($2 = 'ACTIVE' AND (p.status = 'ACTIVE' OR (p.status = 'PENDING' AND c.approval_required = false))) OR ($2 NOT IN ('PENDING', 'ACTIVE') AND p.status = $2))
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
          ORDER BY 1 DESC, 2 ASC${pagination ? ' LIMIT $3 OFFSET $4' : ''}`,
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
                h.action, h.reason, coalesce(u.username, 'Former Approver') AS by_user, h.acted_at${pagination ? ', count(*) OVER()::int AS total' : ''}
           FROM mams.approval_history AS h
           JOIN mams.person AS p ON p.person_id = h.person_id
           LEFT JOIN mams.app_user AS u ON u.user_id = h.acted_by
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

    async analytics({ tab = 'visits', fromDate, toDate } = {}) {
      const dateRange = getIstDateRange({ fromDate, toDate });
      const { startStr, endStr, prevStartStr, prevEndStr } = dateRange;

      if (tab === 'visits') {
        const [summaryRes, dailyRes, byCategoryRes] = await Promise.all([
          pool.query(
            `SELECT
               count(*) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date)::int AS current_visits,
               count(*) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $3::date AND $4::date)::int AS prev_visits,
               count(*) FILTER (WHERE status = 'OPEN')::int AS inside_now,
               count(*) FILTER (WHERE status = 'OPEN' AND checkin_at < (now() - interval '24 hours'))::int AS open_over_24h,
               coalesce(round(avg(extract(epoch from (checkout_at - checkin_at))/60)) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date AND checkout_at IS NOT NULL), 0)::int AS avg_duration_min,
               coalesce(round(avg(extract(epoch from (checkout_at - checkin_at))/60)) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $3::date AND $4::date AND checkout_at IS NOT NULL), 0)::int AS prev_avg_duration_min,
               coalesce(sum(accompanying_count) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date), 0)::int AS accompanying,
               coalesce(sum(accompanying_count) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $3::date AND $4::date), 0)::int AS prev_accompanying
             FROM mams.visit`,
            [startStr, endStr, prevStartStr, prevEndStr],
          ),
          pool.query(
            `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                    c.name AS category_name,
                    count(v.visit_id)::int AS checkin_count
               FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
              CROSS JOIN mams.category AS c
               LEFT JOIN (
                 SELECT v.visit_id, p.category_id, (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date AS v_date
                   FROM mams.visit v
                   JOIN mams.person p ON p.person_id = v.person_id
                  WHERE (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
               ) AS v
                 ON v.v_date = days.day::date
                AND v.category_id = c.category_id
              WHERE c.status = 'ACTIVE'
              GROUP BY days.day, c.category_id, c.name
              ORDER BY days.day, c.category_id`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT c.name AS category_name, count(v.visit_id)::int AS count
               FROM mams.visit v
               JOIN mams.person p ON p.person_id = v.person_id
               JOIN mams.category c ON c.category_id = p.category_id
              WHERE (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
              GROUP BY c.category_id, c.name
              ORDER BY count DESC`,
            [startStr, endStr],
          ),
        ]);
        return buildVisitsAnalytics({
          summary: summaryRes.rows[0],
          daily: dailyRes.rows,
          byCategory: byCategoryRes.rows,
          dateRange,
        });
      }

      if (tab === 'registrations') {
        const [summaryRes, dailyRes, byCategoryRes] = await Promise.all([
          pool.query(
            `SELECT
               count(*) FILTER (WHERE (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date)::int AS current_registrations,
               count(*) FILTER (WHERE (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $3::date AND $4::date)::int AS prev_registrations,
               count(*) FILTER (WHERE (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date AND c.form_type = 'VISITOR')::int AS visitor_count,
               count(*) FILTER (WHERE (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date AND c.form_type = 'VENDOR')::int AS vendor_count,
               count(*) FILTER (WHERE (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date AND c.form_type = 'STAFF')::int AS staff_count,
               (SELECT count(*)::int FROM mams.person p2 JOIN mams.category c2 ON c2.category_id = p2.category_id WHERE p2.status = 'PENDING' AND c2.approval_required = true) AS pending_approvals,
               (SELECT coalesce(max(((now() AT TIME ZONE 'Asia/Kolkata')::date - (p3.created_at AT TIME ZONE 'Asia/Kolkata')::date)), 0)::int FROM mams.person p3 JOIN mams.category c3 ON c3.category_id = p3.category_id WHERE p3.status = 'PENDING' AND c3.approval_required = true) AS oldest_pending_days
             FROM mams.person p
             JOIN mams.category c ON c.category_id = p.category_id
            WHERE p.status <> 'DRAFT'`,
            [startStr, endStr, prevStartStr, prevEndStr],
          ),
          pool.query(
            `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                    c.name AS category_name,
                    count(p.person_id)::int AS count
               FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
              CROSS JOIN mams.category AS c
               LEFT JOIN mams.person AS p
                 ON (p.created_at AT TIME ZONE 'Asia/Kolkata')::date = days.day::date
                AND p.category_id = c.category_id
                AND p.status <> 'DRAFT'
              WHERE c.status = 'ACTIVE'
              GROUP BY days.day, c.category_id, c.name
              ORDER BY days.day, c.category_id`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT c.name AS category_name, count(p.person_id)::int AS count
               FROM mams.person p
               JOIN mams.category c ON c.category_id = p.category_id
              WHERE p.status <> 'DRAFT'
                AND (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
              GROUP BY c.category_id, c.name
              ORDER BY count DESC`,
            [startStr, endStr],
          ),
        ]);
        return buildRegistrationsAnalytics({
          summary: summaryRes.rows[0],
          daily: dailyRes.rows,
          byCategory: byCategoryRes.rows,
          dateRange,
        });
      }

      if (tab === 'occupancy') {
        const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentHour = istNow.getHours();
        const endHour = Math.min(20, Math.max(15, currentHour));

        const [summaryRes, hourlyRes, byLocationRes] = await Promise.all([
          pool.query(
            `SELECT
               count(*) FILTER (WHERE status = 'OPEN')::int AS on_campus_now,
               count(*) FILTER (WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date)::int AS checked_in_today,
               count(*) FILTER (WHERE status = 'OPEN' AND checkin_at < (now() - interval '24 hours'))::int AS open_over_24h,
               (SELECT l.name FROM mams.location l LEFT JOIN mams.visit v ON v.checkin_location_id = l.location_id AND v.status = 'OPEN' WHERE l.location_type = 'AREA' AND l.status = 'ACTIVE' GROUP BY l.location_id, l.name ORDER BY count(v.visit_id) DESC, l.name LIMIT 1) AS fullest_location,
               (SELECT count(v.visit_id)::int FROM mams.location l LEFT JOIN mams.visit v ON v.checkin_location_id = l.location_id AND v.status = 'OPEN' WHERE l.location_type = 'AREA' AND l.status = 'ACTIVE' GROUP BY l.location_id, l.name ORDER BY count(v.visit_id) DESC, l.name LIMIT 1) AS fullest_count
             FROM mams.visit`,
          ),
          pool.query(
            `SELECT h.hour::int AS hour, count(v.visit_id)::int AS count
               FROM generate_series(6, $1::int) AS h(hour)
               LEFT JOIN mams.visit AS v
                 ON (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
                AND extract(hour from (v.checkin_at AT TIME ZONE 'Asia/Kolkata')) <= h.hour
                AND (v.checkout_at IS NULL OR extract(hour from (v.checkout_at AT TIME ZONE 'Asia/Kolkata')) >= h.hour)
              GROUP BY h.hour
              ORDER BY h.hour`,
            [endHour],
          ),
          pool.query(
            `SELECT l.name, count(v.visit_id)::int AS count
               FROM mams.location l
               LEFT JOIN mams.visit v ON v.checkin_location_id = l.location_id AND v.status = 'OPEN'
              WHERE l.location_type = 'AREA' AND l.status = 'ACTIVE'
              GROUP BY l.location_id, l.name
              ORDER BY count DESC, l.name
              LIMIT 6`,
          ),
        ]);
        return buildOccupancyAnalytics({
          summary: summaryRes.rows[0],
          hourly: hourlyRes.rows,
          byLocation: byLocationRes.rows,
          dateRange,
        });
      }

      if (tab === 'staff') {
        const [summaryRes, dailyRes, onDutyRes] = await Promise.all([
          pool.query(
            `SELECT
               (SELECT count(*)::int FROM mams.person p JOIN mams.category c ON c.category_id = p.category_id WHERE p.status = 'ACTIVE' AND c.form_type = 'STAFF') AS active_staff,
               (SELECT count(*)::int FROM mams.person p JOIN mams.category c ON c.category_id = p.category_id WHERE c.form_type = 'STAFF' AND (p.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date) AS joined_this_period,
               (SELECT count(DISTINCT v.person_id)::int FROM mams.visit v JOIN mams.person p ON p.person_id = v.person_id JOIN mams.category c ON c.category_id = p.category_id WHERE c.form_type = 'STAFF' AND (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date) AS present_today,
               coalesce(round(avg(extract(epoch from (v.checkout_at - v.checkin_at))/3600)::numeric, 1), 0)::float AS avg_hours,
               (SELECT count(*)::int FROM mams.visit v JOIN mams.person p ON p.person_id = v.person_id JOIN mams.category c ON c.category_id = p.category_id WHERE c.form_type = 'STAFF' AND v.status = 'OPEN' AND (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date < (now() AT TIME ZONE 'Asia/Kolkata')::date) AS missed_checkouts,
               (SELECT to_char(min(v.checkin_at AT TIME ZONE 'Asia/Kolkata'), 'DD Mon') FROM mams.visit v JOIN mams.person p ON p.person_id = v.person_id JOIN mams.category c ON c.category_id = p.category_id WHERE c.form_type = 'STAFF' AND v.status = 'OPEN' AND (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date < (now() AT TIME ZONE 'Asia/Kolkata')::date) AS oldest_missed_date
             FROM mams.visit v
             JOIN mams.person p ON p.person_id = v.person_id
             JOIN mams.category c ON c.category_id = p.category_id
            WHERE c.form_type = 'STAFF'
              AND (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
              AND v.checkout_at IS NOT NULL`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                    count(DISTINCT v.person_id)::int AS present_count
               FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
               LEFT JOIN (
                 SELECT v.person_id, (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date AS v_date
                   FROM mams.visit v
                   JOIN mams.person p ON p.person_id = v.person_id
                   JOIN mams.category c ON c.category_id = p.category_id
                  WHERE c.form_type = 'STAFF'
                    AND (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
               ) AS v ON v.v_date = days.day::date
              GROUP BY days.day
              ORDER BY days.day`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT l.name AS label, count(DISTINCT v.person_id)::int AS value
               FROM mams.location l
               LEFT JOIN (
                 SELECT v.checkin_location_id, v.person_id
                   FROM mams.visit v
                   JOIN mams.person p ON p.person_id = v.person_id
                   JOIN mams.category c ON c.category_id = p.category_id
                  WHERE c.form_type = 'STAFF'
                    AND (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date
               ) AS v ON v.checkin_location_id = l.location_id
              WHERE l.location_type = 'AREA' AND l.status = 'ACTIVE'
              GROUP BY l.location_id, l.name
              ORDER BY value DESC, l.name
              LIMIT 6`,
          ),
        ]);
        return buildStaffAnalytics({
          summary: summaryRes.rows[0],
          daily: dailyRes.rows,
          onDutyByLocation: onDutyRes.rows,
          dateRange,
        });
      }

      if (tab === 'approvals') {
        const [summaryRes, dailyRes, byOutcomeRes] = await Promise.all([
          pool.query(
            `SELECT
               count(*) FILTER (WHERE (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date)::int AS total_requests,
               count(*) FILTER (WHERE (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $3::date AND $4::date)::int AS prev_requests,
               count(*) FILTER (WHERE (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date AND h.action = 'APPROVED')::int AS approved_count,
               (SELECT count(*)::int FROM mams.person p JOIN mams.category c ON c.category_id = p.category_id WHERE p.status = 'PENDING' AND c.approval_required = true) AS pending_count,
               (SELECT count(*)::int FROM mams.person p JOIN mams.category c ON c.category_id = p.category_id WHERE p.status = 'PENDING' AND c.approval_required = true AND p.created_at < (now() - interval '1 hour')) AS waiting_over_1h,
               coalesce(round(avg(extract(epoch from (h.acted_at - p.created_at))/60) FILTER (WHERE (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date)), 0)::int AS avg_decision_min
             FROM mams.approval_history h
             JOIN mams.person p ON p.person_id = h.person_id`,
            [startStr, endStr, prevStartStr, prevEndStr],
          ),
          pool.query(
            `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                    count(h.approval_id) FILTER (WHERE h.action = 'APPROVED')::int AS approved_count,
                    count(h.approval_id) FILTER (WHERE h.action = 'REJECTED')::int AS rejected_count,
                    count(h.approval_id) FILTER (WHERE h.action IN ('SUBMITTED', 'RESUBMITTED'))::int AS pending_count
               FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
               LEFT JOIN (
                 SELECT approval_id, action, (acted_at AT TIME ZONE 'Asia/Kolkata')::date AS a_date
                   FROM mams.approval_history
               ) AS h ON h.a_date = days.day::date
              GROUP BY days.day
              ORDER BY days.day`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT action, count(*)::int AS count
               FROM mams.approval_history
              WHERE (acted_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
              GROUP BY action
              ORDER BY count DESC`,
            [startStr, endStr],
          ),
        ]);
        return buildApprovalsAnalytics({
          summary: summaryRes.rows[0],
          daily: dailyRes.rows,
          byOutcome: byOutcomeRes.rows,
          dateRange,
        });
      }

      if (tab === 'blacklist') {
        const [summaryRes, dailyRes, reasonsRes] = await Promise.all([
          pool.query(
            `SELECT
               (SELECT count(*)::int FROM mams.blacklist WHERE lifted_at IS NULL AND (end_date IS NULL OR end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)) AS on_blacklist,
               (SELECT count(*)::int FROM mams.blacklist WHERE lifted_at IS NULL AND end_date IS NOT NULL AND end_date BETWEEN (now() AT TIME ZONE 'Asia/Kolkata')::date AND (now() AT TIME ZONE 'Asia/Kolkata')::date + interval '7 days') AS expiring_soon,
               (SELECT count(*)::int FROM mams.blacklist WHERE (added_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date) AS added_this_period,
               (SELECT count(*)::int FROM mams.audit_log WHERE module = 'GATE' AND activity = 'GATE_BLOCKED_BLACKLIST' AND (occurred_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date) AS blocked_attempts,
               (SELECT count(*)::int FROM mams.visit WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date) AS gate_screenings`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                    count(a.audit_id)::int AS count
               FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
               LEFT JOIN (
                 SELECT audit_id, (occurred_at AT TIME ZONE 'Asia/Kolkata')::date AS a_date
                   FROM mams.audit_log
                  WHERE module = 'GATE' AND activity = 'GATE_BLOCKED_BLACKLIST'
               ) AS a ON a.a_date = days.day::date
              GROUP BY days.day
              ORDER BY days.day`,
            [startStr, endStr],
          ),
          pool.query(
            `SELECT coalesce(r.name, 'Other') AS label, count(b.blacklist_id)::int AS value
               FROM mams.blacklist b
               LEFT JOIN mams.lookup_value r ON r.lookup_id = b.reason_id
              WHERE b.lifted_at IS NULL AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
              GROUP BY r.name
              ORDER BY value DESC`,
          ),
        ]);
        return buildBlacklistAnalytics({
          summary: summaryRes.rows[0],
          daily: dailyRes.rows,
          reasons: reasonsRes.rows,
          dateRange,
        });
      }

      throw new ApiError(400, 'VALIDATION_ERROR', `Unsupported report tab: ${tab}`);
    },
  };
}