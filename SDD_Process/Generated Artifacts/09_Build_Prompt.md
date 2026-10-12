# Build Prompt

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Build_Target_Type: Application_Code
- Source_Baseline_ID: SRC-BL-005
- Document_Version: 3.6
- Date: 2026-10-09
- Build_Prompt_Status: Ready_G1_Approved
- Implementation_Authorization: Build start authorized 2026-10-09 after validator Pass and G1 approval by Vineet Agrawal and Sujal Ray, as confirmed by the requester; separate approval evidence ID was not provided. Signed waivers defer specified evidence only to G2/G3.

## Purpose
Provide a controlled implementation handoff for the approved MAMS scope. This prompt is a build specification only; it does not authorize coding while its validation preconditions fail.

## Validation Preconditions
- `10_ADLC_Validation_Report.md` must show Pass or Conditional Pass and named build authorization. Open blockers stop only their affected workstream; DNB-008 blocks business endpoint implementation until GATE-005 passes.
- Accept source baseline SRC-BL-005 and the latest versions of 00–08; stale artifacts invalidate this prompt.
- Apply CR-001–007, DEC-001–004, POL-001, RACI-001, RB-001–006 and TEP-001 outputs from signed SRC-011 and approved governance changes to all owning artifacts.
- Validator passed with no structural findings and G1 approval was recorded 2026-10-09; continue to require refreshed validation if the source baseline changes.
- Before G2/G3, complete TST-01–10 and evidence; before G3, complete independent pen test, DPDP counsel review, DRL-01–06, release scans and deployment approval.
- Resolve remaining non-waived questions (category/broad-category masters, bulk template, mockup v2.10 discrepancy, any FRD/business clarifications) with Kantimati Iyer before their affected stories are built.

## Do Not Build If

| DNB_ID | Condition | Evidence_or_Resolution |
|---|---|---|
| DNB-001 | Validation report is missing, stale, failed, or G1 build-start approval is absent | SRC-BL-005 artifacts propagated, validator Pass and named G1 approval recorded in 10 |
| DNB-002 | Public QR implementation omits signed DEC-001 CTRL-01–06 | Rate limits, response minimization, uniform response, WAF/alarms and audit implemented; WVR-001 permits pen test only to G3 |
| DNB-003 | POL-001/CR-002 consent, retention and rights are omitted from build/UAT | Apply interim policy; no production release before counsel review at G3 |
| DNB-004 | Approved DEC-003 topology, capacity or SLO is not reflected in IaC/load plan | Implement selected pilot/production profile; pass CAP/SLO tests before G2 |
| DNB-005 | Unapproved sample master data or bulk template is loaded as production data | Product_Owner approves category/permission/location mappings and bulk template before production seed/import |
| DNB-006 | Approved RB-001–006 controls are missing from operations implementation | Implement runbooks; WVR-005 permits drills only to G3; no production release before DRL-01–06 pass |
| DNB-007 | SRC-BL-005 Section 9 changes have not been propagated or automated validation/G1 is incomplete | Complete 00/01/02/04/06/07/08/09/10 updates, run validator, record G1 approval |
| DNB-008 | Proposed API route catalogue API-ROUTES-001 is not approved by the Architecture_Owner | Obtain Sujal Ray's approval of methods, paths, auth, payload/error contract and monitoring; update affected artifacts and rerun validation |

## Source Artifact Baseline

| Artifact | Baseline | Status | Build_Use |
|---|---|---|---|
| 00_Project_Intake_And_Mode.md | 3.1 / SRC-BL-005 | Signed owners and DEC outputs | Mode, tier, owners and remaining open questions |
| 01_Source_Baseline.md | 5.4 / SRC-BL-005 | Approved source decisions; CR-004/005/006/007 conflict resolutions recorded | Source inventory, SRC-CHG-004 and approved decisions |
| 02_Requirements_And_Scope.md | 3.5 | CR-001–007 applied | FR-001–FR-022 and NFR-001–NFR-012 |
| 03_Current_State_Analysis.md | N/A | Correctly skipped | Greenfield; no current application code |
| 04_Target_Solution_Architecture.md | 3.6 | DEC-001–004/POL-001, API-ROUTES-001 and ADR-010–013 applied | Components, security, retention, topology/SLO, accepted routes and auth/approval/location policy |
| 05_Technology_Engineering_And_Design.md | 3.3 | SRC-006 selected mockup guidance applied; CR-004/005 auth policy retained | Stack, engineering, screens and design tokens |
| 06_Backlog_Delivery_And_Migration_Plan.md | 3.5 | CR-004/005/006/007 applied to owning backlog stories | Backlog, runbooks and sequencing |
| 07_Quality_Test_And_Validation.md | 3.5 | CR-004/005/006/007 test expectations mapped; execution/evidence pending | Test/NFR gates and waivers |
| 08_Release_Operations_And_Governance.md | 3.6 | ARCH-CHG-001–005 approved; GATE-005–009 passed | Release gates, change governance, and remaining G2/G3 conditions |

## Build Orchestration Handshake
- Delivery_Mode: Single sequential implementation owner; no multi-agent or parallel shared-file work is authorized.
- Orchestrator: Kantimati Iyer, Product_Owner.
- Implementation_Owner: Gautam Pandey, Delivery/Implementation Lead.
- Accepted_Baseline: SRC-BL-005; G0 accepted by Vineet Agrawal and Sujal Ray under DEC-004; G1 approved 2026-10-09 after validator Pass.
- Agent_Ownership: Not applicable for current single-owner mode; if delivery is split, define roles before starting.
- Shared_File_Protocol: One owner per file/branch; review and merge through PR; never overwrite concurrent work; generated artifacts remain read-only inputs to build unless approved.
- Handoff_Contract: Each work item returns changed files, FR/NFR/BL IDs, tests and results, migration/security impacts, unresolved decisions, and rollback implications.
- Conflict_Protocol: Stop on requirement/schema/security conflict; record it in 01/08 and obtain owner decision before coding around it.
- Build_Waves: Use implementation order below; waves do not imply calendar dates or capacity.
- Acceptance_Gates: Each wave passes linked tests; full release passes 07 and receives 08/10 approval.

## Agent Role And Ownership Matrix

| Role | Owner | Responsibility | Approval |
|---|---|---|---|
| Product/Build Orchestrator | Kantimati Iyer | Sequence approved scope and resolve business questions | Yes |
| Architecture/Technical Lead | Sujal Ray | Stack, schema, security and integration consistency | Yes |
| UI/API Implementer | Gautam Pandey | Implement only approved FRs and 05 standards | No |
| Security/Privacy Reviewer | Vineet Agrawal | Threat, privacy, IAM/KMS/public QR approval | Yes |
| QA Owner | Aditya Sharma | TEP-001 test/evidence delivery and G2 UAT | Yes |
| Release Owner | Gaurav Sharma (DevOps) | Validator runs, release and G3 evidence | Yes |

## Shared File And Conflict Protocol
- Keep frontend and API code in the documented project structure; schema changes use reviewed numbered migrations.
- Do not hardcode categories, roles, statuses, locations, limits or secrets; use approved masters/configuration.
- A proposed change to FR/NFR, data model, public QR behavior, retention, topology or release scope stops for product/security/governance review.
- Tests and implementation must not silently alter business rules or source-level privacy choices.

## Session Handoff Contract
- Record baseline ID and current artifact versions at each session start.
- Before handoff: report completed BL IDs, files changed, FR/NFR coverage, commands/tests, failures, migration state, new decisions/questions and next owner.
- On resume, verify repository state and baseline freshness before continuing.

## Build Wave Plan

| Wave | Scope | Backlog | Exit_Gate |
|---|---|---|---|
| WAVE-001 | Repository, environments, CI, migrations foundation | BL-001, BL-018 | Security/repo controls and migration smoke test |
| WAVE-002 | Identity, roles, masters, person registration | BL-002–BL-004 | FR-001–FR-003, FR-006, FR-016, FR-019 tests |
| WAVE-003 | Approval, bulk upload, QR and signed public-lookup controls | BL-005–BL-008, BL-SEC-01/02 | FR-004–FR-008 tests; DAST on UAT; pen test before G3 |
| WAVE-004 | Gate, visits, blacklist, operational fallback | BL-009–BL-011, BL-019 | FR-009–FR-011/020 tests and runbook drill |
| WAVE-005 | Occupancy, notifications, reports, audit, files, consent and retention | BL-012–BL-016, BL-PRIV-01/02 | FR-012–FR-017/021/022 tests; counsel review before G3 |
| WAVE-006 | Cross-cutting quality, security, performance, operations drills and production release | All; BL-017–BL-019, BL-OPS-01/02, BL-QA-01 | TEP-001 evidence, load test, pen test, DRL-01–06, G2/G3 approvals |

## Integration And Acceptance Gates

| Gate_ID | Gate | Required_Evidence | Owner | Blocking |
|---|---|---|---|---|
| BUILD-GATE-001 | Requirements traceability | FR-001–FR-022 mapped to code/test evidence; NFR-001–NFR-012 mapped to evidence | Aditya Sharma, QA_Owner | Yes |
| BUILD-GATE-002 | Identity and authorization | Role matrix, lockout, session expiry/revocation and role escalation tests | Vineet Agrawal, Security_Owner | Yes |
| BUILD-GATE-003 | Data/privacy/security | CTRL-01–06, POL-001 consent/retention, S3/KMS/IAM and audit; counsel/pen test before G3 | Vineet Agrawal, Security/Compliance_Owner | Yes for release |
| BUILD-GATE-004 | Data/API correctness | Migration review, duplicate semantics, visit uniqueness, consent/retention, concurrency and timezone tests | Vineet Agrawal, Data_Owner | Yes |
| BUILD-GATE-005 | Operations and release | CAP/SLO load test, restore/rollback, RB-001–006 drills and G2/G3 approvals | Vineet Agrawal, Operations_Owner; Gaurav Sharma, Release_Owner | Yes for release |

## Build Scope And Non-Goals
- Build the approved MAMS responsive PWA/API for one Ashram and English-language operation.
- Include registration/consent, approvals, dynamic masters, bulk upload, unique QR, DEC-001 public QR lookup controls, gate/visit, blacklist, occupancy, in-app notifications, standard reports, audit, private file storage, retention and role controls as in FR-001–FR-022.
- Non-goals: legacy data migration; offline application mode; physical access hardware/cards; multiple Ashrams/languages; OTP/MFA/SSO; email/SMS/WhatsApp; native mobile app; predictive analytics/BI semantic layer; unapproved policy or integration behavior.
- Paper-register gate fallback is an operating procedure, not offline software.

## Mandatory Tech Stack
- React 19, Vite, Redux Toolkit, React Router v7, Material UI, React Hook Form/Zod, Axios, html5-qrcode, vite-plugin-pwa, Vitest/React Testing Library.
- Node.js 22 LTS or newer LTS, Express 5, PostgreSQL 16 via `pg`, JWT, bcrypt, Zod, Multer, AWS SDK v3, `qrcode`, ExcelJS, Helmet, CORS, express-rate-limit, Pino, node-cron, Swagger UI/OpenAPI, Jest/Supertest.
- AWS target: ECS Fargate, ECR, RDS PostgreSQL, private S3, CloudFront/WAF, ALB, Route53/ACM, KMS, Secrets Manager, IAM, CloudWatch and CloudTrail; Terraform and GitHub Actions.
- Redis/ElastiCache is not in Phase 1. Do not add dependencies or services without approved architecture change.
- Follow 05 coding/format/test standards; exact package versions are resolved at build start against compatible supported releases and locked.

## Authentication Authorization Security
- Hash passwords with bcrypt cost 12; enforce a minimum of 10 characters containing letters and digits. Lock the account after five failures in a 15-minute window for 15 minutes; rate-limit login by IP.
- Under CR-004, Security Guard JWTs expire 12 hours after issuance; all other role JWTs expire 30 minutes after issuance. This is absolute expiry, not a sliding idle timeout; do not implement or claim idle refresh.
- Under CR-005, Admin resets generate a random temporary password, stored only as a bcrypt hash, expiring after 24 hours and consumed on one successful login. Return the secret once to the authenticated Admin with `Cache-Control: no-store` for out-of-band delivery; never log or persist it in plaintext. The temporary session may only change password or log out; a successful password change revokes its token and clears the forced-change flag.
- Never allow username/email alone to establish or replace a password. First login uses the Admin-issued temporary credential; enforce forced password change before any other protected operation.
- Verify JWT signature and expiry and load current account status and `token_version` on every protected request. Reject inactive accounts and token-version mismatches; logout/password reset increments `token_version`.
- Store JWT signing secrets in AWS Secrets Manager and enforce server-side role authorization on every protected operation.

## Project Structure
Use the two-app structure in 05: `Maitribudh-UI/` with `src/screens`, `components`, `redux`, `services`, `theme`, `utils`; `Maitribudh-API/` with config, constants, controllers, middleware, modules, repositories, services, utils, tests and `db/migrations`; Terraform `infra/`; `.github/workflows/` for CI/CD. Do not include `Input Artifacts/` in the production repository.

## Screens Components And Design System
- Implement screen inventory UI-001–UI-012 from 05: Dashboard, Gate, Person Management, Registration, Person Detail, Approvals, Bulk Upload, Blacklist, Reports, Masters/Users, Audit, Public QR Lookup.
- Use the requester-selected `Maitribodh_AMS_Mockup_v2 (2).html` layout/palette and MUI theme: split login, light collapsible sidebar, compact topbar, dense tables, and 8px maximum radius. Keep responsive behavior and accessible labels/states; approved business/security rules override mockup prototype copy and behavior.
- Preserve source policies over mockup demo data, role-switch controls and prototype-only event handlers; never ship demo credentials/data.
- Only show actions authorized by the server role policy. Public QR applies CTRL-01–06, returns first name + last initial/category/QR only, uses a uniform non-active response, and does not echo mobile. Preserve all duplicate matches per the business rule.

## Data Model And Migration
- Implement the 12-table schema from SRC-007 only after reviewing against SRC-001/002 and SRC-004: `app_user`, `lookup_value`, `category`, `location`, `bulk_upload`, `person`, `person_location`, `approval_history`, `blacklist`, `visit`, `notification`, `audit_log`.
- Preserve explicitly allowed duplicate registrations and shared mobile numbers; each person record receives its own ID and QR. Do not add unique constraints on person mobile/name.
- Enforce one open visit per person and one active blacklist row per person as proposed in SQL; validate transaction behavior and state constraints.
- Store category-specific data as JSON only where source schema specifies; encrypt ID proof data in API; retain private object keys, not public URLs.
- Add person consent fields `consent_at`, `consent_notice_version`, `consent_captured_by`; implement guardian consent for under-18 Visitor/Participant forms and count-only accompanying minors unless guardian consent is captured.
- Implement the POL-001 RET-01–12 schedule, nightly JOBS_ENABLED retention task and audited Admin erasure/anonymization; keep database backups on the approved rolling 35-day schedule.
- No legacy migration. Version schema changes as numbered migrations; validate forward/backward compatibility, backup/restore and deployment order. Supplied `02_seed_data.sql` is SAMPLE only; do not use as production seed until approved mappings/values exist.

## API Endpoints Integrations And Jobs
- API base: `/api/v1`. Approved methods and paths are recorded as API-ROUTES-001 in 04_Target_Solution_Architecture.md. Derive each request/response contract from its cited FR/query and stop if the source is ambiguous or conflicting.
- Do not invent endpoint paths beyond source-approved API catalog; confirm route inventory from the architecture source with the API owner before implementation.
- Integrations: browser-to-API HTTPS/JWT; API-to-PostgreSQL TLS/parameterized SQL; API-to-private-S3 AWS SDK/IAM; CI/CD to ECR/ECS/S3/CloudFront. No paid external messaging or identity service in Phase 1.
- Jobs: overstay check every 5 minutes; draft cleanup daily 02:00 IST; notification cleanup daily 02:15 IST; POL-001 retention RET-01–11 nightly. Exactly one task has jobs enabled; every retention run is audited.
- Public QR is unauthenticated with no OTP/CAPTCHA, but must implement DEC-001 rate limits, response minimization, uniform non-active response, WAF and CloudWatch alarms. Residual risk accepted for build/UAT; complete independent pen test before G3.

## Migration-Specific Build Constraints
- No legacy person/site import. Initial masters/users are explicitly reviewed and approved.
- Outage paper-register entries require approved reconciliation fields and audit trail; no background/offline sync.
- Apply signed POL-001 retention and consent rules for build/UAT; do not change retention periods without Compliance_Owner approval. Full DPDP counsel review is required before G3.
- Use DEC-003 pilot/UAT and production topology/SLO profiles; do not invent or claim production availability for pilot topology.

## Implementation Order
1. Run the ADLC validator and obtain G1 build-start approval; do not code before both are recorded.
2. Establish repository, CI, AWS accounts/identities, Terraform state and migrations.
3. Implement shared API error/config/auth foundations and role tests.
4. Implement masters/person registration, files, approvals and QR.
5. Implement gate, visits, blacklist and audit atomically with concurrency tests.
6. Implement dashboard, in-app notifications, reports and scheduled jobs.
7. Complete responsive UI, WCAG 2.1 AA accessibility tests and device/browser checks.
8. Run QG-01–08 from first merge; run TST-01–10, load/restore/rollback tests and DRL-01–06; complete pen test and legal review before G3.

## Testing And Validation Requirements
- Map FR-001–FR-022 to automated/documented tests in 07; map NFR-001–NFR-012 to approved metrics/evidence/owner/status.
- FR traceability checklist: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022.
- Unit/component/API/integration/E2E/security/accessibility/performance tests; >=80% line coverage on services/reducers/utils; QG-01–08 from first merge; lint zero warnings; Prettier; high severity npm audit fails.
- Verify duplicate registrations/shared mobile, DEC-001 QR limits/minimized response/uniform response, one-open-visit concurrency, blacklist no-override, QR signature/version invalidation, role boundaries, consent/minor rules, retention/anonymization, file validation, audit coverage and exact time-zone behavior.
- Verify five failures in a 15-minute lockout window, 15-minute lock duration, absolute JWT expiry at 12 hours for Security Guard and 30 minutes for other roles, and `token_version` revocation; do not assert sliding idle-timeout behavior.
- Verify a temporary password expires after 24 hours, is consumed once, cannot authorize non-password operations, and forces a password change; reset auditing must not include the secret.
- Verify approval separation: Approver self-decisions are always denied; Admin self-decision is allowed only when exactly one active Admin exists, with Super Admin excluded from the count; status, history, notification and audit changes commit atomically.
- Run SCA/license/SBOM, secret scan, SAST/equivalent, container scan, DAST, pen test, CAP/SLO load test, WCAG audit, backup restore, rollback and DRL-01–06; record EVD-* evidence before G2/G3. WVR-001/005/006 defer timing only, not release criteria.
- Use `scripts/validate_adlc_artifacts.py` when Python is available, followed by substantive human review of Enterprise gates.

## Generation Rules
- No unapproved requirement, route, schema, dependency, external integration, retention behavior, notification channel or deployment behavior.
- Treat SRC-001 BRD as review draft, SRC-002 FRD as detailed behavior amended by approved CR-001–006, SRC-003 architecture as target amended by DEC-003/CR-004–006, SRC-004/007–009 as proposed physical contracts, SRC-006 as UI-only evidence, and SRC-011 plus approved ARCH-CHG-001–004 as governing decisions for build/UAT.
- On any source or scope change, stop, update 01, assess impacts, obtain governance decision in 08, regenerate affected artifacts, rerun 10 and refresh this prompt.
- Do not begin application implementation until validation 10 authorizes it.

## Delivery Report Requirements
At handoff report changed files, completed BL/FR/NFR IDs, migrations, tests and exact results, scans/evidence, deployment environment/commit, known gaps, open decisions, rollback status and next owner. Do not claim production readiness without 08 signoffs and a passing 10 report.