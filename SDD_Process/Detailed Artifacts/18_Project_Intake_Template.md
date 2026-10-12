# Project Intake Template

## Metadata
Instruction: Use this optional greenfield enterprise-readiness template before Step 1 to classify the project, source readiness, artifact depth, approval path, and execution model.

- Project_Name: {{Project_Name}}
- Intake_Date: {{Date}}
- Intake_Owner: {{Owner}}
- Project_Sponsor: {{Sponsor_or_Not_Specified}}
- Version: {{Document_Version}}

## Purpose
Instruction: Establish project intake decisions before artifact generation begins. Keep this artifact technology-agnostic and use it to guide which ADLC artifacts are required, optional, deferred, or not applicable.

- Intake_Objective: {{Intake_Objective}}
- Intended_Use: {{Greenfield_Artifact_Generation_Project_Setup}}
- SSoT_Rule: This intake artifact guides execution depth only; detailed requirements still belong in 01_Requirement_Specification.md.

## Project Classification
Instruction: Classify the work so the right artifact depth and execution mode are selected.

| Intake_ID | Project_Type | Delivery_Type | Application_Type | Business_Criticality | Recommended_Artifact_Depth | Execution_Mode | Rationale |
|---|---|---|---|---|---|---|---|
| INTAKE-001 | {{Greenfield}} | {{New_Build_MVP_Phased_Product}} | {{Web_Mobile_API_Data_Internal_External_Other}} | {{Critical_High_Medium_Low}} | {{Full_Focused_Lightweight}} | {{Sequential_MultiAgent}} | {{Rationale}} |

## Source Readiness Checklist
Instruction: Validate whether source folders and manifests are ready before Step 1.

| Source_Area | Folder_or_File | Manifest | Status | Required_For | Gap_or_Action | Owner |
|---|---|---|---|---|---|---|
| Requirements | {{REQUIREMENTS_FOLDER_PATH}} | {{REQUIREMENTS_MANIFEST_PATH}} | {{Ready_Partial_Missing_NA}} | Step 1 | {{Gap_or_Action}} | {{Owner}} |
| UI References | {{UI_REFERENCE_FOLDER_PATH}} | {{UI_REFERENCE_MANIFEST_PATH}} | {{Ready_Partial_Missing_NA}} | Step 11/14 | {{Gap_or_Action}} | {{Owner}} |
| Database References | {{DATABASE_REFERENCE_FOLDER_PATH}} | {{DATABASE_REFERENCE_MANIFEST_PATH}} | {{Ready_Partial_Missing_NA}} | Step 12 | {{Gap_or_Action}} | {{Owner}} |
| Technical References | {{TECHNICAL_REFERENCE_FOLDER_PATH}} | {{TECHNICAL_REFERENCE_MANIFEST_PATH}} | {{Ready_Partial_Missing_NA}} | Step 3/13 | {{Gap_or_Action}} | {{Owner}} |
| Notes and Clarifications | {{GENERAL_NOTES_FOLDER_PATH}} | {{GENERAL_NOTES_MANIFEST_PATH}} | {{Ready_Partial_Missing_NA}} | Step 1/16 | {{Gap_or_Action}} | {{Owner}} |

## Stakeholders and Approval Path
Instruction: Identify who must review and approve generated artifacts before implementation.

| Role | Name_or_Group | Approval_Area | Required_Before | Evidence_Expected | Escalation_Path |
|---|---|---|---|---|---|
| Business Analyst | {{Name_or_Group}} | Requirements and scope | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |
| Product Owner | {{Name_or_Group}} | Business priority and backlog | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |
| Architect | {{Name_or_Group}} | Solution and technology decisions | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |
| QA Lead | {{Name_or_Group}} | Testability and quality gates | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |
| Security/Compliance | {{Name_or_Group}} | Security, privacy, compliance | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |
| Project Manager | {{Name_or_Group}} | Plan, capacity, milestones | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |
| Release Owner | {{Name_or_Group}} | Release readiness | {{Step_or_Gate}} | {{Review_Signoff_Reference}} | {{Escalation_Path}} |

## Artifact Applicability Matrix
Instruction: Decide which artifacts are required, optional, deferred, or not applicable for this project.

| Artifact | Applicability | Reason | Required_Inputs | Approval_Owner | Notes |
|---|---|---|---|---|---|
| 01_Requirement_Specification.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 02_Flows.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 03_Solution.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 04_Backlog.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 05_Guidelines.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 06_Plan.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 07_Code-And-Test.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 08_Quality.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 09_Release.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 10_Governance.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 11_UI.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 12_Database.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 13_Technology_Specification.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 14_Design_System.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 15_Build_Prompt.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 16_Validation_Summary.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 17_Regression_Test_Suite.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |
| 19_Backlog_Export.md | {{Required_Optional_Deferred_NA}} | {{Reason}} | {{Inputs}} | {{Owner}} | {{Notes}} |

## Tool and Integration Targets
Instruction: Capture optional delivery-tool targets without making tool-specific choices mandatory.

| Tool_Area | Target_Tool_or_Not_Applicable | Intended_Use | Export_or_Integration_Mode | Required_By | Notes |
|---|---|---|---|---|---|
| Backlog Management | {{Azure_Boards_Jira_Other_Not_Applicable}} | {{Work_Item_Tracking}} | {{Manual_Import_CSV_API_Not_Applicable}} | {{Step_or_Role}} | {{Notes}} |
| Source Control | {{Git_Other_Not_Applicable}} | {{Repository_Control}} | {{Manual_Tool_Native_Not_Applicable}} | {{Step_or_Role}} | {{Notes}} |
| Test Management | {{Tool_or_Not_Applicable}} | {{Test_Tracking}} | {{Manual_Import_CSV_API_Not_Applicable}} | {{Step_or_Role}} | {{Notes}} |
| CI/CD or Release | {{Tool_or_Not_Applicable}} | {{Build_Release_Tracking}} | {{Manual_Config_API_Not_Applicable}} | {{Step_or_Role}} | {{Notes}} |

## Intake Risks and Open Questions
Instruction: Capture readiness gaps before Step 1. Blocking gaps should be resolved or explicitly approved before artifact generation proceeds.

| Intake_Risk_ID | Type | Question_or_Risk | Impact | Blocking | Owner | Target_Resolution | Related_Source |
|---|---|---|---|---|---|---|---|
| IR-001 | {{Open_Question_Risk_Gap}} | {{Question_or_Risk}} | {{Impact}} | {{Yes_No}} | {{Owner}} | {{YYYY-MM-DD_or_Gate}} | {{Source_or_NA}} |

## Traceability Instructions
Instruction: Intake decisions must guide execution without replacing downstream artifacts.

- Traceability_Rule_1: Artifact applicability decisions must map to source readiness, stakeholder approval needs, delivery type, or governance rationale.
- Traceability_Rule_2: Tool targets must be optional and must not introduce implementation technologies unless later approved in 13_Technology_Specification.md.
- Traceability_Rule_3: Blocking intake risks must be resolved, deferred, or recorded in 10_Governance.md before downstream build handoff.
- Traceability_Rule_4: Project intake decisions must be validated in 16_Validation_Summary.md.

