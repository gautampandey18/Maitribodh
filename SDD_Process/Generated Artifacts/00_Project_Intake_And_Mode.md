# Project Intake And Mode

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Project_Code: MAITRIBODH-AMS
- Document_Version: 3.2
- Date: 2026-10-27
- Intake_Owner: Vineet Agrawal, Business_Sponsor
- Generated_From_Master_Prompt: Yes

## Purpose
- Intake_Objective: Establish a traceable, repository-backed current-state baseline from the implemented API, UI, migrations, tests, and updated `docs/`.
- User_Input_Model: Current implementation sources are in the repository root and `docs/`; legacy design inputs remain under `SDD_Process/Inputs Artifacts/`.
- Execution_Mode: Reverse_Engineering_Only
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Dashboard_Frontend_In_Scope: No (operational application dashboards are software UI, not BI delivery)
- Build_Target_Type: Current_State_Documentation
- Lifecycle_Run_Mode: Change_Impact
- Source_Baseline_ID: SRC-BL-006
- Generation_Strategy: Targeted reverse-engineering refresh of 00, 01, 03, 07, 08 and 10; prior target build artifacts are retained but are not a current implementation handoff.

## Project Classification

| Classification_ID | Classification_Area | Value | Rationale | Source_IDs | Impact |
|---|---|---|---|---|---|
| CLASS-001 | Project_Domain | Software | Existing repository contains a React/Node.js application, PostgreSQL migrations and API/UI tests | SRC-018–SRC-021 | Software optimized artifact rules apply |
| CLASS-002 | Data_Analytics_Subtype | Not_Applicable | PostgreSQL is transactional application storage; no pipeline, warehouse, BI semantic layer or governance catalog evidence | SRC-001–SRC-009 | Data & Analytics conditional sections are N/A |
| CLASS-003 | Risk_Profile | High | Gate access decisions, identity photographs, mobile/passport/ID data, public QR retrieval and audit obligations | SRC-001–SRC-003 | Enterprise security, privacy, operational and approval gates are mandatory |
| CLASS-004 | Regulatory_Exposure | DPDP applies; interim POL-001 approved for build/UAT | SRC-001/SRC-003 state DPDP applies; DEC-002 approves notice/consent/retention policy for build/UAT, with full counsel review before G3 | SRC-001, SRC-003, SRC-011 | Apply CR-002/POL-001; no G3 release before legal review and evidence |
| CLASS-005 | Delivery_Model | Ashram-led project with technical delivery team; schedule not approved | Stakeholders and technical responsibilities are named by team, but no signed delivery plan or named individuals are supplied | SRC-001, SRC-003 | Backlog sequencing is proposed; do not claim an approved timeline or capacity |

## Auto-Detection Rules

| Detection_ID | Evidence | Interpretation | Decision | Confidence | Related_Input_Source |
|---|---|---|---|---|---|
| DET-001 | Existing API/UI source, package manifests, migrations and automated tests are present alongside current implementation documentation | Existing implementation is the primary as-is evidence | Reverse_Engineering_Only | High | SRC-012–SRC-021 |
| DET-002 | Updated docs describe repository behavior; no new feature, migration, modernization, rewrite or enhancement request is included | Current state only; do not infer a future-state build from old target artifacts | No 02/04/05/06/09 generation in this run; create 03 | High | SRC-012–SRC-017, SRC-018–SRC-021 |
| DET-003 | PII, gate admission decisions, audit and DPDP obligations | Production business/security sensitivity | Enterprise | High | SRC-001–SRC-003 |
| DET-004 | No pipeline, warehouse, BI semantic-model or catalog artifacts | Application domain, not Data & Analytics | Domain=Software | High | SRC-012–SRC-021 |

## Source Folder Inventory

| Source_ID | Folder | File_or_Path | Source_Type | Status | Priority | Used_For | Notes |
|---|---|---|---|---|---|---|---|
| SRC-001 | Inputs Artifacts/ | Maitribodh_AMS_Business_Requirements_Document_v1.2.docx | Requirement | Review draft | Primary | Objectives, scope, business rules, risks and open items | BRD says DPDP applies; details pending |
| SRC-002 | Inputs Artifacts/ | Maitribodh_AMS_Functional_Requirements_Document_v1.2.docx | Requirement | Approval status not stated | Primary | Detailed workflows, roles, validation and errors | Reconcile against BRD and SQL |
| SRC-003 | Inputs Artifacts/ | Maitribodh_AMS_Solution_Architecture_v2.docx | Technical | Approval status not stated | Primary | Target stack, security, deployment and NFR targets | Production and pilot options are both documented |
| SRC-004 | Inputs Artifacts/ | Maitribodh_AMS_Database_Design_Document_v2.0.docx | Database | Approval status not stated | Primary | Data model and business-rule persistence | Reconcile with SQL |
| SRC-005 | Inputs Artifacts/ | Maitribodh_AMS_End_to_End_Application_Flow_v1.2.pdf | Technical | Content unverified | Supporting | Flow evidence | Local extraction unavailable; no unverified claims used |
| SRC-006 | Inputs Artifacts/ | Maitribodh_AMS_Mockup_v2 (2).html | UI | Reference only | Primary for presentation | Screen/layout/control inventory and design tokens | Prototype only; visual behavior does not override policies |
| SRC-007 | Inputs Artifacts/Maitribodh_AMS_Database_SQL_v2/ | 01_schema.sql | Database | Draft | Primary for physical schema | Tables, keys, constraints and indexes | Not an executed migration |
| SRC-008 | Inputs Artifacts/Maitribodh_AMS_Database_SQL_v2/ | 02_seed_data.sql | Database | Sample | Supporting | Illustrative master data | Replace/approve sample values before production |
| SRC-009 | Inputs Artifacts/Maitribodh_AMS_Database_SQL_v2/ | 03_api_queries.sql | Technical | Draft | Primary for query behavior | API data operations and jobs | Validate against FRD, authorization and transaction boundaries |
| SRC-011 | Inputs Artifacts/ | MAMS Blocker Resolution Pack v1.pdf | Governance / Decision_Pack | Approved v1.2; named decisions signed 2026-10-08 | Primary for blocker decisions and approved change requests | DEC-001–004, POL-001, RB-001–006, TEP-001, WVR-001/005/006, CR-001–003 | G1 was pending when this pack was signed; it was subsequently approved on 2026-10-09. G3 pen test, legal review, drills and evidence remain required |
| SRC-012–017 | `docs/` | Six updated MAMS implementation and local-development Markdown references | Current implementation documentation | Updated 2026-10-27 | Primary for documented as-is behavior | Business rules, API/data behavior, implementation boundaries and Windows local operations | Does not prove a live deployment or applied database state |
| SRC-018 | `Maitribodh-API/` | API source, manifest, tests and database runtime code | Codebase | Current repository | Primary for API as-is structure/behavior | Express routes/services/repositories, API tests, migrations runner | Tests have 2 failures in this run; no live DB inspection |
| SRC-019 | `Maitribodh-UI/` | UI source, manifest and tests | Codebase | Current repository | Primary for UI as-is structure/behavior | React screens, client API/store, UI tests | Tests have 3 timeouts in this run |
| SRC-020 | `Maitribodh-API/db/migrations/` | Ten numbered PostgreSQL migrations | Database / Codebase | Current repository | Primary for repository schema history | Migrations 0001–0010 | Files do not prove which migrations are applied in any database |
| SRC-021 | Repository root and project configuration | Readmes, lockfiles, scripts and deployment/CI inventory | Codebase / Operations | Current repository | Supporting | Local setup and operations; checked-in deployment evidence | No CI workflow, Terraform, container manifest or live runtime evidence found in inspected root |

## Stakeholders And Ownership

| Role | Name_or_Team | Responsibility | Approval_Needed | Source_or_Status | Required_For_Domain |
|---|---|---|---|---|---|
| Business_Sponsor | Vineet Agrawal | Owns scope, budget and go-live approval | Yes | SRC-011 DEC-001/003/004 and G1/G3 | All |
| Product_Owner | Kantimati Iyer | Clarifies requirements, approves CR-001–003 and UAT | Yes | SRC-011 RACI-001 | All |
| Architecture_Owner | Sujal Ray | Owns architecture, capacity and technical decisions | Yes | SRC-011 DEC-003/004 | All |
| Security_Owner | Vineet Agrawal | Owns access policy, public QR risk and security evidence | Yes | SRC-011 DEC-001, WVR-001 | All |
| QA_Owner | Aditya Sharma | Owns test strategy and evidence | Yes | SRC-011 TEP-001/WVR-006 | All |
| Release_Owner | Gaurav Sharma (DevOps) | Owns release execution and validator runs | Yes | SRC-011 RACI-001 | All |
| Operations_Owner | Vineet Agrawal | Owns runbooks, monitoring, on-call and outage process | Yes | SRC-011 RB-001–006/WVR-005 | All |
| Data_Owner | Vineet Agrawal | Owns person data, retention and privacy policy | Yes | SRC-011 DEC-002/POL-001 | All |
| Compliance_Owner | Vineet Agrawal | Defines DPDP controls, privacy and retention | Yes | SRC-011 DEC-002/POL-001; counsel review due before G3 | All |
| Business_Analyst | [OPEN QUESTION] | Owns requirements clarification | Yes | Not named | Data_And_Analytics only |
| Data_Architect | Not_Applicable | Not_Applicable | Not_Applicable | Software domain | Data_And_Analytics only |
| Data_Engineer | Not_Applicable | Not_Applicable | Not_Applicable | Software domain | Data_And_Analytics only |
| Data_Steward_Governance_Owner | Not_Applicable | Not_Applicable | Not_Applicable | Software domain | Data_And_Analytics only |
| BI_Analytics_Owner | Not_Applicable | Not_Applicable | Not_Applicable | No BI scope | Data_And_Analytics only |

- Global_Staffing_Or_Delivery_Hours_Constraint: Not specified; no approved schedule, named delivery team capacity, or overlap constraint supplied.

## Applicability Matrix

| Artifact | Required_For_Greenfield | Required_For_Reverse_To_Forward | Required_For_Regulated | Domain_Subtype_Condition | Generate | Reason |
|---|---|---|---|---|---|---|
| 00_Project_Intake_And_Mode.md | Yes | Yes | Yes | Always | Yes | Current run classification |
| 01_Source_Baseline.md | Yes | Yes | Yes | No change | Yes | Current docs, source code, migrations and tests reconciled as SRC-BL-006 |
| 02_Requirements_And_Scope.md | Yes | Yes | Yes | No change | No | No new target-state requirements were requested; prior version retained as historical target scope |
| 03_Current_State_Analysis.md | No | Yes | Yes when existing system | No change | Yes | Repository has API/UI source, migrations and tests |
| 04_Target_Solution_Architecture.md | Yes | Yes | Yes | No change | No | No new target architecture decision requested; prior version is not current-state evidence |
| 05_Technology_Engineering_And_Design.md | Yes | Yes | Yes | Software; UI sections required | No | No technology change request; implementation inventory is in 03 |
| 06_Backlog_Delivery_And_Migration_Plan.md | Yes | Yes | Yes | No change | No | No new delivery/migration scope requested |
| 07_Quality_Test_And_Validation.md | Yes | Yes | Yes | No change | Yes | Refresh with current test execution and evidence gaps |
| 08_Release_Operations_And_Governance.md | Yes | Yes | Yes | No change | Yes | Refresh source-change decision and verified operational evidence |
| 09_Build_Prompt.md | Build in scope | Yes | Yes | Application_Code | No | Prior build prompt is stale against SRC-BL-006; no build requested |

## Tool And Integration Targets

| Target_ID | Target_Type | Tool_or_System | Intended_Use | Required | Owner | Notes |
|---|---|---|---|---|---|---|
| TOOL-001 | Cloud | AWS services named in historical architecture | Prior target architecture only | Not verified as current | Unknown | Not observed | No cloud account, infrastructure-as-code, deployment or runtime evidence was inspected |
| TOOL-002 | Repository_CICD | Current Git repository; GitHub Actions not found in inspected root | Source control; CI/deployment unverified | No current pipeline evidence | Unknown | Not observed | No `.github/workflows` directory or CI run was present in the inspected repository |
| TOOL-003 | IaC | Terraform | Environment infrastructure | Not verified as current | Unknown | Not observed | No Terraform files were found in the inspected repository root |
| TOOL-004 | External_Integration | Email, SMS/OTP, WhatsApp, SSO | Not used in Phase 1 | No | Product_Owner | Explicitly excluded in current architecture/requirements |

## Open Questions And Blockers

| Question_ID | Question | Impact | Blocking | Owner | Due_Date | Related_Source |
|---|---|---|---|---|---|---|
| Q-INTAKE-001 | Which database/environment is authoritative, and which of migrations 0001–0010 are applied there? | Prevents claims about deployed schema/data state | Yes for deployment claims | Operations_Owner (not verified) | Not specified | SRC-020, SRC-016 |
| Q-INTAKE-002 | Are CI, Terraform, container, monitoring and cloud-deployment assets maintained outside this repository? | Current repository may not include the full operating system | No | Release_Owner (not verified) | Not specified | SRC-021 |
| Q-INTAKE-003 | What is the approved disposition for the five failing API/UI tests observed in this run? | Test readiness and any future implementation handoff | Yes for release readiness | QA_Owner (not verified) | Not specified | SRC-018, SRC-019 |

## Traceability Instructions
- All current inputs are listed in this artifact and expanded in 01; SRC-005 is explicitly unverified.
- Domain=Software and Data_Analytics_Subtype=Not_Applicable govern conditional sections in 02–09.
- Current source inputs supersede the previous baseline; unresolved questions and material risks flow to 07–10.
- No application implementation may start unless `10_ADLC_Validation_Report.md` is Pass or Conditional Pass with approved exceptions.
- This run is reverse-engineering only. Updated `docs/` and repository source are evidence of the current application; prior forward-engineering build artifacts are retained as historical material and are not authorized for execution.