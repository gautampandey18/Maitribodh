# Target Solution Architecture

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Source_Baseline_ID: SRC-BL-005
- Document_Version: 3.6
- Date: 2026-10-08
- Owner: Sujal Ray, Architecture_Owner (DEC-003/004; SRC-011)

## Purpose
Define the target architecture from SRC-003/SRC-004, reconcile it with SRC-001/SRC-002 and SRC-007–SRC-009, and apply approved DEC-001–004/POL-001 decisions from SRC-011. Approval of design does not mean AWS infrastructure is provisioned or production evidence exists.

## Executive Summary
MAMS is a responsive React PWA served from S3/CloudFront, backed by a Node.js 22/Express 5 API on ECS Fargate and Amazon RDS for PostgreSQL 16. Signed DEC-003 selects separate pilot/UAT and production profiles in ap-south-1: production uses two Fargate tasks across two AZs and Multi-AZ RDS for the 99.5% SLO; Redis remains deferred. DEC-001 accepts residual Medium public-lookup confirmation risk with rate limits, minimized response, WAF and alarms. POL-001 is approved as an interim build/UAT policy; legal review, pen test, operational drills and evidence remain release gates.

## Architecture Views

| View_ID | View | Description | Key_Elements | Related_Requirements |
|---|---|---|---|---|
| AV-001 | Context | Portal users and public QR visitors interact with MAMS; guards use phone/tablet cameras; AWS hosts app/data | React PWA, API, RDS, private S3, AWS operations | FR-001–FR-022 |
| AV-002 | Container | UI, REST API, PostgreSQL, object storage, deployment and observability | UI S3/CloudFront; ECS Fargate; RDS PostgreSQL; S3; CloudWatch/CloudTrail | FR-017–FR-020 |
| AV-003 | Security | Identity, role checks, private subnet boundaries, encrypted storage, public QR exception | JWT, authorization middleware, KMS, WAF, Secrets Manager, audit | NFR-006–NFR-010 |
| AV-004 | Deployment | Per-environment VPC across AZs, private app/database subnets, CI/CD and Terraform | ALB, ECS, RDS, Route53/ACM, GitHub Actions | NFR-004, FR-018 |
| AV-005 | Data | Operational entities and media lifecycle | 12 PostgreSQL tables and private S3 object prefixes | FR-002–FR-017 |

## Diagram-Ready Architecture Inventory

| Node_ID | Node | Type | Network_or_Trust_Zone | Responsibility | Evidence |
|---|---|---|---|---|---|
| NODE-001 | Browser/PWA | Client | Public/untrusted | Portal and public QR view; camera scan on guard device | SRC-002, SRC-003, SRC-006 |
| NODE-002 | CloudFront + WAF + Route53/ACM | Edge | Public edge | TLS, static delivery, DNS and managed WAF rules | SRC-003 |
| NODE-003 | S3 web bucket | Static hosting | AWS account | React build files | SRC-003 |
| NODE-004 | Application Load Balancer | Ingress | Public subnet | HTTPS ingress and `/health` checks | SRC-003 |
| NODE-005 | ECS Fargate API tasks | Application | Private app subnets, 2 AZs | REST API, jobs when enabled, business logic | SRC-003 |
| NODE-006 | RDS PostgreSQL 16 | Data | Private DB subnets | 12-table transactional store; Multi-AZ for production target | SRC-003, SRC-004, SRC-007 |
| NODE-007 | Private S3 files bucket | Data | AWS account | Photos, documents, bulk files and report exports | SRC-003 |
| NODE-008 | KMS / Secrets Manager / IAM | Security | AWS control plane | Encryption keys, application credentials and least-privilege service access | SRC-003 |
| NODE-009 | CloudWatch / CloudTrail | Operations | AWS control plane | Logs, metrics, alarms and AWS API audit | SRC-003 |
| NODE-010 | GitHub Actions + ECR | Delivery | CI/CD trust boundary | Lint, tests, scans, build, image publish, deployment | SRC-003 |
| NODE-011 | Terraform state/pipeline | Delivery | Restricted deployment identity | Environment infrastructure definition and change | SRC-003 |

## Component Architecture

| Component_ID | Component | Responsibility | Interfaces | Data_Stores | Related_FRs |
|---|---|---|---|---|---|
| CMP-001 | React PWA | Screens, role-aware routing, registration, gate and reports | HTTPS `/api/v1`; device camera | Browser state only | FR-001–FR-022 |
| CMP-002 | Identity and access | Login/password, lockout, JWT, role middleware, user lifecycle | REST API | app_user | FR-001, FR-019 |
| CMP-003 | Person registration | Validation, person/category data, photo/doc references, duplicate-allowed registration | REST API | person, category, lookup_value, person_location | FR-002–FR-007, FR-016–FR-017 |
| CMP-004 | Approval | Pending queue, approval/rejection/resubmission and history | REST API | approval_history, person | FR-004 |
| CMP-005 | QR | Signed versioned QR generation and public retrieval | REST API | person.qr_version; no QR image persistence | FR-007–FR-008 |
| CMP-006 | Gate and visits | Eligibility, scan/search, walk-in Visitor, check-in/out and corrections | REST API | visit, person, blacklist, location | FR-009–FR-010 |
| CMP-007 | Master data | Categories, permissions, locations, departments, roles and lookups | REST API | category, location, lookup_value | FR-003, FR-016 |
| CMP-008 | Blacklist | Admin-only add/lift and gate block | REST API | blacklist | FR-009, FR-011 |
| CMP-009 | Files | Validate upload, S3 storage, short-lived signed download | S3 SDK | S3 object keys in person/bulk tables | FR-017 |
| CMP-010 | Reports/dashboard | Occupancy, operational report queries and Visit History export | REST API | PostgreSQL | FR-012, FR-014 |
| CMP-011 | Notifications/jobs | In-app alerts, overstay, draft and notification cleanup | REST API / cron | notification, visit, person | FR-013 |
| CMP-012 | Audit | Append application actions and Admin search | Internal API | audit_log | FR-015 |

## Integration Architecture

| Integration_ID | Producer | Consumer | Protocol_or_SDK | Authentication | Data_Exchanged | Failure_Handling_and_Retry | Monitoring | Owner | Related_Requirements |
|---|---|---|---|---|---|---|---|---|---|
| INT-001 | React PWA | API/ALB | HTTPS REST `/api/v1` | JWT for authenticated routes; public QR endpoint uses DEC-001 controls | Person, visit, user, report, lookup, consent and data-principal requests | Surface actionable error; retry only safe/idempotent requests; no offline queue | CloudWatch API latency/errors | Sujal Ray, Architecture_Owner | FR-001–FR-022 |
| INT-002 | API | RDS PostgreSQL | TLS, `pg` pool, parameterized SQL | Private security group and DB credentials from Secrets Manager | Transactional application records | Transaction rollback; bounded connection/pool handling; alert failed operations | RDS/CloudWatch metrics and API errors | Data_Owner | FR-002–FR-016 |
| INT-003 | API | Private S3 | AWS SDK v3 | ECS task IAM role | Photo/document/bulk/export bytes and object metadata | Validate then fail request; no container-disk persistence; retry only safe upload with idempotent key handling | S3/CloudWatch logs | Operations_Owner | FR-005, FR-017 |
| INT-004 | GitHub Actions | ECR/ECS/S3/CloudFront | AWS APIs, Docker, Terraform | Restricted deployment credentials/role; exact trust configuration open | Image, static assets, migrations, deployment config | Stop rollout on failed checks/health; rollback per RB-003 | CI logs, CloudWatch deployment health | Gaurav Sharma, Release_Owner | FR-018–FR-020 |
| INT-005 | API background task | PostgreSQL/notifications | `node-cron` and SQL | API service identity; single `JOBS_ENABLED=true` task | Overstay and cleanup records | Prevent duplicate execution by single-runner control; alert job failure | CloudWatch job logs/alarms | Operations_Owner | FR-012–FR-013 |
| INT-006 | Public QR user | API | HTTPS lookup | No login/OTP/CAPTCHA; DEC-001 adds IP rate limits of 10/minute and 50/day | Mobile lookup; return first name + last initial, category and QR only | HTTP 429 at limit; uniform non-active response; masked-mobile audit | WAF and CloudWatch alarms (>300 lookups/hour or >50 429/hour) | Vineet Agrawal, Security_Owner | FR-008, NFR-007 |
| INT-007 | External messaging/identity providers | MAMS | None in Phase 1 | N/A | None | Explicitly out of scope | N/A | Product_Owner | FR-013, FR-019 |

## Proposed API Route Catalogue (Owner Approval Required)

The source set defines SQL operations but no original HTTP paths. `API-ROUTES-001` was proposed as `ARCH-CHG-001` and approved as drafted by Sujal Ray on 2026-10-09, as confirmed by the requester; no separate evidence ID was supplied. The listed methods and paths are accepted. Request/response schemas, error codes, token claims, pagination, and file-download details must be derived from the cited requirements and queries; stop an affected operation if those sources conflict or are incomplete.

| Route_ID | Method | Path | Authorization | Operation | Source_Query_or_Requirement | Proposal_Status_At_Creation |
|---|---|---|---|---|---|---|
| API-ROUTE-001 | GET | `/health` | Public infrastructure probe | ALB target health | AV-004 | Existing |
| API-ROUTE-002 | POST | `/api/v1/auth/login` | Public; IP rate-limited | Authenticate and start session | LOGIN-01–03; FR-001, FR-019 | Proposed |
| API-ROUTE-003 | POST | `/api/v1/auth/logout` | Authenticated | Revoke current session | FR-001, FR-019 | Proposed |
| API-ROUTE-004 | PUT | `/api/v1/auth/password` | Authenticated full or must-change session | Set or change password; successful change revokes current token | LOGIN-04; FR-019; CR-005 | Proposed |
| API-ROUTE-005 | GET, POST | `/api/v1/users` | Admin; Super Admin for Admin creation | List or create portal users | USER-01; FR-001, FR-016 | Proposed |
| API-ROUTE-006 | GET, PATCH | `/api/v1/users/{userId}` | Admin; scoped self-access where approved | Read, update, or deactivate user | USER-02; FR-001, FR-016 | Proposed |
| API-ROUTE-007 | POST | `/api/v1/users/{userId}/password-reset` | Admin; Super Admin for an Admin account | Generate a 24-hour, single-use temporary password; return once with no-store for out-of-band delivery; audit without secret | LOGIN-04; FR-019; CR-005 | Proposed |
| API-ROUTE-008 | GET, POST | `/api/v1/categories` | Authorized Admin | List or create category | MST-01; FR-003, FR-016 | Proposed |
| API-ROUTE-009 | GET, PATCH | `/api/v1/categories/{categoryId}` | Authorized Admin | Read or update category | MST-01; FR-003, FR-016 | Proposed |
| API-ROUTE-010 | GET, POST | `/api/v1/lookups/{lookupType}` | Authorized Admin for writes | Read or create lookup values | MST-02; FR-003, FR-016 | Proposed |
| API-ROUTE-011 | PATCH | `/api/v1/lookups/{lookupType}/{lookupId}` | Authorized Admin | Update lookup value | FR-016 | Proposed |
| API-ROUTE-012 | GET, POST | `/api/v1/locations` | Authorized Admin | List or create gates/areas | MST-03; FR-016 | Proposed |
| API-ROUTE-013 | GET, PATCH | `/api/v1/locations/{locationId}` | Authorized Admin | Read or update gate/area | FR-016 | Proposed |
| API-ROUTE-014 | GET, POST | `/api/v1/persons` | Role-authorized registration users | Search/list or register person | REG-01, REG-02, REG-05; FR-002, FR-006 | Proposed |
| API-ROUTE-015 | GET, PATCH | `/api/v1/persons/{personId}` | Role-scoped | Read or edit person record | REG-04; FR-002, FR-006 | Proposed |
| API-ROUTE-016 | POST | `/api/v1/persons/{personId}/resubmissions` | Authorized registration user | Resubmit the same rejected record | APR-03; FR-004 | Proposed |
| API-ROUTE-017 | GET | `/api/v1/approvals` | Admin or Approver | Read pending approval queue | APR-01; FR-004 | Proposed |
| API-ROUTE-018 | POST | `/api/v1/approvals/{personId}/decisions` | Admin or Approver; CR-006 self-decision rule | Approve or reject with reason | APR-02, APR-03; FR-004; CR-006 | Proposed |
| API-ROUTE-019 | GET | `/api/v1/persons/{personId}/qr` | Role-scoped; active person only | Retrieve generated QR | FR-007 | Proposed |
| API-ROUTE-020 | POST | `/api/v1/public/qr-lookups` | Public; DEC-001 limits and controls | Find all active matches without echoing mobile | QR-01; FR-006, FR-008 | Proposed |
| API-ROUTE-021 | POST | `/api/v1/gate/lookups` | Authorized gate roles | Evaluate QR/mobile and location eligibility | GATE-01; FR-009 | Proposed |
| API-ROUTE-022 | POST | `/api/v1/visits` | Security Guard, Admin, Super Admin | Check in an eligible registered person; return warning-only for unassigned restricted area and audit the warning (CR-007) | GATE-02; FR-009/010; CR-007 | Proposed |
| API-ROUTE-023 | POST | `/api/v1/visits/{visitId}/check-outs` | Authorized gate roles | Check out an open visit | GATE-03; FR-010 | Proposed |
| API-ROUTE-024 | POST | `/api/v1/visits/{visitId}/admin-closures` | Admin only | Close forgotten visit with note and audit | GATE-04; FR-010, FR-020 | Proposed |
| API-ROUTE-025 | GET, POST | `/api/v1/blacklist` | Admin for writes; reads per role matrix | List or add blacklist entry | BL-01; FR-011 | Proposed |
| API-ROUTE-026 | POST | `/api/v1/blacklist/{blacklistId}/lifts` | Admin only | Lift active blacklist entry | BL-01; FR-011 | Proposed |
| API-ROUTE-027 | POST | `/api/v1/bulk-uploads` | Permission-controlled | Upload and process registration file | BLK-01; FR-005 | Proposed |
| API-ROUTE-028 | GET | `/api/v1/bulk-uploads/{bulkUploadId}` | Uploader or authorized Admin | Read processing result | BLK-01; FR-005 | Proposed |
| API-ROUTE-029 | GET | `/api/v1/dashboard` | Role-authorized | Read dashboard summary | DSH-01; FR-012, FR-013 | Proposed |
| API-ROUTE-030 | GET | `/api/v1/dashboard/inside` | Role-authorized | Read current inside list | DSH-02; FR-012 | Proposed |
| API-ROUTE-031 | GET, PATCH | `/api/v1/notifications` | Recipient-scoped | List or mark notifications read | NTF-01; FR-013 | Proposed |
| API-ROUTE-032 | GET | `/api/v1/reports/registrations` | Report permission | Read registration report | RPT-02; FR-014 | Proposed |
| API-ROUTE-033 | GET | `/api/v1/reports/visit-history` | Report permission | Read filtered visit history | RPT-01; FR-014 | Proposed |
| API-ROUTE-034 | GET | `/api/v1/reports/visit-history/export` | Report permission | Export CSV/XLSX | RPT-01; FR-014 | Proposed |
| API-ROUTE-035 | GET | `/api/v1/reports/occupancy` | Report permission | Read occupancy report | RPT-03; FR-014 | Proposed |
| API-ROUTE-036 | GET | `/api/v1/reports/staff` | Report permission | Read staff report | RPT-04; FR-014 | Proposed |
| API-ROUTE-037 | GET | `/api/v1/reports/approvals` | Report permission | Read approval report | RPT-05; FR-014 | Proposed |
| API-ROUTE-038 | GET | `/api/v1/reports/blacklist` | Report permission | Read blacklist report | RPT-06; FR-014 | Proposed |
| API-ROUTE-039 | GET | `/api/v1/audit-logs` | Admin only | Read filtered audit log | AUD-02; FR-015 | Proposed |
| API-ROUTE-040 | POST | `/api/v1/persons/{personId}/files` | Role-scoped | Upload validated private file | INT-003; FR-017 | Proposed |
| API-ROUTE-041 | POST | `/api/v1/files/download-urls` | Role-scoped; object ownership checked | Create short-lived signed download | INT-003; FR-017 | Proposed |
| API-ROUTE-042 | POST | `/api/v1/persons/{personId}/erasure-requests` | Admin only | Request audited erasure/anonymization | FR-021, FR-022 | Proposed |

`ARCH-CHG-001` records the accepted method/path change. GATE-005 is closed for the route inventory; endpoint implementation remains subject to the approved FR/query contracts and all security and quality gates.

## Data Architecture And Governance

| Entity_ID | Entity_or_Store | System_of_Record | Classification | Owner | Access_Control | Encryption_and_Handling | Retention | Related_Requirements |
|---|---|---|---|---|---|---|---|---|
| DATA-001 | Portal account and credentials | RDS app_user | Restricted | Security_Owner | Role checks; password hash only; token version | TLS/RDS encryption; bcrypt | Account retention governed by approved account policy; review at access deactivation | FR-001, FR-019 |
| DATA-002 | Person profile, mobile, passport, category data and consent record | RDS person | Restricted PII | Vineet Agrawal, Data_Owner | Role-scoped; non-Admin masks mobile/ID/passport; consent fields and data-principal rights per POL-001 | TLS/RDS encryption; ID numbers encrypted by API | RET-02/03/04/06/07; anonymize/delete per POL-001 | FR-002, FR-006, FR-021, FR-022, NFR-008 |
| DATA-003 | Photos and identity documents | Private S3 | Restricted PII | Vineet Agrawal, Data_Owner | Application authorization; short-lived presigned URLs | KMS; validate real file type/size | RET-02 and RET-05; delete S3 objects on schedule | FR-017, FR-022, NFR-010 |
| DATA-004 | Visits, gates and locations | RDS visit/location | Confidential operational | Vineet Agrawal, Operations_Owner | Guard writes; role-scoped read; Admin outage correction audited | TLS/RDS encryption | RET-06: 3 years, then anonymize person link | FR-009, FR-010, FR-012, FR-020, FR-022 |
| DATA-005 | Approval/blacklist history | RDS approval_history/blacklist | Confidential | Vineet Agrawal, Security_Owner | Approver/Admin policy; append-only approval history | TLS/RDS encryption | RET-03/07; rejected and expired/lifted records anonymized per POL-001 | FR-004, FR-011, FR-022 |
| DATA-006 | Audit log | RDS audit_log | Restricted | Vineet Agrawal, Compliance_Owner | Append by service; Admin read; immutable through UI/API | TLS/RDS encryption | RET-08: 7 years interim, counsel review before G3 | FR-015, FR-022, NFR-008 |
| DATA-007 | Bulk files and exports | Private S3 | Restricted PII | Vineet Agrawal, Data_Owner | Authorized upload/export; expiring signed downloads | KMS; versioned private S3 | RET-11: bulk source files 30 days; export lifetime per POL-001 | FR-005, FR-014, FR-017, FR-022 |
| DATA-008 | Notification content and public lookup log | RDS notification / audit | Confidential | Vineet Agrawal, Compliance_Owner | Recipient-scoped notifications; public lookup audit masked and Admin-only | TLS/RDS encryption; do not retain lookup mobile in clear | RET-09: lookup log 1 year; RET-10: notification 30 days | FR-013, FR-015, FR-022 |

- Database: 12 tables in PostgreSQL 16: app_user, lookup_value, category, location, bulk_upload, person, person_location, approval_history, blacklist, visit, notification, audit_log (SRC-004, SRC-007).
- Data rules: duplicate persons/mobile values allowed; unique open visit per person; category-specific fields in JSON; person and approval/visit/audit history deletion rules require migration/API review.
- Domain=Software; no Data & Analytics pipeline, warehouse, semantic-model, data-quality scorecard or MDM deliverable is in scope.

## Security Privacy And Compliance Architecture

| Control_ID | Threat_or_Risk | Mechanism | Evidence_Required | Related_Requirements | Status |
|---|---|---|---|---|---|
| SEC-001 | Unauthorized portal access | bcrypt cost 12, lock after 5 failures/15 min, IP login rate limit | Auth tests and config review | FR-001, FR-019 | Proposed; not implemented |
| SEC-002 | Broken role authorization | API `authorize(roles)` checks every route; UI guards are not enforcement | Role matrix/API tests | FR-001, FR-016 | Proposed |
| SEC-003 | Exposure/enumeration through public QR lookup | DEC-001 CTRL-01–06: 10/min and 50/day per IP, minimized name/category/QR response, uniform non-active response, WAF, CloudWatch spike/429 alarms, masked lookup audit; guard photo check required | DAST each UAT deploy; independent pen test before G3; review residual risk at 6 months post-go-live/after abuse | FR-008, NFR-007 | Approved for build; Low–Medium residual risk accepted; pen test remains G3 gate under WVR-001 |
| SEC-004 | Forged/stale QR | Signed `AMS1.<Person ID>.<version>.<HMAC>`; version check after mobile change | QR tamper/version tests; secret rotation review | FR-007 | Proposed |
| SEC-005 | PII/object exposure | POL-001 access minimization, masking, KMS, private S3, signed URLs, consent and retention controls | EVD-DATA-01–07 and tests before G2/G3 | FR-017, FR-021, FR-022, NFR-008, NFR-010 | Interim controls approved for build/UAT; evidence pending |
| SEC-006 | Network compromise | TLS, private API/DB subnets, security groups, WAF managed rules, strict CORS | IaC review and scan evidence | FR-018, NFR-006 | Proposed |
| SEC-007 | Credential leakage | Secrets Manager and least-privilege IAM | Secret scan and IAM review | FR-019 | Proposed |
| SEC-008 | Untraceable sensitive actions | Audit login/failure, changes, approval, QR, visits, blacklist, upload/export and retention-job runs | EVD-DATA-05/06; test immutable audit and nightly retention job | FR-015, FR-022, NFR-008 | Approved interim retention; evidence pending |
| SEC-009 | Privacy noncompliance | POL-001 interim purpose/notice, consent, guardian consent, rights, retention and erasure policy; AWS Mumbai; counsel review before G3 | EVD-DATA-01–07; DPA; legal review and retention evidence before G3 | FR-021, FR-022, NFR-008 | Approved for build/UAT; counsel review due before G3 |
| SEC-010 | Child/minor data exposure | Under-18 children are accompanying count only unless guardian consent; Visitor/Participant minors require guardian name/mobile/consent | Consent and authorization tests; counsel review before G3 | FR-021, NFR-008 | Approved interim policy; implementation/evidence pending |
| SEC-011 | Retention/deletion failure | Nightly JOBS_ENABLED retention job RET-01–11; 35-day rolling backup expiry RET-12; audit each run | EVD-DATA-06 job logs and deletion/anonymization tests | FR-022, NFR-008 | Approved interim policy; implementation/evidence pending |

## Scalability Resilience And Operations
- Approved production target (DEC-003): ap-south-1; S3/CloudFront/WAF; ECS Fargate 2 tasks across 2 AZs (1 vCPU/2 GB), autoscale to 4 at 60% CPU; ALB; RDS PostgreSQL 16 db.t4g.medium Multi-AZ, 50 GB gp3 auto-grow, PITR 35 days; 99.5% monthly SLO.
- Approved pilot/UAT target: same region/UI; ECS Fargate 1 task (0.5 vCPU/1 GB), max 2; RDS db.t4g.small Single-AZ, 20 GB gp3, 7-day backups; this is not production and has no 99.5% SLO claim.
- Approved capacity: 1,000–5,000 launch records; 100,000 lifetime headroom; 3,000 normal/10,000 festival daily people; 500 concurrent sessions; 60 gate events/min sustained, 200/min burst; 1.5M visits/year.
- SLOs: gate API p95 <800 ms/user-visible <2 s; other APIs p95 <500 ms at CAP-04; error rate <1%; RPO 5 min, RTO 1 h database/30 min application. Load test to TEP-001 before G2.
- Cache: Redis/ElastiCache is not in Phase 1; add only if measured dashboard load requires it and after approval.
- Gate outage: no offline mode; paper register is the fallback. Operational process, reconciliation and training need approval.
- Backups: production RDS PITR 35 days; pilot/UAT backup 7 days. DEC-003 sets RPO 5 minutes and RTO 1 hour DB/30 minutes app; restore/rollback drills remain required before G3.
- Monitoring: CloudWatch logs/metrics/alarms, RDS Performance Insights, ECS/ALB health and single job-runner alarm.

## Architecture Decisions

| ADR_ID | Decision | Status | Rationale | Consequences_or_Open_Items | Source_IDs |
|---|---|---|---|---|---|
| ADR-001 | React 19/Vite PWA and Node.js 22/Express 5 REST API | Accepted at G0 under DEC-004 | Solution Architecture v2 and signed baseline review | Lock compatible package versions and preserve stack | SRC-003, SRC-011 |
| ADR-002 | RDS PostgreSQL 16 with 12-table model | Accepted at G0; schema implementation review remains | Database design, SQL and signed baseline review | Review query/schema details and use versioned migrations | SRC-003, SRC-004, SRC-007–SRC-009, SRC-011 |
| ADR-003 | Adopt DEC-003 pilot/UAT and production profiles, capacity CAP-01–06 and SLO-01–06 in ap-south-1 | Approved 2026-10-08 | Signed by Sujal Ray, Architecture_Owner; Vineet Agrawal, Operations_Owner; budget by Vineet Agrawal | Provision selected profile; run TEP-001 load/availability tests before G2 | SRC-011 |
| ADR-004 | No Redis in Phase 1 | Source decision | Architecture says add only if dashboard load needs it | Instrument and revisit based on measured evidence | SRC-003 |
| ADR-005 | Keep no login/OTP/CAPTCHA but implement CTRL-01–06 for public QR lookup | Approved DEC-001 Option A | Signed security/business acceptance; residual risk Low–Medium | CR-001 updates FRD; WVR-001 waives pen test only to G3; monitor and review at 6 months | SRC-011 |
| ADR-006 | Apply POL-001 interim privacy/consent/retention controls and CR-002 | Approved for build/UAT | Signed DEC-002 by Vineet Agrawal, Compliance_Owner/Security_Owner and Business_Sponsor | Full DPDP counsel review and evidence required before G3 | SRC-011 |
| ADR-007 | Manual paper register is outage fallback; no offline software | Approved RB-001–006 | Signed by Vineet Agrawal, Operations_Owner | Drills DRL-01–06 deferred under WVR-005; complete before G3 | SRC-001, SRC-003, SRC-011 |
| ADR-008 | Duplicate registration/mobile allowed | Business rule | BRD explicitly rejects duplicate-prevention enforcement | Search/lookup lists all matching registrations; QR identity uses person ID and version | SRC-001, SRC-002, SRC-007 |
| ADR-009 | Adopt owner register RACI-001 and approval gates G0–G4 | Approved DEC-004 | Named owners and signed G0 baseline acceptance | G1 build-start approval recorded 2026-10-09; G2/G3 evidence gates remain binding | SRC-011; approval confirmed by requester, separate evidence ID not provided |
| ADR-010 | Use role-specific absolute JWT expiry: 12 hours for Security Guard and 30 minutes for other roles; no sliding idle timeout | Approved CR-004 / ARCH-CHG-002 | Resolves CONFLICT-007; avoids claiming idle-session enforcement without shared session state | Test expiry and token_version revocation; do not implement rolling refresh unless separately approved | SRC-002, SRC-003, CR-004 |
| ADR-011 | Use Admin-issued one-time temporary passwords for first login; 24-hour expiry and forced password change | Approved CR-005 / ARCH-CHG-003 | Username/email alone is not identity proof; no email/OTP provider is in Phase 1 | Return secret once over authenticated TLS with no-store; hash at rest; consume once; audit reset without recording secret | FR-019, CR-005 |
| ADR-012 | Apply CR-006 sole-Admin self-decision exception | Approved CR-006 / ARCH-CHG-004 | ADMIN self-decision only when exactly one active ADMIN exists; SUPER_ADMIN excluded; APPROVER self-decision denied | Enforce count and submitter identity in the approval transaction; append history, notification, and audit atomically | FR-004, CR-006 |
| ADR-013 | Return a warning for unassigned restricted-area access; do not automatically block check-in | Approved CR-007 / ARCH-CHG-005 | Restricted-area access is manually enforced by Security; no hardware enforcement | Guard manually verifies; record warning and audit outcome; blacklist/non-active/already-inside remain hard blocks | FR-009, CR-007 |

## Traceability Instructions
- Requirements map to components and data/security elements above and to backlog/tests/build instructions in 06/07/09.
- Data & Analytics conditional sections are Not Applicable because Domain=Software and subtype is Not_Applicable.
- Architecture, public QR risk, interim privacy policy, topology, sizing and runbooks are approved for build/UAT under SRC-011; pen test, counsel review, load test, drills and evidence remain G2/G3 release conditions.