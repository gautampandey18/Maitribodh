-- =============================================================================
-- MAMS - Queries used by the Node.js API (node-postgres $1, $2 parameters)
-- "Today" is India time: (now() AT TIME ZONE 'Asia/Kolkata')::date
-- =============================================================================
SET search_path = mams;

-- ============================ LOGIN ==========================================
-- [LOGIN-01] Find user by username (API checks status, lock, password with bcrypt)
SELECT user_id, role, status, password_hash, locked_until, failed_login_count, token_version
  FROM app_user WHERE lower(username) = lower($1);
-- [LOGIN-02] Wrong password: count it, lock for 15 minutes on the 5th failure
UPDATE app_user
   SET failed_login_count = failed_login_count + 1,
       locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN now() + interval '15 minutes' END
 WHERE user_id = $1
RETURNING failed_login_count, locked_until;
-- [LOGIN-03] Correct password: reset the counter
UPDATE app_user SET failed_login_count = 0, locked_until = NULL, last_login_at = now() WHERE user_id = $1;
-- [LOGIN-04] Create password (first login) or change password; Admin reset sets it to NULL
UPDATE app_user SET password_hash = $2, token_version = token_version + 1, updated_at = now() WHERE user_id = $1;

-- ============================ USERS ==========================================
-- [USER-01] Create user (no password). Only SUPER_ADMIN may create role ADMIN (checked in API)
INSERT INTO app_user (first_name, last_name, mobile, email, username, role, is_security_head, can_bulk_upload, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING user_id;
-- [USER-02] Deactivate user / grant bulk upload
UPDATE app_user SET status = 'INACTIVE', token_version = token_version + 1, updated_at = now() WHERE user_id = $1;
UPDATE app_user SET can_bulk_upload = $2, updated_at = now() WHERE user_id = $1;

-- ============================ MASTER DATA ====================================
-- [MST-01] Category list and create (no approval; applies immediately)
SELECT c.*, p.name AS permission_level FROM category c LEFT JOIN lookup_value p ON p.lookup_id = c.permission_level_id ORDER BY c.name;
INSERT INTO category (name, form_type, approval_required, overstay_cutoff, permission_level_id, is_broad, broad_category_id)
VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING category_id;
-- [MST-02] Dropdown values of one lookup type (e.g. JOB_ROLE of a department)
SELECT lookup_id, name, extra FROM lookup_value
 WHERE lookup_type = $1 AND status = 'ACTIVE' AND ($2::int IS NULL OR parent_id = $2) ORDER BY name;
-- [MST-03] Gates and areas
SELECT location_id, name, location_type, is_restricted FROM location WHERE status = 'ACTIVE' ORDER BY location_type, name;

-- ============================ REGISTRATION ===================================
-- [REG-01] Existing registrations on a mobile (information only; save is allowed)
SELECT p.person_code, p.first_name || ' ' || p.last_name AS name, c.name AS category, p.status
  FROM person p JOIN category c ON c.category_id = p.category_id
 WHERE p.mobile = $1 AND p.status <> 'DRAFT';
-- [REG-02] Register. API sets status PENDING (approval category), ACTIVE (others, qr_version = 1) or DRAFT
INSERT INTO person (category_id, subcategory_id, first_name, last_name, mobile, alternate_mobile, gender, date_of_birth,
                    resident_status, passport_number, address, email, photo_key, id_proof_type_id, id_proof_number_enc,
                    id_proof_last4, emergency_contact_name, emergency_contact_mobile, permission_level_id,
                    category_details, accompanying, accompanying_count, documents, remarks, status, source, qr_version, registered_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20::jsonb, $21::jsonb, $22, $23::jsonb, $24, $25, $26, $27, $28)
RETURNING person_id, person_code;
-- [REG-03] Assign locations (staff: also the areas linked to their department)
INSERT INTO person_location (person_id, location_id, assigned_by)
SELECT $1, unnest($2::smallint[]), $3 ON CONFLICT DO NOTHING;
INSERT INTO person_location (person_id, location_id, assigned_by)
SELECT $1, location_id, $3 FROM location WHERE department_id = $2 AND status = 'ACTIVE' ON CONFLICT DO NOTHING;
-- [REG-04] Edit; when the mobile changes on an Active record the API also sets qr_version = qr_version + 1
UPDATE person SET first_name = $2, last_name = $3, mobile = $4, email = $5, address = $6,
                  category_details = $7::jsonb, updated_by = $8, updated_at = now()
 WHERE person_id = $1 RETURNING qr_version;
-- [REG-05] Search by Person ID, mobile or name (25 per page)
SELECT p.person_id, p.person_code, p.photo_key, p.first_name || ' ' || p.last_name AS name, c.name AS category,
       p.mobile, p.status, p.created_at, count(*) OVER () AS total
  FROM person p JOIN category c ON c.category_id = p.category_id
 WHERE p.status <> 'DRAFT'
   AND (p.person_code = upper($1) OR p.mobile = $1 OR lower(p.first_name || ' ' || p.last_name) LIKE '%' || lower($1) || '%')
   AND ($2::smallint IS NULL OR p.category_id = $2)
   AND ($3::varchar IS NULL OR p.status = $3)
 ORDER BY p.created_at DESC LIMIT 25 OFFSET $4;

-- ============================ APPROVAL =======================================
-- [APR-01] Pending queue (oldest first)
SELECT p.person_id, p.person_code, p.photo_key, p.first_name || ' ' || p.last_name AS name, c.name AS category,
       h.acted_by AS submitted_by, h.acted_at AS submitted_at
  FROM person p
  JOIN category c ON c.category_id = p.category_id
  JOIN LATERAL (SELECT acted_by, acted_at FROM approval_history
                 WHERE person_id = p.person_id AND action IN ('SUBMITTED','RESUBMITTED')
                 ORDER BY acted_at DESC LIMIT 1) h ON true
 WHERE p.status = 'PENDING'
 ORDER BY h.acted_at;
-- [APR-02] Approve (one transaction). API first checks the approver is not the submitter
UPDATE person SET status = 'ACTIVE', qr_version = 1, approved_by = $2, approved_at = now(), updated_at = now()
 WHERE person_id = $1 AND status = 'PENDING';
INSERT INTO approval_history (person_id, action, acted_by) VALUES ($1, 'APPROVED', $2);
-- [APR-03] Reject (reason at least 10 characters) and resubmit
UPDATE person SET status = 'REJECTED', updated_at = now() WHERE person_id = $1 AND status = 'PENDING';
INSERT INTO approval_history (person_id, action, reason, acted_by) VALUES ($1, 'REJECTED', $2, $3);
UPDATE person SET status = 'PENDING', updated_at = now() WHERE person_id = $1 AND status = 'REJECTED';
INSERT INTO approval_history (person_id, action, acted_by) VALUES ($1, 'RESUBMITTED', $2);

-- ============================ QR =============================================
-- [QR-01] Public lookup page: Active, not blacklisted registrations on a mobile
SELECT p.person_code, p.first_name || ' ' || p.last_name AS name, c.name AS category, p.qr_version
  FROM person p JOIN category c ON c.category_id = p.category_id
 WHERE p.mobile = $1 AND p.status = 'ACTIVE'
   AND NOT EXISTS (SELECT 1 FROM blacklist b WHERE b.person_id = p.person_id AND b.lifted_at IS NULL
                     AND b.start_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
                     AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date));
-- The API builds the QR as AMS1.<person_code>.<qr_version>.<HMAC signature>

-- ============================ GATE ===========================================
-- [GATE-01] After scan or search: everything the gate check needs, in one query.
--           API order: not found -> blacklisted -> not Active -> already inside -> location warning
SELECT p.person_id, p.person_code, p.first_name || ' ' || p.last_name AS name, p.photo_key, c.name AS category,
       p.status, p.qr_version, p.accompanying_count, p.accompanying,
       EXISTS (SELECT 1 FROM blacklist b WHERE b.person_id = p.person_id AND b.lifted_at IS NULL
                 AND b.start_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date
                 AND (b.end_date IS NULL OR b.end_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)) AS is_blacklisted,
       v.visit_id AS open_visit_id, v.checkin_at AS inside_since,
       (l.is_restricted AND NOT EXISTS (SELECT 1 FROM person_location pl
                                         WHERE pl.person_id = p.person_id AND pl.location_id = l.location_id)) AS location_warning
  FROM person p
  JOIN category c ON c.category_id = p.category_id
  LEFT JOIN visit v ON v.person_id = p.person_id AND v.status = 'OPEN'
  JOIN location l ON l.location_id = $2
 WHERE p.person_id = $1 AND p.status <> 'DRAFT';
-- [GATE-02] Check in (the unique index rejects a second open visit -> "Person already inside")
INSERT INTO visit (person_id, checkin_gate_id, checkin_location_id, checkin_by, checkin_device,
                   accompanying_count, accompanying_names, location_override)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8) RETURNING visit_id;
-- [GATE-03] Check out at any gate (0 rows -> "No active check-in found")
UPDATE visit SET status = 'CLOSED', checkout_at = now(), checkout_gate_id = $2, checkout_location_id = $3,
                 checkout_by = $4, checkout_device = $5
 WHERE person_id = $1 AND status = 'OPEN' RETURNING visit_id;
-- [GATE-04] Admin closes a forgotten check-out (note required)
UPDATE visit SET status = 'CLOSED_BY_ADMIN', checkout_at = now(), checkout_by = $2, admin_note = $3
 WHERE visit_id = $1 AND status = 'OPEN';

-- ============================ DASHBOARD ======================================
-- [DSH-01] All widgets in one query
SELECT (SELECT count(*) FROM visit WHERE status = 'OPEN') AS current_occupancy,
       (SELECT COALESCE(sum(accompanying_count), 0) FROM visit WHERE status = 'OPEN') AS accompanying_inside,
       (SELECT count(*) FROM visit WHERE (checkin_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date) AS todays_checkins,
       (SELECT count(*) FROM visit WHERE (checkout_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date) AS todays_checkouts,
       (SELECT count(*) FROM person WHERE status = 'PENDING') AS pending_approvals,
       (SELECT count(*) FROM audit_log WHERE activity = 'GATE_BLOCKED_BLACKLIST'
           AND (occurred_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date) AS blacklisted_attempts_today;
-- [DSH-02] Inside list with overstay flag
SELECT v.visit_id, p.person_code, p.first_name || ' ' || p.last_name AS name, c.name AS category,
       v.checkin_at, g.name AS gate, l.name AS location,
       (c.overstay_cutoff IS NOT NULL AND (now() AT TIME ZONE 'Asia/Kolkata') >
            ((v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date + c.overstay_cutoff)) AS is_overstay
  FROM visit v
  JOIN person p   ON p.person_id = v.person_id
  JOIN category c ON c.category_id = p.category_id
  JOIN location g ON g.location_id = v.checkin_gate_id
  JOIN location l ON l.location_id = v.checkin_location_id
 WHERE v.status = 'OPEN'
 ORDER BY is_overstay DESC, v.checkin_at;

-- ============================ BACKGROUND TASKS (Node.js timer) ===============
-- [JOB-01] Every 5 minutes: overstays not yet alerted; API notifies Admins + Security Head, then marks them
SELECT v.visit_id, p.person_code, p.first_name || ' ' || p.last_name AS name, c.name AS category
  FROM visit v JOIN person p ON p.person_id = v.person_id JOIN category c ON c.category_id = p.category_id
 WHERE v.status = 'OPEN' AND v.overstay_alerted_at IS NULL AND c.overstay_cutoff IS NOT NULL
   AND (now() AT TIME ZONE 'Asia/Kolkata') > ((v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date + c.overstay_cutoff);
UPDATE visit SET overstay_alerted_at = now() WHERE visit_id = ANY($1::bigint[]);
-- [JOB-02] Daily: drafts older than 7 days, notifications older than 30 days
DELETE FROM person WHERE status = 'DRAFT' AND created_at < now() - interval '7 days';
DELETE FROM notification WHERE created_at < now() - interval '30 days';

-- ============================ BLACKLIST ======================================
-- [BL-01] Add (unique index blocks a second open entry) and lift
INSERT INTO blacklist (person_id, reason_id, remarks, start_date, end_date, added_by)
VALUES ($1, $2, $3, COALESCE($4::date, (now() AT TIME ZONE 'Asia/Kolkata')::date), $5, $6) RETURNING blacklist_id;
UPDATE blacklist SET lifted_by = $2, lifted_at = now(), lift_note = $3 WHERE blacklist_id = $1 AND lifted_at IS NULL;

-- ============================ BULK UPLOAD ====================================
-- [BLK-01] Start, then finish with totals and row errors
INSERT INTO bulk_upload (file_name, file_key, uploaded_by) VALUES ($1, $2, $3) RETURNING bulk_upload_id;
UPDATE bulk_upload SET status = 'COMPLETED', total_rows = $2, success_rows = $3, error_rows = $4,
                       errors = $5::jsonb, completed_at = now()
 WHERE bulk_upload_id = $1;

-- ============================ NOTIFICATIONS ==================================
-- [NTF-01] Bell icon
SELECT * FROM notification WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30;
UPDATE notification SET is_read = true WHERE user_id = $1 AND notification_id = ANY($2::bigint[]);

-- ============================ REPORTS ========================================
-- [RPT-01] Visit History (export to Excel / CSV)
SELECT v.checkin_at, v.checkout_at, p.person_code, p.first_name || ' ' || p.last_name AS name, p.mobile,
       c.name AS category, gi.name AS checkin_gate, li.name AS checkin_location,
       go.name AS checkout_gate, lo.name AS checkout_location, v.status, v.accompanying_count
  FROM visit v
  JOIN person p   ON p.person_id = v.person_id
  JOIN category c ON c.category_id = p.category_id
  JOIN location gi ON gi.location_id = v.checkin_gate_id
  JOIN location li ON li.location_id = v.checkin_location_id
  LEFT JOIN location go ON go.location_id = v.checkout_gate_id
  LEFT JOIN location lo ON lo.location_id = v.checkout_location_id
 WHERE (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1 AND $2
   AND ($3::smallint IS NULL OR p.category_id = $3)
   AND ($4::smallint IS NULL OR v.checkin_location_id = $4)
 ORDER BY v.checkin_at;
-- [RPT-02] Registration report
SELECT p.person_code, p.first_name || ' ' || p.last_name AS name, c.name AS category, p.mobile, p.status, p.created_at
  FROM person p JOIN category c ON c.category_id = p.category_id
 WHERE p.status <> 'DRAFT' AND ($1::smallint IS NULL OR p.category_id = $1) AND ($2::varchar IS NULL OR p.status = $2)
 ORDER BY p.created_at DESC;
-- [RPT-03] Occupancy per day and location
SELECT (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date AS day, l.name AS location,
       count(*) AS checkins, count(v.checkout_at) AS checkouts, count(*) FILTER (WHERE v.status = 'OPEN') AS still_inside
  FROM visit v JOIN location l ON l.location_id = v.checkin_location_id
 WHERE (v.checkin_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1 AND $2
 GROUP BY 1, 2 ORDER BY 1, 2;
-- [RPT-04] Staff report (department and job role from category_details)
SELECT p.person_code, p.first_name || ' ' || p.last_name AS name, d.name AS department, j.name AS job_role,
       p.category_details ->> 'joining_date' AS joining_date, p.status
  FROM person p
  JOIN category c ON c.category_id = p.category_id AND c.form_type = 'STAFF'
  LEFT JOIN lookup_value d ON d.lookup_id = (p.category_details ->> 'department_id')::int
  LEFT JOIN lookup_value j ON j.lookup_id = (p.category_details ->> 'job_role_id')::int
 WHERE p.status <> 'DRAFT';
-- [RPT-05] Approval report
SELECT p.person_code, p.first_name || ' ' || p.last_name AS name, h.action, h.reason, u.username AS by_user, h.acted_at
  FROM approval_history h JOIN person p ON p.person_id = h.person_id JOIN app_user u ON u.user_id = h.acted_by
 WHERE h.acted_at::date BETWEEN $1 AND $2 ORDER BY h.acted_at DESC;
-- [RPT-06] Blacklist report
SELECT p.person_code, p.first_name || ' ' || p.last_name AS name, r.name AS reason, b.remarks, b.start_date, b.end_date,
       CASE WHEN b.lifted_at IS NOT NULL THEN 'LIFTED'
            WHEN b.end_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'EXPIRED' ELSE 'ACTIVE' END AS state
  FROM blacklist b JOIN person p ON p.person_id = b.person_id JOIN lookup_value r ON r.lookup_id = b.reason_id
 ORDER BY b.added_at DESC;

-- ============================ AUDIT ==========================================
-- [AUD-01] Write one entry (called by the API after every change, login and gate event)
INSERT INTO audit_log (user_id, user_role, module, activity, entity_type, entity_id, old_value, new_value, ip_address, device)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10);
-- [AUD-02] Audit screen (Admin only)
SELECT a.*, u.username FROM audit_log a LEFT JOIN app_user u ON u.user_id = a.user_id
 WHERE a.occurred_at >= $1 AND a.occurred_at < $2
   AND ($3::varchar IS NULL OR a.module = $3) AND ($4::bigint IS NULL OR a.entity_id = $4)
 ORDER BY a.occurred_at DESC LIMIT 50 OFFSET $5;
