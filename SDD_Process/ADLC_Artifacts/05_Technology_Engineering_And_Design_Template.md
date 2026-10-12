# Technology Engineering And Design Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Requirements: 02_Requirements_And_Scope.md
- Architecture: 04_Target_Solution_Architecture.md
- Current_State: {{03_Current_State_Analysis.md_or_Not_Applicable}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Owner: {{Owner}}

## Purpose
Instruction: Consolidate technology specification, engineering guidelines, project structure, repository hygiene, implementation standards, UI extraction, and design system.

- Technology_And_Engineering_Objective: {{Objective}}
- Dependency_Rule: Do not introduce unlisted implementation dependencies in the build prompt.

## Technology Source Inventory
| Tech_Source_ID | Source_ID_or_Artifact_ID | Source_Type | Decision_Area | Usage | Status | Related_IDs |
|---|---|---|---|---|---|---|
| TECH-SRC-001 | {{Source_or_Artifact}} | {{TechnicalReference_CurrentState_Recommendation_Architecture}} | {{Stack_Integration_Deployment_Config_Security_UI}} | {{Usage}} | {{Approved_Recommendation_Open}} | {{IDs}} |

## Target Technology Stack
| Layer | Technology | Version_or_Range | Decision_Status | Rationale | Alternatives_Considered | Related_Component_or_NFR_IDs |
|---|---|---|---|---|---|---|
| {{Layer}} | {{Technology}} | {{Version}} | {{Mandated_Recommended_Open}} | {{Rationale}} | {{Alternatives}} | {{IDs}} |

## Project Structure And Repository Hygiene
```text
{{Project_Directory_Tree}}
```

- Repository_Initialization: {{Initialize_New_Repository_Use_Existing_Repository_Not_Applicable}}
- Branching_Model: {{Branching_Model_or_Not_Specified}}
- Ignore_File_Rule: Exclude secrets, local environment files, dependency folders, build outputs, logs, caches, coverage reports, temporary files, and machine-specific files.
- Protected_File_Patterns: {{Protected_File_Patterns}}
- Baseline_Handoff: {{Baseline_Tag_Branch_Commit_or_Not_Applicable}}

## Naming Conventions
Instruction: Preserve artifact/code naming rules from the detailed guidelines template.

| Artifact_Type | Convention | Example | Related_Artifact_or_ID |
|---|---|---|---|
| {{Module_Interface_Contract_API_Route_Event_Data_Entity_Database_Object_Config_Key_Log_Event_UI_Component_Design_Token_Test_Case_Test_Fixture_Runbook}} | {{Convention}} | {{Example}} | {{Related_IDs}} |

## Authentication Authorization And Configuration
- Identity_Provider: {{Identity_Provider}}
- Auth_Library: {{Auth_Library}}
- Session_Strategy: {{Session_Strategy}}
- Role_Definitions: {{Roles}}
- Scope_Enforcement: {{Scope_Enforcement}}
- Config_Strategy: {{Config_Strategy}}
- Secret_Management: {{Secret_Management}}

Required environment variables:
| Variable | Description | Required | Default | Secret | Owner |
|---|---|---|---|---|---|
| {{Variable}} | {{Description}} | {{Yes_No}} | {{Default}} | {{Yes_No}} | {{Owner}} |

## Database Scheduler Integration And Deployment Configuration
Instruction: Preserve implementation-specific database, scheduler, integration, observability, environment, and deployment details from the technology specification.

| Config_ID | Area | Setting_or_Decision | Value | Tool_or_Technology | Owner | Related_IDs |
|---|---|---|---|---|---|---|
| TECH-CONFIG-001 | {{Database_ORM_Migration_Seed_Integration_Scheduler_BackgroundJob_Observability_Deployment_CICD_HealthCheck_Scaling}} | {{Setting}} | {{Value}} | {{Tool}} | {{Owner}} | {{IDs}} |

Instruction: For Data & Analytics projects, `Scheduler_BackgroundJob` covers pipeline orchestration tools (for example Airflow, Azure Data Factory, Databricks Jobs, dbt Cloud, cron) in addition to application background jobs.

## Engineering Standards
Instruction: Consolidates core rules from `05_Guidelines_Template.md`.

| Standard_ID | Area | Mandatory_Standard | Evidence_Method | Owner | Related_FR_NFR_CON_CMP_IDs |
|---|---|---|---|---|---|
| STD-001 | {{Maintainability_Security_Privacy_Performance_Resilience_Observability_Accessibility_Configuration_Testing}} | {{Standard}} | {{Review_Test_Scan_Audit_Runbook}} | {{Owner}} | {{IDs}} |

Standing rules:
- Separate contracts, UI, styling, domain logic, data access, integrations, configuration, and tests into appropriate reusable units.
- Use dedicated adapters for external systems, storage, network calls, and databases.
- Externalize environment-specific values and secrets through the approved configuration model.
- Use reusable test fixtures, mocks, and data setup patterns.
- Do not combine contracts, UI markup, styling, business logic, data access, integration code, configuration, and tests into one monolithic file unless explicitly approved for a small prototype.

## Data Pipeline And Job Design Standards
Instruction: Required when `Domain: Data_And_Analytics` and `Data_Analytics_Subtype` includes Data_Pipeline_ETL, Data_Warehouse_Lakehouse, Data_Migration, or Data_Governance_Quality_MDM; mark Not Applicable with rationale otherwise.

| Standard_ID | Area | Mandatory_Standard | Evidence_Method | Owner | Related_IDs |
|---|---|---|---|---|---|
| DATA-STD-001 | {{Idempotency_SchemaEvolution_Partitioning_Retry_Backfill_DataQualityGate_Naming}} | {{Standard}} | {{Review_Test_Scan_Audit}} | {{Owner}} | {{IDs}} |

Data object naming conventions:
| Object_Type | Convention | Example | Related_IDs |
|---|---|---|---|
| {{Dataset_Table_Pipeline_Job_Model_Feature_Column}} | {{Convention}} | {{Example}} | {{IDs}} |

## UI Screen And Control Inventory
Instruction: Consolidates essential `11_UI_Template.md` details. Required for Software-domain projects. For Data & Analytics projects, this section is Not Applicable unless `BI_Reporting_Analytics ∈ Data_Analytics_Subtype` and `Dashboard_Frontend_In_Scope: Yes` — in that case, treat dashboards, reports, and semantic-layer visuals as "screens" in this inventory rather than skipping it.

| Screen_ID | Screen_Name | Route_or_Access_Point | Purpose | Layout | Controls | States | Data_Source | Related_FR_WF_IDs | Source_IDs |
|---|---|---|---|---|---|---|---|---|---|
| UI-001 | {{Screen}} | {{Route}} | {{Purpose}} | {{Layout}} | {{Controls}} | {{States}} | {{Data_Source}} | {{IDs}} | {{Source_IDs}} |

## Detailed UI Evidence
Instruction: Preserve screenshot references, layout overview, controls, navigation, interactions, accessibility notes, and UI gaps.

| UI_Evidence_ID | Screen_ID | Evidence_Type | Source_or_Screenshot | Layout_Observation | Control_or_Interaction | Navigation | Accessibility_Note | Difference_or_Gap |
|---|---|---|---|---|---|---|---|---|
| UI-EV-001 | {{UI_ID}} | {{Screenshot_Wireframe_Figma_Requirement_Image_Note}} | {{Source}} | {{Layout}} | {{Control_or_Interaction}} | {{Navigation}} | {{Accessibility}} | {{Gap}} |

## BI Semantic Model And Dashboard Inventory
Instruction: Required when `BI_Reporting_Analytics ∈ Data_Analytics_Subtype`; mark Not Applicable with rationale otherwise. Consolidates essential `24_BI_Semantic_Model_And_Dashboard_Template.md` details — the dashboard/report-level counterpart to the semantic-layer architecture defined in `04_Target_Solution_Architecture.md`.

| Dashboard_ID | Dashboard_or_Report_Name | Tool | Audience | Embedded_or_Standalone | Data_Source_Semantic_ID | Refresh_Cadence | Staleness_SLA | Owner | Related_KPI_IDs |
|---|---|---|---|---|---|---|---|---|---|
| DASH-001 | {{Name}} | {{PowerBI_Tableau_Looker_Qlik_Other}} | {{Audience}} | {{Embedded_Standalone}} | {{Semantic_ID}} | {{Cadence}} | {{SLA}} | {{Owner}} | {{KPI_IDs}} |

Self-service and embedded analytics governance:
| Governance_ID | Area | Rule | Applies_To | Related_IDs |
|---|---|---|---|---|
| BI-GOV-001 | {{Self_Service_Certification_Embedded_Tenant_Isolation_Rate_Limit}} | {{Rule}} | {{Applies_To}} | {{IDs}} |

## Design System
Instruction: Consolidates essential `14_Design_System_Template.md` details. Required for Software-domain projects. For Data & Analytics projects, this section is Not Applicable unless `BI_Reporting_Analytics ∈ Data_Analytics_Subtype` and `Dashboard_Frontend_In_Scope: Yes` — in that case, scope it to dashboard/report visualization tokens and theming only, not a full generic application design system.

### Color Typography Spacing And Shape
| Token_ID | Token_Type | Name | Value | Usage | Accessibility_Note |
|---|---|---|---|---|---|
| DS-001 | {{Color_Typography_Spacing_Border_Shape_Shadow}} | {{Name}} | {{Value}} | {{Usage}} | {{Note}} |

### Component Patterns
| Component_Pattern_ID | Component | Variants | States | Reuse_Rule | Accessibility_Rule | Related_UI_IDs |
|---|---|---|---|---|---|---|
| DS-CMP-001 | {{Component}} | {{Variants}} | {{States}} | {{Reuse_Rule}} | {{Accessibility}} | {{UI_IDs}} |

### Interaction Iconography Responsive And Theming Rules
| Design_Rule_ID | Area | Rule | Applies_To | Evidence_or_Source | Related_UI_or_Component_IDs |
|---|---|---|---|---|---|
| DS-RULE-001 | {{Interaction_State_Feedback_Iconography_Responsive_Theming_DarkMode_Accessibility}} | {{Rule}} | {{Applies_To}} | {{Evidence}} | {{IDs}} |

## DevSecOps And Tooling
| Gate_ID | Gate | Tool_or_Method | Required_For_Tier | Evidence | Owner | Status |
|---|---|---|---|---|---|---|
| DEVSEC-001 | {{DependencyScan_SecretsScan_SAST_DAST_ContainerScan_IaCScan_SBOM_LicenseCheck_Lint_TypeCheck_Build_Test}} | {{Tool_or_Method}} | {{Lite_Standard_Enterprise_Regulated}} | {{Evidence}} | {{Owner}} | {{Planned_Ready_NA_Open}} |

## Traceability Instructions
- Every technology, standard, UI screen, design token, component pattern, and DevSecOps gate must map to requirements, architecture, current-state evidence, or approved recommendations.
- Unapproved technologies or dependencies must not appear in 09_Build_Prompt.md.
- Every Data Pipeline And Job Design Standard must map to a Data Pipeline And Storage Architecture element in 04_Target_Solution_Architecture.md.
- Every Dashboard_ID in BI Semantic Model And Dashboard Inventory must map to a Semantic_ID in 04_Target_Solution_Architecture.md.
