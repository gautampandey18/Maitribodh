# Maitribodh Access Management System (MAMS)
# Implementation, Checks, and Application Flow

**Purpose:** Explain the implementation currently present in this repository, how its major parts work together, how to verify it, and which requirements remain incomplete.

**Scope note:** This guide describes the code and documented runtime behavior currently in the repository. It is not a claim that every supplied requirement, production operation, or live-device scenario has been delivered. For the concise requirement-by-requirement status, see [MAMS_IMPLEMENTATION_STATUS.md](./MAMS_IMPLEMENTATION_STATUS.md).

## 1. Product and implementation overview

MAMS is a web application for managing people registered with Maitribodh, their approval/access status, entry and exit visits, operational reporting, and the administrators and security staff who use the system.

The implementation is split into:

- **Web client:** React 19, Vite, Material UI, React Router, Redux Toolkit, and Axios in [Maitribodh-UI](../Maitribodh-UI/README.md).
- **HTTP API:** Node.js 22+, Express 5, PostgreSQL, and feature-oriented modules in [Maitribodh-API](../Maitribodh-API/README.md).
- **Database:** PostgreSQL schema `mams`, created and evolved by ordered SQL migrations under `Maitribodh-API/db/migrations`.
- **Local-development scripts:** PowerShell helpers for safe local database access, migrations, development fixtures, and starting the API.

The UI makes requests through `/api/v1`. During local development, Vite forwards `/api` to `http://127.0.0.1:6200`; the UI itself runs on port `5173` by default. The API exposes `/health` independently of the versioned API routes.

## 2. Application architecture

### 2.1 Web client

The client entry point is `Maitribodh-UI/src/main.jsx`. It mounts the React application, Redux store, router, and shared UI theme. [App.jsx](../Maitribodh-UI/src/App.jsx) declares public and authenticated routes and contains the responsive application shell. Individual workflows are implemented in `src/screens/`.

The API client in `src/api.js`:

1. Uses `VITE_API_BASE_URL` when configured; otherwise it uses `/api/v1`.
2. Reads the bearer token from the Redux auth state and attaches it to requests.
3. Clears the in-memory session when a request returns `401` while a token is present.

Authentication state is held in Redux memory ([store.js](../Maitribodh-UI/src/store.js)); access tokens are not persisted to browser storage. Consequently, a page reload requires signing in again.

### 2.2 API

[server.js](../Maitribodh-API/src/server.js) constructs the PostgreSQL pool, repositories, services, routers, authentication middleware, and signed-QR service, then starts the HTTP listener. Feature modules generally use a route → service → repository separation:

- **Routes** parse and validate HTTP input, apply authentication and role authorization, call the service, and format the response.
- **Services** enforce workflow and business rules, such as registration decisions, access eligibility, and visit state transitions.
- **Repositories** perform parameterized database reads and writes, including transactional operations where required.

[app.js](../Maitribodh-API/src/app.js) configures Helmet, CORS, JSON request-size limits, request logging, `/health`, versioned route mounts, not-found handling, and centralized error handling. In production, the API requires an explicit `TRUST_PROXY_HOPS` value; it must be a non-negative integer.

### 2.3 Database

The schema starts from a core set of entities in migration `0001_initial_schema.sql`:

| Entity | Purpose |
|---|---|
| `app_user` | Portal accounts, built-in role, active status, password hash, login lock/version state |
| `lookup_value` | Configurable lookup/master values such as departments, job roles, proof types, and permission levels |
| `category` | Person categories, form type, approval setting, and related category metadata |
| `location` | Gate and area records; gates and areas are distinct location types |
| `person` | Identity/profile fields, encrypted identity values, registration/access status, QR version, and workflow metadata |
| `person_location` | Person-to-area access assignments |
| `approval_history` | Registration approval decisions and history |
| `blacklist` | Blacklist records and their status/reason |
| `visit` | Check-in/check-out events and operational overrides |
| `notification` | Per-user notifications and read state |
| `audit_log` | Append-oriented audit history |
| `bulk_upload` | Persistence model for upload batches; the complete bulk-upload workflow is not implemented |

The exact column definitions, constraints, indexes, and foreign keys are in the migration files. Later migrations extend authentication, registration drafts/category form schemas, master data, and photo rules. Migrations are checksum-tracked: applied SQL files must not be edited; new schema changes belong in a new migration.

## 3. Delivered functional areas

### 3.1 Authentication and portal users

- Sign-in is backed by bcrypt password verification and signed JWT access tokens.
- Authentication middleware verifies the token and resolves the current account; route-level authorization restricts protected operations.
- Login throttling is configured from `LOGIN_RATE_LIMIT_WINDOW_MS` and `LOGIN_RATE_LIMIT_MAX`; the server does not invent a default threshold.
- Temporary-password/first-login password-change behavior is retained. Users with `mustChangePassword` are redirected to the password route before they can use other screens.
- User management supports administrator account operations and temporary credential provisioning.
- The token includes a token-version claim so server-side account/session state can invalidate older credentials.

### 3.2 Role-based screen access

Client navigation and route guards use a shared built-in role matrix in `Maitribodh-UI/src/constants/navigation.js`, and the API separately applies route-level role checks. The roles currently present are `SUPER_ADMIN`, `ADMIN`, `APPROVER`, `REG_OFFICER`, `SECURITY_GUARD`, and `VIEWER`.

Implemented access behavior includes:

- Security Guard users land on the Gate screen.
- Super Admin, Admin, and Approver users can access approval work.
- Approver and Registration Officer users have reporting access.
- User, master-data, category, location, blacklist, QR administration, and audit administration are restricted to Admin/Super Admin where configured.
- Registration and person screens are exposed to the operational roles specified in the UI route matrix.
- Guards may register visitors only; registration authorization and server validation enforce this operational restriction.

This is a built-in role model, not a custom permission-code matrix. UI visibility is not treated as a replacement for API authorization.

### 3.3 Person registration and drafts

The registration screen requests active categories, category-specific form schemas, and master values from the API. It renders the applicable fields and supports the six existing form types: Staff, Parivar, Visitor, Vendor, Contractor, and Participant. Department/job-role selections use their master-data relationship.

The API validates the submission, including profile names and contact details, gender/date values, passport and proof requirements, required category fields, address/emergency contacts, and master references. Registration sends multipart form data containing JSON metadata, a required JPG/PNG photograph (up to 2 MB), and optional documents. Image inputs are decoded and resized to the configured maximum image dimension (600 pixels). The broader API file limits and accepted input behavior are documented in the API README.

Registration persistence is transactional: profile data, area assignments, approval history, audit entries, and notification rows are written together. If persistence fails, newly uploaded files are removed. New registrations that require approval enter the review flow; category approval configuration that has not been confirmed cannot be submitted as though approval were optional.

Users can save and resume per-user drafts. Drafts deliberately do not preserve passport/ID-proof numbers or uploaded file bytes; those sensitive values and files must be supplied again when a draft is resumed. Existing photo-less legacy profiles can be repaired at Gate; new registrations require a photo.

### 3.4 Approval and status changes

Authorized approvers see a paginated queue and can approve or reject registrations. Rejection requires a non-empty reason of at least ten characters. Decisions are recorded in approval history and the audit trail. Self-approval is rejected for Admin, Super Admin, and Approver roles.

The UI also supports resubmission of rejected records through the existing approval workflow. Full category-specific edit parity and resubmission through the registration wizard remain gaps.

Person profiles include a detail view with contact editing, documents, assigned areas/access expiry, recent visits, and (for administrators) audit context. Changing the mobile number advances the QR version, invalidating previously issued signed codes. Deactivation/reactivation requires confirmation and is audited; only active profiles can be deactivated, preventing a reactivation path from bypassing pending approval rules.

### 3.5 Gate lookup, check-in, and check-out

Gate staff can identify a person through a signed QR payload, exact mobile number, or text query (name/person identifier). Lookup requires one identification method and an active location. If multiple matches are possible, the user selects the correct person; the UI presents the profile/photo for confirmation before check-in.

Check-in enforces workflow and access rules, including person status, blacklist state, access expiry, and whether the person already has an open visit. For restricted areas:

- An unassigned area produces a warning rather than an unconditional hard block.
- Security must acknowledge the warning to proceed.
- The override is stored with the visit and recorded in audit history.

Check-out closes the open visit. An already-inside blacklisted person is still allowed to check out. Administrators can perform manual visit reconciliation with a required note; this operation is audited.

If camera scanning is unavailable, manual identification and a mobile camera photo-capture fallback are provided where supported. The interface directs staff to use the paper register when offline; it does not queue/replay gate movements.

### 3.6 QR identity

QR payloads are signed and versioned. The QR service validates signatures and current person/version state, so changed contact data can invalidate earlier codes. The application supports QR previews/download/print in the person/admin surfaces and public multi-match QR retrieval. Public QR lookup is separate from authenticated gate lookup and is rate-limited where configured.

### 3.7 Dashboard, reports, audit, and notifications

- The dashboard presents summary metrics, occupancy, recent activity, and category/location breakdowns.
- Reports include six API report endpoints and CSV export behavior in the UI. Full report-filter parity and real XLSX generation are not implemented.
- Audit browsing is paginated and filterable for administrators, with a detail view. CSV export currently covers the displayed audit page, not the complete filtered result set.
- Audit rows are append-only: migration `0004_registration_workflows.sql` installs a database trigger rejecting update/delete operations.
- Notifications are scoped to the authenticated user; notification read updates use that user identity. The UI includes a notifications drawer and mark-all-read action.
- Dashboard manual reconciliation is explicitly confirmed in the UI and persisted by an audit-backed API transaction.

### 3.8 Administration

Admin/Super Admin screens cover:

- Portal user administration.
- Category status and category form-schema editing (field types, labels, required flags, master sources, custom options, ordering).
- Lookup/master-data administration, including retrieving and reactivating inactive values.
- Gate and area administration as separate location types.
- Blacklist add/lift operations with audit context.
- QR identity lookup and audit browsing.

Category status controls prevent disabling the last active category. Category icons/descriptions and category metadata are persisted through category APIs. Deleting master values, editing document schemas, and enforcing named required-document rules are not complete.

## 4. End-to-end application flows

### 4.1 Startup and sign-in

1. Apply database migrations to PostgreSQL schema `mams`.
2. Start the API; it loads required database/auth/QR configuration, wires feature dependencies, and listens on port `6200` by default.
3. Start the Vite UI. The development proxy forwards `/api` traffic to the API.
4. The user submits credentials on `/login`.
5. The API checks the account and password, applies login lock/rate-limit rules, then returns a token and user/first-login state on success.
6. The UI stores session state in Redux memory. A forced password change routes to `/password`; otherwise the user is directed to their role landing route.
7. Each subsequent protected request carries the bearer token. API middleware authenticates it and each protected route enforces its own role policy.
8. A `401` response ends the in-memory UI session and requires a new sign-in.

### 4.2 New person registration and approval

1. An authorized user opens Register Person. The UI obtains category schemas and active master values from the API.
2. The user selects a category and completes its schema-driven form; the client handles conditional/cascaded controls and draft save/resume.
3. The user provides the required photo, optional documents, and consent/workflow data applicable to the form.
4. The API validates metadata, references, role/category restrictions, fields, and uploaded files; it processes images and protects sensitive identity fields.
5. The registration repository writes the person, area assignments, approval history/status, audit, and notifications within one transaction.
6. If the write fails, the database transaction is rolled back and files written for that attempted registration are cleaned up.
7. When approval is required, the record appears in the approval queue.
8. An authorized approver reviews the record and approves or rejects it. Rejection requires a reason; self-approval is blocked.
9. The person’s status, history, notification, and audit trail reflect the decision. Approved/active people can proceed to gate verification, subject to access rules.

### 4.3 Gate visit lifecycle

1. Security selects an active gate/area and searches by QR, mobile, or name/person identifier.
2. The API validates the lookup and returns an eligible match or result state. Ambiguous matches require explicit selection.
3. Security checks the displayed photo/identity. If the legacy profile has no photo, the Gate workflow can capture and upload one before check-in.
4. Security selects the check-in location. If it is a restricted area not assigned to the person, the UI displays an override warning requiring acknowledgement.
5. The API re-checks current person status, blacklist, access expiry, open-visit state, and area assignment; client-side checks alone are not authoritative.
6. The visit is written with actor, time, gate/area, device context, and any acknowledged override; the action is audited.
7. At departure, Security selects the open visit and records check-out gate/area. The API closes the visit. Reconciliation is a separate administrator action with a mandatory note and audit record.
8. Offline operation is handled manually using the paper register; there is no offline queue/replay feature.

### 4.4 Profile, QR, and administration flow

1. Authorized staff search/list people and open the person detail route.
2. The detail view exposes permitted profile, access, document, activity, visit, and administrative audit information.
3. Contact changes are validated and audited; a mobile change advances the QR version.
4. Admins maintain active/inactive categories, category form schemas, lookup values, locations, portal users, and blacklist records using their dedicated API routes.
5. Dashboards, audit pages, reports, and notification views read from API endpoints; they do not use a separate client-side database.

## 5. API and request checks

The API is mounted under `/api/v1` with feature prefixes for authentication, users, categories, lookups, locations, persons, approvals, public QR, gate, visits, blacklist, reports, dashboard, and activity/audit-related routes.

Across these surfaces, the implemented checks include:

- JWT verification and active-user resolution for protected routes.
- Role authorization in API middleware/route handlers.
- Zod schema validation and domain-specific error responses for user input.
- Pagination parsing for paginated list endpoints.
- Login rate limiting with explicitly configured window and maximum.
- JSON request size limit, CORS origin configuration, Helmet security headers, request logging, and centralized error handling.
- Parameterized PostgreSQL operations, foreign-key/check constraints, and transactional repository workflows where required.
- Database-enforced append-only audit records.
- Multipart file limits, supported image handling, encrypted passport/ID-proof values, and private authenticated file routes.
- Check-in validation at the service/API boundary, including restriction override acknowledgement and open-visit/blacklist/expiry checks.

Production configuration must use separate high-entropy JWT and QR HMAC secrets, a stable data-encryption secret/key plan, exact allowed UI origin, PostgreSQL TLS (`DATABASE_SSL=true`), a deliberate login threshold, and correct trusted-proxy configuration. Secrets and database credentials must not be placed in the UI's `VITE_*` variables or committed to source control.

## 6. Database migrations and local data

The migration set is sequential; run migrations before starting/restarting the API after schema changes. The migration runner verifies checksums and skips previously applied migrations. The development scripts prompt for the local PostgreSQL password rather than requiring it in command arguments.

| Migration | Documented/visible role |
|---|---|
| `0001_initial_schema.sql` | Initial MAMS schema and core entities/constraints |
| `0002_login_failure_window.sql` | Login failure-window/authentication schema evolution |
| `0003_first_login_temporary_password.sql` | Temporary-password/first-login support |
| `0004_registration_workflows.sql` | Category form schema, expiry, draft storage, append-only audit enforcement |
| `0005_seed_registration_masters.sql` | Mockup-oriented registration category/master seed values |
| `0006_optional_person_photo.sql` | Preserves compatibility with existing photo-less people |
| `0007_require_person_photo.sql` | Requires photos for newly registered people while retaining the legacy exception |

Development fixtures are synthetic and guarded for loopback development databases. Do not run development/demo seeding against shared or production data. The reset script is destructive to all data in the `mams` schema and should only be used for an explicitly disposable local database after confirming the connection target. Uploaded files are on local disk by default and are not removed by the database reset.

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed Windows/PowerShell setup, startup, backup, and reset procedures.

## 7. Verification checks

Run commands from each project directory, not the repository root. The repository has no root `package.json`.

### 7.1 API checks

```powershell
Push-Location .\Maitribodh-API
npm test
npm run lint
Pop-Location
```

`npm test` executes the Node core test group and the Jest group. The test suite is organized around middleware/authentication, users, categories/lookups/locations, people/registration, approvals, QR, gate/visits, blacklist, reports, dashboard, activity, and route behavior. `npm run lint` runs ESLint with warnings treated as errors.

### 7.2 UI checks

```powershell
Push-Location .\Maitribodh-UI
npm test
npm run lint
npm run build
Pop-Location
```

The UI tests use Vitest and cover screen behavior including login, role navigation, registration/drafts, people, approvals, Gate confirmation/results, QR, users, master data, categories, locations, reports, blacklist, dashboard, and activity. The production build check is `npm run build`.

For an isolated UI test when investigating a timeout or failure:

```powershell
Push-Location .\Maitribodh-UI
npm run test -- src/screens/PersonDetailPage.test.jsx
Pop-Location
```

### 7.3 Local runtime smoke checks

After configuring a local PostgreSQL 16 instance and applying migrations:

1. Start the API with `npm run dev:local` from `Maitribodh-API`.
2. Start the UI with `npm run dev` from `Maitribodh-UI`.
3. Check `http://localhost:6200/health`; expected JSON is `{ "status": "ok" }`.
4. Open `http://localhost:5173/`, sign in using a configured development account, and verify the role-appropriate landing page.
5. Exercise an end-to-end registration → approval (when required) → person detail/QR → Gate lookup → check-in → check-out flow with synthetic/local test data.
6. Confirm a restricted unassigned-area warning requires explicit acknowledgement; confirm invalid/expired/blacklisted/already-inside cases are rejected or handled according to the rules above.
7. Confirm notifications/audit and report/dashboard reads are visible to the intended roles only.

Do not use production data as test data. Local end-to-end checks requiring PostgreSQL, actual uploaded files, or a real camera should be reported separately from unit/component test results.

## 8. Verification boundaries and known gaps

The following limits are known and should be considered before treating the implementation as production-complete:

- Bulk CSV/photo-package upload, template generation, and row-level import error reporting are not complete.
- User onboarding remains temporary-password/first-login based; username-first password-free account claims and the described alternative password flow are not implemented.
- Custom portal roles, a database-driven permission-code matrix, and migration to the newer four-role model are not implemented.
- Person list category/status filtering and export, category-specific full profile editing, and edited-data resubmission through the registration wizard are incomplete.
- Required category document schemas, named-document enforcement, master deletion rules, and the exact requested seeded category/master set are not aligned/completed. Participant program/batch master configuration is still needed.
- Gate torch/shift/device administration, accompanying names/count edits at check-in, and automatic walk-in check-in are incomplete.
- Program/batch-derived participant expiry, automated overstay scheduling/alerts, and full occupancy grouping parity are incomplete.
- Full filtered audit export/print, report-filter parity, real XLSX exports, QR KPI/filter parity, and explicit manual QR reissue workflow are incomplete.
- Automatic session warning/keep-alive, global shell person search, and complete profile menu/display-name parity are incomplete.
- Person soft-delete with mandatory reason, assigned-gate administration, gate-scoped Security occupancy/audit, and full visit-history filter parity are incomplete.
- File storage is local-disk based by default, not S3; malware scanning, production deployment, retention operations, and key-rotation procedures are not delivered here.
- The frontend layout has been checked with synthetic fixtures at desktop/mobile widths as recorded in the status inventory. Real camera hardware/torch operation and a full live-database registration-through-checkout path are not verified by that browser check.

The source requirements and UI mockup documents contain differences; the implementation status document records the current decisions and which requests remain open. Confirm those decisions before implementing a gap that changes access, seed data, or account-security behavior.

## 9. Feature-by-feature operating guide

This section follows the screens as a user experiences them and explains what the client, API, and database do at each step. Fields and rules below describe the current implementation, not every proposed requirement in the source mockups.

### 9.1 Portal account creation and temporary password

Only Admin and Super Admin can use the Users screen and the user-management APIs. A new portal user account is created with identity/contact data and one of the built-in roles: Super Admin, Admin, Approver, Registration Officer, Security Guard, or Viewer.

**Create flow**

1. Admin opens **Users → Add user** and enters first/last name, mobile, optional email, username, role, and the security-head/bulk-upload flags.
2. UI validation requires non-empty names and username (up to 100/100/50 characters respectively), a 10-digit mobile, valid optional email, a supported role, and boolean flags.
3. UI posts `POST /api/v1/users`. The API validates the same core fields and rejects a Super Admin role assignment unless the caller is itself Super Admin.
4. The database creates the user without accepting a plaintext password from the client. Duplicate username/email/mobile values are translated to a conflict response.
5. After account creation succeeds, the UI immediately posts `POST /api/v1/users/{userId}/password-reset` to issue a temporary password.
6. If password issuance succeeds, a one-time credential panel shows the username, temporary password, and expiry timestamp; the user can copy it. The API response is marked `Cache-Control: no-store`/`Pragma: no-cache`/`Expires: 0`.
7. If account creation succeeds but the password endpoint fails, the UI does not pretend the whole operation succeeded: it keeps the created account, reports that credential issuance failed, and directs the administrator to issue the password from the user list.

**How the temporary password is generated and stored**

- API uses 24 cryptographically random bytes encoded as base64url. It is generated on each reset; it is not a fixed/default password.
- The plaintext is returned only in the reset response. The API hashes it using bcrypt with 12 rounds and stores the hash, never the plaintext.
- The temporary credential expires 24 hours after issuance. The database marks `must_change_password`, stores its expiry, clears the previous “used” marker and failed-login/lock counters, and increments the user token version to invalidate prior sessions.
- Password-reset metadata is written to the audit log with actor, target user, network address/device details and expiry; the password itself is not written to the audit value.
- Reset is only available for an active target user. A deactivated account cannot be issued a working credential through this endpoint.

**First login and password change**

1. User submits username/password to `POST /api/v1/auth/login`.
2. API requires a username of 1–50 characters and password of 1–256 characters. It rejects missing, inactive, locked, password-less, expired temporary, or previously used temporary credentials with a generic invalid-credentials response.
3. After bcrypt verification, the API marks the temporary password as used, clears failed-login state, records last login, issues a JWT, and returns `mustChangePassword: true`.
4. UI stores the token in Redux memory and guards routes: while that flag is true, navigation redirects to `/password`.
5. User supplies current and new password to `PUT /api/v1/auth/password`. New password is 10–256 characters and must include at least one ASCII letter and one digit. API verifies the current password and active account before hashing the new password.
6. Successful change clears the forced-change/temporary credential flags and increments token version. The UI clears local auth and returns the user to sign in with the new permanent password.

The temporary credential can be used for only one successful login. If it has been consumed and the user did not complete the password change, an administrator must issue another reset. Password reuse/history rules are not implemented in the current code.

**Login failures, session expiry, and deactivation**

- Wrong passwords are counted inside a 15-minute failure window. The fifth failed attempt locks the account for 15 minutes; a successful login clears the count/window/lock.
- There is also an HTTP login rate limiter. Its time window and request limit are deployment settings (`LOGIN_RATE_LIMIT_WINDOW_MS`, `LOGIN_RATE_LIMIT_MAX`); configure them explicitly for the environment.
- Security Guard JWT lifetime is 12 hours; other roles receive 30-minute tokens.
- Logout increments the account token version. Authentication resolves the account and checks current status/token version, so deactivated users and revoked tokens are not accepted.
- Admins can list/search users with pagination and filters for role/status; set or clear the bulk-upload flag; and deactivate an active account. Deactivation and permission changes go through audited repository operations.

### 9.2 Category setup and registration form design

Categories determine which form applies to a person. The category record carries a name, icon/description metadata, form type, nullable approval setting, active/inactive state, optional permission-level default, optional overstay cutoff, and optional broad-category relationship. Admins can filter categories by text, type, and status; create/update records; and activate/deactivate them.

**Supported form types and current built-in schema fields**

| Form type | Current built-in category-specific fields | Built-in required address / emergency contact |
|---|---|---|
| `STAFF` | Department (required), Job Role (required and department-dependent), Joining Date (required), Employee ID, Employment Type (Permanent/Contract/Seasonal), Shift | Both required |
| `PARIVAR` | Subcategory (required), Member Since, Seva Area, Referred By | Both required |
| `VISITOR` | Purpose of Visit (required), Visit Date (required), City, Person/Department to Meet, Expected Duration (hours), Vehicle Number | Neither required by default |
| `VENDOR` | Firm Name (required), Goods/Services Supplied (required), Receiving Department (required), GSTIN, Delivery Frequency (Daily/Weekly/Occasional), Vehicle Number, Business Address | Neither required by default |
| `CONTRACTOR` | Agency Name (required), Nature of Work (required), Supervising Department (required), Contract Start Date (required), Contract End Date (required), Work Order Number, Work Location | Neither required by default |
| `PARTICIPANT` | Program and Batch (required), City, Accommodation, Dietary/Medical Notes | Emergency contact required; address not required by default |
| `GENERIC` | Purpose / Details | Neither required by default |

The list above is the default schema in `Maitribodh-API/src/constants/registration.js`. If a category has a persisted non-empty `form_schema`, that category-specific schema takes precedence over the built-in schema.

**Schema editor**

1. Admin opens **Categories** and chooses the field editor action for a category.
2. UI loads registration options and edits the category schema: up to 50 fields, unique lowercase keys matching `[a-z][a-z0-9_]{0,49}`, labels, field type (`text`, `date`, `number`, `select`), required flag, and address/emergency-required flags.
3. Select fields can use a supported data source (`DEPARTMENT`, `JOB_ROLE`, `SUBCATEGORY`, `PROGRAM_BATCH`, `ID_PROOF_TYPE`, `BLACKLIST_REASON`, `PERMISSION_LEVEL`, `AREA`) or custom options.
4. Field order can be changed; fields can be added or removed. Custom options are comma-separated in the editor and normalized to trimmed, unique values when saved.
5. UI patches `formSchema` to the category API. API validates structure and duplicate keys; the repository saves it and writes an audit change record.
6. Future registration options return this schema and the form renders it dynamically. API revalidates required values, dates, positive integers, and allowed option values; client input constraints are not the authority.

The API also supports category `approvalRequired` as true, false, or null. Null means the business approval rule is unconfirmed; registration is deliberately paused for that category. At least one category must remain active. Duplicate category names and invalid permission/broad-category references are rejected.

### 9.3 Person registration: full screen-to-database journey

The Register Person workflow has five screen steps: **Category → Profile → Access → Documents → Review**. The categories and master values come from `GET /api/v1/persons/registration/options`; saved drafts come from `GET /api/v1/persons/drafts`.

**Step 1 — choose category**

- The UI displays active categories with type-based icon and description.
- Choosing a category resets the form values, applies the category's default permission level, and advances to profile details.
- When opening registration from Gate, or when the current user is Security Guard, only Visitor-form categories are displayed. The API independently enforces that a guard can submit Visitor only.
- Non-Gate users can resume their own available saved drafts; the draft list is not exposed as a cross-user list.

**Step 2 — common profile and category details**

Common information comprises first/last name, primary/alternate mobile, date of birth, email, gender, resident status, address, ID proof type/number, emergency contact, required photograph, and category-driven fields.

Current API input checks include:

- Names: 1–100 characters, Unicode letters/combining marks/spaces/hyphens.
- Indian mobile fields: exactly 10 digits beginning 6–9; this applies to primary, alternate (if supplied), and emergency mobile.
- Gender: `MALE`, `FEMALE`, or `OTHER`.
- Date of birth cannot be in the future; date values must be valid ISO dates.
- Email must be valid and at most 150 characters if supplied.
- Non-resident registrations require a 6–9 alphanumeric passport number. Resident registrations do not require passport.
- If an ID proof number is supplied, an ID proof type is required. Default category/master definitions can also encode specific Aadhaar/PAN/passport formats.
- Category schema required fields must be populated. Category `date` values must be ISO dates; `number` values must be positive whole numbers; custom dropdown values must match an allowed option.
- Contract end date cannot be earlier than start date; joining/member-since dates cannot be in the future; GSTIN, when supplied, must be 15 uppercase letters/digits.
- Address and emergency contact become required when the category schema says so.
- Registration consent must be true. The backend records the consent notice version, time, and actor for submitted profiles.

The UI requests JPG/PNG photos only, up to 2 MB. The API verifies the image can actually be decoded (up to 40 million input pixels), rotates according to image orientation, scales it within 600×600 without enlargement, and stores normalized JPEG. A forged MIME type or corrupt/non-image input is rejected.

**Step 3 — access**

- User selects optional permission level and one or more active areas, plus accompanying-person count and remarks.
- The category permission level is preselected where configured; the form labels it as category default.
- `locationIds` is an array of positive integer IDs, maximum 100; accompanying count is a non-negative integer.
- For Security Guard-created walk-ins, API overrides permission level to null and locations to an empty array, and sets source to `WALK_IN`. This is a server-side restriction, not just a disabled UI field.
- Assignment of gates is not part of this form: gates and areas remain separate concepts.

**Step 4 — documents**

- Optional attachments accept PDF, JPG, or PNG; up to 12 documents.
- Each upload is limited to 5 MB by the upload middleware. Documents are validated using a PDF signature or decoded image format rather than trusting the filename alone.
- Images are normalized to JPEG; PDFs are saved as PDFs. Stored document metadata contains a random file key, sanitized base filename (up to 150 characters), and content type.
- Uploaded content is kept under `UPLOAD_DIRECTORY` (default `private-uploads` under API working directory), not served as a public static directory.
- Authenticated person-file routes verify that the requested file key belongs to that person's photo or document list. Security Guards may retrieve the profile photo but not documents. Responses are private/no-store attachments.

**Step 5 — review and submit**

- UI requires consent and submits multipart `metadata`, `photo`, and optional `documents` to `POST /api/v1/persons`.
- API validates category exists/is active; approval state is confirmed; requester is allowed for the category; schema, values, contact details, file size/type/content, and photo requirement all pass.
- Passport and ID-proof numbers are encrypted before database persistence with AES-256-GCM: the encryption key is SHA-256-derived from a namespaced encryption secret, each value uses a fresh 12-byte nonce, and the authentication tag is stored with the ciphertext. The API stores last-four display values separately where implemented.
- Because files are written before the database transaction, the route tracks every new file. Any later validation/storage/database error deletes those newly written files; successful writes retain them for authenticated retrieval.
- Repository creates the person and associated records atomically: assigned areas, approval history, audit record, and notifications. Status depends on category approval configuration/workflow; a pending person cannot be treated as approved for Gate entry.
- The response includes person code and resulting status. UI reports that a QR is available for active status or will follow approval otherwise.
- Gate-originated visitor registration returns an active visitor to Gate with the visitor's person code and selected gate/area for explicit identity/photo check and check-in. Registration itself does not silently check the person in.

**Draft save/resume**

- A draft is saved via `POST /api/v1/persons/drafts` and associated with the authenticated creator; the user can update that draft using its draft/person ID.
- Draft API requires a selected active category and applies the Security Guard/Visitor restriction.
- UI clears consent and passport value when restoring a draft and clears selected photo/documents, so the user must supply consent again and re-enter sensitive values/reselect files.
- Sensitive passport/ID-proof numbers and file bytes are deliberately not saved in resumable draft data.
- The configured draft retention constant is seven days. Drafts are a convenience for incomplete registration, not a valid active profile.

### 9.4 Person management and profile detail

The Person Management list supports paginated person retrieval and currently includes category selection and status filter interaction in the screen. The implementation status calls out full category/status filtering and export parity as incomplete, so do not assume every mockup filter/export option exists.

An authorized person-detail page can show identity/profile, category fields, documents, assigned access, expiry, recent visits/activity, and QR. Available operations are:

- **Edit contact/profile basics:** first/last name, mobile, alternate mobile, email, address, and emergency contact fields are validated. The full category-specific registration form is not yet an edit workflow.
- **Update access:** set permission level, area IDs, and expiry date. This is a dedicated access update rather than a full profile resubmission.
- **Photo repair/change:** upload a JPG/PNG photo (2 MB max); decode and resize it with the same 600-pixel policy. When replacement succeeds, the previous photo file can be removed.
- **Add documents:** management roles can add up to 12 PDF/image documents, each up to 5 MB; database/file failure triggers cleanup of newly written files.
- **Activity:** person activity and visits can be viewed through the detail/activity routes; administrator audit access is separately role-gated.
- **Deactivate/reactivate:** Admin/Super Admin sends status `ACTIVE` or `DEACTIVATED` and a mandatory non-empty reason (up to 300 characters). Only active people can be deactivated; status change is audited.
- **QR:** active identities can display/download/print a QR. A mobile change advances the QR version so old QR images no longer verify.

### 9.5 Approval Center

1. Admin, Super Admin, or Approver loads the paginated approval queue (`GET /api/v1/approvals`) with status `PENDING`, `ACTIVE`, or `REJECTED`.
2. Queue rows display registration information needed for review; the user opens the person/profile to inspect supplied information.
3. Approver selects Approve or Reject. Rejection must include a reason with at least ten non-whitespace characters; API and service both enforce it.
4. API passes actor ID/role/IP/device to a transactional repository decision. The record must still be in an eligible pending/submission state; otherwise the API reports a conflict.
5. The repository blocks self-approval regardless of Admin, Super Admin, or Approver role, writes decision history and audit, updates profile status, and creates relevant notifications.
6. Rejected records may be resubmitted through the existing resubmission route if the record is rejected and requester is authorized. Editing and resubmitting through the full dynamic registration wizard is not yet implemented.

### 9.6 Gate screen, lookup result, check-in and check-out

**Lookup and confirmation**

1. Security selects an active location (which is an `AREA`; the related Gate is recorded separately for the visit).
2. Staff identifies the person using exactly one of signed QR payload, 10-digit mobile, or non-empty text query, then sends the selected location ID.
3. API rejects malformed combinations and inactive locations. QR payload is verified using HMAC and its version is compared with the current person's QR version.
4. Lookup returns candidates and a result such as eligible, invalid QR, blocked blacklist, inactive/expired, already inside, or location warning. Candidate mobile is masked. Lookup attempts/outcomes are recorded with actor, IP/device, count, and masked mobile.
5. UI requires explicit candidate selection when there are multiple matches and explicit photo confirmation before check-in. Real camera hardware is not guaranteed; mobile camera photo capture fallback is available for missing profile photos.

**Check-in**

- API accepts person ID, check-in gate ID, check-in location/area ID, and optional device metadata.
- Only Guard, Admin, and Super Admin can execute the write check-in route.
- API/repository rechecks status, blacklist, access expiry, current open visit, and location assignment in the authoritative write operation; a successful UI lookup is not a reservation and can become stale.
- An unassigned restricted area is surfaced as `LOCATION_WARNING`. User acknowledgement sends the override marker; repository records `location_override` and the audit records actor and warning context. No silent bypass is intended.
- Existing open visit, expired/inactive person, blocked person, and invalid QR prevent check-in.
- Check-in is transactional and generates an open visit; dashboard occupancy reflects the open visit.

**Check-out and manual reconciliation**

- Security, Admin, or Super Admin checks out an open visit with checkout gate and location IDs.
- A closed/missing visit returns a conflict rather than fabricating a successful checkout.
- Blacklist blocking applies to entry; a person already inside can still check out.
- Admin/Super Admin can reconcile an open visit with a required note (1–500 chars). Reconciliation closes the visit and writes an audit record atomically.
- Offline check-in/out remains on the paper register. The application does not buffer activity for later replay.

### 9.7 QR / identity screens

- QR generation is available for active person records and uses the payload shape `AMS1.{personCode}.{version}.{signature}`.
- `personCode` must match the generated `MB-` code format; version must be a positive integer.
- Signature uses HMAC-SHA256 and base64url encoding. Verification uses timing-safe signature comparison and checks that the scanned version equals the current version for that person.
- Profile mobile changes advance QR version. Previously printed/downloaded QR payloads therefore fail Gate verification instead of silently resolving as current.
- The public QR lookup is a separate endpoint: it takes a mobile number, masks mobile values in results/logging, derives an HMAC-based client-IP key, and returns all matching registrations as reduced display name/category/QR image. It does not expose full person records.
- QR identity screen is Admin/Super Admin only. Dedicated manual QR reissue management and complete QR KPI/category-filter parity remain gaps.

### 9.8 Dashboard, reports, audit, notifications

**Dashboard**

- Dashboard screen requests live summary/occupancy data; UI tests check metric and open-visit rendering.
- It includes KPI summaries, occupancy list/table, charts/category/location breakdown and recent activity as implemented by the dashboard service/repository.
- Admin manual reconciliation is a separate confirmed operation with note and audit, not an implicit edit of dashboard display values.

**Reports**

- Reports screen loads six existing API report sections/endpoints, renders paged result sets, and offers the implemented CSV export behavior.
- In implemented UI tests, registration status and visit-history date filters are applied; pagination uses requested page/page size; overlapping requests do not replace a newer selected page with stale data.
- Exact mockup parity for filters and real XLSX output is not present; CSV is the supported export in the tested flows.

**Audit**

- Admin/Super Admin can browse paginated/filterable audit records and open a detail drawer.
- Current export is CSV of the displayed page, not all matching audit records.
- Audit writes preserve actor ID/role, module/activity/entity, before/after values as applicable, request IP, and device where the feature supplies those fields.
- Application exposes no normal update/delete path for audit rows, and the database trigger rejects those operations as a second enforcement layer.

**Notifications**

- Notification queries and read/mark-all-read updates are scoped to the authenticated user. The client cannot choose another user ID to mark read.
- Notifications are created for relevant registration/approval operations as part of those workflow transactions and shown from the shared shell notification drawer.

### 9.9 Master data, locations, blacklist

**Lookup/master data**

- Lookup types currently include Department, Job Role, Subcategory, Program/Batch, ID Proof Type, Blacklist Reason, and Permission Level. Category schema fields can also refer to Area as a selection source.
- Authenticated users can read active lookup values; parent IDs support dependent values such as Job Role → Department. Admins can search, paginate where requested, include inactive values, create new values, and update name/extra/status.
- Inactive values are restricted to Admin/Super Admin. No hard-delete API is provided; deactivation preserves references/history.
- Duplicate and invalid parent/category/master references are rejected by service/database constraints.
- Master data should be configured before registering categories that require it; Participant form selection needs Program/Batch data, for example.

**Locations**

- Admin/Super Admin creates and edits `GATE` or `AREA` separately. A location has a name, active/inactive status, optional department association, and restricted flag.
- API prohibits a Gate from being restricted. Gate check-in requires both a Gate ID and an Area/location ID; this supports separate entry point and destination-area records.
- The location screen supports active-location search/filter by name/type and pagination. Full assigned-gate administration and gate-specific security policy are gaps.

**Blacklist**

- Admin/Super Admin lists entries and adds an entry for a person with active reason, remarks, and optional start/end ISO dates.
- Date range must not end before it begins. Duplicate open blacklist entries are rejected. A lift operation requires a non-empty note and is only available while an entry is open.
- Add/lift operations are audited. Gate lookup/check-in reports a blocked outcome for blacklisted persons, but checkout remains possible for an open visit.

## 10. Current gap checklist by workflow

Use this list to avoid interpreting an implemented screen/API as complete parity with every source artifact:

- **Accounts:** No username-first password-free claim flow, OTP/email/WhatsApp delivery, custom role editor, or password-history/reuse policy.
- **People:** No bulk CSV/photo-package import workflow, complete category-specific profile edit/resubmit, full list filter/export parity, or soft delete with mandatory reason.
- **Category and masters:** No named document-schema/mandatory-document policy, master-value delete workflow, exact alignment of seeded category set to every spec, or full Participant program/batch lifecycle configuration.
- **Gate:** No torch control, gate/device/shift assignment administration, automatic walk-in check-in, accompanying-person names/count edits at check-in, or offline queue/replay.
- **Reports/oversight:** No full filtered audit export/print, real XLSX export, full report filter parity, automated overstay scheduler/alerts, or complete occupancy grouping parity.
- **Operations/security:** No S3 object storage, malware scanning, production deployment automation, retention automation, or encryption-key rotation migration.

## 11. Related project references

- [Implementation status and requirement gaps](./MAMS_IMPLEMENTATION_STATUS.md)
- [Local development guide](./LOCAL_DEVELOPMENT.md)
- [API README](../Maitribodh-API/README.md)
- [UI README](../Maitribodh-UI/README.md)
- [API migration guide](../Maitribodh-API/db/migrations/README.md)
