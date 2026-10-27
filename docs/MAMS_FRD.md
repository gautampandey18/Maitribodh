# Maitribodh Access Management System
# Functional Requirements Document (Current Implementation)

| Document property | Value |
|---|---|
| Document type | Functional Requirements Document (FRD) |
| System | Maitribodh Access Management System (MAMS) |
| Baseline | Current implementation in this repository |
| Implementation snapshot | API/UI source and database migrations 0001–0010 |
| Status | As-implemented functional specification |
| Related documents | [Business Requirements Document](./MAMS_BRD.md), [Implementation and Flow Guide](./MAMS_IMPLEMENTATION_GUIDE.md), [Implementation Status](./MAMS_IMPLEMENTATION_STATUS.md) |

## 1. Purpose and interpretation

This document specifies the user-visible and system-side behavior currently implemented in MAMS. Requirements tagged **Implemented** describe existing behavior. Items tagged **Not implemented** are explicitly outside this FRD's delivered baseline and are included only to prevent scope confusion.

The requirements are organized by workflow rather than by source mockup page. The functional flow is implemented by a React/Vite client, an Express API, and PostgreSQL schema `mams`. Most API operations use the route → service → repository pattern. The API is authoritative for authentication, authorization, validation, and workflow decisions.

## 2. Actors and role codes

| Actor name | Stored role value |
|---|---|
| Super Admin | `SUPER_ADMIN` |
| Admin | `ADMIN` |
| Approver | `APPROVER` |
| Registration Officer | `REG_OFFICER` |
| Security Guard | `SECURITY_GUARD` |
| Viewer | `VIEWER` |

Public QR lookup is an unauthenticated user-facing operation with reduced output. Application staff roles are enforced at API routes. Unless specified, account/category/location/master/audit operations are not exposed to Viewer or Guard.

## 3. System context and common functional behavior

### 3.1 Client/API behavior

| ID | Requirement | Status |
|---|---|---|
| FR-COM-001 | The client shall send versioned API requests under `/api/v1`, using `VITE_API_BASE_URL` when set and `/api/v1` otherwise. | Implemented |
| FR-COM-002 | The client shall attach the current bearer token from in-memory Redux authentication state to API requests. | Implemented |
| FR-COM-003 | The client shall clear local session state after a `401` response when the client currently has an access token. | Implemented |
| FR-COM-004 | The API shall provide `GET /health` returning status `ok` when the application process is running. | Implemented |
| FR-COM-005 | The API shall apply JSON body limits, CORS origin configuration, Helmet headers, request logging, not-found handling, and centralized error responses. | Implemented |
| FR-COM-006 | The API shall validate HTTP payloads/parameters and return an explicit client error for invalid input rather than treating invalid data as success. | Implemented |
| FR-COM-007 | The API shall use PostgreSQL parameterized queries and transactional writes for workflows that update related records. | Implemented |
| FR-COM-008 | API route authorization shall remain effective even when client-side navigation hides a screen. | Implemented |

### 3.2 Route groups

| API prefix / route family | Primary function |
|---|---|
| `/api/v1/auth` | Login, logout, password change |
| `/api/v1/users` | User listing, creation, details, password reset, deactivation, and bulk-upload flag updates |
| `/api/v1/categories` | Category CRUD/status/schema administration |
| `/api/v1/lookups` | Lookup/master values |
| `/api/v1/locations` | Gate and Area administration |
| `/api/v1/persons` | Registration options, drafts, profile, photo/documents, access, status |
| `/api/v1/approvals` | Approval queue and decisions/resubmission |
| `/api/v1/public` | Public QR lookup |
| `/api/v1/gate` | Gate identity lookup |
| `/api/v1/visits` | Check-in, checkout, reconciliation |
| `/api/v1/blacklist` | List/add/lift blacklist entries |
| `/api/v1/dashboard` | Dashboard summaries/occupancy |
| `/api/v1/reports` | Six report sections |
| `/api/v1` activity routes | User notifications and administrator audit browsing |

## 4. Functional requirements

### 4.1 Authentication and account security

#### Login and session

| ID | Requirement | Status |
|---|---|---|
| FR-AUTH-001 | System shall accept username (1–50 chars) and password (1–256 chars) for login. | Implemented |
| FR-AUTH-002 | System shall authenticate usernames case-insensitively and verify passwords using bcrypt. | Implemented |
| FR-AUTH-003 | System shall reject inactive, locked, password-less, missing, invalid, expired temporary, and already-used temporary credentials with a generic invalid-credentials response. | Implemented |
| FR-AUTH-004 | System shall issue a signed bearer JWT only after successful credential verification and successful account-state update. | Implemented |
| FR-AUTH-005 | System shall return user ID, role, token type, expiry, and first-login password-change state. | Implemented |
| FR-AUTH-006 | A Security Guard session shall expire after 12 hours; sessions for other roles shall expire after 30 minutes. | Implemented |
| FR-AUTH-007 | Logout shall revoke sessions by incrementing the user's token version. | Implemented |
| FR-AUTH-008 | Authentication shall verify the token and current account state/version before honoring protected requests. | Implemented |
| FR-AUTH-009 | Client auth state shall exist in Redux memory only and shall not be persisted in browser local storage. | Implemented |
| FR-AUTH-010 | Client shall force the user to `/password` before allowing other authenticated routes when `mustChangePassword` is true. | Implemented |
| FR-AUTH-011 | Five failed account login attempts in the active 15-minute failure window shall result in a 15-minute account lock. Successful login shall clear the failure/lock state. | Implemented |
| FR-AUTH-012 | Login shall also use an HTTP rate limiter whose window and limit are explicit deployment settings. | Implemented |

#### Password change and temporary password

| ID | Requirement | Status |
|---|---|---|
| FR-AUTH-020 | Authenticated user shall change password using current password and new password. | Implemented |
| FR-AUTH-021 | New password shall be 10–256 characters, contain an ASCII letter and a digit, and be hashed using bcrypt before storage. | Implemented |
| FR-AUTH-022 | Password change shall validate current password and active account status. | Implemented |
| FR-AUTH-023 | Successful password change shall clear forced-change and temporary-password expiry/use state and increment token version. | Implemented |
| FR-AUTH-024 | Admin/Super Admin shall be able to issue a new temporary password to an active target user. | Implemented |
| FR-AUTH-025 | Temporary password shall be generated from 24 cryptographic random bytes using base64url encoding, valid for 24 hours, and usable for one successful login. | Implemented |
| FR-AUTH-026 | System shall persist only the bcrypt hash of a temporary password and shall not place the plaintext password in audit data. | Implemented |
| FR-AUTH-027 | Password reset shall clear lock/failure state, mark forced password change, invalidate prior tokens, and audit the reset actor/target/expiry. | Implemented |
| FR-AUTH-028 | Password reset response shall include no-store cache directives. | Implemented |
| FR-AUTH-029 | User-creation UI shall issue a temporary password after successful account creation and clearly report the partial-success case if password issuance fails. | Implemented |
| FR-AUTH-030 | Temporary password shall be delivered by email, SMS, OTP, or WhatsApp. | Not implemented |
| FR-AUTH-031 | Password history/reuse policy shall be enforced. | Not implemented |

#### User administration

| ID | Requirement | Status |
|---|---|---|
| FR-USER-001 | Admin/Super Admin shall list users with pagination, text search, role filter, and active/inactive status filter. | Implemented |
| FR-USER-002 | Admin/Super Admin shall create users with first name, last name, mobile, optional email, username, built-in role, security-head flag, and bulk-upload permission flag. | Implemented |
| FR-USER-003 | Only a Super Admin shall be able to assign the Super Admin role. | Implemented |
| FR-USER-004 | Duplicate username/email/mobile shall produce a conflict response. | Implemented |
| FR-USER-005 | Admin/Super Admin shall view an individual account, reset active user's password, toggle bulk-upload permission, and deactivate an active account. | Implemented |
| FR-USER-006 | User creation and sensitive user changes shall retain actor context in audit records where implemented. | Implemented |
| FR-USER-007 | Admin shall define arbitrary custom roles and permission grants. | Not implemented |
| FR-USER-008 | Account shall be claimed through a password-free username onboarding flow. | Not implemented |

### 4.2 Role navigation and route access

| ID | Requirement | Status |
|---|---|---|
| FR-RBAC-001 | UI navigation shall be generated from the shared built-in role/screen navigation map. | Implemented |
| FR-RBAC-002 | Unauthenticated users accessing protected screens shall be redirected to Login and the requested path may be retained for navigation. | Implemented |
| FR-RBAC-003 | Unauthorized authenticated users shall be redirected to their role landing page. | Implemented |
| FR-RBAC-004 | Security Guard landing path shall be Gate; other implemented roles default to Dashboard. | Implemented |
| FR-RBAC-005 | The API shall apply role authorization to protected route operations, not rely only on UI visibility. | Implemented |
| FR-RBAC-006 | Security Guard registration shall be restricted to Visitor category/form type. | Implemented |
| FR-RBAC-007 | Security Guard shall not assign areas when creating a walk-in registration; server shall clear those values and mark walk-in source. | Implemented |
| FR-RBAC-008 | System shall support database-driven fine-grained permission-code matrix and custom role administration. | Not implemented |

The detailed UI screen matrix is in `Maitribodh-UI/src/constants/navigation.js`; each API route group additionally applies its own allowed-role list.

### 4.3 Category administration and form schemas

| ID | Requirement | Status |
|---|---|---|
| FR-CAT-001 | Admin/Super Admin shall search/filter/paginate categories by name/description query, form type, and status. | Implemented |
| FR-CAT-002 | Admin/Super Admin shall create categories with name, icon, description, form type, and nullable approval policy. | Implemented |
| FR-CAT-003 | Admin/Super Admin shall update supported category details/status and its registration form schema. | Implemented |
| FR-CAT-004 | Category name shall be unique; legacy broad-category database fields are not configurable through the current category API. | Implemented |
| FR-CAT-005 | At least one category shall remain active. | Implemented |
| FR-CAT-006 | Category form schema shall support up to 50 unique fields with key, label, type, required flag, optional lookup source, and optional allowed options. | Implemented |
| FR-CAT-007 | Supported field types shall be text, date, number, and select. Keys shall match `[a-z][a-z0-9_]{0,49}` and be unique within the schema. | Implemented |
| FR-CAT-008 | Schema shall support `addressRequired` and `emergencyRequired` switches. | Implemented |
| FR-CAT-009 | Select sources shall support Department, Job Role, Subcategory, Program/Batch, ID Proof Type, Blacklist Reason, and Area. | Implemented |
| FR-CAT-010 | Category registration options shall use saved non-empty schema when present and otherwise use the form-type built-in schema. | Implemented |
| FR-CAT-011 | `approvalRequired = null` shall block registration submission until the rule is confirmed. | Implemented |
| FR-CAT-012 | Category create/update/schema/status operations shall be audited. | Implemented |
| FR-CAT-013 | Category administration shall include the required named document schemas and mandatory document rules. | Not implemented |
| FR-CAT-014 | Category administration shall expose permission-level assignment or category overstay-cutoff controls. | Not implemented; the former schema fields were removed by migrations 0010 and 0009 respectively. |

Built-in form fields are listed in section 5.2. Six form types in the current UI are Staff, Parivar, Visitor, Vendor, Contractor, and Participant; the API schema also includes Generic fallback.

### 4.4 Master data and locations

#### Lookup/master data

| ID | Requirement | Status |
|---|---|---|
| FR-MASTER-001 | Authenticated users shall retrieve active lookup values by type, with optional parent/query filters and pagination. | Implemented |
| FR-MASTER-002 | Admin/Super Admin shall retrieve inactive lookup values and create/update lookup entries. | Implemented |
| FR-MASTER-003 | System shall support Department, Job Role, Subcategory, Program/Batch, ID Proof Type, and Blacklist Reason lookup types. | Implemented |
| FR-MASTER-004 | System shall validate parent/category/master references and reject duplicate/invalid values. | Implemented |
| FR-MASTER-005 | Inactive values shall remain available to administrators for reference/reactivation; there is no hard-delete interface. | Implemented |
| FR-MASTER-006 | System shall provide full master deletion, merge, and referential cleanup workflows. | Not implemented |

#### Gates and areas

| ID | Requirement | Status |
|---|---|---|
| FR-LOC-001 | Admin/Super Admin shall create/update/list active locations with name, location type, restricted flag, optional department, and status. | Implemented |
| FR-LOC-002 | Location type shall be Gate or Area; a Gate cannot be restricted. | Implemented |
| FR-LOC-003 | Visit workflows shall accept a Gate ID and Area/location ID separately. | Implemented |
| FR-LOC-004 | Location records and edits shall be audited. | Implemented |
| FR-LOC-005 | System shall administer gate/device/shift assignments and gate-scoped role grants. | Not implemented |

### 4.5 Person registration, drafts, media, and profile

#### Registration options and form

| ID | Requirement | Status |
|---|---|---|
| FR-REG-001 | Authenticated registration roles shall retrieve active categories, computed schemas, active lookup values, and active locations. | Implemented |
| FR-REG-002 | Registration UI shall provide five steps: Category, Profile, Access, Documents, Review. | Implemented |
| FR-REG-003 | UI shall render common profile fields and category-defined fields, supporting dependent Job Role options filtered by selected Department. | Implemented |
| FR-REG-004 | Gate-originated and Security Guard registration shall offer Visitor categories only. | Implemented |
| FR-REG-005 | Registration screen shall support common profile fields, category details, areas, accompanying count, remarks, consent, photo, and optional documents as applicable. | Implemented |
| FR-REG-006 | New registration shall require `consent: true`. | Implemented |
| FR-REG-007 | New registration shall require one valid JPG or PNG photo no larger than 2 MB. | Implemented |
| FR-REG-008 | Photo shall be decoded, orientation-corrected, resized within 600×600 without enlargement, and normalized to JPEG. | Implemented |
| FR-REG-009 | Upload shall reject invalid/corrupt image payloads and enforce upload-size/file-count limits. | Implemented |
| FR-REG-010 | Optional documents shall be limited to 12 files, up to 5 MB each, accepted as PDF/JPG/PNG, and validated by content. | Implemented |
| FR-REG-011 | Uploaded files shall be written to private local storage and only retrieved through authenticated person-file routes. | Implemented |
| FR-REG-012 | Security Guard shall be allowed to retrieve a person's photo but not attached documents. | Implemented |
| FR-REG-013 | Passport/ID-proof values shall be encrypted before database storage; encrypted values shall not be returned from the general person detail read. | Implemented |
| FR-REG-014 | A person may have up to 100 assigned areas in submission input; referenced areas and lookups must be active and of correct type. | Implemented |
| FR-REG-015 | Database creation of person, area assignments, approval history, audit, and notifications shall be transactional. Newly written files shall be removed if registration persistence fails. | Implemented |

#### Registration validation

| ID | Requirement | Current rule |
|---|---|---|
| FR-REG-020 | First and last name shall each be 1–100 characters containing Unicode letters/marks, spaces, or hyphens. | Implemented |
| FR-REG-021 | Primary mobile shall be a valid phone number; Visitor may use a valid international number and all other registration categories require a valid Indian number. Stored primary values use E.164 form. | Implemented |
| FR-REG-022 | Alternate and emergency mobile numbers (when provided) shall match a 10-digit Indian mobile pattern beginning 6–9. | Implemented |
| FR-REG-023 | Gender shall be Male, Female, or Other; DOB cannot be in the future. | Implemented |
| FR-REG-024 | Email, if provided, shall be valid and no longer than 150 characters. | Implemented |
| FR-REG-025 | Non-resident registration shall supply a 6–9 alphanumeric passport number. | Implemented |
| FR-REG-026 | Supplying an ID-proof number requires an active ID-proof type; configured Aadhaar/PAN/Passport patterns shall be validated. | Implemented |
| FR-REG-027 | Required schema fields shall be non-empty; date fields shall be valid ISO dates; number fields shall be positive whole numbers; select values shall be allowed. | Implemented |
| FR-REG-028 | Lookup-backed fields shall reference active values of the correct type. Job Role must belong to the selected Department; Subcategory must match the selected category when category-scoped. | Implemented |
| FR-REG-029 | Address/emergency details shall be required when category schema flags require them. | Implemented |
| FR-REG-030 | Contract end date shall not precede start date; joining/member-since dates shall not be future; supplied GSTIN shall be 15 uppercase letters/digits. | Implemented |
| FR-REG-031 | Person names shall be limited to 100 characters and the currently implemented character set. | Implemented |
| FR-REG-032 | System shall support arbitrary configurable per-category mobile patterns and a 150-character person-name maximum. | Not implemented |

#### Drafts

| ID | Requirement | Status |
|---|---|---|
| FR-REG-040 | User shall save a draft for an active category and update their own draft. | Implemented |
| FR-REG-041 | User shall see/resume only their own drafts updated within the prior seven days. | Implemented |
| FR-REG-042 | Draft payload shall omit passport/ID-proof numbers and uploaded file bytes; resume shall require those values/files again and require consent again. | Implemented |
| FR-REG-043 | Guard draft shall obey Visitor-only category restrictions. | Implemented |

#### Resulting person status

| ID | Requirement | Status |
|---|---|---|
| FR-REG-050 | If category requires approval, submitted person shall enter `PENDING` and have a submission history entry. | Implemented |
| FR-REG-051 | If category does not require approval, submitted person shall enter `ACTIVE` and receive an initial positive QR version. | Implemented |
| FR-REG-052 | Category approval rule or active state changed during submission shall cause the API to reject stale submission and require reload/review. | Implemented |
| FR-REG-053 | Gate-originated active Visitor registration shall return user to Gate for explicit lookup/confirmation/check-in. | Implemented |
| FR-REG-054 | Creating a Gate-originated person shall automatically create a check-in. | Not implemented |

### 4.6 Person management

| ID | Requirement | Status |
|---|---|---|
| FR-PER-001 | Authorized roles shall list/search/paginate people and open an individual person detail. | Implemented |
| FR-PER-002 | Person detail shall not expose encrypted passport/ID-proof ciphertext. | Implemented |
| FR-PER-003 | Management roles shall update basic contact/profile fields supported by the current edit endpoint. | Implemented |
| FR-PER-004 | Staff-profile edits shall be restricted to Admin/Super Admin. | Implemented |
| FR-PER-005 | Mobile change for an active person shall increment QR version and create corresponding audit information. | Implemented |
| FR-PER-006 | Management roles shall update assigned active areas and expiry date. | Implemented |
| FR-PER-007 | Authorized registration roles shall capture or replace profile photo with valid JPG/PNG up to 2 MB. Guards may only repair a missing photo for an active non-draft record. | Implemented |
| FR-PER-008 | Management roles shall append optional person documents subject to count/type/size validation. | Implemented |
| FR-PER-009 | Admin/Super Admin shall change person status between Active and Deactivated with a required reason and audit. | Implemented |
| FR-PER-010 | A profile in an ineligible state shall not be deactivated in a way that bypasses approval/reactivation controls. | Implemented |
| FR-PER-011 | Person shall be soft-deleted with mandatory reason and recoverable deletion history. | Not implemented |
| FR-PER-012 | Full category-specific registration profile edit and edit/resubmit wizard shall be supported. | Not implemented |
| FR-PER-013 | Person list shall provide full category/status/export parity with all source specification filters. | Partial / not complete |

### 4.7 Approval management

| ID | Requirement | Status |
|---|---|---|
| FR-APR-001 | Admin, Super Admin, and Approver shall list pending/active/rejected approval records with pagination. | Implemented |
| FR-APR-002 | Authorized approver shall approve or reject an eligible pending registration. | Implemented |
| FR-APR-003 | Rejection shall require at least 10 non-whitespace characters. | Implemented |
| FR-APR-004 | Admin, Super Admin, or Approver shall not approve their own submission. | Implemented |
| FR-APR-005 | Decision shall update person status and approval history and persist audit/notification context transactionally. | Implemented |
| FR-APR-006 | Resubmission shall be allowed only for an eligible rejected record and authorized actor. | Implemented |
| FR-APR-007 | Stale/already-decided submissions shall return a conflict rather than silently applying duplicate decisions. | Implemented |
| FR-APR-008 | Full re-entry/edit in registration wizard followed by resubmission shall be supported. | Not implemented |

### 4.8 Gate identification and visit operations

#### Lookup and QR validation

| ID | Requirement | Status |
|---|---|---|
| FR-GATE-001 | Gate lookup shall accept exactly one of QR payload, Indian 10-digit or international E.164 mobile, or text query and an active location ID. | Implemented |
| FR-GATE-002 | API shall reject lookup against inactive/nonexistent location. | Implemented |
| FR-GATE-003 | QR payload shall be signature-checked, format-checked, and compared against current person code/version. | Implemented |
| FR-GATE-004 | Lookup shall return candidates with masked mobile and outcome state, including eligible, invalid QR, blacklist, not active/expired, already inside, location warning, or not found. | Implemented |
| FR-GATE-005 | Lookup outcome shall be recorded with actor/context, count, and masked mobile where applicable. | Implemented |
| FR-GATE-006 | UI shall require person selection for ambiguous matches and photo/identity confirmation before check-in. | Implemented |
| FR-GATE-007 | UI shall provide mobile camera-photo fallback where supported and allow missing legacy photo repair before check-in. | Implemented |
| FR-GATE-008 | UI shall support real camera scanning on supported hardware. | Present in implementation; hardware validation is not guaranteed by automated tests. |

#### Check-in and check-out

| ID | Requirement | Status |
|---|---|---|
| FR-VIS-001 | Security Guard, Admin, or Super Admin shall create check-in using person, gate, and location/area IDs. | Implemented |
| FR-VIS-002 | Check-in shall reject ineligible status, blacklist, expired access, invalid QR, and existing open visit. | Implemented |
| FR-VIS-003 | Restricted unassigned area shall produce warning; Security must explicitly acknowledge to continue. | Implemented |
| FR-VIS-004 | Visit shall preserve the location override and audit record when warning is acknowledged. | Implemented |
| FR-VIS-005 | Check-in/out shall retain actor, gate/area, time, and device/request context where supplied. | Implemented |
| FR-VIS-006 | Security Guard, Admin, or Super Admin shall close an open visit using checkout gate and location. | Implemented |
| FR-VIS-007 | Check-out without a matching open visit shall return conflict/not-active-visit response. | Implemented |
| FR-VIS-008 | Blacklisted person with an open visit shall be permitted to check out. | Implemented |
| FR-VIS-009 | Admin/Super Admin shall reconcile an open visit with a required 1–500 character note and audit record. | Implemented |
| FR-VIS-010 | Client shall store and replay offline gate events automatically. | Not implemented; use paper register. |
| FR-VIS-011 | Gate workflow shall edit accompanying-person names/count at check-in and automatically check in walk-ins. | Not implemented |
| FR-VIS-012 | Gate device/shift/torch and assigned-gate operations shall be configurable. | Not implemented |

### 4.9 QR identity and public lookup

| ID | Requirement | Status |
|---|---|---|
| FR-QR-001 | Active person QR shall encode person code and version with an HMAC-SHA256 signature. | Implemented |
| FR-QR-002 | QR validation shall use timing-safe signature comparison and reject malformed, invalid, or stale version values. | Implemented |
| FR-QR-003 | Active person's QR version shall advance when mobile changes. | Implemented |
| FR-QR-004 | Authorized user shall preview/download/print person QR where supported by screen. | Implemented |
| FR-QR-005 | Public QR lookup shall use mobile, mask contact data, and return reduced multi-match identity/QR data rather than full profiles. | Implemented |
| FR-QR-006 | Public lookup shall apply its configured request limiting/privacy key behavior. | Implemented |
| FR-QR-007 | System shall provide full QR metrics/filter parity and administrator manual reissue workflow. | Not implemented |

### 4.10 Blacklist

| ID | Requirement | Status |
|---|---|---|
| FR-BLK-001 | Admin/Super Admin shall list blacklist entries. | Implemented |
| FR-BLK-002 | Admin/Super Admin shall add a record with person, active reason, remarks, and optional ISO start/end dates. | Implemented |
| FR-BLK-003 | End date shall not precede start date and duplicate open blacklist entry shall be rejected. | Implemented |
| FR-BLK-004 | Admin/Super Admin shall lift an open entry with a non-empty note. | Implemented |
| FR-BLK-005 | Add/lift operations shall be audited and Gate shall block blacklisted person from entry. | Implemented |

### 4.11 Dashboard, reports, audit, and notifications

| ID | Requirement | Status |
|---|---|---|
| FR-OPS-001 | Dashboard shall show implemented summary metrics, occupancy/open visit data, activity, and category/location visualizations. | Implemented |
| FR-OPS-002 | Admin shall explicitly confirm manual reconciliation actions and provide an audit-backed transaction. | Implemented |
| FR-OPS-003 | Reports shall expose the six implemented report endpoints and render supported paginated/filterable views. | Implemented |
| FR-OPS-004 | UI shall export supported report data to CSV where implemented. | Implemented |
| FR-OPS-005 | System shall provide real XLSX export and complete report filter parity. | Not implemented |
| FR-AUD-001 | Admin/Super Admin shall browse paginated/filterable audit records and inspect a detail view. | Implemented |
| FR-AUD-002 | Audit CSV export shall cover the currently displayed page. | Implemented |
| FR-AUD-003 | Audit update/delete shall be unavailable through normal application behavior and rejected by database trigger. | Implemented |
| FR-AUD-004 | Full matching-result export/print independent of displayed page shall be supported. | Not implemented |
| FR-NOT-001 | Authenticated user shall see their notifications and mark their own notifications read/all-read. | Implemented |
| FR-NOT-002 | Notification read/write queries shall be scoped to authenticated user, not a user ID supplied by client. | Implemented |
| FR-NOT-003 | Relevant registration/approval notifications shall be persisted in workflow transactions where implemented. | Implemented |

## 5. Detailed functional data and workflow definitions

### 5.1 Built-in category form fields

Persisted non-empty category form schema overrides the defaults below. These are the current built-in defaults:

| Form type | Field key | Display label | Type | Required | Source/options |
|---|---|---|---|---|---|
| Staff | `department_id` | Department | Select | Yes | Department lookup |
| Staff | `job_role_id` | Job Role | Select | Yes | Job Role lookup filtered by Department |
| Staff | `joining_date` | Joining Date | Date | Yes | — |
| Staff | `employee_code` | Employee ID | Text | No | — |
| Staff | `employment_type` | Employment Type | Select | No | Permanent, Contract, Seasonal |
| Staff | `shift` | Shift | Text | No | — |
| Parivar | `subcategory_id` | Subcategory | Select | Yes | Subcategory lookup |
| Parivar | `member_since` | Member Since | Date | No | — |
| Parivar | `seva_area` | Seva Area | Text | No | — |
| Parivar | `referred_by` | Referred By | Text | No | — |
| Visitor | `purpose` | Purpose of Visit | Text | Yes | — |
| Visitor | `visit_date` | Visit Date | Date | Yes | — |
| Visitor | `city` | City | Text | No | — |
| Visitor | `person_to_meet` | Person / Department to Meet | Text | No | — |
| Visitor | `duration_hours` | Expected Duration | Number | No | Positive whole number |
| Visitor | `vehicle_number` | Vehicle Number | Text | No | — |
| Vendor | `firm_name` | Firm Name | Text | Yes | — |
| Vendor | `services` | Goods / Services Supplied | Text | Yes | — |
| Vendor | `department_id` | Receiving Department | Select | Yes | Department lookup |
| Vendor | `gstin` | GSTIN | Text | No | 15 uppercase alphanumeric when supplied |
| Vendor | `delivery_frequency` | Delivery Frequency | Select | No | Daily, Weekly, Occasional |
| Vendor | `vehicle_number` | Vehicle Number | Text | No | — |
| Vendor | `business_address` | Business Address | Text | No | — |
| Contractor | `agency_name` | Agency Name | Text | Yes | — |
| Contractor | `nature_of_work` | Nature of Work | Text | Yes | — |
| Contractor | `department_id` | Supervising Department | Select | Yes | Department lookup |
| Contractor | `start_date` | Contract Start Date | Date | Yes | — |
| Contractor | `end_date` | Contract End Date | Date | Yes | Not before start date |
| Contractor | `work_order` | Work Order Number | Text | No | — |
| Contractor | `work_location_id` | Work Location | Select | No | Area lookup |
| Participant | `program_batch_id` | Program and Batch | Select | Yes | Program/Batch lookup |
| Participant | `city` | City | Text | No | — |
| Participant | `accommodation` | Accommodation | Text | No | — |
| Participant | `medical_notes` | Dietary / Medical Notes | Text | No | — |
| Generic | `details` | Purpose / Details | Text | No | — |

Additionally, Staff and Parivar require address and emergency contact by default; Participant requires emergency contact. These rules may be overridden by a persisted category schema for that category.

The Visitor screen also collects optional driver availability (`YES`/`NO`). When `YES` is selected, optional driver name and Indian 10-digit contact fields are shown. API validation rejects driver details when availability is not `YES`; these conditional fields are not part of the default schema field list above.

### 5.2 Registration payload/data lifecycle

1. **Options read:** active categories include their computed schema; active lookups and locations are returned for the form.
2. **Draft write:** draft metadata is saved with category ID and creator; passport and ID-proof numbers are blanked before draft persistence. Photo/documents are not placed in draft JSON.
3. **Submit:** client sends multipart `metadata` JSON, required `photo`, and optional repeated `documents`.
4. **Validation:** request schema validates common fields; category validation resolves current schema, approval state, role, required values, active master values, lookup parent/category relationships, and domain rules.
5. **File processing:** random UUID-based file keys prevent client-supplied path usage. Images are decoded/resized; documents are PDF/image checked.
6. **Sensitive data:** passport/ID-proof values are AES-256-GCM encrypted using a SHA-256-derived namespaced key and per-value nonce/tag; only encrypted value and limited display metadata are persisted.
7. **Database transaction:** current category is locked/rechecked to avoid stale form-policy submission; person/status/consent/area/approval/audit/notification writes commit together.
8. **Failure handling:** database transaction rolls back; newly written files are deleted; caller receives validation/conflict/server error, not a success-shaped result.
9. **Result:** client displays generated person code and resulting status. Active records can use QR/Gate flow; pending records await approval.

### 5.3 Entity state model

| Entity | State values / transitions currently relevant |
|---|---|
| Portal user | Active → Inactive by administrator; temporary credential → first successful login → forced permanent password change; wrong-password attempts → locked window; logout/password reset/password change → token version increment |
| Person | Draft (incomplete) → Pending when approval required → Active on approval; alternatively direct submission → Active when approval is not required; Pending may be Rejected; eligible Rejected record may be resubmitted; Active may be Deactivated and an authorized administrator may reactivate with reason |
| Category | Active ↔ Inactive, provided an active category remains; approval policy true/false/null |
| Lookup value | Active ↔ Inactive; historical references are retained |
| Location | Active/Inactive; type is Gate or Area; restricted is valid only for Area |
| Visit | Open at check-in → Closed at check-out or authorized reconciliation; one current open visit prevents another check-in |
| Blacklist | Open entry → Lifted/closed with note; duplicate open entry is rejected |
| Audit row | Append-only; no update/delete transitions |
| Notification | Unread → Read, scoped to the owning user |

## 6. End-to-end scenarios

### 6.1 Create user, issue password, and activate account use

```text
Admin / Users / Add user
    -> Client validates details
    -> POST /users creates account (no plaintext password)
    -> POST /users/{id}/password-reset
        -> API generates random temporary credential
        -> bcrypt hash persisted, temporary expiry/use state and audit written
        -> one-time credential returned with no-store headers
    -> Admin securely communicates credential to user outside the application
    -> User POSTs /auth/login
        -> API checks status, lock, hash, temporary expiry/consumption
        -> success consumes temporary-login allowance and returns forced-change flag
    -> Client routes user to /password
    -> User PUTs /auth/password with current and compliant new password
        -> API hashes permanent password, clears temporary flags, increments token version
    -> Client clears auth state; user signs in with permanent password
```

If reset fails after user creation, the account remains; Admin must retry password issuance from the user list. If the temporary password expires or is consumed before permanent password change completes, issue a replacement.

### 6.2 Register and approve a person

```text
Registration role / Register Person
    -> GET /persons/registration/options
    -> Choose category
    -> Dynamic common + category form
    -> Save draft (optional) / resume own draft (optional)
    -> Validate consent, profile, category fields, access, photo, documents
    -> POST /persons multipart
        -> Validate role + active category + approval setting + active references
        -> Decode/normalize image and validate documents
        -> Encrypt passport/ID-proof values
        -> Transaction: person + areas + submission history + audit + notifications
    -> If approvalRequired false: ACTIVE
       If approvalRequired true: PENDING
    -> Approval Center queue
    -> Approver approves/rejects (self-approval forbidden; rejection note required)
    -> Status/history/audit/notification updated
    -> Active person becomes eligible for Gate checks
```

### 6.3 Register a Gate walk-in visitor

```text
Guard enters Gate / Register Visitor
    -> UI limits options to Visitor
    -> Guard completes visitor registration and photo/consent
    -> API enforces Visitor only, clears area assignments, source=WALK_IN
    -> Registration commits as ACTIVE or PENDING based on category approval policy
    -> If ACTIVE: UI returns to Gate with person code and gate/area context
    -> Guard performs explicit lookup and photo confirmation
    -> Gate checks current eligibility; Guard completes check-in
```

Registration does not automatically check in the visitor. A pending walk-in cannot bypass required approval.

### 6.4 QR/mobile/name lookup to exit

```text
Guard chooses active location and lookup input (exactly one method)
    -> POST /gate/lookups
    -> API validates location/input, verifies signed QR where supplied
    -> API searches and returns masked candidates/outcome, logs lookup
    -> Guard selects candidate and confirms photograph/identity
    -> If restricted unassigned area: acknowledge override warning
    -> POST /visits
        -> API rechecks active state, expiry, blacklist, open visit, location rule
        -> create open visit and audit
    -> At departure POST /visits/{visitId}/check-outs
        -> close open visit; audit
```

### 6.5 Administrator reconciliation

1. Admin reviews an open visit requiring correction.
2. Admin confirms the reconciliation action and supplies a note.
3. API requires valid visit ID and a 1–500 character note.
4. Repository closes the open visit and writes audit information atomically.
5. If no open visit remains, API returns a conflict; it does not create a duplicate close.

## 7. Interface and role access matrix

This summarizes current navigation/route policy. Individual API operations may be narrower than a screen role.

| Screen/function | Super Admin | Admin | Approver | Registration Officer | Security Guard | Viewer |
|---|---:|---:|---:|---:|---:|---:|
| Dashboard | Yes | Yes | Yes | Yes | Yes | Yes |
| Person management/detail | Yes | Yes | Yes | Yes | No | No |
| Register Person | Yes | Yes | Yes | Yes | Yes (Visitor only) | No |
| Approval Center | Yes | Yes | Yes | No | No | No |
| QR/Identity administration | Yes | Yes | No | No | No | No |
| Security Gate | Yes | Yes | No | No | Yes | No |
| Blacklist | Yes | Yes | No | No | No | No |
| Reports | Yes | Yes | Yes | Yes | No | Yes |
| Users, Master Data, Categories, Locations, Audit | Yes | Yes | No | No | No | No |
| Password screen | Any authenticated role when needed | Any authenticated role when needed | Any authenticated role when needed | Any authenticated role when needed | Any authenticated role when needed | Any authenticated role when needed |

The matrix reflects application navigation/screens; it is not a substitute for API route authorization. Direct API calls remain subject to server-side role middleware.

## 8. API input/response and validation summary

| Function | Request-level checks | Expected outcome |
|---|---|---|
| Login | username/password required and bounded; rate limit; active/unlocked credential; temporary credential unexpired/unused | Bearer session or explicit invalid-credentials/rate-limit error |
| Create user | required identity and username, mobile length, optional valid email, known role; Super Admin privilege check | Created account or validation/forbidden/conflict error |
| Password reset | positive user ID; Admin/Super Admin; target active | Temporary password and expiry with no-store headers, or not-found/forbidden |
| Password change | authenticated user; correct current password; new password 10–256 chars, letter and digit | `204` on success or explicit validation/current-password/session error |
| Category update | recognized non-empty fields; supported type/status/schema; unique keys; valid references | Updated category/audit or validation/conflict/not-found |
| Registration options | authentication and allowed registration role | Active category/schema/master/location collection |
| Draft save | positive active category, owner identity, role/category rule | Draft ID and data or validation/forbidden/not-found |
| Registration submit | metadata schema; active category/current approval state; all domain/lookup checks; consent/photo/file rules | Person ID/code/status or validation/conflict/forbidden/file error |
| Approval decision | positive person ID; decision enum; rejection reason minimum; allowed role; pending/non-self conditions | Updated decision/history/status or conflict/forbidden |
| Gate lookup | exactly one lookup identifier; active location; QR signature/version | Candidate results with outcomes and audit/log, or invalid input/location/QR |
| Check-in | positive person/gate/area; permitted role; current eligibility and open visit/location checks | Open visit, required warning acknowledgement, or explicit conflict/validation |
| Check-out | positive visit/gate/area; permitted role; open visit exists | Closed visit or no-active-visit conflict |
| Reconciliation | Admin/Super Admin; positive visit ID; required note | Closed visit plus audit, or conflict |
| Blacklist add/lift | valid person/reason/date range/remarks; lift note; privileged role | Open/lifted record plus audit, or validation/conflict |
| Audit/notification | authenticated role; user-scoped notification identity; pagination/filter validation | Permitted page/state change or authorization/input error |

The API uses centralized error handling and does not intentionally silently convert invalid input into a successful write.

## 9. Data protection, audit and file requirements

| ID | Requirement | Status |
|---|---|---|
| FR-SEC-001 | Passwords shall be stored as bcrypt hashes; no plaintext password shall be persisted. | Implemented |
| FR-SEC-002 | Passport/ID-proof values shall be encrypted before persistence and omitted from ordinary detail responses. | Implemented |
| FR-SEC-003 | Private media shall not be served from a public static directory; routes shall verify person/file association and authorization. | Implemented |
| FR-SEC-004 | Gate lookup shall mask mobile values in returned candidates and lookup log metadata. | Implemented |
| FR-SEC-005 | Login/registration/approval/visit/admin operations shall retain audit information where implemented. | Implemented |
| FR-SEC-006 | Audit rows shall be append-only and database-protected from update/delete. | Implemented |
| FR-SEC-007 | Temporary password API response shall disable caching. | Implemented |
| FR-SEC-008 | Production must use stable, separate JWT/QR secrets, appropriate encryption secret, TLS database connection, exact UI origin, and configured trusted proxy hops/login limit. | Deployment configuration requirement |
| FR-SEC-009 | Malware scanning, managed object storage, production retention automation, and online key rotation/migration shall be provided. | Not implemented |

Default upload location is `UPLOAD_DIRECTORY` or `./private-uploads` relative to the API working directory. Operators must provide private access controls and backups for local storage.

## 10. Non-functional operational requirements

| ID | Requirement | Status / note |
|---|---|---|
| NFR-001 | API shall be configured for Node.js 22+ and PostgreSQL 16 per project documentation. | Implemented/documented |
| NFR-002 | Production API shall configure `TRUST_PROXY_HOPS` as a non-negative integer. | Enforced at startup |
| NFR-003 | Production API shall use PostgreSQL SSL and securely managed secrets. | Required by deployment configuration; not a deployment deliverable |
| NFR-004 | Vite development UI shall proxy `/api` to local API port 6200 by default. | Implemented |
| NFR-005 | API and UI changes shall be verified using project tests and ESLint; UI shall also pass production build. | Available checks |
| NFR-006 | Browser layout checks shall use synthetic fixtures and must not expose live personal data. | Test boundary |
| NFR-007 | Real camera hardware, torch behavior, and full live registration-to-checkout flow shall be verified in an environment with appropriate hardware/database. | Not implied by unit/component test pass |
| NFR-008 | Offline gate workflow shall have an operational paper-register procedure because software queue/replay is absent. | Implemented operational boundary |

## 11. Verification and test evidence

Run commands from each project directory:

```powershell
Push-Location .\Maitribodh-API
npm test
npm run lint
Pop-Location

Push-Location .\Maitribodh-UI
npm test
npm run lint
npm run build
Pop-Location
```

The API test suite covers authentication, users, category/lookup/location services and repositories, persons/registration, approvals, QR, Gate, visits, blacklist, reports, dashboard, middleware, and routes. The UI suite covers the screens and role/navigation flows including Register, Gate, approvals, person management, user administration, categories, locations, reports, blacklist, QR, dashboard, and audit/activity.

Automated tests do not replace a live acceptance test for real camera hardware, production secrets, database TLS, or full database/file registration-to-visit behavior. See [MAMS_IMPLEMENTATION_STATUS.md](./MAMS_IMPLEMENTATION_STATUS.md) for the recorded evidence and limits.

## 12. Explicit non-requirements for current release

The following shall not be inferred from schema structures, labels, or earlier mockups:

1. Presence of `bulk_upload` database table does not mean bulk-upload user workflow is implemented.
2. `can_bulk_upload` flag does not imply a complete CSV/photo import feature.
3. A file attachment facility does not mean category-specific mandatory document rules exist.
4. A list filter in one screen does not imply every requirement's filter/export combination is implemented.
5. Local file persistence does not imply S3 integration or malware scanning.
6. QR public lookup does not expose full person records and does not implement an account-enrollment OTP.
7. A Gate visitor registration does not check the visitor in automatically.
8. The included role matrix is not a custom role or permission matrix.
9. CSV export does not imply XLSX generation or complete cross-page export.
10. Passing mocked tests does not demonstrate hardware camera performance or production readiness.

## 13. Traceability to business outcomes

| Business objective | FRD areas |
|---|---|
| Govern access to the application | FR-AUTH, FR-USER, FR-RBAC |
| Capture structured person information | FR-CAT, FR-MASTER, FR-REG |
| Ensure required review | FR-APR |
| Verify identities and record visits | FR-GATE, FR-VIS, FR-QR |
| Control prohibited access | FR-BLK, FR-VIS |
| Manage reference records | FR-CAT, FR-MASTER, FR-LOC |
| Monitor operations and preserve accountability | FR-OPS, FR-AUD, FR-NOT, FR-SEC |

## 14. Related documents

- [Business Requirements Document](./MAMS_BRD.md)
- [Implementation and Flow Guide](./MAMS_IMPLEMENTATION_GUIDE.md)
- [Implementation Status and Gaps](./MAMS_IMPLEMENTATION_STATUS.md)
- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
- [API README](../Maitribodh-API/README.md)
- [UI README](../Maitribodh-UI/README.md)
