# ADLC Artifact Validation Rules

## Purpose

Use this file as the machine-checkable and reviewer-checkable validation rule source for optimized ADLC generated artifacts.

Validation happens after `09_Build_Prompt.md` is generated and before any application build starts. The expected output is `10_ADLC_Validation_Report.md`.

## Validation Severity

| Severity | Meaning | Build_Impact |
|---|---|---|
| Blocker | Missing required artifact, missing required enterprise evidence, unresolved blocking question, or unsafe build prompt condition | Build must not start |
| Warning | Incomplete evidence, weak traceability, draft approval, or missing optional section | Build may proceed only with owner acceptance |
| Info | Non-blocking observation or recommendation | No build block |

## Execution Mode Required Artifacts

| Execution_Mode | Required_Artifacts |
|---|---|
| Forward_Engineering | 00_Project_Intake_And_Mode.md, 01_Source_Baseline.md, 02_Requirements_And_Scope.md, 04_Target_Solution_Architecture.md, 05_Technology_Engineering_And_Design.md, 06_Backlog_Delivery_And_Migration_Plan.md, 07_Quality_Test_And_Validation.md, 08_Release_Operations_And_Governance.md, 09_Build_Prompt.md, 10_ADLC_Validation_Report.md |
| Reverse_Engineering_Only | 00_Project_Intake_And_Mode.md, 01_Source_Baseline.md, 03_Current_State_Analysis.md, 07_Quality_Test_And_Validation.md, 08_Release_Operations_And_Governance.md, 10_ADLC_Validation_Report.md |
| Reverse_To_Forward_Engineering | 00_Project_Intake_And_Mode.md, 01_Source_Baseline.md, 02_Requirements_And_Scope.md, 03_Current_State_Analysis.md, 04_Target_Solution_Architecture.md, 05_Technology_Engineering_And_Design.md, 06_Backlog_Delivery_And_Migration_Plan.md, 07_Quality_Test_And_Validation.md, 08_Release_Operations_And_Governance.md, 09_Build_Prompt.md, 10_ADLC_Validation_Report.md |
| Enhancement | 00_Project_Intake_And_Mode.md, 01_Source_Baseline.md, 02_Requirements_And_Scope.md, 04_Target_Solution_Architecture.md, 05_Technology_Engineering_And_Design.md, 06_Backlog_Delivery_And_Migration_Plan.md, 07_Quality_Test_And_Validation.md, 08_Release_Operations_And_Governance.md, 09_Build_Prompt.md, 10_ADLC_Validation_Report.md |
| Migration_Modernization | 00_Project_Intake_And_Mode.md, 01_Source_Baseline.md, 02_Requirements_And_Scope.md, 03_Current_State_Analysis.md, 04_Target_Solution_Architecture.md, 05_Technology_Engineering_And_Design.md, 06_Backlog_Delivery_And_Migration_Plan.md, 07_Quality_Test_And_Validation.md, 08_Release_Operations_And_Governance.md, 09_Build_Prompt.md, 10_ADLC_Validation_Report.md |

`Domain` (Software vs. Data_And_Analytics) does not remove whole artifacts from this table — it only changes section-level content within each required artifact via the `Domain_Condition` column in Core Section Rules below. The one exception is the whole-artifact N/A case recorded in `00_Project_Intake_And_Mode.md`'s Applicability Matrix (`05`/`09` may be N/A for a `Data_Governance_Quality_MDM`-only engagement with no technology/pipeline build in scope) — when that applies, treat `05`/`09` as not required for that project regardless of this table.

## Core Section Rules

`Domain_Condition` qualifies when a rule's `Required_Sections` are actually required. `All` means the rule applies unchanged regardless of `Domain`/`Data_Analytics_Subtype` — every rule inherited from the original rule set keeps `All` so Software projects see zero behavior change. Rows with a non-`All` condition are new or split from the original SEC-05/SEC-09 rows to make Data & Analytics support enforceable rather than advisory. `Subtype ∈ {...}` means the rule applies when any listed `Data_Analytics_Subtype` value is selected (multi-select union, per the combination rule in `00_Project_Intake_And_Mode_Template.md`).

| Rule_ID | Artifact | Required_Sections | Domain_Condition | Severity |
|---|---|---|---|---|
| SEC-00 | 00_Project_Intake_And_Mode.md | Metadata, Purpose, Project Classification, Auto-Detection Rules, Source Folder Inventory, Stakeholders And Ownership, Applicability Matrix, Tool And Integration Targets, Open Questions And Blockers | All | Blocker |
| SEC-00-DOMAIN | 00_Project_Intake_And_Mode.md | Purpose must include Domain and Data_Analytics_Subtype fields; Project Classification must include CLASS-001 Project_Domain and CLASS-002 Data_Analytics_Subtype rows | All | Blocker |
| SEC-01 | 01_Source_Baseline.md | Metadata, Purpose, Consolidated Source Inventory, Auto-Classification Summary, Source Version Register, Post-Generation Source Change Log, Changed Source Impact Summary, Regeneration Decision Matrix, Source Precedence And Conflict Rules, Source Conflict Register, Source Coverage Map | All | Blocker |
| SEC-02 | 02_Requirements_And_Scope.md | Metadata, Purpose, Project Overview, User Personas, Scope, Functional Requirements, Non-Functional Requirements, Workflow And Flow Summary, Detailed Flow Rules, Business Rules And Decisions, Assumptions Constraints And Open Questions | All | Blocker |
| SEC-03-CORE | 03_Current_State_Analysis.md | Metadata, Purpose, Codebase Analysis Depth And Confidence, Language Framework And Runtime Detection, Codebase Source Inventory, Repository Project And Module Inventory, Entrypoint Route Controller And Service Inventory, Package Dependency Manifest Inventory, Current API Interface Job And Integration Inventory, Current Data And Persistence Inventory, Runtime Operations And Deployment Inventory, Deployment Runtime And Test Evidence Matrix, Test Quality Security And Technical Debt Assessment, As-Is To Target Candidate Mapping | All | Blocker |
| SEC-03-DA | 03_Current_State_Analysis.md | Data Pipeline And Orchestration Inventory | Domain=Data_And_Analytics AND Subtype ∈ {Data_Pipeline_ETL, Data_Warehouse_Lakehouse, Data_Migration, BI_Reporting_Analytics} | Blocker |
| SEC-04-CORE | 04_Target_Solution_Architecture.md | Metadata, Purpose, Executive Summary, Architecture Views, Diagram-Ready Architecture Inventory, Component Architecture, Integration Architecture, Data Architecture And Governance, Security Privacy And Compliance Architecture, Scalability Resilience And Operations, Architecture Decisions | All | Blocker |
| SEC-04-DA | 04_Target_Solution_Architecture.md | Data Pipeline And Storage Architecture | Domain=Data_And_Analytics AND Subtype ∈ {Data_Pipeline_ETL, Data_Warehouse_Lakehouse, Data_Migration} | Blocker |
| SEC-04-MDM | 04_Target_Solution_Architecture.md | Master Data Management Design | Domain=Data_And_Analytics AND Data_Governance_Quality_MDM ∈ Subtype | Blocker |
| SEC-04-ACCESS | 04_Target_Solution_Architecture.md | Access Control And Masking Rules | Domain=Data_And_Analytics AND Subtype ∈ {Data_Warehouse_Lakehouse, BI_Reporting_Analytics, Data_Governance_Quality_MDM} | Blocker |
| SEC-04-BI | 04_Target_Solution_Architecture.md | BI Semantic Model And Metric Layer Architecture | Domain=Data_And_Analytics AND BI_Reporting_Analytics ∈ Subtype | Blocker |
| SEC-05-CORE | 05_Technology_Engineering_And_Design.md | Metadata, Purpose, Technology Source Inventory, Target Technology Stack, Project Structure And Repository Hygiene, Naming Conventions, Authentication Authorization And Configuration, Engineering Standards, DevSecOps And Tooling | All | Blocker |
| SEC-05-UI | 05_Technology_Engineering_And_Design.md | UI Screen And Control Inventory, Design System | Domain=Software OR (Domain=Data_And_Analytics AND BI_Reporting_Analytics ∈ Subtype AND Dashboard_Frontend_In_Scope=Yes) | Blocker when condition true; section is not required at all (removed from the required list, not merely marked N/A) when condition is false |
| SEC-05-DA | 05_Technology_Engineering_And_Design.md | Data Pipeline And Job Design Standards | Domain=Data_And_Analytics AND Subtype ∈ {Data_Pipeline_ETL, Data_Warehouse_Lakehouse, Data_Migration, Data_Governance_Quality_MDM} | Blocker |
| SEC-05-BI | 05_Technology_Engineering_And_Design.md | BI Semantic Model And Dashboard Inventory | Domain=Data_And_Analytics AND BI_Reporting_Analytics ∈ Subtype | Blocker |
| SEC-06 | 06_Backlog_Delivery_And_Migration_Plan.md | Metadata, Purpose, Backlog Hierarchy, Backlog Intake Prioritization And Review Criteria, Migration And Transition Plan, Retained Replaced Retired Component Summary, Migration Cutover And Reconciliation Strategy, Data Migration Reconciliation Checklist, Delivery Phases And Milestones, Dependencies And Sequencing, Estimation Capacity And Forecast, Delivery Risks And Open Questions | All | Blocker |
| SEC-07-CORE | 07_Quality_Test_And_Validation.md | Metadata, Purpose, Quality Gate Thresholds By Tier, Minimum Required Tests By Mode, Implementation Unit And Test Strategy, Requirement Traceability And Coverage, Measurable NFR Acceptance Matrix, Evidence And Scan Validation Matrix, Regression Test Suite, Build Prompt Validation, Enterprise Readiness Score, Quality Gate Decision | All | Blocker |
| SEC-07-DA | 07_Quality_Test_And_Validation.md | Data Quality Validation Matrix | Domain=Data_And_Analytics | Blocker |
| SEC-07-BI | 07_Quality_Test_And_Validation.md | BI Dashboard UAT And KPI Reconciliation | Domain=Data_And_Analytics AND BI_Reporting_Analytics ∈ Subtype | Blocker |
| SEC-08-CORE | 08_Release_Operations_And_Governance.md | Metadata, Purpose, Release Notes, Release Scope And Readiness, Environment Configuration And Deployment Readiness, Source Control Build And Release Baseline, Deployment Rollback And Communication, Production Readiness Checklist, Operational Readiness, Support Model And Incident Operations, Governance Baseline And Ownership, Source Change Control Register, Regeneration And Baseline Approval, Approval Gates, Build Orchestration Governance, Compliance And Audit Evidence | All | Blocker |
| SEC-08-DA | 08_Release_Operations_And_Governance.md | Data Governance Cadence And Stewardship | Domain=Data_And_Analytics | Blocker |
| SEC-08-ACCESS | 08_Release_Operations_And_Governance.md | Access Control And Masking Governance | Domain=Data_And_Analytics AND Subtype ∈ {Data_Warehouse_Lakehouse, BI_Reporting_Analytics, Data_Governance_Quality_MDM} | Blocker |
| SEC-09-CORE | 09_Build_Prompt.md | Metadata, Purpose, Validation Preconditions, Do Not Build If, Source Artifact Baseline, Build Orchestration Handshake, Agent Role And Ownership Matrix, Shared File And Conflict Protocol, Session Handoff Contract, Build Wave Plan, Integration And Acceptance Gates, Build Scope And Non-Goals, Mandatory Tech Stack, Project Structure, Data Model And Migration, API Endpoints Integrations And Jobs, Migration-Specific Build Constraints, Implementation Order, Testing And Validation Requirements, Generation Rules, Delivery Report Requirements | All | Blocker |
| SEC-09-UI | 09_Build_Prompt.md | Screens Components And Design System | Build_Target_Type=Application_Code OR Build_Target_Type=BI_Semantic_Model_And_Dashboards | Blocker when condition true; section is not required at all when condition is false |
| SEC-09-DA | 09_Build_Prompt.md | Data Pipeline And Model Build Specification | Build_Target_Type ≠ Application_Code | Blocker |
| SEC-10 | 10_ADLC_Validation_Report.md | Metadata, Validation Summary, Required Artifact Check, Section Completeness Check, Traceability Coverage Check, Source Change And Baseline Freshness Check, Impacted Artifact Regeneration Check, Build Prompt Staleness Check, Build Orchestration Readiness Check, Blocking Conditions, Enterprise Readiness Check, Build Prompt Approval Decision | All | Blocker |

## Traceability Rules

| Rule_ID | Rule | Severity |
|---|---|---|
| TRACE-FR | Every `FR-*` ID must appear in `02_Requirements_And_Scope.md`, `06_Backlog_Delivery_And_Migration_Plan.md`, `07_Quality_Test_And_Validation.md`, and `09_Build_Prompt.md` when build is in scope. | Blocker |
| TRACE-NFR | Every `NFR-*` ID must include metric, target, validation method, evidence, owner, and acceptance status in `07_Quality_Test_And_Validation.md`. | Blocker |
| TRACE-INT | Every integration must include auth, error handling, monitoring, owner or owning artifact, and related requirement IDs. | Blocker |
| TRACE-DATA | Every data item must include classification, owner or source of truth, retention, access control, encryption or security handling, and related requirement IDs. | Blocker |
| TRACE-MIG | Every migration item must map current state to target state and include migration steps, data/interface impact, fallback or rollback, risk, and backlog IDs. | Blocker |
| TRACE-WAIVER | Every waiver or exception must include owner, approver, rationale, mitigation, review date, and related IDs. | Blocker |
| TRACE-BLOCKER | Every open blocking question must include owner, due date or target resolution, impact, and related IDs. | Blocker |
| TRACE-SOURCE-CHANGE | Every post-generation source change must include source ID, previous baseline, new baseline, impact assessment, impacted artifacts, regeneration action, validation impact, and build prompt impact. | Blocker |
| TRACE-BUILD-ORCH | Every multi-agent or multi-session build must include orchestrator, accepted artifact baseline, agent ownership, shared-file protocol, handoff contract, conflict protocol, build waves, and acceptance gates. | Blocker |
| TRACE-DQ | Every Data Quality Validation Matrix row must include dimension, metric, threshold, validation method, and owner. Applies only when Domain=Data_And_Analytics. | Blocker |
| TRACE-MDM | Every Master Data Management Design row must include golden-record/survivorship rule, entity-resolution method, and named steward. Applies only when Data_Governance_Quality_MDM ∈ Subtype. | Blocker |

## Enterprise And Regulated Gate Rules

| Rule_ID | Required_For | Required_Evidence | Severity |
|---|---|---|---|
| ENT-SEC | Enterprise, Regulated | Threat model summary, security controls, auth/authz model, secrets handling, security validation evidence | Blocker |
| ENT-DATA | Enterprise, Regulated | Data classification, owner/source of truth, retention, access control, encryption, privacy handling | Blocker |
| ENT-COMP | Regulated | Compliance framework mapping, control owner, evidence, status, review date | Blocker |
| ENT-DEVSECOPS | Enterprise, Regulated | Dependency scan, secrets scan, SAST or equivalent review, license/SBOM expectation when applicable | Warning for Enterprise, Blocker for Regulated |
| ENT-OPS | Enterprise, Regulated | Monitoring, alerting, runbook, support model, incident severity, backup/restore or DR evidence | Blocker |
| ENT-APPROVAL | Enterprise, Regulated | Build start, release start, production cutover, and exception waiver approval gates | Blocker |
| DA-DQ | Enterprise, Regulated + Domain=Data_And_Analytics | Data-quality scorecard, dimension taxonomy, thresholds, evidence | Blocker |
| DA-GOV | Enterprise, Regulated + Domain=Data_And_Analytics | Data governance cadence, stewardship ownership, runbooks/DQ-alert/retention controls | Blocker |
| DA-MDM | Enterprise, Regulated + Data_Governance_Quality_MDM ∈ Subtype | Golden-record/survivorship rules, master-entity stewardship, classification scheme | Blocker |
| DA-ACCESS | Enterprise, Regulated + Domain=Data_And_Analytics | ABAC rules, masking/tokenization inventory, RLS/CLS evidence, PII tier mapping | Blocker |
| DA-BI | Enterprise, Regulated + BI_Reporting_Analytics ∈ Subtype | Refresh cadence/staleness SLA evidence, KPI-signoff gate | Blocker for Regulated, Warning for Enterprise |

## Blocking Conditions

- Missing required artifact for detected execution mode.
- Required section missing from a generated artifact.
- `09_Build_Prompt.md` contains unresolved blockers or unapproved scope.
- Enterprise or Regulated tier lacks security, data, compliance, release, operations, or governance evidence.
- Reverse-to-forward project lacks current-state-to-target-state mapping.
- Migration lacks rollback/fallback, cutover, or data reconciliation plan.
- Any critical open question is marked blocking without owner and resolution path.
- Post-generation source change is open, unassessed, or missing impacted-artifact regeneration decision.
- Build prompt source baseline is stale or does not match latest accepted source baseline.
- Multi-agent or multi-session build lacks formal orchestration handshake, agent ownership, shared-file protocol, or session handoff contract.
- Data & Analytics domain project (Enterprise/Regulated tier) lacks data-quality scorecard, lineage evidence, or KPI-signoff gate.
- `Data_Governance_Quality_MDM` subtype selected without master-entity stewardship evidence.

## Validation Report Rule

`10_ADLC_Validation_Report.md` is required before implementation handoff for Enterprise, Regulated, Reverse_To_Forward_Engineering, Migration, and Modernization work. The build prompt is not build-ready until the validation report result is `Pass` or `Conditional Pass` with approved exceptions.
