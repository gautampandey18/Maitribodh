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

const IST_TODAY = "(now() AT TIME ZONE 'Asia/Kolkata')::date";

function istDate(column) {
  return `(${column} AT TIME ZONE 'Asia/Kolkata')::date`;
}

/**
 * Person search predicate shared by every report: exact person code, exact mobile, or name contains.
 * Mobile numbers match exactly so masked report roles cannot enumerate them digit by digit.
 */
function personSearchSql(alias, param) {
  return `(${param} = ''
              OR ${alias}.person_code = upper(${param})
              OR ${alias}.mobile = ${param}
              OR (${param} ~ '^[0-9]{10}$' AND ${alias}.mobile = '+91' || ${param})
              OR lower(${alias}.first_name || ' ' || ${alias}.last_name) LIKE '%' || lower(${param}) || '%')`;
}

function registrationStatusSql(param) {
  return `(${param}::varchar IS NULL
              OR (${param} = 'PENDING' AND p.status = 'PENDING' AND c.approval_required = true)
              OR (${param} = 'ACTIVE' AND (p.status = 'ACTIVE' OR (p.status = 'PENDING' AND c.approval_required = false)))
              OR (${param} NOT IN ('PENDING', 'ACTIVE') AND p.status = ${param}))`;
}

function params(first, count) {
  return Array.from({ length: count }, (_, index) => `$${first + index}`);
}

function visitScopeSql(first) {
  const [search, categoryId, locationId] = params(first, 3);
  return `${personSearchSql('p', search)}
            AND (${categoryId}::smallint IS NULL OR p.category_id = ${categoryId})
            AND (${locationId}::smallint IS NULL OR v.checkin_location_id = ${locationId})`;
}

function registrationScopeSql(first) {
  const [search, categoryId, status] = params(first, 3);
  return `p.status <> 'DRAFT'
            AND ${personSearchSql('p', search)}
            AND (${categoryId}::smallint IS NULL OR p.category_id = ${categoryId})
            AND ${registrationStatusSql(status)}`;
}

function approvalScopeSql(first) {
  const [search, user] = params(first, 2);
  return `${personSearchSql('p', search)}
            AND (${user} = '' OR u.username ILIKE '%' || ${user} || '%')`;
}

function staffScopeCte(first) {
  const [search, name, jobRole] = params(first, 3);
  return `staff AS (
             SELECT p.person_id, p.status, p.created_at
               FROM mams.person AS p
               JOIN mams.category AS c ON c.category_id = p.category_id AND c.form_type = 'STAFF'
               LEFT JOIN mams.lookup_value AS j ON j.lookup_id = (p.category_details ->> 'job_role_id')::int
              WHERE p.status <> 'DRAFT'
                AND ${personSearchSql('p', search)}
                AND (${name} = '' OR p.first_name || ' ' || p.last_name ILIKE '%' || ${name} || '%')
                AND (${jobRole} = '' OR j.name ILIKE '%' || ${jobRole} || '%')
           ),
           staff_visit AS (
             SELECT v.* FROM mams.visit AS v JOIN staff AS s ON s.person_id = v.person_id
           )`;
}

function blacklistScopeCte(first) {
  const [search, name, category] = params(first, 3);
  const unfiltered = `(${search} = '' AND ${name} = '' AND ${category} = '')`;
  return `scoped_person AS (
             SELECT p.person_id
               FROM mams.person AS p
               JOIN mams.category AS c ON c.category_id = p.category_id
              WHERE ${personSearchSql('p', search)}
                AND (${name} = '' OR p.first_name || ' ' || p.last_name ILIKE '%' || ${name} || '%')
                AND (${category} = '' OR c.name ILIKE '%' || ${category} || '%')
           ),
           scoped AS (
             SELECT b.* FROM mams.blacklist AS b JOIN scoped_person AS sp ON sp.person_id = b.person_id
           ),
           gate_screening AS (
             SELECT a.audit_id, ${istDate('a.occurred_at')} AS a_date,
                    CASE WHEN ${unfiltered} THEN a.activity = 'GATE_BLOCKED_BLACKLIST'
                         ELSE EXISTS (SELECT 1 FROM scoped_person AS sp
                                       WHERE a.new_value -> 'blocked_person_ids' @> to_jsonb(sp.person_id))
                    END AS is_blocked
               FROM mams.audit_log AS a
              WHERE a.module = 'GATE'
                AND a.activity IN ('GATE_LOOKUP', 'GATE_BLOCKED_BLACKLIST')
                AND (${unfiltered} OR EXISTS (SELECT 1 FROM scoped_person AS sp
                                               WHERE a.new_value -> 'person_ids' @> to_jsonb(sp.person_id)))
           )`;
}

function withPagination(values, pagination) {
  return pagination ? [...values, pagination.pageSize, pagination.offset] : values;
}

function paginationSql(pagination, first) {
  return pagination ? ` LIMIT $${first} OFFSET $${first + 1}` : '';
}

function totalSql(pagination) {
  return pagination ? ', count(*) OVER()::int AS total' : '';
}

export function createReportsRepository(pool) {
  const analyticsByTab = {
    async visits({ dateRange, search, categoryId, locationId }) {
      const { startStr, endStr, prevStartStr, prevEndStr } = dateRange;
      const scope = [search, categoryId ?? null, locationId ?? null];
      const checkinDay = istDate('v.checkin_at');
      const [summaryRes, dailyRes, byCategoryRes] = await Promise.all([
        pool.query(
          `SELECT
             count(*) FILTER (WHERE ${checkinDay} BETWEEN $1::date AND $2::date)::int AS current_visits,
             count(*) FILTER (WHERE ${checkinDay} BETWEEN $3::date AND $4::date)::int AS prev_visits,
             count(*) FILTER (WHERE v.status = 'OPEN')::int AS inside_now,
             count(*) FILTER (WHERE v.status = 'OPEN' AND v.checkin_at < (now() - interval '24 hours'))::int AS open_over_24h,
             coalesce(round(avg(extract(epoch FROM (v.checkout_at - v.checkin_at)) / 60) FILTER (WHERE ${checkinDay} BETWEEN $1::date AND $2::date AND v.checkout_at IS NOT NULL)), 0)::int AS avg_duration_min,
             coalesce(round(avg(extract(epoch FROM (v.checkout_at - v.checkin_at)) / 60) FILTER (WHERE ${checkinDay} BETWEEN $3::date AND $4::date AND v.checkout_at IS NOT NULL)), 0)::int AS prev_avg_duration_min,
             coalesce(sum(v.accompanying_count) FILTER (WHERE ${checkinDay} BETWEEN $1::date AND $2::date), 0)::int AS accompanying,
             coalesce(sum(v.accompanying_count) FILTER (WHERE ${checkinDay} BETWEEN $3::date AND $4::date), 0)::int AS prev_accompanying
           FROM mams.visit AS v
           JOIN mams.person AS p ON p.person_id = v.person_id
          WHERE ${visitScopeSql(5)}`,
          [startStr, endStr, prevStartStr, prevEndStr, ...scope],
        ),
        pool.query(
          `SELECT to_char(${checkinDay}, 'YYYY-MM-DD') AS day,
                  c.name AS category_name,
                  count(*)::int AS checkin_count
             FROM mams.visit AS v
             JOIN mams.person AS p ON p.person_id = v.person_id
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE ${checkinDay} BETWEEN $1::date AND $2::date
              AND ${visitScopeSql(3)}
            GROUP BY 1, c.category_id, c.name
            ORDER BY 1, c.category_id`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `SELECT c.name AS category_name, count(*)::int AS count
             FROM mams.visit AS v
             JOIN mams.person AS p ON p.person_id = v.person_id
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE ${checkinDay} BETWEEN $1::date AND $2::date
              AND ${visitScopeSql(3)}
            GROUP BY c.category_id, c.name
            ORDER BY count DESC, c.name`,
          [startStr, endStr, ...scope],
        ),
      ]);
      return buildVisitsAnalytics({
        summary: summaryRes.rows[0],
        daily: dailyRes.rows,
        byCategory: byCategoryRes.rows,
        dateRange,
      });
    },

    async registrations({ dateRange, search, categoryId, status }) {
      const { startStr, endStr, prevStartStr, prevEndStr } = dateRange;
      const scope = [search, categoryId ?? null, status ?? null];
      const createdDay = istDate('p.created_at');
      const [summaryRes, dailyRes, byCategoryRes] = await Promise.all([
        pool.query(
          `SELECT
             count(*) FILTER (WHERE ${createdDay} BETWEEN $1::date AND $2::date)::int AS current_registrations,
             count(*) FILTER (WHERE ${createdDay} BETWEEN $3::date AND $4::date)::int AS prev_registrations,
             count(*) FILTER (WHERE ${createdDay} BETWEEN $1::date AND $2::date AND c.form_type = 'VISITOR')::int AS visitor_count,
             count(*) FILTER (WHERE ${createdDay} BETWEEN $1::date AND $2::date AND c.form_type = 'VENDOR')::int AS vendor_count,
             count(*) FILTER (WHERE ${createdDay} BETWEEN $1::date AND $2::date AND c.form_type = 'STAFF')::int AS staff_count,
             count(*) FILTER (WHERE p.status = 'PENDING' AND c.approval_required = true)::int AS pending_approvals,
             coalesce(max(${IST_TODAY} - ${createdDay}) FILTER (WHERE p.status = 'PENDING' AND c.approval_required = true), 0)::int AS oldest_pending_days
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE ${registrationScopeSql(5)}`,
          [startStr, endStr, prevStartStr, prevEndStr, ...scope],
        ),
        pool.query(
          `SELECT to_char(${createdDay}, 'YYYY-MM-DD') AS day,
                  c.name AS category_name,
                  count(*)::int AS count
             FROM mams.person AS p
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE ${createdDay} BETWEEN $1::date AND $2::date
              AND ${registrationScopeSql(3)}
            GROUP BY 1, c.category_id, c.name
            ORDER BY 1, c.category_id`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `SELECT c.name AS category_name, count(*)::int AS count
             FROM mams.person AS p
             JOIN mams.category AS c ON c.category_id = p.category_id
            WHERE ${createdDay} BETWEEN $1::date AND $2::date
              AND ${registrationScopeSql(3)}
            GROUP BY c.category_id, c.name
            ORDER BY count DESC, c.name`,
          [startStr, endStr, ...scope],
        ),
      ]);
      return buildRegistrationsAnalytics({
        summary: summaryRes.rows[0],
        daily: dailyRes.rows,
        byCategory: byCategoryRes.rows,
        dateRange,
      });
    },

    async occupancy({ dateRange, search }) {
      const day = dateRange.endStr;
      const isToday = day === dateRange.todayStr;
      const currentIstHour = Number(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23',
      }).format(new Date()));
      const lastHour = isToday ? currentIstHour : 23;
      const [summaryRes, hourlyRes, byLocationRes] = await Promise.all([
        pool.query(
          `SELECT
             count(*) FILTER (WHERE v.status = 'OPEN')::int AS on_campus_now,
             count(*) FILTER (WHERE ${istDate('v.checkin_at')} = $1::date)::int AS checked_in_day,
             count(*) FILTER (WHERE ${istDate('v.checkin_at')} = $1::date AND v.status = 'OPEN')::int AS still_inside_from_day,
             count(*) FILTER (WHERE v.status = 'OPEN' AND v.checkin_at < (now() - interval '24 hours'))::int AS open_over_24h
           FROM mams.visit AS v
           JOIN mams.person AS p ON p.person_id = v.person_id
          WHERE ${personSearchSql('p', '$2')}`,
          [day, search],
        ),
        pool.query(
          `SELECT h.hour::int AS hour, count(v.visit_id)::int AS count
             FROM generate_series(0, $2::int) AS h(hour)
             LEFT JOIN (
               SELECT v.visit_id, v.checkin_at, v.checkout_at
                 FROM mams.visit AS v
                 JOIN mams.person AS p ON p.person_id = v.person_id
                WHERE v.checkin_at < (($1::date + interval '1 day') AT TIME ZONE 'Asia/Kolkata')
                  AND (v.checkout_at IS NULL OR v.checkout_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata'))
                  AND ${personSearchSql('p', '$3')}
             ) AS v
               ON v.checkin_at < (($1::date + make_interval(hours => h.hour + 1)) AT TIME ZONE 'Asia/Kolkata')
              AND (v.checkout_at IS NULL OR v.checkout_at >= (($1::date + make_interval(hours => h.hour)) AT TIME ZONE 'Asia/Kolkata'))
            GROUP BY h.hour
            ORDER BY h.hour`,
          [day, lastHour, search],
        ),
        pool.query(
          `SELECT l.name, count(DISTINCT v.person_id)::int AS count
             FROM mams.location AS l
             LEFT JOIN (
               SELECT v.checkin_location_id, v.person_id
                 FROM mams.visit AS v
                 JOIN mams.person AS p ON p.person_id = v.person_id
                WHERE ${personSearchSql('p', '$3')}
                  AND CASE WHEN $2::boolean THEN v.status = 'OPEN'
                           ELSE ${istDate('v.checkin_at')} = $1::date END
             ) AS v ON v.checkin_location_id = l.location_id
            WHERE l.location_type = 'AREA' AND l.status = 'ACTIVE'
            GROUP BY l.location_id, l.name
           HAVING $3 = '' OR count(v.person_id) > 0
            ORDER BY count DESC, l.name
            LIMIT 6`,
          [day, isToday, search],
        ),
      ]);
      return buildOccupancyAnalytics({
        summary: summaryRes.rows[0],
        hourly: hourlyRes.rows,
        byLocation: byLocationRes.rows,
        dateRange,
      });
    },

    async staff({ dateRange, search, name, jobRole }) {
      const { startStr, endStr } = dateRange;
      const scope = [search, name, jobRole];
      const [summaryRes, dailyRes, onDutyRes] = await Promise.all([
        pool.query(
          `WITH ${staffScopeCte(3)}
           SELECT
             (SELECT count(*)::int FROM staff WHERE status = 'ACTIVE') AS active_staff,
             (SELECT count(*)::int FROM staff WHERE ${istDate('created_at')} BETWEEN $1::date AND $2::date) AS joined_this_period,
             (SELECT count(DISTINCT person_id)::int FROM staff_visit WHERE ${istDate('checkin_at')} = ${IST_TODAY}) AS present_today,
             (SELECT coalesce(round((avg(extract(epoch FROM (checkout_at - checkin_at))) / 3600)::numeric, 1), 0)::float
                FROM staff_visit
               WHERE ${istDate('checkin_at')} BETWEEN $1::date AND $2::date AND checkout_at IS NOT NULL) AS avg_hours,
             (SELECT count(*)::int
                FROM staff_visit
               WHERE ${istDate('checkin_at')} BETWEEN $1::date AND $2::date AND checkout_at IS NOT NULL) AS completed_visits,
             (SELECT count(*)::int FROM staff_visit WHERE status = 'OPEN' AND ${istDate('checkin_at')} < ${IST_TODAY}) AS missed_checkouts,
             (SELECT to_char(min(checkin_at AT TIME ZONE 'Asia/Kolkata'), 'DD Mon')
                FROM staff_visit
               WHERE status = 'OPEN' AND ${istDate('checkin_at')} < ${IST_TODAY}) AS oldest_missed_date`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `WITH ${staffScopeCte(3)}
           SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                  count(DISTINCT sv.person_id)::int AS present_count
             FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
             LEFT JOIN staff_visit AS sv ON ${istDate('sv.checkin_at')} = days.day::date
            GROUP BY days.day
            ORDER BY days.day`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `WITH ${staffScopeCte(1)}
           SELECT l.name AS label, count(DISTINCT sv.person_id)::int AS value
             FROM mams.location AS l
             LEFT JOIN staff_visit AS sv
               ON sv.checkin_location_id = l.location_id
              AND ${istDate('sv.checkin_at')} = ${IST_TODAY}
            WHERE l.location_type = 'AREA' AND l.status = 'ACTIVE'
            GROUP BY l.location_id, l.name
           HAVING ($1 = '' AND $2 = '' AND $3 = '') OR count(sv.person_id) > 0
            ORDER BY value DESC, l.name
            LIMIT 6`,
          scope,
        ),
      ]);
      return buildStaffAnalytics({
        summary: summaryRes.rows[0],
        daily: dailyRes.rows,
        onDutyByLocation: onDutyRes.rows,
        dateRange,
      });
    },

    async approvals({ dateRange, search, user }) {
      const { startStr, endStr, prevStartStr, prevEndStr } = dateRange;
      const scope = [search, user];
      const actedDay = istDate('h.acted_at');
      const latestSubmission = (personColumn, upToColumn) => `LEFT JOIN LATERAL (
               SELECT max(s.acted_at) AS submitted_at
                 FROM mams.approval_history AS s
                WHERE s.person_id = ${personColumn}
                  AND s.action IN ('SUBMITTED', 'RESUBMITTED')
                  ${upToColumn ? `AND s.acted_at <= ${upToColumn}` : ''}
             ) AS sub ON true`;
      const [summaryRes, pendingRes, dailyRes, byOutcomeRes] = await Promise.all([
        pool.query(
          `SELECT
             count(*) FILTER (WHERE ${actedDay} BETWEEN $1::date AND $2::date AND h.action IN ('SUBMITTED', 'RESUBMITTED'))::int AS total_requests,
             count(*) FILTER (WHERE ${actedDay} BETWEEN $3::date AND $4::date AND h.action IN ('SUBMITTED', 'RESUBMITTED'))::int AS prev_requests,
             count(*) FILTER (WHERE ${actedDay} BETWEEN $1::date AND $2::date AND h.action = 'APPROVED')::int AS approved_count,
             count(*) FILTER (WHERE ${actedDay} BETWEEN $1::date AND $2::date AND h.action = 'REJECTED')::int AS rejected_count,
             coalesce(round(avg(extract(epoch FROM (h.acted_at - coalesce(sub.submitted_at, p.created_at))) / 60)
               FILTER (WHERE ${actedDay} BETWEEN $1::date AND $2::date AND h.action IN ('APPROVED', 'REJECTED'))), 0)::int AS avg_decision_min
           FROM mams.approval_history AS h
           JOIN mams.person AS p ON p.person_id = h.person_id
           LEFT JOIN mams.app_user AS u ON u.user_id = h.acted_by
           ${latestSubmission('h.person_id', 'h.acted_at')}
          WHERE ${actedDay} BETWEEN $3::date AND $2::date
            AND ${approvalScopeSql(5)}`,
          [startStr, endStr, prevStartStr, prevEndStr, ...scope],
        ),
        pool.query(
          `SELECT count(*)::int AS pending_count,
                  count(*) FILTER (WHERE coalesce(sub.submitted_at, p.created_at) < (now() - interval '1 hour'))::int AS waiting_over_1h
             FROM mams.person AS p
             JOIN mams.category AS c ON c.category_id = p.category_id
             ${latestSubmission('p.person_id')}
            WHERE p.status = 'PENDING'
              AND c.approval_required = true
              AND ${personSearchSql('p', '$1')}`,
          [search],
        ),
        pool.query(
          `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                  count(h.approval_id) FILTER (WHERE h.action = 'APPROVED')::int AS approved_count,
                  count(h.approval_id) FILTER (WHERE h.action = 'REJECTED')::int AS rejected_count,
                  count(h.approval_id) FILTER (WHERE h.action IN ('SUBMITTED', 'RESUBMITTED'))::int AS submitted_count
             FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
             LEFT JOIN (
               SELECT h.approval_id, h.action, ${actedDay} AS a_date
                 FROM mams.approval_history AS h
                 JOIN mams.person AS p ON p.person_id = h.person_id
                 LEFT JOIN mams.app_user AS u ON u.user_id = h.acted_by
                WHERE ${actedDay} BETWEEN $1::date AND $2::date
                  AND ${approvalScopeSql(3)}
             ) AS h ON h.a_date = days.day::date
            GROUP BY days.day
            ORDER BY days.day`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `SELECT h.action, count(*)::int AS count
             FROM mams.approval_history AS h
             JOIN mams.person AS p ON p.person_id = h.person_id
             LEFT JOIN mams.app_user AS u ON u.user_id = h.acted_by
            WHERE ${actedDay} BETWEEN $1::date AND $2::date
              AND ${approvalScopeSql(3)}
            GROUP BY h.action
            ORDER BY count DESC`,
          [startStr, endStr, ...scope],
        ),
      ]);
      return buildApprovalsAnalytics({
        summary: { ...summaryRes.rows[0], ...pendingRes.rows[0] },
        daily: dailyRes.rows,
        byOutcome: byOutcomeRes.rows,
        dateRange,
      });
    },

    async blacklist({ dateRange, search, name, category }) {
      const { startStr, endStr } = dateRange;
      const scope = [search, name, category];
      const activeEntry = (alias = '') => `${alias}lifted_at IS NULL AND ${alias}start_date <= ${IST_TODAY}
              AND (${alias}end_date IS NULL OR ${alias}end_date >= ${IST_TODAY})`;
      const [summaryRes, dailyRes, reasonsRes] = await Promise.all([
        pool.query(
          `WITH ${blacklistScopeCte(3)}
           SELECT
             (SELECT count(*)::int FROM scoped WHERE ${activeEntry()}) AS on_blacklist,
             (SELECT count(*)::int FROM scoped WHERE ${activeEntry()} AND end_date IS NOT NULL AND end_date <= ${IST_TODAY} + 7) AS expiring_soon,
             (SELECT count(*)::int FROM scoped WHERE ${istDate('added_at')} BETWEEN $1::date AND $2::date) AS added_this_period,
             (SELECT count(*)::int FROM scoped WHERE lifted_at IS NOT NULL AND ${istDate('lifted_at')} BETWEEN $1::date AND $2::date) AS lifted_this_period,
             (SELECT count(*)::int FROM gate_screening WHERE is_blocked AND a_date BETWEEN $1::date AND $2::date) AS blocked_attempts,
             (SELECT count(*)::int FROM gate_screening WHERE a_date BETWEEN $1::date AND $2::date) AS gate_screenings`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `WITH ${blacklistScopeCte(3)}
           SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
                  count(g.audit_id)::int AS count
             FROM generate_series($1::date, $2::date, interval '1 day') AS days(day)
             LEFT JOIN gate_screening AS g ON g.a_date = days.day::date AND g.is_blocked
            GROUP BY days.day
            ORDER BY days.day`,
          [startStr, endStr, ...scope],
        ),
        pool.query(
          `WITH ${blacklistScopeCte(1)}
           SELECT coalesce(r.name, 'Other') AS label, count(*)::int AS value
             FROM scoped AS b
             LEFT JOIN mams.lookup_value AS r ON r.lookup_id = b.reason_id
            WHERE ${activeEntry('b.')}
            GROUP BY r.name
            ORDER BY value DESC, label`,
          scope,
        ),
      ]);
      return buildBlacklistAnalytics({
        summary: summaryRes.rows[0],
        daily: dailyRes.rows,
        reasons: reasonsRes.rows,
        dateRange,
      });
    },
  };

  return {
    async visitHistory({ fromDate, toDate, categoryId, locationId, search = '', pagination }) {
      const result = await pool.query(
        `SELECT v.checkin_at, v.checkout_at, p.person_code,
                p.first_name || ' ' || p.last_name AS name, p.mobile,
                c.name AS category, gi.name AS checkin_gate, li.name AS checkin_location,
                go.name AS checkout_gate, lo.name AS checkout_location,
                v.status, v.accompanying_count${totalSql(pagination)}
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
            AND ${personSearchSql('p', '$5')}
          ORDER BY v.checkin_at DESC, v.visit_id DESC${paginationSql(pagination, 6)}`,
        withPagination([fromDate, toDate, categoryId ?? null, locationId ?? null, search], pagination),
      );
      return result.rows;
    },

    async registrations({ fromDate, toDate, categoryId, status, search = '', pagination }) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, c.approval_required, p.mobile,
                CASE WHEN c.approval_required = false AND p.status = 'PENDING' THEN 'ACTIVE' ELSE p.status END AS status,
                p.created_at${totalSql(pagination)}
           FROM mams.person AS p
           JOIN mams.category AS c ON c.category_id = p.category_id
          WHERE ${registrationScopeSql(1)}
            AND ($4::date IS NULL OR (p.created_at AT TIME ZONE 'Asia/Kolkata')::date >= $4::date)
            AND ($5::date IS NULL OR (p.created_at AT TIME ZONE 'Asia/Kolkata')::date <= $5::date)
          ORDER BY p.created_at DESC, p.person_id${paginationSql(pagination, 6)}`,
        withPagination([search, categoryId ?? null, status ?? null, fromDate, toDate], pagination),
      );
      return result.rows;
    },

    async occupancy({ fromDate, toDate, search = '', pagination }) {
      const result = await pool.query(
        `SELECT (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date AS day,
                l.name AS location, count(*) AS checkins,
                count(v.checkout_at) AS checkouts,
                count(*) FILTER (WHERE v.status = 'OPEN') AS still_inside${totalSql(pagination)}
           FROM mams.visit AS v
           JOIN mams.person AS p ON p.person_id = v.person_id
           JOIN mams.location AS l ON l.location_id = v.checkin_location_id
          WHERE ($1::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date)
            AND ($2::date IS NULL OR (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date <= $2::date)
            AND ${personSearchSql('p', '$3')}
          GROUP BY 1, 2
          ORDER BY 1 DESC, 2 ASC${paginationSql(pagination, 4)}`,
        withPagination([fromDate, toDate, search], pagination),
      );
      return result.rows;
    },

    async staff({ name = '', jobRole = '', search = '', pagination } = {}) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                d.name AS department, j.name AS job_role,
                p.category_details ->> 'joining_date' AS joining_date, p.status${totalSql(pagination)}
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
            AND ${personSearchSql('p', '$3')}
          ORDER BY p.created_at DESC, p.person_id${paginationSql(pagination, 4)}`,
        withPagination([name, jobRole, search], pagination),
      );
      return result.rows;
    },

    async approvals({ fromDate, toDate, user = '', search = '', pagination }) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                h.action, h.reason, coalesce(u.username, 'Former Approver') AS by_user, h.acted_at${totalSql(pagination)}
           FROM mams.approval_history AS h
           JOIN mams.person AS p ON p.person_id = h.person_id
           LEFT JOIN mams.app_user AS u ON u.user_id = h.acted_by
          WHERE ($1::date IS NULL OR (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date >= $1::date)
            AND ($2::date IS NULL OR (h.acted_at AT TIME ZONE 'Asia/Kolkata')::date <= $2::date)
            AND ($3 = '' OR u.username ILIKE '%' || $3 || '%')
            AND ${personSearchSql('p', '$4')}
          ORDER BY h.acted_at DESC, h.approval_id${paginationSql(pagination, 5)}`,
        withPagination([fromDate, toDate, user, search], pagination),
      );
      return result.rows;
    },

    async blacklist({ name = '', category = '', search = '', pagination } = {}) {
      const result = await pool.query(
        `SELECT p.person_code, p.first_name || ' ' || p.last_name AS name,
                c.name AS category, r.name AS reason, b.remarks, b.start_date, b.end_date,
                CASE
                  WHEN b.lifted_at IS NOT NULL THEN 'LIFTED'
                  WHEN b.end_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'EXPIRED'
                  ELSE 'ACTIVE'
                END AS state${totalSql(pagination)}
           FROM mams.blacklist AS b
           JOIN mams.person AS p ON p.person_id = b.person_id
           JOIN mams.category AS c ON c.category_id = p.category_id
           JOIN mams.lookup_value AS r ON r.lookup_id = b.reason_id
          WHERE ($1 = '' OR p.first_name || ' ' || p.last_name ILIKE '%' || $1 || '%')
            AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
            AND ${personSearchSql('p', '$3')}
          ORDER BY b.added_at DESC, b.blacklist_id${paginationSql(pagination, 4)}`,
        withPagination([name, category, search], pagination),
      );
      return result.rows;
    },

    /**
     * Lists categories and locations for report filter dropdowns, including inactive ones for history.
     * @returns {Promise<{categories: object[], locations: object[]}>} Filter options.
     */
    async options() {
      const [categories, locations] = await Promise.all([
        pool.query(
          `SELECT category_id, name, status
             FROM mams.category
            ORDER BY status = 'ACTIVE' DESC, name`,
        ),
        pool.query(
          `SELECT location_id, name, location_type, status
             FROM mams.location
            ORDER BY status = 'ACTIVE' DESC, name`,
        ),
      ]);
      return { categories: categories.rows, locations: locations.rows };
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

    /**
     * Builds KPI and chart data for a report tab, scoped by the same filters as the report table.
     * @param {object} filters Tab, IST date range, person search, and tab-specific filters.
     * @returns {Promise<object>} Subtitle, KPI cards, and left/right chart configs.
     */
    async analytics({
      tab = 'visits', fromDate, toDate, search = '', categoryId, locationId, status,
      name = '', jobRole = '', user = '', category = '',
    } = {}) {
      const build = analyticsByTab[tab];
      if (!build) throw new ApiError(400, 'VALIDATION_ERROR', `Unsupported report tab: ${tab}`);
      return build({
        dateRange: getIstDateRange({ fromDate, toDate }),
        search,
        categoryId,
        locationId,
        status,
        name,
        jobRole,
        user,
        category,
      });
    },
  };
}
