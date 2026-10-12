# As-Is to Target Mapping Template

## Metadata
Instruction: Use this optional legacy template to map current-state evidence to target-state requirements, architecture, backlog, migration, and modernization decisions.

- Project_Name: {{Project_Name}}
- Legacy_Reverse_Engineering_Document: {{21_Legacy_Reverse_Engineering_Document_Name}}
- Technical_Debt_Assessment_Document: {{22_Technical_Debt_Assessment_Document_Name_or_Not_Applicable}}
- Requirement_Specification_Document: {{01_Requirement_Specification_Document_Name}}
- Solution_Document: {{03_Solution_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Provide a controlled bridge from legacy as-is findings to approved target-state scope. Do not use this artifact to bypass requirements, solution, backlog, or governance ownership.

- Mapping_Objective: {{Objective}}
- Target_State_Type: {{Stabilize_Replatform_Refactor_Rebuild_Modernize_Migrate}}
- Mapping_Decision_Status: {{Draft_Approved_Conditional}}

## Capability Mapping
Instruction: Map legacy capabilities to future requirements, retained scope, changed behavior, retired behavior, or open questions.

| Mapping_ID | Legacy_Capability_ID | Current_Behavior | Target_Disposition | Target_Requirement_or_Backlog_ID | Change_Rationale | Approval_Status |
|---|---|---|---|---|---|---|
| AIM-CAP-001 | {{LRE_CAP_ID}} | {{Current_Behavior}} | {{Retain_Modify_Retire_Replace_Defer_Open}} | {{FR_US_ID_or_NA}} | {{Rationale}} | {{Proposed_Approved_Rejected_Open}} |

## Architecture and Integration Mapping
Instruction: Map as-is components, integrations, jobs, and runtime behavior to target architecture decisions.

| Mapping_ID | Legacy_Element_ID | Element_Type | Target_Component_or_Decision_ID | Target_Disposition | Migration_or_Compatibility_Need | Related_Risks |
|---|---|---|---|---|---|---|
| AIM-ARC-001 | {{LRE_CMP_CBI_INT_RUN_ID}} | {{Component_API_Job_Data_Config_Deployment}} | {{CMP_TSD_DD_ID_or_NA}} | {{Retain_Modify_Retire_Replace_Defer_Open}} | {{Need}} | {{Risk_ID_List}} |

## Data and Migration Mapping
Instruction: Map legacy data entities, storage objects, transformations, and migration risks to target database and release artifacts.

| Mapping_ID | Legacy_Data_ID | Target_Data_ID | Mapping_Type | Transformation_or_Migration_Need | Data_Risk | Validation_Need |
|---|---|---|---|---|---|---|
| AIM-DATA-001 | {{Legacy_Data_ID}} | {{DATA_Entity_ID_or_NA}} | {{Retain_Transform_Merge_Split_Retire_Open}} | {{Need}} | {{Risk}} | {{Validation_Need}} |

## Remediation and Backlog Mapping
Instruction: Map approved technical debt remediation and modernization candidates to backlog, quality, release, or governance.

| Mapping_ID | Debt_or_Candidate_ID | Target_Backlog_ID | Disposition | Priority | Acceptance_or_Evidence_Need | Governance_Reference |
|---|---|---|---|---|---|---|
| AIM-REM-001 | {{TDA_MOD_ID}} | {{EP_FEAT_US_TSK_ID_or_NA}} | {{Approved_Deferred_Rejected_Open}} | {{P0_P1_P2_P3}} | {{Evidence_Need}} | {{GOV_ID_or_NA}} |

## Open Mapping Decisions
Instruction: Capture unresolved differences between current state and target state.

| Decision_ID | Decision_Needed | Options | Impact | Owner | Required_By | Related_IDs |
|---|---|---|---|---|---|---|
| AIM-DD-001 | {{Decision_Needed}} | {{Options}} | {{Impact}} | {{Owner}} | {{Gate_or_Date}} | {{Related_ID_List}} |

## Traceability Instructions
Instruction: Every target-state decision must trace to legacy evidence and an approved ADLC owner artifact.

- Traceability_Rule_1: Every mapping row must reference a legacy evidence ID from 20_Codebase_Inventory.md, 21_Legacy_Reverse_Engineering.md, or 22_Technical_Debt_Assessment.md.
- Traceability_Rule_2: Retained or changed behavior must map to 01_Requirement_Specification.md, 02_Flows.md, 03_Solution.md, or 04_Backlog.md before implementation.
- Traceability_Rule_3: Migration, compatibility, release, or exception decisions must map to 09_Release.md or 10_Governance.md.

