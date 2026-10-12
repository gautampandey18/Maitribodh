# Requirements And Scope

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Source_Baseline_ID: SRC-BL-005
- Document_Version: 3.5
- Date: 2026-10-09
- Owner: Kantimati Iyer, Product_Owner (RACI-001, SRC-011)

## Purpose
- Requirements_Objective: Consolidate the current requirements and approved CR-001–CR-004 decisions into a traceable application scope, preserving G2/G3 release conditions.
- Source_Discipline: SRC-001 governs business policy, SRC-002 detailed behavior, SRC-003 target technology, SRC-004/007/009 proposed data contracts, SRC-006 visual design only, and signed SRC-011 decisions govern approved changes for build/UAT.

## Project Overview
MAMS is a single-Ashram responsive web/PWA system for registering people, issuing individual QR identifiers, managing approvals, recording gate visits, tracking occupancy, blocking blacklisted entries, and providing reports/audit history. The project starts without legacy-data migration. It is not a physical access-control system; Security personnel manually verify identity and assigned-location access.

| Objective_ID | Objective | Measure_or_Status | Source_IDs |
|---|---|---|---|
| BO-01 | Ensure people entering are registered | Coverage target not specified | SRC-001 |
| BO-02 | Identify a registered person with a unique QR | QR generated for each active person | SRC-001, SRC-002 |
| BO-03 | Verify identity at gates quickly | Architecture target: QR scan result within 2 seconds | SRC-001, SRC-003 |
| BO-04 | Record entry and exit with gate/location | Check-in/out records with timestamps and guard | SRC-001–SRC-004 |
| BO-05 | Show current occupancy | Count of open visits; accompanying count unresolved | SRC-001–SRC-003 |
| BO-06 | Govern Staff and Parivar Member registration | Approval workflow, including resubmission | SRC-001, SRC-002 |
| BO-07 | Prevent blacklisted persons from checking in | No override described | SRC-001, SRC-002 |
| BO-08 | Provide operations reporting and audit trail | Visit History export in CSV/XLSX; other report export later | SRC-001–SRC-003 |

## User Personas

| Persona_ID | Persona | Goals | Access_and_Constraints | Related_Workflows | Source_IDs |
|---|---|---|---|---|---|
| PER-001 | Super Admin | Bootstrap and manage Admin accounts; full system access | First account created by IT; schema supports SUPER_ADMIN | WF-001, WF-007 | SRC-001–SRC-003, SRC-007 |
| PER-002 | Admin | Manage users, masters, registrations, approvals, blacklist, reports and audit | Only role that adds/removes blacklist; Staff profile edit; only Super Admin creates Admin | WF-001–WF-008 | SRC-001, SRC-002 |
| PER-003 | Approver | Register and decide Staff/Parivar applications | Cannot manage users/masters, blacklist or edit Staff profiles; cannot approve own submission except sole-Admin exception as specified in query design | WF-001, WF-003 | SRC-002, SRC-009 |
| PER-004 | Registration Officer | Register/edit eligible people, view reports | Cannot approve, delete, manage masters, or edit Staff profiles | WF-001, WF-002 | SRC-002 |
| PER-005 | Security Guard | Search/scan, verify photo, check in/out, register walk-in Visitor | Cannot edit/approve/configure; manually checks location permissions | WF-004, WF-005 | SRC-001, SRC-002 |
| PER-006 | Viewer | View dashboard and reports | Read-only | WF-006 | SRC-001, SRC-002 |
| PER-007 | Registered person | Retrieve own QR from public lookup | No login/OTP/CAPTCHA; DEC-001 adds IP rate limits and response minimization; multiple matches may appear for shared mobile | WF-003 | SRC-001–SRC-003, SRC-011 |

## Scope

| Scope_ID | Classification | Capability | Priority | Decision_Status | Source_IDs |
|---|---|---|---|---|---|
| SCP-001 | In_Scope | Person registration for six base categories plus configured broad categories | High | Broad/base mapping unresolved | SRC-001, SRC-002 |
| SCP-002 | In_Scope | Role-based portal login, user management, five business roles plus Super Admin bootstrap | High | Target | SRC-001–SRC-003 |
| SCP-003 | In_Scope | Staff/Parivar approvals, rejection, editing and resubmission | High | Target; final policy details open | SRC-001, SRC-002 |
| SCP-004 | In_Scope | Unique per-person QR and public mobile lookup with signed DEC-001 controls | High | Approved for build; pen test is a G3 release condition under WVR-001 | SRC-001–SRC-003, SRC-011 |
| SCP-005 | In_Scope | Gate scan/search, walk-in Visitor, eligibility checks, visit check-in/out | High | Target | SRC-001–SRC-004 |
| SCP-006 | In_Scope | Dynamic category, subcategory, department, job, permission, gate/location and lookup masters | High | Seed values are samples | SRC-001, SRC-002, SRC-008 |
| SCP-007 | In_Scope | Permission-controlled bulk upload with row errors and QR creation | High | Template and approval behavior open | SRC-001, SRC-002, SRC-009 |
| SCP-008 | In_Scope | Dashboard, occupancy, overstay alert, standard reports and audit log | High | Accompanying occupancy and some cutoffs open | SRC-001–SRC-003 |
| SCP-009 | In_Scope | Photo/document upload, consent capture, privacy notice, data-principal actions and POL-001 retention | High | Interim policy approved for build/UAT; counsel review remains a G3 condition | SRC-001–SRC-004, SRC-011 |
| SCP-010 | Out_Of_Scope | Physical access hardware/cards, RFID/NFC, biometric/CCTV, native mobile app | Medium | Excluded from MVP | SRC-001 |
| SCP-011 | Out_Of_Scope | OTP, SSO, MFA, email/SMS/WhatsApp, external ERP/HRMS/site integrations | Medium | Excluded from Phase 1 | SRC-001–SRC-003 |
| SCP-012 | Out_Of_Scope | Offline software mode/synchronization; multilingual and multi-Ashram operation | Medium | Excluded; paper register used during outage | SRC-001, SRC-003 |
| SCP-013 | Out_Of_Scope | Legacy data migration and multi-level/dynamic approval chains | Medium | Excluded | SRC-001 |
| SCP-014 | Out_Of_Scope | BI semantic layer, predictive analytics, data pipelines and ML/AI model lifecycle | Low | Not evidenced; Data & Analytics subtype N/A | SRC-001–SRC-009 |

## Functional Requirements

| Requirement_ID | Requirement_Statement | Priority | Source_IDs | Source_Reference | Acceptance_Criteria |
|---|---|---|---|---|---|
| FR-001 | Provide authenticated portal access with Super Admin, Admin, Approver, Registration Officer, Security Guard and Viewer authorization. Super Admin alone creates Admin users. | High | SRC-001–SRC-003, SRC-007 | BR-25; FRD 3, 5; SQL app_user | API enforces role permissions on every protected operation; UI hiding is not authorization. |
| FR-002 | Register people with mandatory photograph, mobile, residency and category-specific fields; assign category-derived permission and one or more locations. | High | SRC-001, SRC-002, SRC-007 | BR-17, BR-18, BR-26, BR-28; FRD 6–12 | Invalid required fields block save; Non-Resident/International requires passport; Resident disables passport; permission/location are recorded. |
| FR-003 | Support six base categories and configurable broad categories; category/master changes require no approval and take effect immediately. | High | SRC-001, SRC-002, SRC-008 | BR-23; FRD 4; OI-16 | Categories and mappings are data-driven; production seed is not finalized until business confirms mapping. |
| FR-004 | Route Staff and Parivar Member registrations to approval; other in-scope categories become Active immediately. Rejection requires reason and resubmits the same record while preserving history. | High | SRC-001, SRC-002, SRC-007, SRC-009 | BR-10, BR-11, BR-14; FRD 14; CR-006 | Approval/rejection/resubmission updates status and append-only history; only authorized roles decide; ADMIN self-decision is allowed only when exactly one active ADMIN exists; APPROVER self-decision is denied. |
| FR-005 | Allow permitted users to bulk-upload registrations; validate each row, report failures and issue QR for created active people. | High | SRC-001, SRC-002, SRC-007, SRC-009 | BR-27; FRD 6.5; OI-17 | Unauthorized user cannot upload; row errors include row number/reason; audit records start, completion and errors. |
| FR-006 | Allow duplicate registrations and repeated mobile numbers; each registration has its own Person ID, status and QR. Search/lookup presents all matching registrations with category. | High | SRC-001, SRC-002, SRC-007, SRC-009 | BR-04, BR-05; FR-REG-02; OI-13 | Same mobile may match multiple records; no unique-mobile constraint or duplicate rejection is added. |
| FR-007 | Generate a unique QR when a person becomes Active; regenerate only when encoded data changes and invalidate the previous version. | High | SRC-001–SRC-004, SRC-009 | BR-06, BR-13; FRD 15–16; OI-19 | Each person/registration QR is unique even with shared mobile; inactive/non-active persons are not returned by public lookup. |
| FR-008 | Provide public QR lookup without login, OTP or CAPTCHA. Apply 10 lookups/minute and 50/day per client IP; show first name + last initial, category and QR only; use a uniform response for non-active cases, WAF rules and CloudWatch abuse alarms. | High | SRC-001, SRC-003, SRC-009, SRC-011 | DEC-001, CTRL-01–06, CR-001 | Rate limits return HTTP 429; response never echoes mobile/full name; every lookup is audited with masked mobile; penetration test is required before G3. |
| FR-009 | Support gate QR scan or mobile search, photo review, eligibility decision, check-in/out and walk-in Visitor registration. | High | SRC-001–SRC-004, SRC-009, SRC-011 | BR-01, BR-08, BR-09; FRD 17–19; CR-007 | Reject non-Active, blacklisted or already-open visit; allow only Visitor walk-in; show denial reason; unassigned restricted area returns warning-only, with Security Guard manual verification and audited outcome. |
| FR-010 | Record each visit’s check-in/out gate, location, timestamp, guard/device and accompanying-member details; allow at most one open visit per person. | High | SRC-001, SRC-002, SRC-007, SRC-009 | BR-19–BR-21; SQL unique partial index | A second open visit and checkout without an open visit are rejected; Admin correction requires recorded note and audit entry. |
| FR-011 | Allow only Admin to add/remove a blacklist entry with reason; block blacklisted entry without override and audit the attempt/change. | High | SRC-001, SRC-002, SRC-007, SRC-009 | BR-08, BR-22; FRD 21 | Block is unconditional; add/remove is Admin-only, reason required, entry and gate attempt audited. |
| FR-012 | Show occupancy, check-in/out counts, pending approvals, blacklist attempts and an inside list; no automatic checkout. | High | SRC-001–SRC-003, SRC-009 | BR-21; FRD 20 | Occupancy is open visits; Admin manually reviews/closes forgotten visits; treatment of accompanying people remains unresolved. |
| FR-013 | Create in-app registration, approval, rejection, blacklist and overstay notifications. | Medium | SRC-001–SRC-003, SRC-009 | FRD 23; architecture 11–12 | No Phase 1 email, SMS, WhatsApp or OTP integrations; overstay recipients/cutoffs require confirmation. |
| FR-014 | Provide registration, visit-history, occupancy, staff, approval and blacklist reports; support Visit History CSV/XLSX export. | High | SRC-001–SRC-003, SRC-009 | BR-08; FRD 22; query RPT-01–06 | Visit History supports source-defined filters/export; other report exports are not assumed in MVP. |
| FR-015 | Record all data changes, account/login events, approval, QR, gate, blacklist, bulk upload and export activity with actor/time/old/new values; Admin views audit log. | High | SRC-001–SRC-004, SRC-009, SRC-011 | BR-30; FRD 24; SQL audit_log; POL-001 RET-08 | Audit coverage is verified per event class; audit retention is 7 years interim and counsel review remains before G3. |
| FR-016 | Admin manages users, status, bulk-upload permission, categories, lookups, departments, jobs, gates and areas. | High | SRC-001–SRC-003, SRC-007–SRC-009 | FRD 4–5; BR-23, BR-25, BR-27 | Changes follow role policy and are audited; sample lookup values are not promoted as approved master data. |
| FR-017 | Store photographs, documents, bulk files and exports in private object storage with source-defined file validation and POL-001 lifecycle. | High | SRC-002, SRC-003, SRC-007–SRC-009, SRC-011 | Architecture 3, 9–10; SQL file keys; POL-001 RET-02/05/11/12 | Validate file signature/type/size; private S3/KMS and short-lived signed downloads; apply the approved retention job and audit each run. |
| FR-018 | Deliver a responsive English-language web/PWA experience with device-camera QR scan on supported mobile/tablet devices. | High | SRC-001–SRC-003, SRC-006 | BRD assumptions; architecture 3.1 | Role-appropriate navigation and responsive gate interaction; browser/device compatibility remains to be verified. |
| FR-019 | Provide account password lifecycle, failed-login lockout, role-specific JWT expiry and token revocation as specified in the architecture/FRD and CR-004. | High | SRC-002, SRC-003, SRC-007, SRC-009, SRC-011 | FRD 5.3–5.7; architecture 9; CR-004 | Implement bcrypt cost 12, 5-failure/15-minute lockout, Security Guard JWT expiry at 12 hours, other-role JWT expiry at 30 minutes from issuance (absolute, not idle), and token_version revocation. |
| FR-020 | Support one Ashram, English, no legacy migration, paper-register outage fallback and manually enforced location checks; use RB-001 outage reconciliation. | High | SRC-001–SRC-003, SRC-011 | BR-24, BR-29; RB-001 | When an outage exceeds 2 minutes, record entries on paper; within 24 hours Admin closes visits with the paper reference, audited; drills remain required before G3. |
| FR-021 | Present an approved privacy notice and capture explicit consent before registration; store consent timestamp, notice version and actor; capture guardian consent for minors; allow audited Admin erasure/anonymization under POL-001. | High | SRC-001, SRC-002, SRC-007, SRC-011 | DEC-002, POL-001, CR-002-01–06 | Consent is mandatory for manual/walk-in flows and recorded in person data; minors follow guardian rules; erasure is Admin-only and audited. |
| FR-022 | Apply interim retention schedule RET-01–RET-12, data-principal request handling and a nightly audited retention job guarded by JOBS_ENABLED. | High | SRC-001–SRC-004, SRC-009, SRC-011 | POL-001 RET-01–12; DEC-002; CR-002 | Retention actions run on schedule and are audited; access/correction/erasure requests follow the approved interim targets; legal review is required before G3. |

## Approved Clarification CR-004

| Change_ID | Decision | Approver | Approval_Record | Scope_Impact |
|---|---|---|---|---|
| CR-004 | Use absolute JWT expiry: 12 hours for Security Guard and 30 minutes for all other roles. This replaces the previous 30-minute idle-timeout interpretation; token_version revocation remains required. | Vineet Agrawal, Security_Owner | Approved 2026-10-09; requester-confirmed, separate evidence ID not supplied | FR-019, BL-002, session tests in 07, auth implementation in 09 |
| CR-005 | First password setup requires an Admin-issued random temporary password; hash at rest, single successful login, 24-hour expiry, one-time display to Admin for out-of-band delivery, then force password change. Username/email alone never authorizes password setup. | Vineet Agrawal, Security_Owner | Approved 2026-10-09; requester-confirmed, separate evidence ID not supplied | API-ROUTE-004/007, app_user state, BL-002, auth tests in 07 and 09 |
| CR-006 | An ADMIN may approve or reject their own submission only when exactly one active ADMIN account exists. SUPER_ADMIN does not count toward that total; APPROVER self-decisions are always denied. All decisions remain audited. | Kantimati Iyer, Product_Owner | Approved 2026-10-09; requester-confirmed, separate evidence ID not supplied | FR-004, API-ROUTE-018, BL-005, approval tests in 07 and 09 |
| CR-007 | An unassigned person at a restricted area produces a warning but does not automatically block check-in; Security Guard manually verifies access and the outcome is audited. Blacklist, non-active and already-open visit denials remain hard blocks. | Vineet Agrawal, Security_Owner | Approved 2026-10-09; requester-confirmed, separate evidence ID not supplied | FR-009, API-ROUTE-021/022, BL-009, gate tests in 07 and 09 |

## Non-Functional Requirements

| NFR_ID | Category | Metric | Target | Tolerance_or_Status | Validation_Method | Owner | Evidence | Gate_Status | Source_IDs |
|---|---|---|---|---|---|---|---|---|---|
| NFR-001 | Performance | Gate scan-to-decision API and visible result | p95 API <800 ms; user-visible <2 seconds | SLO-02 approved by DEC-003 | k6 and device E2E at CAP-04 load | QA_Owner | EVD-PERF-01 | Planned; due before G2 | SRC-003, SRC-011 |
| NFR-002 | Performance | Other API calls under peak load | p95 <500 ms at 500 concurrent sessions | SLO-03 approved by DEC-003 | k6/API load test | QA_Owner | EVD-PERF-01 | Planned; due before G2 | SRC-003, SRC-011 |
| NFR-003 | Performance | Dashboard load | <= 5 seconds; refresh every 30 seconds | Architecture target | E2E/load test | QA_Owner | Timed test report | Not tested | SRC-003 |
| NFR-004 | Availability | Production service availability | 99.5% monthly | SLO-01 approved; pilot/UAT is not production | CloudWatch SLI review | Operations_Owner | EVD-ARCH-01 / monitoring reports | Target approved; not yet measured | SRC-003, SRC-011 |
| NFR-005 | Capacity | Launch records, lifetime headroom, daily people, concurrency, gate events, annual visits | 1,000–5,000 launch records; 100,000 headroom; 3,000 normal/10,000 festival people per day; 500 concurrent; 60 gate events/min sustained, 200/min burst; 1.5M visits/year | CAP-01–06 approved by DEC-003; supersedes conflicting earlier sizing statements | k6 profile and database/index review | Architecture_Owner | EVD-PERF-01 | Approved target; load test pending G2 | SRC-001, SRC-003, SRC-011 |
| NFR-006 | Security | Password storage/lockout/API authorization | bcrypt cost 12; lock after 5 failures for 15 min; authorize each route | Architecture baseline; review approval needed | Security tests/review | Security_Owner | Test and review evidence | Not tested | SRC-002, SRC-003, SRC-007 |
| NFR-007 | Security/Privacy | Public QR lookup disclosure and abuse controls | 10/minute and 50/day per IP; first name + last initial/category/QR only; uniform non-active response; WAF and CloudWatch alarms; residual mobile-registration confirmation risk Medium (accepted) | DEC-001 Option A approved; WVR-001 defers pen test only to G3 | DAST on each UAT deploy; independent pen test before G3 | Security_Owner | TA-001, EVD-SEC-04/07 | Accepted for build; G3 pen test open | SRC-001, SRC-003, SRC-011 |
| NFR-008 | Data protection | DPDP/privacy, consent, retention and data-principal rights | POL-001 interim policy and RET-01–12 approved for build/UAT; counsel review required before G3 | DEC-002/CR-002 approved; lawful basis/notice remains subject to counsel | Consent, masking, retention, rights and erasure tests | Compliance_Owner | EVD-DATA-01–07 | Approved interim; G3 legal review open | SRC-001, SRC-003, SRC-011 |
| NFR-009 | Data integrity | One open visit per person; duplicate registrations allowed | Enforced open-visit uniqueness; do not enforce person/mobile uniqueness | Exact schema/application transaction behavior to test | Integration tests/schema review | Data_Owner | Migration and test evidence | Not tested | SRC-001, SRC-002, SRC-007 |
| NFR-010 | Security/Privacy | Protect photos, ID proofs and documents | TLS 1.2+, RDS/S3 KMS encryption, private objects, encrypted ID, expiring signed URLs and non-Admin masking | Architecture and POL-001 controls approved; evidence remains to be produced | IaC review and automated masking/access tests | Security_Owner | EVD-DATA-01–05 | Planned; due before G2/G3 | SRC-003, SRC-011 |
| NFR-011 | Quality | Automated test coverage and CI gates | >=80% line coverage on services, reducers and utils; QG-01–08 pass | TEP-001 approved; WVR-006 defers evidence to G2/G3 | CI reports and coverage gate on every merge | QA_Owner | EVD-CODE-01–03, EVD-SEC-01–06 | Enforced from first merge; evidence pending | SRC-003, SRC-011 |
| NFR-012 | Accessibility | Gate and registration UI conformance | WCAG 2.1 AA; no Critical/Serious violations | TST-06 approved in TEP-001 | axe-core Playwright plus manual keyboard/screen-reader audit | QA_Owner | EVD-A11Y-01 | Planned; due before G2 | SRC-011 |

## Workflow And Flow Summary

| Workflow_ID | Persona_or_System | Workflow_Name | Trigger | Preconditions | Main_Steps | Decisions_and_Exceptions | Postconditions | Related_FR_IDs |
|---|---|---|---|---|---|---|---|---|
| WF-001 | Registration Officer/Admin | Register person | New registration | Authenticated role, approved category/master data | Enter common/category fields, photo/documents, permission/locations; validate; submit | Staff/Parivar -> Pending; other categories -> Active; duplicate mobile is allowed; draft behavior per FRD | Person record and audit entry; QR when active | FR-001–FR-007, FR-015–FR-019 |
| WF-002 | User with permission | Bulk upload | Upload selected | `can_bulk_upload` granted | Download approved template, upload, validate rows, report errors | Template, photo packaging, approval-category handling unresolved | Upload result audited; QR for active created records | FR-005, FR-007, FR-015–FR-017 |
| WF-003 | Public user | Retrieve QR | Public lookup | Registered mobile supplied | Apply per-IP limits; search; return first name + last initial, category and QR; audit masked lookup | No login/OTP/CAPTCHA; uniform response for every non-active case; 429 after limit; show every duplicate match | QR downloaded/displayed; lookup audited | FR-006–FR-008, FR-015 |
| WF-004 | Security Guard | Gate check-in/out | QR scan/mobile search | Guard authenticated; active gate/location configured | Resolve person; verify photo and assigned location; evaluate blacklist/status/open visit; record event | Not found -> Visitor walk-in; blacklisted/nonactive/already inside -> block; offline -> paper register | Visit event or audited denial | FR-009–FR-011, FR-015, FR-018, FR-020 |
| WF-005 | Approver/Admin | Decide registration | Pending record | Approval permission; separation-of-duties rule satisfied | Review; approve or reject with reason; submitter edits/resubmits same record | Self-approval exception and full role policy require confirmation | Status/history/notification updated | FR-004, FR-013, FR-015, FR-019 |
| WF-006 | Admin/Viewer | Occupancy and reports | Dashboard/report request | Role permits view | Aggregate open visits, filter report, export Visit History | Accompanying-person counts unresolved; export scope beyond Visit History excluded | View/report returned; export audited | FR-012–FR-015 |
| WF-007 | Admin | Manage masters/users/blacklist | Admin action | Admin role; Super Admin restriction for Admin accounts | Validate change, persist, audit | Blacklist block has no override; masters are dynamic | Updated configuration/user/blacklist state | FR-001, FR-011, FR-015–FR-016 |
| WF-008 | System | Background cleanup and alerts | Scheduled job | Exactly one job runner enabled | Overstay scan every 5 min; draft cleanup daily; notification cleanup daily | Cutoff and recipients partly unresolved; single job runner required | Notification/audit/cleanup result | FR-012–FR-015 |

## Detailed Flow Rules

| Flow_Detail_ID | Workflow_ID | Detail_Type | Detail | State_or_Validation_Rule | Exception_Path | Related_IDs |
|---|---|---|---|---|---|---|
| FLOW-001 | WF-001 | State | Staff/Parivar: Pending -> Active or Rejected -> same record resubmitted | Approval history is append-only | Approval self-decision policy needs confirmation | FR-004 |
| FLOW-002 | WF-003 | Security | Public QR has no login/OTP/CAPTCHA; DEC-001 applies 10/minute and 50/day per IP, first-name/last-initial response, uniform non-active response, WAF and alarms | Return only Active, non-blacklisted records; do not echo mobile; log masked lookup | DAST each UAT deploy; independent pen test before G3 under WVR-001 | FR-007, FR-008, NFR-007 |
| FLOW-003 | WF-004 | Eligibility | Check-in requires Active, not blacklisted, and no open visit | Validate server-side and DB unique-open-visit constraint | Not found permits Visitor-only walk-in; unavailable system uses paper register | FR-009, FR-010, FR-020 |
| FLOW-004 | WF-004 | Location | Gate stores gate and location; Security manually checks assigned location rights | No physical access enforcement is in scope | API warn/block behavior for unassigned area open | FR-009, FR-010 |
| FLOW-005 | WF-006 | Occupancy | Occupancy equals open visit count; no auto-checkout | Admin validates and corrects forgotten visits with note | Accompanying occupancy treatment open | FR-010, FR-012 |
| FLOW-006 | WF-002 | Validation | Bulk rows use manual registration validations | Invalid rows are not saved and include row/reason | Template and approval-type rows open | FR-005 |

## Business Rules And Decisions

| Rule_ID | Rule | Applies_To | Source_IDs | Related_FR_or_WF_IDs | Validation_Method |
|---|---|---|---|---|---|
| BR-001 | Every individual entering must have a valid record; no public self-registration | All | SRC-001 | FR-002, FR-009 | E2E test |
| BR-002 | Duplicate registrations and repeated mobile numbers are explicitly allowed | All | SRC-001, SRC-002 | FR-006 | Schema/API test |
| BR-003 | Staff/Parivar require approval; other base categories activate immediately | Person registration | SRC-001, SRC-002 | FR-004 | Workflow test |
| BR-004 | QR identifies a person but does not itself grant entry | All | SRC-001, SRC-002 | FR-007–FR-009 | Security test |
| BR-005 | Blacklisted persons cannot check in, with no override | All | SRC-001, SRC-002 | FR-009, FR-011 | Authorization/E2E test |
| BR-006 | One person may have no more than one open visit; no auto-checkout | All | SRC-001, SRC-002, SRC-007 | FR-010, FR-012 | DB/API test |
| BR-007 | Only Admin modifies Staff profiles and manages blacklist; Super Admin alone creates Admin users | Admin operations | SRC-001, SRC-002 | FR-001, FR-011, FR-016 | Role matrix tests |
| BR-008 | Master values are configurable, not hardcoded; supplied seed values are samples | Admin | SRC-001, SRC-002, SRC-008 | FR-003, FR-016 | Review/test |
| BR-009 | Restricted locations are manually enforced by Security; no access hardware | Gate | SRC-001 | FR-009, FR-020 | E2E/operations review |
| BR-010 | All material data modifications are audited | System | SRC-001–SRC-004 | FR-015 | Audit completeness test |

## Assumptions Constraints And Open Questions
- Assumptions: One Ashram, English, responsive web/PWA, no legacy migration, no paid external messaging/auth integrations in Phase 1 (SRC-001–SRC-003).
- Constraints: Gate access is manually checked; outage fallback is a paper register; production uses no offline sync (SRC-001, SRC-003).
- Open questions: unresolved Q-INTAKE items in 00; additionally confirm approval self-decision rules, stale visit correction, accompaniment counting and report export scope.
- Security decision: DEC-001 Option A is signed; the controls and accepted Medium residual risk apply for build/UAT. WVR-001 defers independent penetration testing only to G3.
- Privacy decision: POL-001/CR-002 are signed for build/UAT; full DPDP counsel review remains a G3 release condition.
- Operational/quality decisions: RB-001–006 and TEP-001 are approved; WVR-005/006 defer drills/generated evidence only to G3/G2 as recorded in 07/08.
- Remaining open items: category/broad-category mappings, bulk-upload template and approval behavior, accompaniment occupancy, approval separation details, current mockup copy discrepancy, and any counsel/budget actions listed in SRC-011.
- Data & Analytics conditional sections: Not Applicable because Domain=Software and no Data_Analytics_Subtype is selected.

## Traceability Instructions
- Every FR-001–FR-022 maps to implementation backlog in 06, a validation row in 07, and instructions in 09.
- Every NFR has a metric/target or an explicit open status, validation method, evidence, owner and gate status in 07.
- Current source baseline is SRC-BL-005; approved SRC-011 decisions and CR-001–003 are authoritative changes for build/UAT, with G2/G3 release conditions preserved.