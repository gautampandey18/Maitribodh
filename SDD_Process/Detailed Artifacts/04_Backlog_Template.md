# Backlog Template

## Metadata
Instruction: Reference solution artifact.

- Project_Name: {{Project_Name}}
- Solution_Document: {{Solution_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Decompose solution into executable work items.

- Planning_Horizon: {{Planning_Horizon}}
- Source_Artifacts: {{01_Requirement_Specification_02_Flows_03_Solution}}
- Prioritization_Method: {{MoSCoW_WSJF_RICE_ValueRisk_Other}}

## Backlog Intake Rules
Instruction: Define how items enter the backlog and how unsupported items are handled.

- Intake_Source_Rule: Only create backlog items from approved requirements, flows, solution components, risks, constraints, or marked recommendations.
- Granularity_Rule: Epics describe outcomes, features describe deliverable capability groups, stories describe user/system value, and tasks describe implementation work.
- Technology_Agnostic_Rule: Do not introduce frameworks, libraries, cloud services, or implementation layout unless already defined in 03_Solution.md or 13_Technology_Specification.md.
- Conflict_or_Gap_Handling: {{Conflict_Gap_or_Open_Question_Process}}

## Epics
Instruction: Group related capabilities into broad outcomes.

| Epic_ID | Epic_Name | Objective | Business_Value | Related_Component_IDs | Related_FR_NFR_IDs |
|---|---|---|---|---|---|
| EP-001 | {{Epic_Name}} | {{Objective}} | {{Business_Value}} | {{Component_ID_List}} | {{FR_NFR_ID_List}} |

## Features
Instruction: Break epics into deliverable feature groups.

| Feature_ID | Epic_ID | Feature_Name | Business_Value | Priority | Dependency_IDs | Related_WF_IDs |
|---|---|---|---|---|---|---|
| FEAT-001 | EP-001 | {{Feature_Name}} | {{Business_Value}} | {{High_Medium_Low}} | {{Dependency_List}} | {{WF_ID_List}} |

## User Stories
Instruction: Define user-centered outcomes with acceptance criteria.

| Story_ID | Feature_ID | User_Story | Acceptance_Criteria | Priority | NFR_Considerations | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|
| US-001 | FEAT-001 | {{As_A_I_Want_So_That}} | {{Acceptance_Criteria_List}} | {{High_Medium_Low}} | {{NFR_Considerations}} | {{FR_NFR_ID_List}} |

## Tasks
Instruction: Split stories into actionable tasks with ownership.

| Task_ID | Story_ID | Task_Description | Owner | Estimate | Definition_Of_Ready | Definition_Of_Done |
|---|---|---|---|---|---|---|
| TSK-001 | US-001 | {{Task_Description}} | {{Owner}} | {{Estimate}} | {{DoR}} | {{DoD}} |

## Acceptance and Review Criteria
Instruction: Define objective checks that prove each backlog item is ready for planning and complete after delivery.

| Criteria_ID | Applies_To_ID | Criteria_Type | Criteria | Evidence_Expected | Related_FR_NFR_IDs |
|---|---|---|---|---|---|
| AC-001 | {{EP_FEAT_US_TSK_ID}} | {{Readiness_Acceptance_Review}} | {{Criteria}} | {{Evidence_Expected}} | {{FR_NFR_ID_List}} |

## Release Grouping and Sequencing
Instruction: Group backlog items into logical increments without committing dates unless the plan artifact does so.

| Increment_ID | Objective | Included_Backlog_IDs | Dependency_IDs | Release_Readiness_Notes |
|---|---|---|---|---|
| INC-001 | {{Objective}} | {{Backlog_ID_List}} | {{Dependency_ID_List}} | {{Readiness_Notes}} |

## Deferred or Out-of-Scope Items
Instruction: Capture requested or discovered work that is not approved for current delivery scope.

| Deferred_ID | Item | Reason_Deferred | Trigger_For_Reconsideration | Related_Source_IDs |
|---|---|---|---|---|
| DEF-001 | {{Deferred_Item}} | {{Reason}} | {{Trigger}} | {{FR_CON_RISK_ID_List}} |

## Traceability Instructions
Instruction: Preserve hierarchy and links to solution.

- Traceability_Rule_1: Every Feature links to one Epic.
- Traceability_Rule_2: Every Story links to one Feature.
- Traceability_Rule_3: Every Task links to one Story.
- Traceability_Rule_4: Epics should map to Solution Component IDs.
- Traceability_Rule_5: Deferred items must map to source, risk, constraint, or governance IDs.
- Traceability_Rule_6: Acceptance criteria and increments must map to backlog and source IDs.
