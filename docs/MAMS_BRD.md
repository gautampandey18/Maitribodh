# Maitribodh Access Management System
# Business Requirements Document (Current Implementation)

| Document property | Value |
|---|---|
| Document type | Business Requirements Document (BRD) |
| System | Maitribodh Access Management System (MAMS) |
| Baseline | Current implementation in this repository |
| Status | As-implemented description |
| Related documents | [Functional Requirements Document](./MAMS_FRD.md), [Implementation and Flow Guide](./MAMS_IMPLEMENTATION_GUIDE.md), [Implementation Status](./MAMS_IMPLEMENTATION_STATUS.md) |

## 1. Purpose

This BRD describes the business need, users, scope, rules, and end-to-end operating workflows supported by the current MAMS application. It is intentionally based on implemented application behavior. It does not treat unimplemented requirements from earlier mockups or source specifications as delivered.

MAMS provides a controlled way to register people, review registrations where required, assign access, identify people at the gate, record entry/exit visits, and administer the categories, lookup values, locations, portal accounts, and reports used by those operations.

## 2. Business context and problem

The organization needs a consistent operational record for people requiring access and for the staff who manage that access. Registration information must be collected in category-appropriate forms; some categories require review before becoming active. At the gate, staff need to identify a person, check their status and access conditions, and retain a visit record. Administrators need a governed way to manage portal accounts and reference data and to review operational activity.

The current application supports these activities through a browser client, an API, and a PostgreSQL database. It supplements rather than replaces offline contingency procedures: when network or application access is unavailable, gate staff are directed to use the paper register.

## 3. Business objectives

1. Maintain a central, auditable record of people, categories, access assignments, registration status, and visits.
2. Collect registration data using category-specific form fields while retaining common identity and contact fields.
3. Apply approval workflows only to categories configured as requiring approval.
4. Give operational users role-appropriate screens and enforce the same access control at the API.
5. Enable gate staff to verify QR codes or search for a person and record check-in/check-out decisions.
6. Protect sensitive identity values, uploaded documents, credentials, and audit data.
7. Provide administrators with tools to manage portal users, categories, lookup masters, gates/areas, and blacklist entries.
8. Make status and operational information available through dashboards, reports, notifications, and audit views.

## 4. Stakeholders and user roles

| Role | Business responsibility in the current implementation |
|---|---|
| Super Admin | Administrative access including user, category, location, master, blacklist, QR, audit, and approval activities. Only Super Admin may assign the Super Admin role. |
| Admin | Operational administration, user provisioning, category/master/location/blacklist/audit management, approvals, person management, reporting, and permitted visit reconciliation. |
| Approver | Review pending registrations, decide approval/rejection, access person/registration workflows permitted by the role, and view reports. |
| Registration Officer (`REG_OFFICER`) | Register/manage person records and use operational/reporting functions permitted by the role. |
| Security Guard (`SECURITY_GUARD`) | Use Gate workflows, identify and verify people, record visits, and register Visitors only. |
| Viewer (`VIEWER`) | Read-only dashboard/report access where allowed. |

The six roles above are the implemented built-in roles. Custom role creation, configurable permission-code matrices, and conversion to a different role model are outside the current baseline.

## 5. Scope

### 5.1 In scope — implemented business capabilities

- User sign-in, logout, password change, temporary-password issuance/reset, account deactivation, and role-based access.
- Person registration using active categories and dynamic category form schemas.
- Draft saving and resumption by the creator.
- Required photograph capture/upload and optional document upload.
- Approval/rejection and resubmission flows where configured.
- Person detail, basic contact edit, access assignment/expiry maintenance, photo/document handling, and activation/deactivation.
- Signed/versioned QR identity, public QR lookup, and authenticated Gate lookup.
- Gate check-in, check-out, restricted-area warning/acknowledged override, and administrative reconciliation.
- Dashboard, reports, notification management, audit browsing, and supported CSV exports.
- Administration of portal users, categories/schema, master values, gates/areas, and blacklist entries.

### 5.2 Out of scope / not currently implemented

- Bulk registration from CSV/photo packages, downloadable templates, and row-level import result reports.
- Username-first password-free enrollment, OTP/email/WhatsApp delivery, and the alternative unauthenticated account-claim/password flow.
- Custom roles or a database-managed permission matrix.
- Full category-specific profile editing and registration-wizard resubmission parity.
- Named mandatory document schemas, document rule editing, and master-value deletion.
- Complete gate/device/shift assignment administration, torch controls, automatic walk-in check-in, or accompanying-person name/count editing at check-in.
- Offline visit queueing and later replay; offline operation uses the paper register.
- Automated overstay scheduling/alerting, participant expiry fully derived from program/batch dates, and all requested occupancy groupings.
- Full filtered audit export/print, real XLSX export, full report filter parity, and complete QR KPI/reissue parity.
- S3 file storage, malware scanning, production deployment/retention automation, and key-rotation migration workflows.

The full current gap inventory is maintained in [MAMS_IMPLEMENTATION_STATUS.md](./MAMS_IMPLEMENTATION_STATUS.md).

## 6. Business process overview

```text
Administrator sets up users, categories, masters, gates, and areas
        |
        +--> Admin creates portal account and issues temporary password
        |       -> User signs in once with temporary password
        |       -> User must choose permanent password
        |
        +--> Registration user selects active person category
                -> Enters common profile + category-specific details
                -> Assigns access and uploads photo/documents
                -> Submits registration (or saves a draft)
                        |
                        +--> Approval not required: person becomes ACTIVE
                        |
                        +--> Approval required: person becomes PENDING
                                -> Approver approves or rejects with reason
                                -> Approved person becomes eligible for Gate
                                        |
                                        +--> QR/mobile/name lookup
                                        -> identity/photo confirmation
                                        -> status/access checks
                                        -> check-in visit
                                        -> check-out visit
```

Audit records and notifications are generated by applicable operations throughout these workflows. Role checks and business validations are performed by the API; the user interface provides the corresponding interaction and immediate feedback.

## 7. Business workflows

### 7.1 Portal user onboarding

1. Admin or Super Admin enters a new user's name, mobile, optional email, username, role, and supported flags.
2. The system creates the account without a permanent plaintext password supplied by the creator.
3. The system generates a cryptographically random temporary password and returns it to the authorized administrator once, with an expiry timestamp.
4. The system stores only the bcrypt password hash, marks the account as requiring a password change, and sets the temporary credential to expire after 24 hours.
5. User signs in with username and temporary password. The temporary credential is usable for one successful login only.
6. The user is directed to set a permanent password before accessing other screens. The new password must be at least 10 characters and contain a letter and digit.
7. If the credential expires or has already been consumed, an administrator issues another temporary password.

### 7.2 Person registration and category routing

1. Registration user requests current active categories and registration lookup data.
2. User selects one category. The system applies its form type, persisted schema if present, default permission level, and approval policy.
3. User supplies common identity/contact details and the fields configured for the category.
4. User supplies a photograph, consent, optional documents, areas/access information, and any applicable category details.
5. User can save an incomplete draft. Draft ownership remains with the creator; sensitive identity numbers and file bytes must be re-entered/reselected on resume.
6. On submission, the API repeats validation against current category/master data and the user's role.
7. The system creates an active person if approval is not required; if approval is required, the system creates a pending person and an approval submission.
8. Registration, area assignments, approval history (when applicable), audit, and notifications are persisted as one database transaction.

### 7.3 Approval

1. An Admin, Super Admin, or Approver opens the approval queue.
2. The approver reviews person/category details and selects Approve or Reject.
3. Rejection requires a meaningful reason of at least 10 characters.
4. The system checks that the submission is still eligible and that the actor is not approving their own submission.
5. The system updates person status and approval history, writes audit information, and creates relevant notifications.
6. Rejected registrations may use the existing resubmission operation where authorized. Full edit-through-registration resubmission is not currently supported.

### 7.4 Gate entry/exit

1. Guard selects an active gate and area context and looks up a person by signed QR, mobile, or text query.
2. The system checks signature/version and returns candidates with masked mobile data and an outcome.
3. Guard selects the right candidate if multiple results exist and confirms the displayed identity/photo.
4. The system checks current active status, blacklist, expiry, existing open visit, and the selected area assignment.
5. When an unassigned restricted area is selected, the system shows a warning. Guard must acknowledge it; the visit and audit retain the override.
6. Successful check-in opens a visit. At departure, the guard records check-out against the open visit.
7. Admin/Super Admin may reconcile an open visit with a required note; reconciliation is audited.
8. If MAMS is unavailable, gate staff use the paper register; the application does not queue offline events.

### 7.5 Administration and monitoring

- Admin/Super Admin create/deactivate accounts and issue/reset temporary passwords.
- Admin/Super Admin manage category approval settings and registration fields, lookup values, and Gate/Area records.
- Admin/Super Admin add or lift blacklist entries with reasons/notes.
- Authorized users monitor dashboard summaries and reports.
- Admin/Super Admin inspect paginated/filterable audit history; current audit CSV export is limited to the displayed page.
- Users see and mark their own notifications as read.

## 8. Business rules

| ID | Business rule |
|---|---|
| BR-01 | Only active portal accounts may authenticate or receive a usable temporary password. |
| BR-02 | Admin and Super Admin manage portal accounts; only Super Admin may assign Super Admin. |
| BR-03 | A newly issued temporary password expires after 24 hours and is usable for one successful login; first login requires password change. |
| BR-04 | Permanent password length is 10–256 characters and it must include at least one ASCII letter and one digit. |
| BR-05 | Five failed password attempts within the implemented 15-minute account failure window lock the account for 15 minutes; the deployment HTTP rate limit is separately configured. |
| BR-06 | Registration can use only an active category and active referenced master data. |
| BR-07 | A category with approval requirement unset (`null`) cannot accept a registration submission until the rule is confirmed. |
| BR-08 | A category requiring approval creates a `PENDING` person; a category not requiring approval creates an `ACTIVE` person. |
| BR-09 | Security Guard can register Visitor form types only. Guard-created registrations cannot assign permission level or area at creation and are tagged as walk-in source. |
| BR-10 | New person registration requires consent and a decodable JPG/PNG profile photo no larger than 2 MB. Legacy records may be photo-less and can be repaired at Gate under the implemented rules. |
| BR-11 | Category-specific required fields, referenced lookup relationships, and date/number/option formats must pass API validation. |
| BR-12 | Passport and ID-proof values are encrypted before storage; drafts do not retain those values or uploaded bytes. |
| BR-13 | Approval self-decision is not allowed for Admin, Super Admin, or Approver. Reject requires a reason of at least 10 characters. |
| BR-14 | Gate check-in requires a valid active person, no disqualifying blacklist/expiry/open-visit condition, and a valid gate/area selection. |
| BR-15 | An unassigned restricted area requires explicit Security acknowledgement; the override is retained on visit/audit records. |
| BR-16 | A blacklisted person may be prevented from entering but may check out if already inside with an open visit. |
| BR-17 | Gates and Areas are separate location types; a Gate cannot be configured as restricted. |
| BR-18 | Mobile changes advance the active person's QR version, invalidating older signed QR payloads. |
| BR-19 | Audit rows are append-only; normal updates/deletes are unavailable and a database trigger rejects them. |
| BR-20 | Notification read-state is scoped to the authenticated user. |
| BR-21 | At least one active category must remain. |
| BR-22 | Offline gate events are recorded using the paper register and are not replayed through an application queue. |

## 9. Business data and records

The system maintains:

- Portal users, roles, status, password hash, login counters/lock, token version, and temporary-password state.
- Categories, form schema, approval rule, status, and access defaults.
- Lookup/master values with types, parent relationship, optional category relationship, metadata, and status.
- Locations as Gates or Areas; area restriction and optional department association.
- Person identity, contact, category details, consent metadata, access status/expiry, QR version, encrypted identity values, file metadata, and area assignments.
- Approval decision history.
- Blacklist records, reasons, dates, remarks, and lift information.
- Visit check-in/check-out details, device/actor context, and location override state.
- User notifications and read state.
- Audit events including actor, event/module, entity, before/after values when supplied, and request context.

Database constraints and relationships are defined in `Maitribodh-API/db/migrations`. File bytes are stored in a private local directory by default; file metadata is stored against the person.

## 10. Non-functional and operational expectations

- **Access control:** UI routes and API operations apply the role model. API access checks are required even if a screen is hidden.
- **Credential safety:** passwords are bcrypt-hashed; secrets are environment configuration and must not be committed.
- **Sensitive data:** passport/ID-proof values are encrypted; file access is authenticated and scoped.
- **Auditability:** material workflows create audit records; audit history is append-only at the database.
- **Integrity:** registration/approval/visit operations use transactional repository writes where required; database constraints reinforce data relationships.
- **Transport/app hardening:** API config includes Helmet, origin-restricted CORS, bounded JSON parsing, structured request logging, and centralized error handling.
- **Availability boundary:** no offline visit queue exists. Paper register is the business continuity process for gate operations.
- **Deployment boundary:** this repository documents local development and application behavior; S3, malware scanning, automated production deployment, full retention automation, and key rotation are not claimed delivered.

## 11. Acceptance criteria for the current business baseline

The implemented baseline is considered functionally demonstrated when:

1. A privileged administrator can create a portal user, issue a temporary credential, and the user is forced through first-login password change.
2. Registration retrieves active categories and master values, renders the selected category form, accepts a required photo, validates the submission, and stores it with the correct approval state.
3. A saved draft can be resumed by its owner without exposing its sensitive identity numbers or file bytes.
4. An approval-required registration can be approved/rejected by an eligible non-self approver, with reason validation, audit, and status update.
5. Gate staff can resolve a person by supported lookup method, confirm identity, and have the API apply blacklist/status/expiry/open-visit/area rules before check-in.
6. A restricted unassigned-area override requires acknowledgement and is recorded; an open visit can be checked out or reconciled by an authorized user.
7. Administrators can maintain users, categories/schema, masters, locations, and blacklist records; relevant changes appear in audit.
8. Dashboard/report/audit/notification screens return data within their allowed roles.
9. API tests, UI tests, linters, and UI production build pass. Real camera and live-database testing are reported separately from automated test evidence.

## 12. Assumptions, dependencies, and limitations

- PostgreSQL schema `mams` is migrated before API use; currently migration scripts are checksum-aware.
- Registration accuracy depends on current master data and category configuration. Participant registration, for example, depends on Program/Batch master setup.
- Approval policy is controlled by category configuration; an unset rule intentionally blocks submission.
- Upload directory must be private, backed up appropriately, and outside a public web root.
- Encryption key source must remain stable until an explicit data-key migration/rotation process exists.
- UI and API must be configured for matching origins/ports.
- Automated tests and browser checks using synthetic fixtures do not prove camera-hardware behavior or a full production/live-database flow.
- Requirements in earlier business/functional documents and mockups conflict in some areas. This BRD reflects the shipped implementation and the decisions recorded in [MAMS_IMPLEMENTATION_STATUS.md](./MAMS_IMPLEMENTATION_STATUS.md).

## 13. Reference documents

- [Functional Requirements Document](./MAMS_FRD.md)
- [Implementation and Flow Guide](./MAMS_IMPLEMENTATION_GUIDE.md)
- [Implementation Status and Gaps](./MAMS_IMPLEMENTATION_STATUS.md)
- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
- [API README](../Maitribodh-API/README.md)
- [UI README](../Maitribodh-UI/README.md)
