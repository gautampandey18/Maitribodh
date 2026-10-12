# Project Intake And Mode

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Project_Code: MAITRIBODH-AMS
- Document_Version: 3.1
- Date: 2026-10-08
- Intake_Owner: Vineet Agrawal, Business_Sponsor
- Generated_From_Master_Prompt: Yes

## Purpose
- Intake_Objective: Establish a traceable greenfield baseline from the current BRD, FRD, architecture, database design, flow reference and UI mockup.
- User_Input_Model: Files were found in `SDD_Process/Inputs Artifacts/`; this differs from the canonical `Input Artifacts/` folder name in the master prompt.
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Dashboard_Frontend_In_Scope: No (operational application dashboards are software UI, not BI delivery)
- Build_Target_Type: Application_Code
- Generation_Strategy: Full optimized artifact set; skip only 03 because no existing application/source-code or runtime evidence exists.

## Project Classification

| Classification_ID | Classification_Area | Value | Rationale | Source_IDs | Impact |
|---|---|---|---|---|---|
| CLASS-001 | Project_Domain | Software | Greenfield web/PWA application with user roles, registration workflows, gate operations and application database | SRC-001–SRC-009 | Software optimized artifact rules apply |
| CLASS-002 | Data_Analytics_Subtype | Not_Applicable | PostgreSQL is transactional application storage; no pipeline, warehouse, BI semantic layer or governance catalog evidence | SRC-001–SRC-009 | Data & Analytics conditional sections are N/A |
| CLASS-003 | Risk_Profile | High | Gate access decisions, identity photographs, mobile/passport/ID data, public QR retrieval and audit obligations | SRC-001–SRC-003 | Enterprise security, privacy, operational and approval gates are mandatory |
| CLASS-004 | Regulatory_Exposure | DPDP applies; interim POL-001 approved for build/UAT | SRC-001/SRC-003 state DPDP applies; DEC-002 approves notice/consent/retention policy for build/UAT, with full counsel review before G3 | SRC-001, SRC-003, SRC-011 | Apply CR-002/POL-001; no G3 release before legal review and evidence |
| CLASS-005 | Delivery_Model | Ashram-led project with technical delivery team; schedule not approved | Stakeholders and technical responsibilities are named by team, but no signed delivery plan or named individuals are supplied | SRC-001, SRC-003 | Backlog sequencing is proposed; do not claim an approved timeline or capacity |

## Auto-Detection Rules

| Detection_ID | Evidence | Interpretation | Decision | Confidence | Related_Input_Source |
|---|---|---|---|---|---|
| DET-001 | BRD/FRD, architecture, UI mockup and SQL reference files; no application source tree or runtime evidence | New application requirements and design inputs only | Forward_Engineering | High | SRC-001–SRC-009 |
| DET-002 | HTML/CSS/JS is a mockup; SQL files are schema, sample data and query references | Not an existing deployable codebase | Skip 03_Current_State_Analysis.md | High | SRC-006–SRC-009 |
| DET-003 | PII, gate admission decisions, audit and DPDP obligations | Production business/security sensitivity | Enterprise | High | SRC-001–SRC-003 |
| DET-004 | No orchestration, warehouse, BI semantic-model or catalog artifacts | Application domain, not Data & Analytics | Domain=Software | High | SRC-001–SRC-009 |

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
| 00_Project_Intake_And_Mode.md | Yes | Yes | Yes | Always | Yes | Entry baseline |
| 01_Source_Baseline.md | Yes | Yes | Yes | No change | Yes | Nine current source files |
| 02_Requirements_And_Scope.md | Yes | Yes | Yes | No change | Yes | BRD and FRD supplied |
| 03_Current_State_Analysis.md | No | Yes | Yes when existing system | No change | No | No existing application code/runtime evidence |
| 04_Target_Solution_Architecture.md | Yes | Yes | Yes | No change | Yes | Target architecture and security required |
| 05_Technology_Engineering_And_Design.md | Yes | Yes | Yes | Software; UI sections required | Yes | Architecture and mockup supplied |
| 06_Backlog_Delivery_And_Migration_Plan.md | Yes | Yes | Yes | No change | Yes | Delivery backlog required; data migration is N/A (fresh start) |
| 07_Quality_Test_And_Validation.md | Yes | Yes | Yes | No change | Yes | Enterprise quality and evidence gates required |
| 08_Release_Operations_And_Governance.md | Yes | Yes | Yes | No change | Yes | Enterprise governance, operations and compliance required |
| 09_Build_Prompt.md | Build in scope | Yes | Yes | Application_Code | Yes, gated | Implementation handoff is not authorized until 10 passes |

## Tool And Integration Targets

| Target_ID | Target_Type | Tool_or_System | Intended_Use | Required | Owner | Notes |
|---|---|---|---|---|---|---|
| TOOL-001 | Cloud | AWS: ECS Fargate, RDS PostgreSQL, S3, CloudFront/WAF, Route 53/ACM, KMS, Secrets Manager, CloudWatch | Production hosting and operations | Yes | IT Team | Architecture target; provisioning/account readiness unverified |
| TOOL-002 | Repository_CICD | GitHub / GitHub Actions | Source control, CI, deployment | Yes | IT Team | Architecture describes repo `Maitribudh-AMS`; no repository supplied |
| TOOL-003 | IaC | Terraform | Environment infrastructure | Yes | IT Team | Source architecture; code and approval not supplied |
| TOOL-004 | External_Integration | Email, SMS/OTP, WhatsApp, SSO | Not used in Phase 1 | No | Product_Owner | Explicitly excluded in current architecture/requirements |

## Open Questions And Blockers

| Question_ID | Question | Impact | Blocking | Owner | Due_Date | Related_Source |
|---|---|---|---|---|---|---|
| Q-INTAKE-001 | Confirm responsive web/device-camera gate platform (OI-01) | User-device and rollout design | Yes before design approval | Ashram Management | Not specified | SRC-001, SRC-003 |
| Q-INTAKE-002 | Confirm photo capture/upload and interim storage/consent handling (OI-06) | Registration and PII controls | No for build/UAT; approved by POL-001, full legal review before G3 | Data_Owner | 2026-10-08; legal review before G3 | SRC-001–SRC-003, SRC-011 |
| Q-INTAKE-003 | Approve detailed DPDP controls, consent, retention periods and audit retention (OI-10) | Legal/privacy and lifecycle | No for build/UAT under signed interim POL-001; legal review still blocks G3 | Compliance_Owner | Before G3 | SRC-001, SRC-003, SRC-011 |
| Q-INTAKE-004 | Confirm whether approval_required is configurable for each category (OI-09) | Category behavior/schema | Yes before acceptance | Product_Owner | Not specified | SRC-001, SRC-002, SRC-007 |
| Q-INTAKE-005 | Confirm overstay cutoffs for categories other than day visitors/contractors and alert recipients (OI-11) | Background job and notification tests | Yes before release | Operations_Owner | Not specified | SRC-001–SRC-003 |
| Q-INTAKE-006 | Decide if accompanying people count toward occupancy (OI-12) | Occupancy reports and counts | Yes before acceptance | Product_Owner | Not specified | SRC-001, SRC-007 |
| Q-INTAKE-007 | Approve mappings between six base categories and broad categories; permissions (OI-16) | Seed data and access policy | Yes before production setup | Product_Owner | Not specified | SRC-001, SRC-008 |
| Q-INTAKE-008 | Finalize bulk-upload columns, photos and approval handling for Staff/Parivar rows (OI-17) | Upload implementation and tests | Yes before bulk-upload release | Product_Owner | Not specified | SRC-001, SRC-002 |
| Q-INTAKE-009 | Confirm QR payload fields/versioning that guarantee uniqueness across duplicate/shared-mobile registrations (OI-19) | QR validation, lookup and gate scan | No; signed QR uses Person ID/version/HMAC per DEC-001 | Architecture_Owner | 2026-10-08 | SRC-001–SRC-004, SRC-009, SRC-011 |
| Q-INTAKE-010 | Resolve conflicting scale statements and select capacity baseline | Infrastructure sizing and performance gate | No; CAP-01–06/SLO-01–06 approved by DEC-003; load test remains before G2/G3 | Architecture_Owner | 2026-10-08; load test before G2 | SRC-001, SRC-003, SRC-011 |
| Q-INTAKE-011 | Approve production and pilot topology and availability targets | Resilience, cost and release scope | No; selected in DEC-003; production provisioning still pending | Business_Sponsor | 2026-10-08 | SRC-003, SRC-011 |
| Q-INTAKE-012 | Name accountable individual approvers and accept/reject the source architecture and this baseline | Governance and build authorization | Resolved for build: G0 baseline accepted and G1 approved on 2026-10-09 by Vineet Agrawal and Sujal Ray; G2/G3 approvals remain | Business_Sponsor | 2026-10-09; approved | SRC-001–SRC-003, SRC-011; approval confirmed by requester, separate evidence ID not provided |
| Q-INTAKE-013 | Hold the decision meeting and complete/sign the Blocker Resolution Pack; confirm proposed resolutions/waivers and provide named owners/dates | Validation readiness and closure of BLOCK-001–006 | Resolved for build: pack v1.2 signed, validator passed, and G1 approved on 2026-10-09; later G2/G3 evidence remains | Business_Sponsor and control owners | 2026-10-09; resolved for build | SRC-011; approval confirmed by requester, separate evidence ID not provided |

## Traceability Instructions
- All current inputs are listed in this artifact and expanded in 01; SRC-005 is explicitly unverified.
- Domain=Software and Data_Analytics_Subtype=Not_Applicable govern conditional sections in 02–09.
- Current source inputs supersede the previous baseline; unresolved questions and material risks flow to 07–10.
- No application implementation may start unless `10_ADLC_Validation_Report.md` is Pass or Conditional Pass with approved exceptions.