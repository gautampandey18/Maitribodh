# Backlog Export Template

## Metadata
Instruction: Use this optional template to prepare backlog import/export guidance for agile or project management boards without mandating a specific tool.

- Project_Name: {{Project_Name}}
- Backlog_Document: {{Backlog_Document_Name}}
- Intake_Document: {{18_Project_Intake_Document_Name_or_Not_Applicable}}
- Target_Backlog_Tool: {{Azure_Boards_Jira_Other_Not_Applicable}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Convert the approved backlog hierarchy into export-ready mapping guidance for tools such as Azure Boards, Jira, or another project-management board. This artifact prepares import material only; live connector or API execution is out of scope unless explicitly approved elsewhere.

- Export_Objective: {{Export_Objective}}
- Export_Mode: {{Manual_CSV_API_Planned_Not_Applicable}}
- Source_Backlog_Baseline: {{04_Backlog_Version_or_Baseline}}

## Export Readiness Rules
Instruction: Define rules for preserving hierarchy, traceability, and field completeness during import.

- Hierarchy_Rule: Preserve Epic -> Feature -> Story -> Task relationships using parent references or tool-specific hierarchy fields.
- Traceability_Rule: Preserve FR/NFR/WF/US/AC/TSK references in description, custom fields, labels, or traceability fields.
- Tool_Neutrality_Rule: Do not require a tool-specific field unless the target tool is approved in 18_Project_Intake.md or 10_Governance.md.
- Import_Safety_Rule: Do not import deferred, rejected, duplicate, or unresolved items unless they are explicitly marked for backlog parking.

## Tool Field Mapping
Instruction: Map ADLC backlog fields to the selected target tool fields.

| Mapping_ID | ADLC_Field | Target_Field | Required | Transformation_Rule | Notes |
|---|---|---|---|---|---|
| MAP-001 | {{Epic_ID_Feature_ID_Story_ID_Task_ID}} | {{Target_Field}} | {{Yes_No}} | {{Transformation_Rule}} | {{Notes}} |

## Exportable Backlog Items
Instruction: List export-ready backlog items with hierarchy, priority, acceptance criteria, dependencies, and traceability.

| Export_ID | Work_Item_Type | Source_Backlog_ID | Parent_Source_ID | Title | Description_Summary | Priority | Acceptance_Criteria | Dependency_IDs | Traceability_IDs | Export_Status |
|---|---|---|---|---|---|---|---|---|---|---|
| EXP-001 | {{Epic_Feature_Story_Task}} | {{EP_FEAT_US_TSK_ID}} | {{Parent_ID_or_Blank}} | {{Title}} | {{Summary}} | {{Priority}} | {{Acceptance_Criteria_or_NA}} | {{Dependency_ID_List}} | {{FR_NFR_WF_AC_ID_List}} | {{Ready_Blocked_Deferred_NA}} |

## Parent-Child Relationship Validation
Instruction: Confirm hierarchy can be recreated after import.

| Relationship_ID | Parent_ID | Child_ID | Relationship_Type | Target_Link_Method | Validation_Status | Notes |
|---|---|---|---|---|---|---|
| REL-001 | {{Parent_Backlog_ID}} | {{Child_Backlog_ID}} | {{Epic_Feature_Story_Task}} | {{Parent_Field_Link_Relation_Custom_Field}} | {{Pass_Fail_Blocked_NA}} | {{Notes}} |

## Import Package Checklist
Instruction: Define what must be ready before importing or handing the backlog to a PM/tool admin.

| Checklist_ID | Item | Required | Status | Owner | Evidence_or_File |
|---|---|---|---|---|---|
| IMP-001 | {{CSV_Field_Mapping_Hierarchy_Check_Duplicate_Check_Approval}} | {{Yes_No}} | {{Ready_Blocked_NA}} | {{Owner}} | {{Evidence_or_File}} |

## Deferred, Blocked, or Non-Exported Items
Instruction: Capture backlog items that should not be imported and why.

| NonExport_ID | Source_Backlog_ID | Reason | Required_Action | Owner | Related_Governance_ID |
|---|---|---|---|---|---|
| NEX-001 | {{EP_FEAT_US_TSK_ID}} | {{Reason}} | {{Action}} | {{Owner}} | {{GOV_ID_or_NA}} |

## Traceability Instructions
Instruction: Backlog export must preserve ADLC hierarchy and source traceability.

- Traceability_Rule_1: Every exported item must map to an item in 04_Backlog.md.
- Traceability_Rule_2: Every child item must preserve parent relationship or be marked blocked.
- Traceability_Rule_3: Acceptance criteria must remain traceable to FR/NFR/WF/AC IDs where available.
- Traceability_Rule_4: Export exceptions, blocked imports, and tool-field deviations must map to 10_Governance.md when material.
- Traceability_Rule_5: Export readiness must be validated in 16_Validation_Summary.md when Step 19 is generated.

