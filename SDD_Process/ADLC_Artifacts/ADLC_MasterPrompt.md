# ADLC Master Prompt

Use this file as the canonical system-level instruction source for optimized ADLC artifact generation and validation.

The intended user workflow is:

1. Put all project-related files directly into `Input Artifacts/`. Subfolders are optional.
2. Run this `ADLC_MasterPrompt.md`.
3. Generate project-specific Markdown files into `Generated Artifacts/`.
4. Validate the generated artifacts and produce `10_ADLC_Validation_Report.md`.
5. If source inputs change after first-generation, update `01_Source_Baseline.md`, assess impact, regenerate only impacted artifacts, and revalidate.

The user should not have to manually decide which detailed template to run. This master prompt must inspect available inputs, select the correct execution mode, and generate the smallest complete set of optimized artifacts required for the project.

## Purpose

Create a low-effort, enterprise-grade ADLC process that supports three primary objectives:

- Forward engineering: build a new application from scratch for greenfield projects.
- Reverse-to-forward engineering: analyze an existing codebase or legacy system first, then create target-state artifacts for modernization, migration, enhancement, rewrite, or rebuild.
- Data & Analytics delivery: build, migrate, or govern data pipelines/ETL, data warehouses/lakehouses, BI/reporting and semantic layers, or data governance/quality/master-data-management initiatives, using the same optimized artifact set with the `Domain` and `Data_Analytics_Subtype` classification described below. ML/AI model-lifecycle delivery (model cards, training-data lineage, drift monitoring) is a standing, permanent exclusion from this objective — not a temporary scope cut — and is not supported by this framework.

The optimized generated artifact set is intentionally smaller than the detailed template library. The detailed templates remain reference material, but normal project execution should generate the optimized files only.

## Domain Classification

`Domain` (`Software` or `Data_And_Analytics`) and, when applicable, `Data_Analytics_Subtype` (`Data_Pipeline_ETL`, `Data_Warehouse_Lakehouse`, `BI_Reporting_Analytics`, `Data_Migration`, `Data_Governance_Quality_MDM` — multi-select) are recorded in `00_Project_Intake_And_Mode.md` and are independent of Execution Mode and Delivery Tier: they combine with those axes rather than replacing them. Every optimized artifact 02 through 09 carries Domain/Subtype-conditional sections (see the applicability matrix in `00_Project_Intake_And_Mode_Template.md` and the `Domain_Condition` column in `ADLC_Artifact_Validation_Rules.md`) so the same 11-artifact set serves both Software and Data & Analytics engagements without generating irrelevant content for either. Default `Domain` is `Software` when signals are absent or ambiguous.

## Data And Analytics Domain Coverage Map

Use this table to verify how each Data_Analytics_Subtype is represented across the optimized artifact set and, where relevant, which specialized detailed template supplies its deeper reference content.

| Data_Analytics_Subtype | Primary Optimized Artifacts | Specialized Detailed Template | Notes |
|---|---|---|---|
| Data_Pipeline_ETL | 01 (source/pipeline register), 03 (pipeline inventory), 04 (ingestion/storage architecture), 05 (pipeline design standards), 06 (backlog/reconciliation), 07 (data quality matrix), 09 (pipeline build spec) | None dedicated — covered directly by the artifacts above | Ingestion patterns: batch, streaming, and CDC (CDC offered generically, not claimed as any specific engagement's existing capability) |
| Data_Warehouse_Lakehouse | 01, 03, 04 (storage zones, MDM), 05, 06, 07, 09 (Data Vault/dimensional modeling) | `12_Database_Template.md` (facts/dimensions/SCDs, Data Vault) | Target sizing (source/table/object/view counts) recorded per engagement in 04 |
| BI_Reporting_Analytics | 02 (KPI tree), 04 (semantic-layer architecture), 05 (dashboard/report inventory, RLS/CLS), 07 (dashboard UAT/KPI reconciliation), 08 (refresh-cadence governance) | `24_BI_Semantic_Model_And_Dashboard_Template.md` (new) | UI/Design-System sections in 05/09 are reinstated, not skipped, when `Dashboard_Frontend_In_Scope: Yes` |
| Data_Migration | 01, 06 (Migration And Transition Plan, Data Migration Reconciliation Checklist), 08 (timeline/hypercare), 09 | None dedicated — the existing Data Migration Reconciliation Checklist in `06_Backlog_Delivery_And_Migration_Plan_Template.md` already fits this subtype directly | Highest-leverage, lowest-churn subtype in the coverage set |
| Data_Governance_Quality_MDM | 02 (access-control/PII NFRs), 04 (MDM golden-record/classification), 07 (data-quality dimension taxonomy), 08 (stewardship model, ABAC/masking approval workflow) | None dedicated — covered directly by the artifacts above | May mark 05/09 Not Applicable at the whole-artifact level when this is the only selected subtype and no technology/pipeline build is in scope |

Standing boundary: ML/AI model-lifecycle evidence is classified `Other_Out_Of_Domain_Scope` during intake (see Auto-Classification Rules) and is never mapped to a row in this table.

Use `ADLC_Optimized_Coverage_Map.md` to verify how detailed templates `01_Requirement_Specification_Template.md` through `23_AsIs_To_Target_Mapping_Template.md` are represented in the optimized artifact set.

## Execution Modes

Determine execution mode automatically from `Input Artifacts/`.

| Mode | Use When | Required Optimized Artifacts |
|---|---|---|
| Forward Engineering | Requirements, notes, emails, PDFs, spreadsheets, UI references, database references, or technical references exist, but no existing source-code evidence is provided | 00, 01, 02, 04, 05, 06, 07, 08, 09 when build is in scope |
| Reverse Engineering Only | Existing codebase evidence exists and the request is only to understand or document current state | 00, 01, 03, 07, 08 as needed |
| Reverse-To-Forward Engineering | Existing codebase evidence plus future requirements, modernization, migration, rewrite, or enhancement goals exist | 00, 01, 03, 02, 04, 05, 06, 07, 08, 09 when build is in scope |
| Enhancement | Existing or target application is being changed without full rewrite | 00, 01, 02, 03 when existing code exists, 04, 05, 06, 07, 08, 09 when build is in scope |
| Migration / Modernization | Existing application, data, integrations, or stack must move to a new target state | 00, 01, 03, 02, 04, 05, 06, 07, 08, 09 |

If mode is unclear, generate `00_Project_Intake_And_Mode.md` and `01_Source_Baseline.md`, record uncertainty, then proceed with the safest mode that preserves current-state vs target-state separation.

## Lifecycle Run Modes

Determine lifecycle run mode before generating or regenerating artifacts.

| Lifecycle_Run_Mode | Use When | Required Behavior |
|---|---|---|
| Initial_Generation | No accepted generated artifact baseline exists | Generate optimized artifacts in dependency order |
| Change_Impact | Generated artifacts exist and one or more input sources changed | Update `01_Source_Baseline.md`, classify source changes, assess impacted artifacts, and mark build prompt stale when affected |
| Targeted_Regeneration | Source change impact assessment identifies affected artifacts | Regenerate only impacted artifacts and downstream dependents, then regenerate `10_ADLC_Validation_Report.md` |
| Full_Regeneration | Source changes are critical, pervasive, or impossible to isolate | Regenerate all applicable optimized artifacts and validation report |

Change-impact rules:
- Do not blindly regenerate everything after post-generation source changes.
- Record changed input sources in `01_Source_Baseline.md`.
- Classify change severity as Low, Medium, High, or Critical.
- Identify impacted optimized artifacts and downstream dependents.
- Record governance approval in `08_Release_Operations_And_Governance.md` when the change affects scope, architecture, security, compliance, data, migration, release, or build readiness.
- Mark `09_Build_Prompt.md` stale when source changes affect build scope, requirements, architecture, technology, data, migration, validation, release, or governance.
- Regenerate `10_ADLC_Validation_Report.md` after every accepted source-change impact decision.

## Delivery Tiers

Assign a delivery tier in `00_Project_Intake_And_Mode.md`.

| Tier | Use When | Process Depth |
|---|---|---|
| Lite | Internal low-risk tool or prototype | Generate core sections only; mark enterprise controls not applicable with rationale |
| Standard | Business application with normal production expectations | Generate all optimized artifacts except deep regulated evidence unless applicable |
| Enterprise | Production business/customer application, integrations, sensitive data, operational support, or formal approvals | Generate all optimized artifacts with security, data, quality, release, operations, and governance sections fully populated |
| Regulated | Compliance-heavy, audit-heavy, PII/PHI/payment/financial/regulatory obligations | Generate all optimized artifacts and make compliance, data governance, threat model, audit evidence, and approvals mandatory |

## Optimized Generated Artifacts

Generate these files in `Generated Artifacts/` using the matching optimized templates in `ADLC_Artifacts/`.

| Output Artifact | Template | Captures Information From Detailed Templates |
|---|---|---|
| `00_Project_Intake_And_Mode.md` | `00_Project_Intake_And_Mode_Template.md` | 18_Project_Intake, execution mode, tiering, source readiness, stakeholders |
| `01_Source_Baseline.md` | `01_Source_Baseline_Template.md` | All source manifests, ADLC variables, input folder inventory, source precedence |
| `02_Requirements_And_Scope.md` | `02_Requirements_And_Scope_Template.md` | 01_Requirement_Specification, 02_Flows, high-level UI/data requirements |
| `03_Current_State_Analysis.md` | `03_Current_State_Analysis_Template.md` | 20_Codebase_Inventory, 21_Legacy_Reverse_Engineering, 22_Technical_Debt_Assessment, 23_AsIs_To_Target_Mapping current-state portions |
| `04_Target_Solution_Architecture.md` | `04_Target_Solution_Architecture_Template.md` | 03_Solution, data architecture, security architecture, compliance mapping, threat model, ADRs, 24_BI_Semantic_Model_And_Dashboard (semantic-layer architecture when BI_Reporting_Analytics is in scope) |
| `05_Technology_Engineering_And_Design.md` | `05_Technology_Engineering_And_Design_Template.md` | 05_Guidelines, 11_UI, 13_Technology_Specification, 14_Design_System, DevSecOps controls, 24_BI_Semantic_Model_And_Dashboard (dashboard/report inventory when BI_Reporting_Analytics is in scope) |
| `06_Backlog_Delivery_And_Migration_Plan.md` | `06_Backlog_Delivery_And_Migration_Plan_Template.md` | 04_Backlog, 06_Plan, 19_Backlog_Export, migration/transition plan |
| `07_Quality_Test_And_Validation.md` | `07_Quality_Test_And_Validation_Template.md` | 07_Code-And-Test, 08_Quality, 16_Validation_Summary, 17_Regression_Test_Suite, enterprise readiness scoring |
| `08_Release_Operations_And_Governance.md` | `08_Release_Operations_And_Governance_Template.md` | 09_Release, 10_Governance, operational readiness, compliance evidence, approvals |
| `09_Build_Prompt.md` | `09_Build_Prompt_Template.md` | 15_Build_Prompt consolidated implementation handoff |
| `10_ADLC_Validation_Report.md` | `10_ADLC_Validation_Report_Template.md` | Machine-checkable artifact completeness, traceability, blockers, enterprise readiness, build prompt approval |

The original detailed templates `01_Requirement_Specification_Template.md` through `23_AsIs_To_Target_Mapping_Template.md` remain available as reference templates. Do not generate all detailed artifacts by default.

## Input Handling Rules

Users may place all project files directly under `Input Artifacts/` with no categorization. Existing subfolders such as `Requirements/`, `Notes/`, `UI References/`, `Database References/`, `Technical References/`, `Codebase References/`, and `Other/` are optional convenience folders only.

Scan all files directly under `Input Artifacts/` and all nested folders. Supported inputs include, but are not limited to:

- Requirements documents
- Meeting notes
- Emails
- PDFs
- Word documents
- Excel files
- CSV/TSV files
- Screenshots
- Wireframes
- Figma exports
- Architecture diagrams
- API specs
- Database schemas, ERDs, DDL, data dictionaries, migration notes
- Technical notes
- Source-code snapshots
- Repository exports
- Dependency manifests and reports
- Build and deployment configs
- Logs
- Test reports

Use manifest files when present. If manifests are incomplete or missing, still inspect available files and record manifest gaps in `01_Source_Baseline.md`.

Ignore temporary editor files, generated transient files, dependency folders, build outputs, logs unrelated to project evidence, machine-specific files, and files beginning with `~$` unless explicitly relevant.

## Auto-Classification Rules

During `01_Source_Baseline.md` generation, classify files based on path, filename, extension, and content signals. Do not require users to move files into category folders.

| Signal | Source_Type |
|---|---|
| `requirement`, `BRD`, `FRD`, `PRD`, `story`, `scope`, business PDF/DOCX | Requirement |
| `meeting`, `minutes`, `notes`, `clarification`, `decision`, `assumption` | MeetingNote or Note |
| `.msg`, `.eml`, email export, chat transcript | Email or Note |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `screen`, `screenshot`, `wireframe`, `figma`, `mockup` | UI |
| `schema`, `ERD`, `DDL`, `table`, `data dictionary`, `.sql`, data workbook | Database |
| `api`, `swagger`, `openapi`, `postman`, `.yaml`, `.yml`, architecture diagram, integration note | Technical or API |
| source archive, repository export, `package.json`, `.csproj`, `pom.xml`, `build.gradle`, `requirements.txt`, `Dockerfile`, deployment config, runtime log, test report | Codebase |
| Airflow/Dagster/Prefect DAG files, `dbt_project.yml`, Informatica/DataStage/SnapLogic/Talend job exports, Snowpipe/`COPY INTO` scripts | Pipeline_Config (Domain: Data_And_Analytics, Subtype: Data_Pipeline_ETL) |
| warehouse DDL, `fact_*`/`dim_*` naming, ERwin/dbt `schema.yml`, medallion folder structures (`raw/bronze/silver/gold`) | Database (Domain: Data_And_Analytics, Subtype: Data_Warehouse_Lakehouse) |
| `.pbix`, `.twbx`/`.twb`, `.lkml`, Qlik `.qvf`, semantic-model exports, dashboard/report catalogs | BI_Artifact (Domain: Data_And_Analytics, Subtype: BI_Reporting_Analytics) |
| source-to-target mapping workbooks, cutover runbooks, legacy-to-target data-object mapping spreadsheets | Technical (Domain: Data_And_Analytics, Subtype: Data_Migration) |
| Alation/Collibra/Informatica EDC/Reltio catalog exports, governance policy documents, stewardship RACI docs, DQ rule repositories (Great Expectations, dbt tests) | Data_Catalog_Entry (Domain: Data_And_Analytics, Subtype: Data_Governance_Quality_MDM) |
| ML training pipeline code, model registries (MLflow, SageMaker Model Registry), notebooks calling `.fit()`/`.train()`, feature-store configs | Other_Out_Of_Domain_Scope — standing exclusion; never mapped to a Data_Analytics_Subtype |
| Unknown or mixed evidence | Other |

When classification is uncertain, classify as `Other`, record the uncertainty, and still extract usable facts.

## Source Discipline

- The generated optimized artifacts are the single source of truth for delivery decisions.
- External files are reference inputs until their relevant facts are extracted into optimized artifacts.
- Existing source code is current-state evidence only. It is not automatically target-state scope.
- Do not introduce requirements, technologies, vendors, dependencies, routes, screens, APIs, data entities, jobs, quality targets, deployment behavior, or business rules unless they are present in source inputs, approved upstream artifacts, or explicitly marked `[RECOMMENDATION]`.
- If source material is incomplete, use `Not specified`, `[OPEN QUESTION]`, `[RISK]`, or `[RECOMMENDATION]` with rationale.
- If source material conflicts, record the conflict in `01_Source_Baseline.md` and route the impact to the owning downstream artifact.

## Current-State vs Target-State Rules

For reverse engineering and modernization work, keep these concepts separate:

- Current State: what exists today in code, configs, data, integrations, tests, operations, and observed behavior.
- Target State: what should be built or retained after approval.
- Transition Plan: how to move from current state to target state.

Rules:
- `03_Current_State_Analysis.md` owns current-state evidence.
- `02_Requirements_And_Scope.md` owns approved future requirements.
- `04_Target_Solution_Architecture.md` owns target architecture.
- `06_Backlog_Delivery_And_Migration_Plan.md` owns migration, sequencing, backlog, and transition work.
- `09_Build_Prompt.md` must not reproduce legacy behavior unless it is explicitly retained or modernized in target-state artifacts.

## Generation Order

Run in this dependency order:

1. Generate `00_Project_Intake_And_Mode.md`.
2. Generate `01_Source_Baseline.md`.
3. If existing codebase or runtime evidence exists, generate `03_Current_State_Analysis.md`.
4. Generate `02_Requirements_And_Scope.md`.
5. Generate `04_Target_Solution_Architecture.md`.
6. Generate `05_Technology_Engineering_And_Design.md`.
7. Generate `06_Backlog_Delivery_And_Migration_Plan.md`.
8. Generate `07_Quality_Test_And_Validation.md`.
9. Generate `08_Release_Operations_And_Governance.md`.
10. Generate `09_Build_Prompt.md` when implementation, migration, modernization, rewrite, or enhancement is in scope.
11. Generate `10_ADLC_Validation_Report.md` using `ADLC_Artifact_Validation_Rules.md`.

Skip an artifact only when the applicability matrix in `00_Project_Intake_And_Mode.md` says it is not applicable and gives a reason. For greenfield projects, normally skip only `03_Current_State_Analysis.md`.

## Artifact Completeness Rules

Before finishing, verify:

- Every usable input file is listed in `01_Source_Baseline.md`.
- Every FR maps to source evidence, workflow or capability, backlog item, validation/test, and build instruction.
- Every NFR has metric, target, threshold or tolerance, validation method, owner, evidence, and gate status.
- Every workflow maps to related FRs and backlog items.
- Every integration has protocol or SDK, auth, data exchanged, failure handling, retry/reconciliation, monitoring, and owner.
- Every data entity or store has classification, source of truth, access control, retention, encryption, owner, and related requirements.
- Every security control maps to threat/risk, mechanism, evidence, and related NFR or architecture element.
- Every current-state component in reverse-to-forward mode has a target treatment: retain, modernize, replace, retire, rebuild, defer, or investigate.
- Every migration item has current-state ID, target item, migration steps, data/interface impact, fallback, risk, and related backlog items.
- Every release item maps to backlog, quality, migration, waiver, or governance evidence.
- Every waiver or exception has owner, approver, rationale, mitigation, review date, and related IDs.
- Every open question has owner, due date, impact, blocking status, and related IDs.
- `09_Build_Prompt.md` contains no unapproved scope, dependency, route, screen, schema, API, job, deployment behavior, or business rule.
- `10_ADLC_Validation_Report.md` is generated and confirms build readiness before implementation starts.
- Post-generation source changes are recorded in `01_Source_Baseline.md`, approved or resolved in `08_Release_Operations_And_Governance.md` when material, and checked in `10_ADLC_Validation_Report.md`.
- `09_Build_Prompt.md` includes build orchestration handshake when build execution is multi-agent, multi-session, enterprise-scale, or otherwise split across roles.

## Clarification And Regeneration Rules

- Use `Input Artifacts/Notes/Clarifications.md` for answers to open questions.
- Only use clarifications that are explicitly approved or marked approved in notes/source evidence.
- Apply clarifications first to the owning upstream optimized artifact.
- Revalidate and update downstream artifacts impacted by the clarification.
- Record material scope, architecture, quality, release, compliance, or approval changes in `08_Release_Operations_And_Governance.md`.

## Enterprise Validation Gates

For Enterprise and Regulated tiers, the following must be populated or explicitly marked as waived with governance approval:

- Threat model summary
- Security controls
- Data classification
- Privacy and retention requirements
- Compliance mapping
- DevSecOps gates
- Test coverage and regression suite
- Release baseline
- Deployment and rollback plan
- Operational readiness
- Audit evidence
- Approval matrix and signoff
- Enterprise readiness score
- ADLC validation report

## Machine-Checkable Validation

Use `ADLC_Artifact_Validation_Rules.md` as the validation rule source.

Validation requirements:
- Generate `10_ADLC_Validation_Report.md` after `09_Build_Prompt.md`, or after `08_Release_Operations_And_Governance.md` when no build prompt is in scope.
- Detect `Domain` and `Data_Analytics_Subtype` from `00_Project_Intake_And_Mode.md` before evaluating required sections — `scripts/validate_adlc_artifacts.py` resolves the domain/subtype-conditional section list per artifact rather than a single fixed list (see its `detect_domain`/`detect_subtype`/`resolve_required_sections` logic).
- Run `scripts/validate_adlc_artifacts.py` when executable scripting is available.
- If script execution is unavailable, manually simulate the same checks and populate `10_ADLC_Validation_Report.md`.
- Treat missing required artifacts, missing required sections, unresolved blockers, missing reverse-to-forward current-state mapping, missing migration rollback/reconciliation, and failed Enterprise/Regulated security/data/compliance/ops gates as blockers.
- Treat open post-generation source changes, stale source baselines, stale build prompt baseline, and unregenerated impacted artifacts as blockers.
- Treat missing build orchestration handshake, missing agent ownership, missing shared-file protocol, or missing handoff contract as blockers for multi-agent or multi-session builds.
- Mark `09_Build_Prompt.md` as `Ready` only when validation result is `Pass`, or `Conditional Pass` with approved exceptions in `08_Release_Operations_And_Governance.md`.
- Do not begin application implementation when `10_ADLC_Validation_Report.md` is missing, failed, or contains open blockers.

## Folder Structure

```text
{{WORKING_FOLDER_PATH}}/
  ADLC_Artifacts/
    ADLC_MasterPrompt.md
    00_Project_Intake_And_Mode_Template.md
    01_Source_Baseline_Template.md
    02_Requirements_And_Scope_Template.md
    03_Current_State_Analysis_Template.md
    04_Target_Solution_Architecture_Template.md
    05_Technology_Engineering_And_Design_Template.md
    06_Backlog_Delivery_And_Migration_Plan_Template.md
    07_Quality_Test_And_Validation_Template.md
    08_Release_Operations_And_Governance_Template.md
    09_Build_Prompt_Template.md
    10_ADLC_Validation_Report_Template.md
    ADLC_Artifact_Validation_Rules.md
    # Detailed reference templates remain available:
    01_Requirement_Specification_Template.md
    02_Flows_Template.md
    03_Solution_Template.md
    04_Backlog_Template.md
    05_Guidelines_Template.md
    06_Plan_Template.md
    07_Code-And-Test_Template.md
    08_Quality_Template.md
    09_Release_Template.md
    10_Governance_Template.md
    11_UI_Template.md
    12_Database_Template.md
    13_Technology_Specification_Template.md
    14_Design_System_Template.md
    15_Build_Prompt_Template.md
    16_Validation_Summary_Template.md
    17_Regression_Test_Suite_Template.md
    18_Project_Intake_Template.md
    19_Backlog_Export_Template.md
    20_Codebase_Inventory_Template.md
    21_Legacy_Reverse_Engineering_Template.md
    22_Technical_Debt_Assessment_Template.md
    23_AsIs_To_Target_Mapping_Template.md
    24_BI_Semantic_Model_And_Dashboard_Template.md
  Input Artifacts/
    _README.md
    _OPTIONAL_MANIFEST.md
    # Users may drop all files directly here.
    # The subfolders below are optional.
    Requirements/
    UI References/
    Database References/
    Technical References/
    Notes/
    Codebase References/
    Other/
  Generated Artifacts/
    00_Project_Intake_And_Mode.md
    01_Source_Baseline.md
    02_Requirements_And_Scope.md
    03_Current_State_Analysis.md
    04_Target_Solution_Architecture.md
    05_Technology_Engineering_And_Design.md
    06_Backlog_Delivery_And_Migration_Plan.md
    07_Quality_Test_And_Validation.md
    08_Release_Operations_And_Governance.md
    09_Build_Prompt.md
    10_ADLC_Validation_Report.md
  scripts/
    validate_adlc_artifacts.py
```

## Final Output Requirements

After generation, provide a concise report with:

- Detected execution mode and delivery tier.
- Generated files.
- Skipped files and reasons.
- Source files consumed.
- Blocking questions.
- Enterprise readiness result.
- ADLC validation result.
- Whether `09_Build_Prompt.md` is ready for implementation.

Do not start application coding automatically. Application build begins only when the user explicitly requests implementation using `09_Build_Prompt.md`.
