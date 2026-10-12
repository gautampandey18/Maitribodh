# MAMS — GitHub Copilot Prompt Pack

## Setup (do once)

1. Save the feature spec into the repo as **`docs/MAMS_FEATURES.md`** so Copilot can read it with `#file`.
2. Create **`.github/copilot-instructions.md`** with the content of Prompt 0. Copilot Chat applies this file to every request automatically.
3. Use **Copilot Chat in Agent mode** (VS Code). Run **one prompt per chat session**, in the order below. After each one, run Prompt 99 (gap check) before moving on.

---

## Prompt 0 — `.github/copilot-instructions.md`

```markdown
# Maitribudh-AMS — Copilot Instructions

## Project
- Monorepo `Maitribudh-AMS`:
  - `Maitribudh-API` — Node.js + Express, port 6200, PostgreSQL (AWS RDS)
  - `Maitribudh-UI` — React PWA, port 3000
- Separate config per environment (dev / qa / prod) via env files; no secrets in code.
- Full functional spec: docs/MAMS_FEATURES.md. Treat it as the source of truth. Feature IDs look like F-GATE-04.

## Coding standards
- ES6+ everywhere. ESLint must pass. Prettier formatting.
- React: small modular functional components, hooks, higher-order components for cross-cutting concerns (auth guard, permission guard, layout).
- Shared logic in `utils/`. ALL hard-coded values (labels, messages, regex, limits, status names, role names, routes) go in a constants config file — never inline.
- API layering: routes → controllers → services → repositories (SQL). Validation with a schema library (Joi or Zod) in middleware.
- Every service method that changes state must write an audit row (see spec §13).
- Every API route must check permissions server-side (spec §2). Hiding buttons in UI is not enough.
- JSDoc on every exported function. Jest tests for every business rule.

## Fixed decisions (override the mockup if it differs)
- Auth: JWT + bcrypt on the server. No SMTP, no email, no WhatsApp, no OTP anywhere.
- Super Admin is seeded by IT in the database. Super Admin creates Admins/users. New users have no password and set it on first login.
- Forgot/change password: on the login page with username + old password + new password + confirm. No reset link.
- QR is generated once when a person becomes Active (on submit if no approval, or on approval). It encodes the Person ID, never expires, and is reissued only when the mobile number changes. It is a real scannable QR (use the `qrcode` npm package).
- QR is NOT shared by email/WhatsApp. People download it from the public lookup page using their registered mobile number. No OTP on that page.
- Session timeout: role-based. Security Guard session ≥ 12 hours; other roles use the configured default.
- Do not build the "View as" role switcher from the mockup; the role comes from the logged-in user's JWT.
- Devotee category: approval rule pending; submission stays blocked until configured.

## Definition of done for any feature
- Every field, dropdown option, validation rule and error message in the spec is implemented word for word.
- Every state in the spec's tables is handled.
- API + UI + migration + tests are all delivered. Nothing is left as TODO.
```

---

## Prompt 1 — Database schema & seed

```text
#file:docs/MAMS_FEATURES.md

Design and implement the complete PostgreSQL schema for Maitribudh-AMS in Maitribudh-API as numbered SQL migrations plus a seed script.

Cover every entity needed by spec §1–§14:
- portal_users (first/last name, unique mobile, unique email, unique username, password_hash nullable until first login, role_id, status, must_set_password, timestamps)
- portal_roles (name, access_tier, is_custom, landing_screen, can_edit, can_delete, can_approve, can_manage) + role_screens + role_categories
- departments + department_roles (job roles)
- categories (name, icon, description, approval_required nullable = pending, is_active) + category_fields (data-driven form schema: section, label, type, required, options source, regex, max length, hint, sort order) + category_documents (name, required)
- parivar_subcategories (name, is_active), checkin_locations
- persons (member_id like MB-xxxx, category_id, first/last name, unique mobile, alternate mobile, gender, dob, address, email, photo path, id_proof_type, id_proof_number encrypted/masked, status Pending/Active/Rejected, access validity, allowed locations, category_data JSONB, emergency contact, created_by, timestamps)
- person_documents, registration_drafts
- approvals (person_id, status, submitted_by, submitted_at, decided_by, decided_at, rejection_reason)
- qr_codes (person_id, payload, generated_at, status Current/ReissueRequired/Invalid)
- visits (person_id, location_id, checkin_at, checkin_by, device, checkout_at, checkout_by, closed_by_reconciliation). Add a partial unique index so a person can have only ONE open visit.
- blacklist (person_id, reason ≤200, remarks, start_date, end_date nullable, created_by, removed_at, removed_by) with CHECK end_date >= start_date
- audit_logs (timestamp, user, action, module, entity_type, entity_id, entity_name, old_value JSONB, new_value JSONB, result, location, device). Append-only: no UPDATE/DELETE grants.
- notifications (title, message, created_at) + notification_reads (per user)

Seed exactly the master data listed in spec §12 (departments and roles, 7 categories with every field/document from spec §5 F-REG-04, Parivar subcategories, locations, the 5 portal roles with the screen/permission matrices from spec §2.2–§2.4) and one Super Admin placeholder whose mobile, email and username come from env variables.

Add indexes for mobile, member_id, status and visit lookups. Output: migrations, seed script, an ER diagram in Mermaid inside docs/DB.md, and npm scripts to migrate and seed.
```

---

## Prompt 2 — Authentication

```text
#file:docs/MAMS_FEATURES.md #file:.github/copilot-instructions.md

Implement Authentication end to end (spec §1, using the fixed decisions in the instructions file, NOT the mockup's email reset).

API (Maitribudh-API):
- POST /auth/login → bcrypt verify, return JWT (claims: userId, username, role, permissions, sessionTimeout). If must_set_password = true, return a "SET_PASSWORD_REQUIRED" response instead of a token.
- POST /auth/first-login/set-password → username + new + confirm (min 8, must match). Only allowed when must_set_password = true.
- POST /auth/change-password → username + old password + new + confirm (min 8, match, old must be correct, new ≠ old).
- POST /auth/logout.
- Role-based session timeout from config (Security Guard ≥ 12h). Reject requests with expired tokens.
- Generic error on bad credentials (never reveal which field is wrong). Rate-limit login.
- Audit "User Login" (Signed out → Session active) and login failures.

UI (Maitribudh-UI):
- Split-screen login page exactly as spec §1: brand panel on the left (orange gradient #F47C20 → #D95712, arch SVG motif, "MAITRIBODH ASHRAM · AMS", heading "One record per person. Every gate, every time.", sub-text listing the 6 categories), form on the right.
- Panels (only one visible at a time, each with "Back to sign in"): Sign in (Username, Password, Remember me, "Forgot password?"), Change password (username, old, new, confirm), Set password on first login, plus a link to "Retrieve your QR code" (built in Prompt 7).
- Strip username/password/remember from the URL query on load.
- AuthContext + ProtectedRoute HOC + an axios interceptor that attaches the JWT and logs out on 401.
- Jest tests for every validation and error message.
```

---

## Prompt 3 — App shell & RBAC

```text
#file:docs/MAMS_FEATURES.md

Implement the app shell and role-based access control (spec §2).

API: a `requirePermission(screen | flag)` middleware that reads the role from the JWT and the role tables (screens, can_edit, can_delete, can_approve, can_manage, allowed categories). Return 403 with a standard error body. Apply it to every route that exists now, and export it for later modules.

UI:
- Layout: collapsible sidebar (header "MAITRIBODH AMS" + ⟨⟩ toggle; collapsed shows icons only) with groups and items exactly as spec F-SHELL-01 (Font Awesome 6 icons). Hide items the role can't access, and hide a group header when none of its items are visible. Highlight the active item; person detail/edit keep "Person Management" active.
- Top bar: global search "Search by name, mobile, or ID…", notification bell with unread badge (placeholder until Prompt 10), avatar menu (initials + full name, Logout, Change password).
- Breadcrumb "Home › <screen title>".
- Reusable right-side Drawer component with overlay (closes on overlay click or ✕).
- A `withPermission` HOC and a `<Can permission="canDelete">` component for hiding actions.
- Route guard: if the role can't access a route, redirect to its landing screen (Security Guard → /gate, others → /dashboard).
- Design tokens from spec §0.1 as CSS variables; responsive breakpoint at 1100px.
- Reusable components: Badge (category/success/warning/danger/critical/info/neutral), Avatar (initials), DataTable with ⋮ row menu that closes on outside click, FilterToolbar, ConfirmDialog, Notice (info/success/warning, aria-live).
- Tests: the permission matrix in spec §2.2–§2.3 as table-driven tests (API + UI).
```

---

## Prompt 4 — Master Data

```text
#file:docs/MAMS_FEATURES.md

Implement the Master Data module (spec §12, F-MD-01 to F-MD-05). Sys Admin only (canManage).

Left sub-nav: Departments & Roles · Categories · Check-in Locations · Portal Roles.
Use proper modal/drawer forms (NOT window.prompt as in the mockup).

- Departments & Roles: table (Department, Roles as tags, Edit/Delete). Add/Edit = name + roles as a tag input (trim, remove duplicates case-insensitively). Unique name → "That department already exists." Delete confirm "Delete X and its roles from master data?"
- Categories: table (Category, Definition, Approval badge Required/Not required/Decision pending, Status Active/Inactive, Edit / Activate-Deactivate / Delete). Add: unique name, description, approval yes/no; new categories get the default schema (section "Category details" → field "Purpose / Details"; document "ID Proof" required). Rules: at least one category must remain active; at least one must remain. Also a field-schema editor so admins can add, edit and reorder category fields and documents.
- Parivar Subcategories (inside the Categories tab): tags with Edit / Delete / Activate-Deactivate + Add. Unique names; at least one must remain active; inactive ones are dimmed.
- Check-in Locations: table with Add/Edit/Delete, unique names.
- Portal Roles: table (Role, Access Tier, Allowed Screens, Edit Access, Delete only for custom roles). Add role = unique name + "copy access from" an existing role. Edit Access = a checkbox matrix of screens (min 1) + canEdit/canDelete/canApprove/canManage + allowed registration categories. System Administrator always keeps canManage. Landing = dashboard if allowed, else the first allowed screen.

Every change writes an audit row (old/new values) and is reflected immediately in registration forms, filters and the gate (invalidate React Query caches). Give every validation message the exact text from the spec. Include tests.
```

---

## Prompt 5 — Register Person

```text
#file:docs/MAMS_FEATURES.md

Implement Register Person (spec §5, F-REG-01 to F-REG-12). The forms MUST be data-driven from the categories / category_fields / category_documents tables. No hard-coded per-category JSX.

- Wizard header: Category → Profile → Access → Documents → Review. Footer: Back, Save Draft, Review & Submit.
- Step 1: category cards (icon, name, description) for active categories. Disable the cards the role can't register, with the tooltip "Not permitted for your role". Show the role notices for Security Guard (Visitor only) and Viewer exactly as worded in the spec.
- Step 2: the common fields table in F-REG-03 (exact regex, max lengths, hints, photo JPG/PNG ≤ 5 MB with message "Choose a JPG or PNG image no larger than 5 MB."), the Identity verification block (ID Proof Type list; ID Proof Number masked after save), then the category sections from F-REG-04 for Staff, Visitor, Vendor, Contractor, Participant, Parivar Member and Devotee. Include:
  - Staff Department → Job Role cascade
  - option sources: departments, departments + Kitchen + Stores, active Parivar subcategories, departments + Kitchen + General Seva, locations
  - the Contractor laborer info notice
  - the hints on contract/program end dates
- Step 3 Access: Allowed Check-in Locations ("All locations" + master); Access Validity options depend on the approval flag, as in F-REG-05.
- Step 4 Documents: one upload row per category document; required ones marked * and blocking submit. Store files in S3 (local disk in dev).
- Approval notice text per F-REG-07; Devotee warning + submit blocked per spec.
- Submit (F-REG-08), in a single DB transaction: validate on the server too, enforce a unique mobile, generate Member ID MB-xxxx, status Active or Pending, create the QR if Active, create the approval row if Pending, audit "Create", notification "Registration Submitted", and show the result line in the spec's exact format.
- Save Draft (F-REG-09), with drafts resumable.
- Back behaviour (F-REG-10).
- Gate fast-path (F-REG-11): route param ?from=gate&location=X forces Visitor; after an Active submit, navigate back to the gate and auto check-in at that location.
- Resubmission prefill (F-REG-12): same Member ID, banner with Cancel, approval goes back to Pending, rejection reason cleared, audit "Resubmit Registration".

API: GET /categories/:id/schema, POST /persons, POST /persons/drafts, PUT /persons/:id/resubmit, POST /persons/:id/documents. Enforce role → category permission on the server. Tests for every category's required fields.
```

---

## Prompt 6 — Person Management

```text
#file:docs/MAMS_FEATURES.md

Implement Person Management (spec §4, F-PER-01 to F-PER-03).

List: "+ Register Person" button; filters Search (ID/name/mobile), Category (from master), Status (Active/Pending/Blacklisted), Last visit (Today / Last 7 days / Older visits), Mobile contains. All are AND-combined, server-side, and paginated ("Showing a–b of N"). Export CSV of the filtered result. Columns exactly as in the spec, mobile masked "98200 XXXXX". Row click opens the detail page; ⋮ menu has Update (canEdit) and Delete (canDelete, confirm "Delete X from Person Management?", soft delete + audit).

Detail: header (avatar, name, category badge, Member ID, department/role, status badge colours), Edit (canEdit), View QR, ⋮. Tabs: Overview (Personal Information + Access & Identity, read-only), Documents, Access Details, Activity (visit history), Audit (audit rows for this person).

Edit: fields per F-PER-03; dynamic Category Details (Staff = Department → Job Role cascade keeping the previous valid value; Parivar = Subcategory; others = free text); Emergency Contact; Cancel / Save Changes. On save: write audit "Update" with the full old and new JSON. If the mobile number changed, set the QR status to "Reissue required" and invalidate the old QR in the same transaction. Mobile must remain unique.

Tests for filters, permissions and the mobile-change → QR-reissue rule.
```

---

## Prompt 7 — QR / Identity + Public QR lookup

```text
#file:docs/MAMS_FEATURES.md

Implement QR / Identity Management (spec §7) and the public QR lookup (F-AUTH-04).

QR rules: a real scannable QR (`qrcode` package) encoding the Person ID; generated once when a person becomes Active; never expires; invalidated on reissue (mobile change) or rejection.

Admin screen:
- KPI cards: Total Registered, Current QR, Reissue Pending.
- List with search (ID/name/mobile) + category filter; columns Name, Category, Mobile, QR Status (Current / Reissue required); clicking a row selects it.
- Preview panel: QR image, name, Person ID, Generated date, Encodes = Person ID, Expiry = Never, Status badge; Download (PNG), Print. NO Share button (decision: no email/WhatsApp).
- "Reissue on profile change" enabled only when Reissue required; confirm "Generate a replacement QR for X? The previous QR will become invalid immediately."; new QR + date; audit "QR Reissue"; notification "QR Reissued".

Public lookup (no login): page reached from the login page "Retrieve your QR code". Field "Registered mobile number" (accept [0-9+\- ]{10,14}, normalise to the last 10 digits) → "Find my QR". Return the QR only for Active persons with a Current QR; otherwise show "No person found for this mobile number. Check the number or contact the Registration Team." No OTP. Rate-limit this endpoint and do not reveal whether Pending/Rejected records exist. Download file name: Maitribodh-QR-<PersonID>.png.

Tests included.
```

---

## Prompt 8 — Security Gate

```text
#file:docs/MAMS_FEATURES.md

Implement the Security Gate (spec §8, F-GATE-01 to F-GATE-06). Mobile-first layout, because guards use tablets/phones.

- Header with a shift badge "Shift: <guard name> · <shift>".
- Camera QR scanner (html5-qrcode) + manual input "Mobile number, name or Person ID" + Find Person. Lookup is an exact case-insensitive match on member_id, mobile or full name.
- Result panel: implement EVERY row of the state table in F-GATE-02 with the exact titles, sub-texts, colours, and Check-In/Check-Out enabled states.
- Person card: avatar, name, category, Person ID, mobile, status badge, blacklist badge (Clear/Blacklisted).
- Location select from master locations (required).
- POST /gate/checkin and /gate/checkout. Enforce on the SERVER inside a transaction:
  - actively blacklisted → block (active = start ≤ today and (end is null or end ≥ today))
  - not Active → "APPROVAL REQUIRED — Pending profiles cannot be checked in."
  - already inside → "Person Already Inside · Complete the active check-out first."
  - checkout with no open visit → "No Active Check-In Found · The person is not currently inside."
  - Store location, time, guard and device id (from a configured terminal name).
- Blacklist lookup → notification "Blacklist Alert — X blocked at <location>" + audit "Blacklist Attempt" (Eligible → Blocked).
- Not found → "Register Visitor" button → /register?from=gate&location=<loc> (auto check-in after registration, F-REG-11).
- Audit Check-In (Outside → Inside · location) and Check-Out (Inside · location → Outside).
- Security Guard session ≥ 12h.
- Large touch targets. Make it work on flaky Wi-Fi with a retry, and show a clear offline message.

Tests for every state in the table.
```

---

## Prompt 9 — Blacklist

```text
#file:docs/MAMS_FEATURES.md

Implement Blacklist Management (spec §9). Sys Admin only, enforced in the API.

- Warning banner text exactly as in the spec. "Add to Blacklist" button (danger).
- Table columns: Person (avatar), Category, Reason, Start Date, End Date (— if empty), Remarks, Created By, Status, Remove.
- Add drawer: Person* (searchable select excluding actively blacklisted people, "Name · Category · ID"), Reason* (≤200), Remarks*, Start Date* (default today), End Date (≥ start → "End Date cannot be before Start Date."). Duplicate → "This person is already blacklisted." Success notice "X is now blocked from check-in." Audit "Blacklist" with reason/remarks/dates; notification "Blacklist Alert".
- Remove: confirm "Remove X from the blacklist? This lifts the blacklist restriction."; soft-remove (removed_at/by) to keep history; audit "Remove Blacklist"; success notice.
- Export a shared util `isActiveBlacklist(person, date)` used by the gate and reports.

Tests for date-range activity and permissions.
```

---

## Prompt 10 — Approval Center

```text
#file:docs/MAMS_FEATURES.md

Implement the Approval Center (spec §6, F-APR-01 to F-APR-09). Requires canApprove (Edit & Resubmit requires canEdit).

- Tabs Pending (live count) / Approved / Rejected. Bulk Approve is visible only on Pending.
- Toolbar: Export CSV; "Select all pending" with an indeterminate state + "N selected"; filters Category, Date (Today / Last 7 days / Older requests), Mobile contains. Rows hidden by a filter get unchecked.
- Table columns as in the spec; checkbox disabled when the row is not Pending.
- Row actions by status per the F-APR-04 table.
- Approve, in one transaction: approval → Approved, person → Active, generate QR, record decided_by/at, audit "Approve", notification "Registration Approved — X · approved by <user>".
- Reject: inline editor "Rejection reason (minimum 10 characters) *", Confirm Rejection / Cancel; < 10 chars → "Rejection reason must be at least 10 characters."; person → Rejected, QR invalidated, reason stored, audit "Reject", notification "Registration Rejected — X · reason: …".
- Approved rows can still be rejected (revocation).
- Bulk approve only the selected Pending rows; none selected → "Select at least one pending registration."
- Edit & Resubmit → /register?resubmit=<memberId> (F-REG-12).
- Export CSV with the columns listed in F-APR-09, file maitribodh-approval-center.csv.

Tests included.
```

---

## Prompt 11 — Audit & Notifications

```text
#file:docs/MAMS_FEATURES.md

Implement Audit & Compliance (spec §13) and In-app Notifications (spec §14).

Audit:
- A central `auditService.log({...})` used by all modules. Go through the existing code and make sure EVERY event in the §13 table is logged with the correct module and old/new values, including master data changes and person deletes.
- Screen (Sys Admin only): filters User, Action (distinct values from the DB), Search (entity or module); server-side pagination; columns Timestamp, User, Action, Module, Entity, Old Value, New Value, Result badge (Success green, Blocked/Rejected red, others neutral). Row click → drawer "Audit Detail" with a Before / After / Actor / Result timeline (pretty-print JSON diffs). Export CSV of the filtered rows (maitribodh-audit-log.csv) and Print/PDF.
- Append-only: no update/delete endpoints.

Notifications:
- `notificationService.create()` for: Registration Submitted, Registration Approved, Registration Rejected (with reason), Blacklist Alert (added / blocked at gate), QR Reissued.
- Bell badge with the per-user unread count (hidden at 0); poll every 30s or use SSE.
- Drawer titled "Notifications" with the sub-text "In-app updates for registrations and security events", "Mark all as read", and a list (title, time, message, "New" badge).
- In-app only.
```

---

## Prompt 12 — Dashboard

```text
#file:docs/MAMS_FEATURES.md

Implement the Dashboard (spec §3, F-DASH-01 to F-DASH-06) with real API data.

- Header "Dashboard" + "Last sync: Xs ago · Live monitoring" (auto-refresh every 30s).
- Six KPI cards with deltas: Active Members (% vs last month), Registrations Today (vs yesterday), Check-Ins Today, Check-Outs Today, Pending Approvals ("Needs review"), Blacklist Alerts (blocked attempts today, "Action required").
- Current Occupancy table (open visits): Person, Category, Location, Checked In, Checked By, Device, Action. Sys Admin sees "Review / Close", which shows the confirm "Manually close the open visit for X? Confirm only after checking the person is no longer on site." and then closes the visit with closed_by_reconciliation + audit "Manual Visit Reconciliation". Other roles see the text "Admin review". Empty state: "No open check-ins."
- Daily Check-In Trend (last 7 days, line/area) and Category Mix (this week, donut) using Recharts with the brand palette.
- Recent Activity table, Pending Approval Queue (top 5), Security Alerts (recent blacklist attempts).
- One aggregated endpoint GET /dashboard/summary.
```

---

## Prompt 13 — Reports & Analytics

```text
#file:docs/MAMS_FEATURES.md

Implement Reports & Analytics (spec §10). Six reports via a left sub-nav: Visit History, Person Registrations, Occupancy, Approvals, Blacklist, Staff.

Implement exactly the filters and columns in the §10 table for each report. Dropdown options come from master data, with "All …" first. Date ranges are inclusive. Filtering and pagination are server-side.

Toolbar: Export CSV, Export Excel (real .xlsx via exceljs), Print/PDF. Exports include only the filtered rows; file names follow maitribodh-<report>-report.<ext>.

Build it as a generic, config-driven ReportView component + report definitions in constants, so a new report needs only a definition and a SQL query. Tests for filters and exports.
```

---

## Prompt 14 — User Management

```text
#file:docs/MAMS_FEATURES.md

Implement User Management (spec §11). Sys Admin only.

- Table: Username (mono), Full Name (avatar), Access Tier badge (Full / Moderate / Limited / View-Only), Role, Permissions summary, Status, ⋮ (Update, Delete).
- Create/Update drawer: First Name* (≤100), Last Name* (≤100), Mobile* (10 digits), Email*, Username*, Portal Role* (incl. custom roles), Status (Active/Inactive). Username, email and mobile must each be unique → "Username, email, and mobile number must be unique." Check this in the DB too, with unique constraints.
- New users are created with must_set_password = true and no password; the success drawer says the user must set their password on first login.
- Delete: confirm "Delete portal user <username>?" (soft delete); a user can't delete themselves; the last active Sys Admin can't be deleted or deactivated.
- Inactive users cannot log in.
- Audit Create User / Update User / Delete User.
```

---

## Prompt 99 — Gap check (run after every module)

```text
#file:docs/MAMS_FEATURES.md

Act as a strict QA reviewer. Compare the current code against section <§N> of the spec.
Produce a table: Feature ID | Requirement (field / rule / message / state) | Implemented? (Yes/Partial/No) | File & line | What is missing.
List every field, dropdown option, validation message, permission check, audit event and UI state separately. Do not summarise.
Then implement all the Partial/No items and re-run the check.
```
