# Project Intake And Mode Template

## Metadata
Instruction: Generate this artifact first for every project. It decides execution mode, delivery tier, source readiness, and required downstream artifacts.

- Project_Name: {{Project_Name}}
- Project_Code: {{Project_Code}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Intake_Owner: {{Owner}}
- Generated_From_Master_Prompt: Yes

## Purpose
Instruction: Convert all available project inputs into a controlled ADLC starting point with the least manual effort from the user.

- Intake_Objective: {{Intake_Objective}}
- User_Input_Model: User provides project-related files in `Input Artifacts/` and runs `ADLC_MasterPrompt.md`.
- Execution_Mode: {{Forward_Engineering_Greenfield | Reverse_Engineering_Only | Reverse_To_Forward_Engineering | Enhancement | Migration | Modernization | Unknown}}
- Delivery_Tier: {{Lite | Standard | Enterprise | Regulated}}
- Domain: {{Software | Data_And_Analytics}}
- Data_Analytics_Subtype: {{Data_Pipeline_ETL | Data_Warehouse_Lakehouse | BI_Reporting_Analytics | Data_Migration | Data_Governance_Quality_MDM | Not_Applicable}}
- Dashboard_Frontend_In_Scope: {{Yes_No_Not_Applicable}}
- Generation_Strategy: Generate only optimized project artifacts unless a regulated or high-risk project requires separate supporting artifacts.

## Project Classification
Instruction: Preserve the classification detail from the detailed project intake template. `Domain` and `Data_Analytics_Subtype` are independent of Execution_Mode and Delivery_Tier and combine with them rather than replacing them. `Data_Analytics_Subtype` is multi-select when `Domain: Data_And_Analytics`; leave `Not_Applicable` when `Domain: Software`. If Domain is `Data_And_Analytics` but no Subtype can be determined, do not silently default to all subtypes or none — record it as an open question in Open Questions And Blockers. `ML_AI_Model` is a permanent, standing exclusion from `Data_Analytics_Subtype` (not a temporary scope cut) — classify any ML/AI model-lifecycle evidence (training pipelines, model registries, notebooks calling `.fit`/`.train()`, feature stores) as `Other_Out_Of_Domain_Scope` in Source Folder Inventory rather than mapping it to a subtype above.

| Classification_ID | Classification_Area | Value | Rationale | Source_IDs | Impact |
|---|---|---|---|---|---|
| CLASS-001 | Project_Domain | {{Software_or_Data_And_Analytics}} | {{Rationale}} | {{Source_IDs}} | {{Impact}} |
| CLASS-002 | Data_Analytics_Subtype | {{Value_or_Not_Applicable}} | {{Rationale}} | {{Source_IDs}} | {{Impact}} |
| CLASS-003 | Risk_Profile | {{Value}} | {{Rationale}} | {{Source_IDs}} | {{Impact}} |
| CLASS-004 | Regulatory_Exposure | {{Value}} | {{Rationale}} | {{Source_IDs}} | {{Impact}} |
| CLASS-005 | Delivery_Model | {{Value}} | {{Rationale}} | {{Source_IDs}} | {{Impact}} |

## Auto-Detection Rules
Instruction: Determine execution mode and required artifacts from available files. If detection is uncertain, choose the safest mode and record the uncertainty.

| Detection_ID | Evidence | Interpretation | Decision | Confidence | Related_Input_Source |
|---|---|---|---|---|---|
| DET-001 | {{Evidence}} | {{Interpretation}} | {{Mode_or_Tier_Decision}} | {{High_Medium_Low}} | {{Source_ID}} |

Rules:
- If source code, repository snapshots, dependency manifests, package files, build configs, deployment configs, runtime logs, or test reports are present, enable reverse-engineering analysis.
- If requirements, meeting notes, emails, PDFs, spreadsheets, UI references, database references, or technical notes are present without source-code evidence, use forward engineering.
- If both existing codebase evidence and future requirements exist, use reverse-to-forward engineering.
- If sensitive data, regulated domain, payment data, PHI, PII-heavy workflows, audit obligations, external customer exposure, production integrations, or formal compliance references exist, set tier to Enterprise or Regulated.

Domain and Data_Analytics_Subtype detection signals:
- Airflow/Dagster/Prefect DAG files, dbt project files (`dbt_project.yml`, `models/*.sql`), Informatica/DataStage/SnapLogic/Talend job exports, or Snowpipe/`COPY INTO` scripts → set `Domain: Data_And_Analytics`, add `Data_Pipeline_ETL`.
- Warehouse DDL (partitioned `CREATE TABLE`, Snowflake/BigQuery/Redshift/Synapse DDL), `fact_*`/`dim_*` naming, ERwin/dbt `schema.yml`, or medallion-style folder structures (`raw/bronze/silver/gold`) → set `Domain: Data_And_Analytics`, add `Data_Warehouse_Lakehouse`.
- `.pbix`, `.twbx`/`.twb`, `.lkml`, Qlik `.qvf`, semantic-model exports, or dashboard/report catalogs → set `Domain: Data_And_Analytics`, add `BI_Reporting_Analytics`, set `Dashboard_Frontend_In_Scope: Yes`.
- Source-to-target mapping workbooks, cutover runbooks, or legacy-to-target data-object mapping spreadsheets → set `Domain: Data_And_Analytics`, add `Data_Migration`.
- Data-catalog exports (Alation, Collibra, Informatica EDC/MDM, Reltio), governance policy documents, stewardship RACI docs, or DQ rule repositories (Great Expectations, dbt tests) → set `Domain: Data_And_Analytics`, add `Data_Governance_Quality_MDM`.
- ML training pipeline code, model registries (MLflow, SageMaker Model Registry), notebooks calling `.fit()`/`.train()`, or feature-store configs → classify as `Other_Out_Of_Domain_Scope`; do not map to any `Data_Analytics_Subtype` value (standing boundary, not a per-project judgment call).
- If both application evidence (routes/controllers/UI) and Data & Analytics evidence exist, set `Domain: Data_And_Analytics` and record the Software-side evidence in Applicability Matrix reasoning rather than discarding it — this is a mixed-domain project, not a misclassification.
- If Domain signals are absent or ambiguous, default to `Domain: Software` and record the uncertainty rather than guessing a Data_Analytics_Subtype.

## Source Folder Inventory
Instruction: Scan every source folder under `Input Artifacts/`. Include all usable files, including requirements, meeting notes, emails, PDFs, spreadsheets, CSVs, images, diagrams, API specs, database references, and codebase references.

| Source_ID | Folder | File_or_Path | Source_Type | Status | Priority | Used_For | Notes |
|---|---|---|---|---|---|---|---|
| SRC-001 | {{Folder}} | {{File_or_Path}} | {{Requirement_MeetingNote_Email_PDF_Spreadsheet_UI_Database_Technical_Codebase_Config_Log_Test_Pipeline_Config_Notebook_BI_Artifact_Data_Catalog_Entry_Other_Out_Of_Domain_Scope}} | {{Approved_Draft_Reference_Only_Unknown}} | {{Primary_Supporting_Reference}} | {{Used_For}} | {{Notes}} |

## Stakeholders And Ownership
Instruction: Extract or infer required roles from source files. Mark unknown roles as `[OPEN QUESTION]`. Rows marked `Data_And_Analytics` in `Required_For_Domain` apply only when `Domain: Data_And_Analytics` (or `Hybrid` evidence per the Auto-Detection Rules); leave them `Not_Applicable` for pure Software projects.

| Role | Name_or_Team | Responsibility | Approval_Needed | Source_or_Status | Required_For_Domain |
|---|---|---|---|---|---|
| Business_Sponsor | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Product_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Architecture_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Security_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| QA_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Release_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Operations_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Data_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Compliance_Owner | {{Name_or_Team}} | {{Responsibility}} | {{Yes_No}} | {{Source_or_Open_Question}} | All |
| Business_Analyst | {{Name_or_Team}} | Co-owns 02_Requirements_And_Scope.md; contributes to intake | {{Yes_No}} | {{Source_or_Open_Question}} | Data_And_Analytics |
| Data_Architect | {{Name_or_Team}} | Owns 01_Source_Baseline.md, 03_Current_State_Analysis.md, 04_Target_Solution_Architecture.md data/architecture content | {{Yes_No}} | {{Source_or_Open_Question}} | Data_And_Analytics |
| Data_Engineer | {{Name_or_Team}} | Owns 05_Technology_Engineering_And_Design.md, 06_Backlog_Delivery_And_Migration_Plan.md, 09_Build_Prompt.md pipeline/build content | {{Yes_No}} | {{Source_or_Open_Question}} | Data_And_Analytics |
| Data_Steward_Governance_Owner | {{Name_or_Team}} | Master-entity stewardship, data quality/lineage/access-control ownership | {{Yes_No}} | {{Source_or_Open_Question}} | Data_And_Analytics |
| BI_Analytics_Owner | {{Name_or_Team}} | Semantic model/KPI ownership, dashboard certification | {{Yes_No}} | {{Source_or_Open_Question}} | Data_And_Analytics (BI_Reporting_Analytics) |

- Global_Staffing_Or_Delivery_Hours_Constraint: {{Constraint_or_Not_Applicable}} — record globally-distributed staffing models or required delivery-hours overlap here; cross-reference in 06_Backlog_Delivery_And_Migration_Plan.md Dependencies And Sequencing and 08_Release_Operations_And_Governance.md Support Model And Incident Operations.

## Applicability Matrix
Instruction: Decide which optimized artifacts must be generated. The `Domain_Subtype_Condition` column decides whether an artifact is required, N/A, or reduced-scope specifically because of `Domain`/`Data_Analytics_Subtype` — it is additive to, not a replacement for, the Mode/Tier columns.

| Artifact | Required_For_Greenfield | Required_For_Reverse_To_Forward | Required_For_Regulated | Domain_Subtype_Condition | Generate | Reason |
|---|---|---|---|---|---|---|
| 00_Project_Intake_And_Mode.md | Yes | Yes | Yes | Always required | Yes | Entry artifact |
| 01_Source_Baseline.md | Yes | Yes | Yes | No change | {{Yes_No}} | {{Reason}} |
| 02_Requirements_And_Scope.md | Yes | Yes | Yes | No change | {{Yes_No}} | {{Reason}} |
| 03_Current_State_Analysis.md | No | Yes | Yes_when_existing_system | No change | {{Yes_No}} | {{Reason}} |
| 04_Target_Solution_Architecture.md | Yes | Yes | Yes | No change | {{Yes_No}} | {{Reason}} |
| 05_Technology_Engineering_And_Design.md | Yes | Yes | Yes | N/A at whole-artifact level when `Domain: Data_And_Analytics` AND `Data_Governance_Quality_MDM` is the only selected subtype AND no technology/pipeline build is in scope (pure governance-audit engagement) | {{Yes_No}} | {{Reason}} |
| 06_Backlog_Delivery_And_Migration_Plan.md | Yes | Yes | Yes | No change | {{Yes_No}} | {{Reason}} |
| 07_Quality_Test_And_Validation.md | Yes | Yes | Yes | No change | {{Yes_No}} | {{Reason}} |
| 08_Release_Operations_And_Governance.md | Yes | Yes | Yes | No change | {{Yes_No}} | {{Reason}} |
| 09_Build_Prompt.md | Yes_when_build_in_scope | Yes_when_build_in_scope | Yes_when_build_in_scope | N/A under the same condition as 05 above — a governance-only assessment produces no build prompt | {{Yes_No}} | {{Reason}} |

## Tool And Integration Targets
Instruction: Capture delivery/tooling targets from intake and backlog export templates. Use `Commercial_Reference` to cross-reference (not generate) bid-management/commercial artifacts such as SOW terms, pricing workbooks, or rate cards — these are explicitly out of ADLC's engineering-delivery scope; see 04_Target_Solution_Architecture.md and 08_Release_Operations_And_Governance.md for the corresponding governance/architecture cross-references.

| Target_ID | Target_Type | Tool_or_System | Intended_Use | Required | Owner | Notes |
|---|---|---|---|---|---|---|
| TOOL-001 | {{Backlog_CICD_Repository_Cloud_Documentation_TestManagement_Monitoring_Commercial_Reference_Other}} | {{Tool_or_System}} | {{Use}} | {{Yes_No}} | {{Owner}} | {{Notes}} |

## Open Questions And Blockers
Instruction: Capture missing information without blocking generation unless the gap changes scope, security, compliance, architecture, or release readiness.

| Question_ID | Question | Impact | Blocking | Owner | Due_Date | Related_Source |
|---|---|---|---|---|---|---|
| Q-INTAKE-001 | {{Question}} | {{Impact}} | {{Yes_No}} | {{Owner}} | {{YYYY-MM-DD}} | {{Source_ID}} |

## Traceability Instructions
- Every source file consumed by later artifacts must appear in Source Folder Inventory or 01_Source_Baseline.md.
- Execution mode and delivery tier must be referenced by all downstream optimized artifacts.
- Unknown ownership, missing approvals, source conflicts, or regulatory uncertainty must flow into 08_Release_Operations_And_Governance.md.
- Domain and Data_Analytics_Subtype must be referenced by all downstream optimized artifacts exactly like Execution_Mode and Delivery_Tier; every conditional/N/A section in 02 through 09 must cite the Domain_Subtype_Condition recorded here as its rationale.
- Content out of ADLC's engineering scope (ML/AI model-lifecycle artifacts; commercial/bid-management deliverables) must be recorded here as `Other_Out_Of_Domain_Scope` or via a `Commercial_Reference` Tool And Integration Target row, never silently omitted.
