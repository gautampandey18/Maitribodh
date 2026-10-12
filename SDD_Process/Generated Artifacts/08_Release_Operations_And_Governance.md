# Release Operations And Governance

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Source_Baseline_ID: SRC-BL-005
- Document_Version: 3.6
- Date: 2026-10-08
- Owner: Gaurav Sharma, Release_Owner (RACI-001, SRC-011)

## Purpose
Define release and operational controls for the current greenfield baseline. Architecture is proposed and approval status is not stated; no environment, pipeline, runbook, test evidence or named approver has been verified.

## Release Notes
- Release baseline: Initial MAMS build, no legacy import; target architecture uses React PWA, Express API, PostgreSQL 16 and AWS.
- DEC-001–004, POL-001, RACI-001, RB-001–006, TEP-001, WVR-001/005/006 and CR-001–003 are approved in SRC-011.
- Build start was authorized on 2026-10-09 after validator Pass and G1 approval from Vineet Agrawal and Sujal Ray. Pen test, DPDP counsel review, load test, drills and TEP-001 evidence remain G2/G3 gates as applicable.
- Older proposal-derived schedule, cost, VIP category, 15-minute timeout and one-record-per-person rule are superseded by SRC-BL-003 sources.

## Release Scope And Readiness

| Release_Item_ID | Type | Scope_or_Gate | Readiness | Evidence | Note |
|---|---|---|---|---|---|
| REL-001 | Feature | FR-001–FR-008 and FR-021/022 identity, masters, registration/consent, approval and QR | Conditional | 02, 06, 07, SRC-011 | Validator Pass and G1 signature required to start |
| REL-002 | Feature | FR-009–FR-013 gate, visits, blacklist, occupancy, notifications | Conditional | 02, 06, 07, SRC-011 | RB-001–006 approved; TEP evidence/drills due by G2/G3 |
| REL-003 | Feature | FR-014–FR-018 reports, audit, files, responsive PWA and retention | Conditional | 02, 06, 07, SRC-011 | Apply POL-001; production release gated on G3 evidence |
| REL-004 | Security/Privacy | Public QR CTRL-01–06 and POL-001 interim privacy/retention | Conditional for build/UAT | 04, 07, SRC-011 | DEC-001/002 signed; pen test and counsel review required before G3 |
| REL-005 | Operations | DEC-003 topology/capacity and approved outage/restore runbooks | Conditional for build/UAT | 04, 06, 07, SRC-011 | Topology/runbooks approved; provisioning, load test and drills remain before G2/G3 |

## Environment Configuration And Deployment Readiness

| Environment_ID | Purpose | Target_Configuration | Required_Controls | Owner | Status |
|---|---|---|---|---|---|
| ENV-DEV | Development | Terraform AWS environment; app/API test stack | Nonproduction data, secrets manager, CI deploy | IT Team | Not provisioned/evidenced |
| ENV-UAT | Business acceptance | Isolated environment and seeded approved test masters | Access controls, test evidence, approval workflow | Release_Owner | Not provisioned/evidenced |
| ENV-PROD | Production | ap-south-1; ECS Fargate 2 tasks/2 AZs (1 vCPU/2 GB; scale to 4 at 60% CPU); ALB; RDS PostgreSQL 16 db.t4g.medium Multi-AZ, 50 GB gp3 auto-grow, PITR 35 days | S3/CloudFront/WAF, KMS, IAM, monitoring, backups, approvals and runbooks | Sujal Ray / Vineet Agrawal | DEC-003 approved; provision/load test pending |
| ENV-PILOT | Pilot/UAT | ap-south-1; ECS Fargate 1 task (0.5 vCPU/1 GB; max 2); RDS PostgreSQL 16 db.t4g.small Single-AZ, 20 GB gp3, 7-day backups | Non-production data; no production 99.5% SLO claim | Vineet Agrawal | DEC-003 approved; provision pending |

- Architecture source calls for GitHub repository `Maitribudh-AMS`, per-environment Terraform state, separate UI/API workflows, branch promotion `feature/*` -> `develop` -> `uat` -> `main`, and named production environment approver.
- Database migration runs before new API version; production requires backup, migration validation, health check, smoke test and rollback plan.
- Environment variable values/secrets are not source-controlled; use Secrets Manager and restricted deployment identities.

## Source Control Build And Release Baseline
- Repository: GitHub `Maitribudh-AMS` (target name only; actual repo/access not provided).
- CI: zero-warning ESLint, Prettier check, UI/API unit/integration tests, >=80% coverage on services/reducers/utils, high-severity `npm audit` failure, SAST, SBOM/license, container and secret scans per QG-01–08.
- Artifacts: commit-tagged Docker image to ECR; versioned UI build to environment S3; CloudFront invalidation.
- Database: reviewed, numbered migrations; do not apply draft SQL without schema/query review and backup.
- Production deployment: protected GitHub Environment requiring a named approver; deployment logs and change ticket/evidence retained per policy.
- Baseline: signed G0 acceptance references SRC-BL-004; current generated impact baseline is SRC-BL-005 and includes approved SRC-011 decisions. Validator Pass and G1 approval were recorded 2026-10-09.

## Deployment Rollback And Communication
- Pre-deploy: approve release, confirm change set, backup/restore point, migration compatibility, owners, monitoring and communication.
- Deploy: run reviewed migration before API rollout; deploy commit-tagged image and matching UI; verify ALB health and smoke checks.
- Rollback: stop rollout on health/test failure; restore previous API image/UI assets and restore database snapshot or execute an approved backward-compatible migration. Exact steps must be proven in rehearsal before production.
- Recovery targets: DEC-003 sets RPO 5 minutes, RTO 1 hour database/30 minutes application; production PITR 35 days and pilot/UAT backups 7 days. Restore/rollback rehearsal remains required before G3.
- Gate outage: use paper register; offline application mode is out of scope. Define sign-in/checkout capture and reconciliation/audit procedures before production.
- Communication: audience/channel/timing and named incident/release contacts not specified; record in runbook before go-live.

## Production Readiness Checklist

| Checklist_ID | Check | Owner | Evidence | Status | Blocking |
|---|---|---|---|---|---|
| PRD-001 | Production topology selected and AWS account/network provisioned | Operations_Owner | Approved ADR and Terraform apply | Blocked | Yes |
| PRD-002 | Named business/product/security/QA/release/operations/data/compliance approvers | Vineet Agrawal / Kantimati Iyer / Sujal Ray / Aditya Sharma / Gaurav Sharma | Signed RACI-001 and gate approvals | Owners named; G1 approved 2026-10-09; G2/G3 approvals remain pending | Yes |
| PRD-003 | POL-001 interim privacy/consent/retention; counsel review before G3 | Vineet Agrawal, Compliance_Owner | Signed DEC-002/POL-001; legal review evidence due G3 | Interim policy approved; G3 legal review open | Yes for release |
| PRD-004 | Public QR controls, DAST and independent penetration test | Vineet Agrawal, Security_Owner | DEC-001/CR-001, DAST per UAT deploy, EVD-SEC-04 pen test | Build controls approved; pen test due G3 under WVR-001 | Yes for release |
| PRD-005 | RDS/S3/KMS/IAM/network configuration and secrets reviewed | Vineet Agrawal, Security_Owner | EVD-DATA-01–05 and configuration evidence | Not run | Yes |
| PRD-006 | TEP-001 CI gates and >=80% coverage target | Aditya Sharma, QA_Owner | QG-01–08 pipeline evidence | WVR-006 permits evidence to G2/G3; CI gates apply from first merge | Yes for release |
| PRD-007 | Capacity/load test against CAP-01–06 and approved SLOs | Sujal Ray, Architecture_Owner | EVD-PERF-01; k6 thresholds in TEP-001 | DEC-003 approved; test due before G2 | Yes |
| PRD-008 | Backup restore, application rollback and DB migration procedure | Vineet Agrawal, Operations_Owner | RB-002/003; RPO 5 min; RTO 1h DB/30m app | Runbooks approved; restore/rollback rehearsal due before G3 under WVR-005 | Yes for release |
| PRD-009 | Gate paper-register outage and reconciliation | Vineet Agrawal, Operations_Owner | RB-001; 2-minute trigger, 24-hour Admin reconciliation with audit reference | Runbook approved; DRL-01 due before G3 under WVR-005 | Yes for release |
| PRD-010 | Initial master data, role model and bulk template approved | Product_Owner | Signed seed/template | Blocked | Yes |
| PRD-011 | Security Guard device/browser and accessibility acceptance | Product_Owner | Device matrix/audit | Not run | Yes |
| PRD-012 | Production deployment approval and communication plan | Release_Owner | Protected environment approval | Blocked | Yes |

## Operational Readiness
- Monitoring: CloudWatch API logs/latency/errors, ECS CPU/memory, RDS CPU/storage/connections, ALB unhealthy targets and job execution/failure alarms.
- Backups: production RDS PITR 35 days; pilot/UAT backups 7 days. DEC-003 sets RPO 5 minutes, RTO 1 hour for DB and 30 minutes for application; restore/rollback rehearsal remains due before G3.
- Background tasks: overstay check every 5 minutes; draft cleanup daily 02:00 IST; notification cleanup daily 02:15 IST. Ensure only one API task runs scheduled jobs (`JOBS_ENABLED=true`).
- Capacity/availability: approved production target 99.5%; CAP-01–06 and SLO-01–06 approved in DEC-003. k6 load test is required before G2.
- Gate operations: manual photo/location verification; paper register on outage; no access-control hardware/offline sync.
- On-call/severity: RB-004 defines P1 15-minute response (24x7), P2 one-hour/business-hours response, P3 next business day, P4 three business days; weekly primary/secondary rota still needs assignment (ACT-005, Vineet Agrawal).

## Support Model And Incident Operations

| Operation_ID | Area | Required_Model | Owner | Status |
|---|---|---|---|---|
| OPS-001 | Gate service outage | RB-001 paper register after >2-minute outage; reconcile Inside list within 24 hours; close with audited paper reference | Vineet Agrawal, Operations_Owner | Runbook approved; DRL-01 due G3 under WVR-005 |
| OPS-002 | Security/PII incident | RB-006 token revocation, secret rotation, WAF block, assess/notify, preserve evidence and post-incident review | Vineet Agrawal, Security/Compliance_Owner | Runbook approved; counsel confirmation of notice timelines due G3 |
| OPS-003 | Database/object restore | RB-002 PITR restore; RPO 5 min/RTO 1h DB/30m app; smoke tests | Vineet Agrawal, Operations_Owner | Runbook approved; DRL-02–06 due G3 under WVR-005 |
| OPS-004 | User access review | RACI-001 review authority and RBAC tests | Vineet Agrawal, Security_Owner | Review cadence to be scheduled |
| OPS-005 | Overstay/job alert | One JOBS_ENABLED runner, CloudWatch job alarm and approved recipients/cutoffs | Vineet Agrawal, Operations_Owner | Implement/test under TEP-001; business-specific cutoffs remain open |

## Governance Baseline And Ownership
- Business_Sponsor: Vineet Agrawal. Product_Owner: Kantimati Iyer. Architecture_Owner: Sujal Ray. Security/Compliance/Data/Operations_Owner: Vineet Agrawal. QA_Owner: Aditya Sharma. Release_Owner: Gaurav Sharma (DevOps). Implementation_Lead: Gautam Pandey.
- G0 baseline SRC-BL-004 is accepted by Vineet Agrawal and Sujal Ray under DEC-004. G1 was approved by Vineet Agrawal and Sujal Ray on 2026-10-09 after validator Pass; approval was confirmed by the requester in this conversation, with no separate evidence ID supplied.
- Domain=Software; no data-governance stewardship or BI governance organization is applicable, but application PII ownership and DPDP governance remain mandatory.
- DEC-001–004 and CR-001–003 are signed. The public QR residual risk is accepted for build/UAT; remaining pen test, legal review and operational/test evidence are release conditions.

## Source Change Control Register

| Change_Control_ID | Change_ID | Source_Baseline | Severity | Impact | Approval_or_Action | Owner | Status |
|---|---|---|---|---|---|---|---|
| SRC-CHG-CTRL-002 | SRC-CHG-002 | SRC-BL-002 -> SRC-BL-003 | Critical | Current inputs replace the earlier baseline and alter requirements, tech, security, data and operations | Full regeneration; obtain named owner approval before implementation | Business_Sponsor | Pending |
| SRC-CHG-CTRL-003 | SRC-CHG-003 | SRC-BL-003 -> SRC-BL-004 | High | Proposed unsigned pack added | Superseded by signed SRC-CHG-004; no decision accepted from v1.0 | Vineet Agrawal, Business_Sponsor | Superseded |
| SRC-CHG-CTRL-004 | SRC-CHG-004 | SRC-BL-004 -> SRC-BL-005 | Critical | Signed v1.2 pack approves DEC-001–004, POL-001, RACI-001, runbooks, TEP-001, waivers and CR-001–003 | Section 9 outputs propagated; preserve G1/G2/G3 and release evidence conditions | Vineet Agrawal, Business_Sponsor | Approved 2026-10-08; validator Pass |

## Architecture Change Register

| Architecture_Change_ID | Change | Reason | Proposed_Artifacts | Owner | Approval_Required | Status | Implementation_Rule |
|---|---|---|---|---|---|---|---|
| ARCH-CHG-001 | API-ROUTES-001 HTTP methods and paths | SRC-009 defines SQL operations but no original HTTP route catalogue; WARN-003 | 04, 05, 06, 07, 09, 10 | Sujal Ray, Architecture_Owner | Yes; exact method/path approval | Approved as drafted 2026-10-09 by requester-confirmed Sujal Ray decision; no separate evidence ID supplied | Implement only against the accepted paths and cited FR/query contracts; resolve ambiguities before affected operations |
| ARCH-CHG-002 | CR-004 role-specific absolute JWT expiry; 30 minutes for non-guard roles replaces idle timeout | CONFLICT-007 leaves session semantics unresolved; shared session state is not in the approved model | 01, 02, 04, 05, 06, 07, 09, 10 | Vineet Agrawal, Security_Owner | Yes; approve exact token lifetime semantics | Approved 2026-10-09 by requester-confirmed Security_Owner decision; no separate evidence ID supplied | Enforce absolute `exp`; do not claim 30-minute idle behavior; retain token_version revocation |
| ARCH-CHG-003 | CR-005 Admin-issued one-time temporary password for first login | Username/email-only password setup provides no identity proof | 01, 02, 04, 05, 06, 07, 08, 09, 10 | Vineet Agrawal, Security_Owner | Yes; approve issuance, 24-hour expiry, one-time use, out-of-band delivery and forced rotation | Approved 2026-10-09 by requester-confirmed Security_Owner decision; no separate evidence ID supplied | Store only bcrypt hash; display once to authenticated Admin with no-store; consume on successful login; require password change before other protected operations |
| ARCH-CHG-004 | CR-006 sole-Admin approval exception | FR-004/approval query conflict on self-approval when one Admin is available | 01, 02, 04, 06, 07, 08, 09, 10 | Kantimati Iyer, Product_Owner | Yes; approve exact active-Admin count, excluded roles, and audit behavior | Approved 2026-10-09 by requester-confirmed Product_Owner decision; no separate evidence ID supplied | Permit ADMIN self-decision only when exactly one active ADMIN exists; exclude SUPER_ADMIN from count; deny APPROVER self-decision; transact status/history/notification/audit together |
| ARCH-CHG-005 | CR-007 warning-only restricted-area behavior | CONFLICT-002 / FR-009 leave API behavior unresolved | 01, 02, 04, 06, 07, 08, 09, 10 | Vineet Agrawal, Security_Owner | Yes; approve warning-only access and audit behavior | Approved 2026-10-09 by requester-confirmed Security_Owner decision; no separate evidence ID supplied | Return location warning and permit check-in; Security Guard manually verifies access; audit warning/outcome; keep blacklist, non-active and already-open visit as hard denials |

## Regeneration And Baseline Approval

| Regeneration_ID | Trigger | Baseline | Impacted_Artifacts | Action | Validation | Approval_Status |
|---|---|---|---|---|---|---|
| REGEN-003 | SRC-CHG-002 current-input-set change | SRC-BL-003 | 00, 01, 02, 04–10 | Full regeneration; 03 skipped as greenfield | Validator unavailable (Python missing); manual section/traceability review required | Pending named human approval |
| REGEN-004 | SRC-CHG-003 unsigned resolution pack | SRC-BL-004 | 00, 01, 08, 09, 10 | Proposal-only readiness refresh | Superseded by REGEN-005; unsigned v1.0 decisions not applied | Superseded |
| REGEN-005 | SRC-CHG-004 approved pack v1.2 | SRC-BL-005 | 00, 01, 02, 04, 06, 07, 08, 09, 10; 05 checked for mockup discrepancy | Signed Section 9 outputs applied; SRC-006/v2.10 discrepancy retained as warning | Automated validator Pass; G1 approved 2026-10-09 | Approved decisions; G1 approval confirmed by requester; no separate evidence ID supplied |

## Approval Gates

| Gate_ID | Gate | Required_Evidence | Owner | Decision | Blocking_If_Failed | Related_IDs |
|---|---|---|---|---|---|---|
| GATE-001 | Build start (G1) | G0; DEC-001–004 signed; WVR-001/005/006 approved; validator Pass | Vineet Agrawal, Business_Sponsor; Sujal Ray, Architecture_Owner | Approved 2026-10-09 by both named owners; requester-confirmed; separate evidence ID not provided | Yes | SRC-011, 10 |
| GATE-005 | API route inventory approval | Architecture_Owner accepts API-ROUTES-001 methods and paths | Sujal Ray, Architecture_Owner | Approved as drafted 2026-10-09; requester-confirmed, no separate evidence ID supplied | Yes | 04, 09, ARCH-CHG-001 |
| GATE-006 | Authentication session policy | Security_Owner approves CR-004: Security Guard 12-hour and other-role 30-minute absolute JWT expiry | Vineet Agrawal, Security_Owner | Approved 2026-10-09; requester-confirmed, no separate evidence ID supplied | Yes | 01, 02, 04, 05, 07, ARCH-CHG-002 |
| GATE-007 | First-login identity proof and temporary credential handling | Security_Owner approves CR-005 temporary secret issuance, delivery, single-use, 24-hour expiry and forced password change | Vineet Agrawal, Security_Owner | Approved 2026-10-09; requester-confirmed, no separate evidence ID supplied | Yes | 02, 04, 05, 07, 09, ARCH-CHG-003 |
| GATE-008 | Approval self-decision policy | Product_Owner approves CR-006 sole-Admin exception and Approver denial | Kantimati Iyer, Product_Owner | Approved 2026-10-09; requester-confirmed, no separate evidence ID supplied | Yes | 02, 04, 06, 07, 09, ARCH-CHG-004 |
| GATE-009 | Restricted-area warning policy | Security_Owner approves CR-007 warning-only behavior and audit | Vineet Agrawal, Security_Owner | Approved 2026-10-09; requester-confirmed, no separate evidence ID supplied | Yes | 01, 02, 04, 06, 07, 09, ARCH-CHG-005 |
| GATE-002 | Test/UAT acceptance (G2) | TEP-001 evidence; no open Critical/High defects | Kantimati Iyer, Product_Owner; Aditya Sharma, QA_Owner; Vineet Agrawal, Security_Owner | Pending | Yes | 07, TST-01–10 |
| GATE-003 | Release (G3) | G2; pen test passed; drills passed; DPDP counsel review done; waivers closed | Vineet Agrawal, Business/Operations/Security/Compliance_Owner; Gaurav Sharma, Release_Owner | Pending | Yes | PRD-001–012 |
| GATE-004 | Hypercare exit (G4) | 30 production days within SLOs | Vineet Agrawal, Operations_Owner and Business_Sponsor | Pending | Yes | SLO-01–06 |

## Approved Waivers

| Waiver_ID | Blocker_ID | Scope | Owner | Approver | Mitigation | Expires_At | Review_Date | Status |
|---|---|---|---|---|---|---|---|---|
| WVR-001 | BLOCK-001 | Independent pen-test evidence deferred only | Vineet Agrawal, Security_Owner | Vineet Agrawal, Business_Sponsor; co-signed Sujal Ray | DEC-001 signed; DAST each UAT deploy; pen test before G3 | G3 | 2026-11-09 | Approved |
| WVR-005 | BLOCK-005 | Operational drills/rehearsal evidence deferred | Vineet Agrawal, Operations_Owner | Vineet Agrawal, Business_Sponsor; co-signed Sujal Ray | RB-001–006 approved; DRL-01–06 before G3 | G3 | 2026-11-09 | Approved |
| WVR-006 | BLOCK-006 | Implementation-generated evidence deferred until implementation exists | Aditya Sharma, QA_Owner; co-owner Vineet Agrawal | Vineet Agrawal, Business_Sponsor; co-signed Sujal Ray | QG-01–08 from first merge; TST-01–10/evidence before G2/G3 | G3 | 2026-11-09 | Approved |

## Build Orchestration Governance
- Delivery mode in current build handoff: single sequential implementation owner, Gautam Pandey; Product_Owner Kantimati Iyer is the business orchestrator.
- Multi-agent orchestration fields: Not Applicable for the current single-owner mode; if delivery is split, 09 must define orchestrator, artifact baseline, role ownership, shared-file protocol, handoff contract, conflict process, waves and acceptance gates before work begins.
- Shared generated artifacts: only change under an approved baseline; record conflicts and revalidate after edits.

## Compliance And Audit Evidence

| Compliance_ID | Requirement | Owner | Evidence | Status | Related_IDs |
|---|---|---|---|---|---|
| CMP-001 | Interim POL-001 notice/consent/rights/retention controls; DPDP counsel review before G3 | Vineet Agrawal, Compliance_Owner | Signed DEC-002/POL-001; legal review evidence | Approved interim; counsel review before G3 open | NFR-008, DATA-002–DATA-008 |
| CMP-002 | Public QR controls CTRL-01–06 and accepted residual risk | Vineet Agrawal, Security_Owner | Signed DEC-001/TA-001; DAST each UAT; EVD-SEC-04 pen test before G3 | Approved for build; pen test due G3 | FR-008, NFR-007 |
| CMP-003 | RDS/S3 KMS, private S3, signed downloads, secret handling and least-privilege IAM | Vineet Agrawal, Security_Owner | EVD-DATA-01–05 and AWS config/IaC evidence | Policy approved; configuration evidence pending | NFR-006, NFR-010 |
| CMP-004 | Audit all material actions and apply RET-08 interim seven-year audit retention | Vineet Agrawal, Compliance_Owner | Event coverage, immutable-log test and retention evidence; counsel review before G3 | Interim policy approved; tests pending | FR-015, FR-022, NFR-008 |
| CMP-005 | CI dependency, secret, SAST/container scan and license/SBOM controls per QG-04–08 | Vineet Agrawal, Security_Owner | TEP-001 pipeline results | Planned; enforce from first merge | EVD-SEC-01–06 |

## Traceability Instructions
- SRC-CHG-004 and baseline SRC-BL-005 are approved under DEC-004; apply Section 9 updates and obtain automated validator Pass before G1.
- G1 build-start approval is recorded as approved on 2026-10-09; pen test, counsel review, drills and complete test evidence remain G2/G3 release gates.
- Domain=Software; Data & Analytics conditional governance sections are Not Applicable.