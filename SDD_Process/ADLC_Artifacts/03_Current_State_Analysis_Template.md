# Current State Analysis Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Reverse_Engineering_Only_or_Reverse_To_Forward_Engineering}}
- Delivery_Tier: {{Delivery_Tier}}
- Source_Baseline: 01_Source_Baseline.md
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Owner: {{Owner}}

## Purpose
Instruction: Use only when existing source code or runtime evidence exists. Consolidates codebase inventory, legacy reverse engineering, technical debt, and as-is evidence.

- Analysis_Objective: {{Analysis_Objective}}
- Evidence_Rule: Current-state facts do not become target-state requirements until approved in 02_Requirements_And_Scope.md or mapped in 06_Backlog_Delivery_And_Migration_Plan.md.

## Codebase Analysis Depth And Confidence
Instruction: Select the analysis depth used for this current-state artifact and separate observed evidence from inference.

| Analysis_ID | Analysis_Depth | Included_Evidence | Excluded_Evidence | Confidence | Notes |
|---|---|---|---|---|---|
| CSA-DEPTH-001 | {{Inventory_Only_Behavioral_Reconstruction_Modernization_Assessment}} | {{Evidence_Types}} | {{Exclusions}} | {{High_Medium_Low}} | {{Notes}} |

Evidence status rules:
- `Observed`: Directly supported by code, config, logs, tests, API specs, database artifacts, or runtime evidence.
- `Inferred`: Reasonable deduction from available evidence; must include rationale and confidence.
- `Unverified`: Mentioned but not proven; must not become target-state scope without clarification.

## Language Framework And Runtime Detection
Instruction: Detect languages, frameworks, runtimes, package managers, build tools, and deployment patterns from codebase evidence.

| Detection_ID | Area | Detected_Item | Version_or_Indicator | Evidence | Confidence | Impact |
|---|---|---|---|---|---|---|
| DET-LANG-001 | {{Language_Framework_Runtime_BuildTool_PackageManager_TestTool_DeploymentPlatform_PipelineOrchestrator_DataProcessingEngine_BITool}} | {{Detected_Item}} | {{Version_or_Indicator}} | {{Source_ID_or_Path}} | {{High_Medium_Low}} | {{Impact}} |

## Codebase Source Inventory
| Code_Source_ID | File_or_Folder | Source_Type | Status | Used_For | Exclusions_or_Redactions | Notes |
|---|---|---|---|---|---|---|
| CODE-SRC-001 | {{Path}} | {{SourceSnapshot_DependencyReport_APIInventory_RuntimeLog_BuildConfig_DeploymentConfig_TestReport_Repository}} | {{Approved_Draft_Reference_Only}} | {{Used_For}} | {{Redactions}} | {{Notes}} |

## Repository Project And Module Inventory
| Current_Component_ID | Path_or_Module | Type | Responsibility | Runtime_or_Build_Role | Owner_or_Unknown | Related_Source_IDs |
|---|---|---|---|---|---|---|
| CUR-CMP-001 | {{Path_or_Module}} | {{App_Service_Module_Library_Config_Test_Script_Generated_Other}} | {{Responsibility}} | {{Runtime_Build_Test_Deploy_None}} | {{Owner}} | {{Source_IDs}} |

## Entrypoint Route Controller And Service Inventory
Instruction: Capture executable entrypoints and request/job dispatch paths so reverse engineering is not just a file inventory.

| Entry_ID | Entry_Type | Path_or_Name | Trigger | Handler_or_Service | Downstream_Calls | Data_Access | Auth_or_Guard | Evidence_Status | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| ENTRY-001 | {{AppEntrypoint_Route_Controller_Service_Job_CLI_EventHandler_Scheduler_DAG_PipelineTask}} | {{Path_or_Name}} | {{Trigger}} | {{Handler}} | {{Calls}} | {{Data_Access}} | {{Auth_or_Guard}} | {{Observed_Inferred_Unverified}} | {{Source_IDs}} |

## Package Dependency Manifest Inventory
Instruction: Capture dependency files and lifecycle evidence separately from individual dependency rows.

| Manifest_ID | File_Path | Ecosystem | Package_Manager | Lockfile_Present | Build_or_Runtime_Role | Risk | Evidence |
|---|---|---|---|---|---|---|---|
| PKG-001 | {{Path}} | {{Node_DotNet_Java_Python_Go_Ruby_PHP_Other}} | {{Package_Manager}} | {{Yes_No_Unknown}} | {{Build_Runtime_Test_Deploy}} | {{Risk}} | {{Source_IDs}} |

## Data Pipeline And Orchestration Inventory
Instruction: Required when `Domain: Data_And_Analytics` and `Data_Analytics_Subtype` includes Data_Pipeline_ETL, Data_Warehouse_Lakehouse, Data_Migration, or BI_Reporting_Analytics; mark Not Applicable with rationale otherwise. Captures existing pipelines, ETL jobs, and BI reports so reverse engineering is not limited to application codebase inventory.

| Pipeline_ID | Item_Type | Name_or_Path | Orchestrator_or_Tool | Source_Dataset | Target_Dataset_or_Report | Schedule_or_Trigger | Dependencies | Failure_Handling | Lineage_Gap | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| CUR-PIPE-001 | {{Pipeline_DAG_ETL_Job_Legacy_BI_Report_Scheduled_Query}} | {{Name_or_Path}} | {{Tool}} | {{Source}} | {{Target}} | {{Schedule}} | {{Dependencies}} | {{Failure_Handling}} | {{Gap_or_None}} | {{Source_IDs}} |

## As-Is Capability Map
Instruction: Preserve reconstructed business capabilities from legacy reverse engineering.

| AsIs_Capability_ID | Capability | Observed_Behavior | Users_or_Actors | Business_Value | Evidence | Target_Relevance |
|---|---|---|---|---|---|---|
| ASIS-CAP-001 | {{Capability}} | {{Behavior}} | {{Users}} | {{Value}} | {{Evidence}} | {{Retain_Modernize_Replace_Retire_Unknown}} |

## As-Is Workflow Reconstruction
| AsIs_Workflow_ID | Capability_ID | Trigger | Steps | Business_Rules | Data_Behavior | Exceptions | Evidence |
|---|---|---|---|---|---|---|---|
| ASIS-WF-001 | {{ASIS_CAP_ID}} | {{Trigger}} | {{Steps}} | {{Rules}} | {{Data_Behavior}} | {{Exceptions}} | {{Evidence}} |

## Current Technology And Dependency Inventory
| Dependency_ID | Layer | Technology_or_Package | Observed_Version | Usage | Risk_Flag | Future_Use_Status | Evidence |
|---|---|---|---|---|---|---|---|
| CUR-DEP-001 | {{Layer}} | {{Technology_or_Package}} | {{Version}} | {{Usage}} | {{None_Security_EOL_Unused_Unknown_License}} | {{Retain_Replace_Assess_Not_Decided}} | {{Source_IDs}} |

## Current API Interface Job And Integration Inventory
| Interface_ID | Interface_Type | Name_or_Path | Producer | Consumer | Input | Output | Auth_or_Access | Failure_Mode | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| CUR-INT-001 | {{API_Event_Job_File_Internal_DB_External}} | {{Name_or_Path}} | {{Producer}} | {{Consumer}} | {{Input}} | {{Output}} | {{Auth}} | {{Failure_Mode}} | {{Evidence}} |

## Current Data And Persistence Inventory
| Current_Data_ID | Entity_or_Store | Source_Of_Truth | Access_Pattern | Classification | Retention_or_Lifecycle | Constraints | Evidence |
|---|---|---|---|---|---|---|---|
| CUR-DATA-001 | {{Entity_or_Store}} | {{Source}} | {{CRUD_or_Usage}} | {{Public_Internal_Confidential_Restricted_Unknown}} | {{Retention}} | {{Constraints}} | {{Source_IDs}} |

## Current UI And User Flow Inventory
| Current_UI_or_Flow_ID | Area | Observed_Behavior | Screens_or_Controls | Business_Rules | Gaps_or_Ambiguity | Evidence |
|---|---|---|---|---|---|---|
| CUR-UI-001 | {{Area}} | {{Behavior}} | {{Screens_or_Controls}} | {{Rules}} | {{Gaps}} | {{Source_IDs}} |

## Runtime Operations And Deployment Inventory
| Runtime_ID | Runtime_Item | Trigger_or_Mode | Environment | Observed_Behavior | Config_or_Secret_Handling | Failure_or_Log_Evidence | Owner |
|---|---|---|---|---|---|---|---|
| CUR-RUN-001 | {{Runtime_Item}} | {{Schedule_API_Event_Manual_Startup_Other}} | {{Environment}} | {{Behavior}} | {{Config_Secrets}} | {{Evidence}} | {{Owner}} |

## Deployment Runtime And Test Evidence Matrix
Instruction: Preserve deployment/runtime/test evidence in a format suitable for modernization decisions.

| Evidence_ID | Evidence_Type | Location | Coverage_or_Operational_Area | Status | Finding | Related_Current_IDs |
|---|---|---|---|---|---|---|
| CSA-EV-001 | {{BuildConfig_DeployConfig_RuntimeLog_TestReport_CoverageReport_HealthCheck_Monitoring_Config_SecretReference}} | {{Location}} | {{Area}} | {{Present_Missing_Stale_Unknown}} | {{Finding}} | {{IDs}} |

## Test Quality Security And Technical Debt Assessment
| Debt_or_Risk_ID | Area | Finding | Evidence | Severity | Impact | Recommended_Treatment | Related_Current_IDs |
|---|---|---|---|---|---|---|---|
| CUR-RISK-001 | {{Security_Dependency_Test_Coverage_Maintainability_Performance_Data_Operations_Compliance}} | {{Finding}} | {{Evidence}} | {{Critical_High_Medium_Low}} | {{Impact}} | {{Retain_Refactor_Replace_Retire_Mitigate_Investigate}} | {{Current_IDs}} |

## Dependency Lifecycle And Modernization Candidates
| Candidate_ID | Current_State_ID | Candidate_Type | Current_Issue | Modernization_Option | Benefit | Risk | Priority | Related_Backlog_or_Target_IDs |
|---|---|---|---|---|---|---|---|---|
| MOD-CAND-001 | {{Current_ID}} | {{Dependency_Framework_Module_Test_Observability_Security_Data_Architecture}} | {{Issue}} | {{Option}} | {{Benefit}} | {{Risk}} | {{High_Medium_Low}} | {{IDs}} |

## As-Is Constraints Risks And Open Questions
| AsIs_Item_ID | Type | Constraint_Risk_or_Question | Evidence | Impact | Owner | Blocking | Related_Current_IDs |
|---|---|---|---|---|---|---|---|
| ASIS-RISK-001 | {{Constraint_Risk_Open_Question}} | {{Item}} | {{Evidence}} | {{Impact}} | {{Owner}} | {{Yes_No}} | {{IDs}} |

## As-Is To Target Candidate Mapping
Instruction: This is a candidate map only. Final target decisions belong in 04, 05, 06, and 08.

| Mapping_ID | Current_State_ID | Current_Behavior_or_Component | Target_Treatment | Rationale | Target_Artifact_Owner | Status |
|---|---|---|---|---|---|---|
| MAP-CUR-001 | {{Current_ID}} | {{Current_Item}} | {{Retain_Modernize_Replace_Retire_Rebuild_Defer}} | {{Rationale}} | {{Artifact}} | {{Proposed_Approved_Rejected_Open}} |

## Traceability Instructions
- Every row must be evidence-based and reference source code, config, report, runtime evidence, or source file.
- Separate observed behavior from approved target behavior.
- Inferred behavior must include confidence and must not be promoted into requirements or build prompt without approval.
- Entry points, route/controller/service paths, data access, configs/secrets, tests, and deployment/runtime evidence must be represented when present in source inputs.
- Material risks must flow into 06, 07, or 08.
- For Data & Analytics projects, pipeline/job/report entries in Data Pipeline And Orchestration Inventory must map to Data Pipeline And Storage Architecture in 04_Target_Solution_Architecture.md.
