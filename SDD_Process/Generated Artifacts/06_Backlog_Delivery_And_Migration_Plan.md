# Backlog Delivery And Migration Plan

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
Sequence the greenfield MAMS implementation against current requirements and architecture. There is no approved sprint schedule or capacity estimate in the current inputs; phase ordering below is a proposal, not a commitment. Production work remains gated by 10.

## Backlog Hierarchy

| Backlog_ID | Type | Parent | Title | Outcome | Priority | Related_FRs | Source_IDs |
|---|---|---|---|---|---|---|---|
| EP-001 | Epic | None | Identity and authorization | Secure portal roles, login, user management | Must | FR-001, FR-019 | SRC-001–SRC-003, SRC-007 |
| EP-002 | Epic | None | Registration and master data | Dynamic categories, forms, duplicate-allowed records | Must | FR-002, FR-003, FR-006, FR-016 | SRC-001, SRC-002, SRC-007–SRC-009 |
| EP-003 | Epic | None | Approval and bulk upload | Pending workflow and controlled batch registration | Must | FR-004, FR-005 | SRC-001, SRC-002, SRC-009 |
| EP-004 | Epic | None | QR identity | Signed unique QR and public retrieval | Must | FR-007, FR-008 | SRC-001–SRC-003, SRC-009 |
| EP-005 | Epic | None | Gate and visit operations | Gate eligibility, visit ledger, outage runbook | Must | FR-009, FR-010, FR-020 | SRC-001–SRC-004, SRC-009 |
| EP-006 | Epic | None | Blacklist | Admin controls and unconditional gate block | Must | FR-011 | SRC-001, SRC-002, SRC-007, SRC-009 |
| EP-007 | Epic | None | Occupancy, notifications and reporting | Operational visibility and reports | Must | FR-012–FR-014 | SRC-001–SRC-003, SRC-009 |
| EP-008 | Epic | None | Audit and file management | Evidence and protected media | Must | FR-015, FR-017 | SRC-001–SRC-004, SRC-007–SRC-009 |
| EP-009 | Epic | None | PWA and platform delivery | Responsive web, AWS environments and CI/CD | Must | FR-018 | SRC-003, SRC-006 |

| Backlog_ID | Type | Parent | Story_or_Enabler | Acceptance_Reference | Priority | Related_FRs | Dependency |
|---|---|---|---|---|---|---|---|
| BL-001 | Enabler | EP-001 | Provision app repository, local dev setup and protected CI | 05 standards | Must | FR-018 | Account/repository access |
| BL-002 | Story | EP-001 | Implement login, role middleware, password flow, lockout and revocation | 02 FR-001/019 | Must | FR-001, FR-019 | CR-004 role-specific expiry and CR-005 one-time Admin-issued first-login credential |
| BL-003 | Story | EP-002 | Implement configurable master data and category permission mappings | 02 FR-003/016 | Must | FR-003, FR-016 | Approved category/location seed |
| BL-004 | Story | EP-002 | Implement registration fields, notice/consent/guardian capture, photo/doc upload, validation and duplicate-allowed profiles | 02 FR-002/006/021 | Must | FR-002, FR-006, FR-017, FR-021 | Apply signed CR-002/POL-001; counsel review remains before G3 |
| BL-005 | Story | EP-003 | Implement Staff/Parivar approval, rejection and same-record resubmission | 02 FR-004 | Must | FR-004, FR-013, FR-015 | Apply CR-006 sole-Admin exception; Approver self-decision always denied |
| BL-006 | Story | EP-003 | Implement permission-controlled bulk upload and row-level results | 02 FR-005 | Must | FR-005, FR-015 | Template, photo format and approval behavior finalized |
| BL-007 | Story | EP-004 | Generate signed unique per-record QR with version invalidation | 02 FR-007 | Must | FR-007 | QR identity fields approved |
| BL-008 | Story | EP-004 | Implement DEC-001 public lookup controls and all duplicate matches | 02 FR-008 | Must | FR-006, FR-008, FR-015 | Apply CTRL-01–06; WVR-001 pen test before G3 |
| BL-009 | Story | EP-005 | Implement scan/search eligibility, Visitor walk-in and photo check | 02 FR-009 | Must | FR-009 | CR-007 approves warning-only unassigned restricted-area behavior; Visitor walk-in contract still required |
| BL-010 | Story | EP-005 | Implement one-open-visit check-in/out, corrections and audit | 02 FR-010 | Must | FR-010, FR-015 | DB transaction and correction policy |
| BL-011 | Story | EP-006 | Implement Admin-only blacklist and unconditional gate block | 02 FR-011 | Must | FR-011, FR-015 | None |
| BL-012 | Story | EP-007 | Implement dashboard occupancy, inside list and overstay job | 02 FR-012 | Must | FR-012, FR-013 | Accompanying count and cutoff/recipient rules |
| BL-013 | Story | EP-007 | Implement in-app notifications and lifecycle cleanup | 02 FR-013 | Must | FR-013 | Notification recipients and retention |
| BL-014 | Story | EP-007 | Implement reports and Visit History CSV/XLSX export | 02 FR-014 | Must | FR-014 | Confirm other report export exclusions |
| BL-015 | Story | EP-008 | Implement audit event coverage, filtering and Admin view | 02 FR-015 | Must | FR-015 | Retention/audit immutability policy |
| BL-016 | Story | EP-008 | Implement private S3 upload/download and POL-001 retention lifecycle | 02 FR-017/022 | Must | FR-017, FR-022 | Apply RET-02/05/11/12 and KMS/IAM policy |
| BL-017 | Enabler | EP-009 | Implement responsive React PWA and camera scan workflow | 02 FR-018 | Must | FR-018 | Browser/device acceptance matrix |
| BL-018 | Enabler | EP-009 | Provision Terraform AWS DEC-003 production topology and CI/CD | 04/05 architecture | Must | FR-018–FR-020 | DEC-003 approved; AWS account, budget evidence and provisioning remain |
| BL-019 | Enabler | EP-009 | Implement RB-001 paper-register reconciliation and outage controls | 02 FR-020 | Must | FR-020 | RB-001–006 approved; drills DRL-01–06 due before G3 under WVR-005 |
| BL-SEC-01 | Story | EP-004 | Add public QR IP rate limits, WAF rate rule and lookup alarms | 02 FR-008 | Must | FR-008, NFR-007 | DEC-001 CTRL-01/05/06; test 10/min, 50/day, alarm thresholds |
| BL-SEC-02 | Story | EP-004 | Minimize public QR response and use uniform non-active result | 02 FR-008 | Must | FR-008, NFR-007 | DEC-001 CTRL-02/03; do not expose full name/mobile/status |
| BL-PRIV-01 | Story | EP-002 | Implement notice, consent metadata, guardian consent and Admin erase action | 02 FR-021 | Must | FR-002, FR-021, NFR-008 | CR-002; store consent_at, consent_notice_version, consent_captured_by; minors policy |
| BL-PRIV-02 | Story | EP-008 | Implement nightly retention job RET-01–RET-11 and audit runs | 02 FR-022 | Must | FR-015, FR-017, FR-022, NFR-008 | POL-001; preserve 35-day backup expiry RET-12 |
| BL-OPS-01 | Enabler | EP-009 | Add maintenance mode, application rollback job and PITR restore procedure | 04/08 operations | Must | FR-020 | RB-002/003; verify RPO 5 min/RTO 1h DB and 30 min app |
| BL-OPS-02 | Story | EP-005 | Add Admin outage reconciliation to Inside list with paper reference | 02 FR-010/020 | Must | FR-010, FR-020 | RB-001; close outage visits within 24h with audited paper reference |
| BL-QA-01 | Enabler | EP-009 | Implement TEP-001 CI quality gates and evidence collection | 07 TEP-001 | Must | FR-001–FR-022, NFR-001–NFR-012 | QG-01–08; >=80% coverage on services/reducers/utils; WVR-006 requires evidence before G2/G3 |

## Backlog Intake Prioritization And Review Criteria
- Prioritize identity/authorization, person/master data, approval, QR, gate safety and audit before convenience/reporting enhancements.
- Every item requires an owner, acceptance criteria, FR/NFR IDs, test mapping, source evidence and security/data review before Ready.
- Do not convert source recommendations or prototype demo behavior into scope without an approved decision.
- Approved decisions DEC-001–004 and CR-001–003 govern affected stories; open non-blocking master/category items remain in 00 and must be resolved before production setup.

## Migration And Transition Plan
Legacy application/data migration: Not Applicable — project is greenfield and BRD states the system starts fresh without importing legacy/site data (SRC-001).

| Transition_ID | Current_State_ID | Target_Item | Treatment | Steps | Data_or_Interface_Impact | Fallback_or_Rollback | Risk | Related_Backlog_IDs |
|---|---|---|---|---|---|---|---|---|
| TRANS-001 | None | New MAMS application | Build | Create environment, migrate schema, configure masters/users, verify workflow | No legacy records; initial master data only | Roll back release and restore DB snapshot; retain paper register for gate operations | Incorrect sample data or migration | BL-001, BL-003, BL-018, BL-019 |
| TRANS-002 | SQL draft schema | Versioned PostgreSQL migrations | Validate then adopt | Review DDL/query rules; build migration; test forward/rollback; run before API deployment | 12-table database; no source data migration | Restore tested backup and previous API/image; exact RPO/RTO open | Schema/query mismatch | BL-003–BL-016, BL-018 |

## Retained Replaced Retired Component Summary

| Component_or_Capability | Current_State | Target_Treatment | Evidence_or_Note |
|---|---|---|---|
| Existing AMS application | None supplied | Build | Forward engineering |
| Existing Ashram registry | No import in MVP | Retire from delivery scope | BRD excludes migration |
| Gate paper register | Manual fallback | Retain as outage fallback | No offline application mode |
| Current SQL reference | Draft design | Review/adopt as versioned migrations | Not executable baseline until verified |
| Prototype mockup | UI reference | Reimplement approved screens | Do not ship static demo behavior/data |

## Migration Cutover And Reconciliation Strategy
- No legacy data cutover is planned.
- Release cutover: configure approved categories, permissions, locations, first Super Admin and authorized users; validate gate identities and operational procedures before live use.
- Outage reconciliation: apply RB-001; after an outage >2 minutes, use the paper register, resume digital scanning on recovery, and within 24 hours Admin closes departures with an audited “Closed by Admin — outage, paper ref [page]” entry. Paper pages are scanned/archived for 1 year per interim policy.
- Database release: use RB-002/003; PITR restore to a new instance, validate row counts/audit tail, switch Secrets Manager endpoint, deploy previous ECS task/UI if needed, then smoke test. DEC-003 targets RPO 5 minutes, RTO 1 hour DB/30 minutes app; rehearsal evidence remains due before G3 under WVR-005.

## Data Migration Reconciliation Checklist
Not Applicable for legacy-source migration: no legacy records are imported. Initial master-data and manual outage-register reconciliation remain in scope and require owner-approved source lists, row counts, error handling, duplicate semantics (duplicates allowed), and signoff evidence before production.

## Delivery Phases And Milestones

| Phase_ID | Phase | Scope | Exit_Criteria | Schedule_Status |
|---|---|---|---|---|
| PH-001 | Approved foundations | Apply DEC-001–004, POL-001, RACI-001 and CR-001–003; provision accounts and approved topology | Artifacts updated; validator Pass; G1 approval recorded | No dates/capacity schedule approved |
| PH-002 | Core application | Identity, masters, registration/consent, approval, QR controls | FR-001–FR-008/019/021 pass; QG-01–08 enforced from first merge | Proposed sequence |
| PH-003 | Gate and operations | Gate, visits, blacklist, occupancy, notifications, audit, retention and outage reconciliation | FR-009–FR-022 pass; runbooks implemented; drills remain before G3 | Proposed sequence |
| PH-004 | Release readiness | Reports, S3 lifecycle, CI/CD, security/performance/restore tests | TEP-001 evidence, pen test, legal review and drills complete; G2/G3 approvals | Proposed sequence |

## Dependencies And Sequencing
- Decisions and environment access precede implementation (BL-001–BL-003, BL-018).
- Master data and identity precede registration; registration/approval precede QR; QR and role authorization precede gate.
- Gate/visit events precede occupancy, reports and overstay operations.
- Audit and file lifecycle span workflows and must be implemented with the owning features, not deferred to end.
- Build/UAT may proceed under signed DEC-001/002 and approved waivers after validator Pass and G1; production/G3 still depends on pen test, DPDP counsel review, load/performance evidence, drills and complete TEP-001 evidence.

## Estimation Capacity And Forecast
- Delivery duration, budget, role allocation and capacity: Not specified in current sources.
- Do not reuse the previous vendor proposal’s 5-sprint/10-week/950-hour estimate; that source is absent from the current input set.
- Estimate only after open items are resolved and backlog is decomposed with the delivery team.

## Delivery Risks And Open Questions
- High risk: public QR has an accepted Medium residual registration-confirmation risk; pen test remains before G3.
- High risk: POL-001 is an interim build/UAT policy; DPDP counsel review and final lawful-basis confirmation remain before G3.
- High risk: sample seed values and base/broad category mapping are still not approved.
- High risk: TEP-001, load test, drills and production runbooks must produce evidence before G2/G3; G1 was approved 2026-10-09 after validator Pass.
- Named owners are recorded in 00; several counsel/budget follow-ups remain with due dates in SRC-011/08.

## Traceability Instructions
- FR-001–FR-022 are covered by BL-001–BL-019 and BL-SEC/PRIV/OPS/QA-01/02; NFR gates are in 07.
- Domain=Software and Data_Analytics_Subtype=Not_Applicable; no data-pipeline or analytics backlog is implied.
- Implementation does not begin until validation report 10 authorizes the build baseline.