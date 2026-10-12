# Codebase Inventory Template

## Metadata
Instruction: Use this optional legacy template when an existing codebase is available and must be inventoried before reverse engineering or modernization planning.

- Project_Name: {{Project_Name}}
- Codebase_Reference_Folder: {{CODEBASE_REFERENCE_FOLDER_PATH}}
- Codebase_Reference_Manifest: {{CODEBASE_REFERENCE_MANIFEST_PATH}}
- Requirement_Specification_Document: {{Requirement_Specification_Document_Name_or_Not_Available}}
- Version: {{Document_Version}}
- Date: {{Date}}
- Inventory_Owner: {{Owner}}

## Purpose
Instruction: Create an evidence-based inventory of the existing application codebase without rewriting requirements, architecture, or implementation plans.

- Inventory_Objective: {{Inventory_Objective}}
- Current_System_Name: {{System_Name}}
- Inventory_Scope: {{Application_Modules_APIs_Jobs_Data_UI_Config_Deployment_Tests}}
- Evidence_Rule: Codebase facts are current-state evidence only until mapped into downstream ADLC artifacts.

## Codebase Source Inventory
Instruction: List source snapshots, dependency reports, API inventories, runtime logs, build/deployment configs, and test reports consumed.

| Source_ID | Source_File_or_Folder | Source_Type | Status | Used_For | Exclusions_or_Redactions | Notes |
|---|---|---|---|---|---|---|
| CODE-SRC-001 | {{Source_File_or_Folder}} | {{SourceSnapshot_DependencyReport_APIInventory_RuntimeLog_BuildConfig_DeploymentConfig_TestReport}} | {{Approved_Draft_Reference_Only}} | {{Used_For}} | {{Exclusions_or_Redactions}} | {{Notes}} |

## Repository and Project Structure
Instruction: Capture current repository layout, modules, packages, services, apps, scripts, and generated-code boundaries.

| Structure_ID | Path_or_Module | Type | Responsibility | Owner_or_Unknown | Runtime_or_Build_Role | Notes |
|---|---|---|---|---|---|---|
| CBI-STR-001 | {{Path_or_Module}} | {{App_Service_Module_Library_Config_Test_Script_Generated_Other}} | {{Responsibility}} | {{Owner_or_Unknown}} | {{Runtime_Build_Test_Deploy_None}} | {{Notes}} |

## Technology and Dependency Inventory
Instruction: List observed technologies and dependencies as current-state facts. Do not approve future use here.

| Dependency_ID | Layer | Technology_or_Package | Observed_Version | Source | Usage | Risk_Flag | Related_Component_or_File |
|---|---|---|---|---|---|---|---|
| CBI-DEP-001 | {{Layer}} | {{Technology_or_Package}} | {{Version}} | {{Source_File}} | {{Usage}} | {{None_Security_EOL_Unused_Unknown}} | {{Component_or_File}} |

## API, Interface, and Contract Inventory
Instruction: Capture discovered APIs, events, jobs, file interfaces, and internal contracts.

| Interface_ID | Interface_Type | Name_or_Path | Producer | Consumer | Input | Output | Auth_or_Access | Evidence |
|---|---|---|---|---|---|---|---|---|
| CBI-INT-001 | {{API_Event_Job_File_Internal_DB_External}} | {{Name_or_Path}} | {{Producer}} | {{Consumer}} | {{Input}} | {{Output}} | {{Auth_or_Access}} | {{Evidence}} |

## Runtime and Operational Inventory
Instruction: Capture observed runtime behavior, scheduled jobs, logs, health checks, deployment configs, and operational dependencies.

| Runtime_ID | Runtime_Item | Trigger_or_Execution_Mode | Environment | Observed_Behavior | Failure_or_Log_Evidence | Owner_or_Unknown |
|---|---|---|---|---|---|---|
| CBI-RUN-001 | {{Runtime_Item}} | {{Schedule_API_Event_Manual_Startup_Other}} | {{Environment}} | {{Behavior}} | {{Evidence}} | {{Owner_or_Unknown}} |

## Test and Quality Inventory
Instruction: Capture existing tests, test gaps, quality reports, and observable coverage evidence.

| Test_Asset_ID | Test_Type | Location_or_Report | Coverage_Area | Status | Gaps | Related_Module_or_Interface |
|---|---|---|---|---|---|---|
| CBI-TST-001 | {{Unit_Integration_E2E_Manual_Report_None}} | {{Location_or_Report}} | {{Coverage_Area}} | {{Present_Missing_Stale_Unknown}} | {{Gaps}} | {{Module_or_Interface}} |

## Inventory Gaps and Risks
Instruction: Record missing, inaccessible, ambiguous, or conflicting codebase evidence.

| Gap_ID | Gap_or_Risk | Impact | Blocking | Owner | Required_Action | Related_Source |
|---|---|---|---|---|---|---|
| CBI-GAP-001 | {{Gap_or_Risk}} | {{Impact}} | {{Yes_No}} | {{Owner}} | {{Required_Action}} | {{Source_ID_or_Path}} |

## Traceability Instructions
Instruction: Codebase inventory must remain current-state evidence and must not silently become future-state scope.

- Traceability_Rule_1: Every inventory row must reference a source file, folder, report, or manifest entry.
- Traceability_Rule_2: Current-state technologies, dependencies, interfaces, and runtime behavior must map to 21_Legacy_Reverse_Engineering.md before becoming requirements, solution decisions, or backlog items.
- Traceability_Rule_3: Security, dependency, test, operational, and maintainability risks must map to 22_Technical_Debt_Assessment.md or 10_Governance.md when material.

