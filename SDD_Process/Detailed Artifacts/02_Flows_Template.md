# Flows Template

## Metadata
Instruction: Fill metadata and reference specification artifact.

- Project_Name: {{Project_Name}}
- Requirement_Specification_Document: {{Requirement_Specification_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Define user workflows, user journeys, and data flows from specifications.

- Scope: {{Flow_Scope_Summary}}
- Source_Artifacts: {{01_Requirement_Specification_11_UI_12_Database_or_Not_Applicable}}
- Flow_Boundary: {{In_Scope_and_Out_Of_Scope_Flow_Boundary}}

## Source and Flow Rules
Instruction: State how upstream artifacts were used and prevent unsupported flow invention.

- Source_Precedence: {{Specification_UI_Database_Precedence_Rules}}
- Assumption_Handling: {{Assumptions_Open_Questions_or_Recommendations}}
- Conflict_Handling: {{Conflict_IDs_or_Not_Applicable}}
- Technology_Agnostic_Rule: Describe behavior, actors, data movement, and decisions without prescribing implementation technology unless mandated upstream.
- Duplication_Rule: Reference 11_UI.md for screen/control/layout evidence and 12_Database.md for schema/entity evidence; include only the workflow implication in this artifact.

## User Personas
Instruction: Use personas from business context; avoid technical implementation assumptions.

| Persona_ID | Persona_Name | Goals | Pain_Points | Frequency |
|---|---|---|---|---|
| PER-001 | {{Persona_Name}} | {{Goal_List}} | {{Pain_Point_List}} | {{Usage_Frequency}} |

## Key Workflows
Instruction: Name end-to-end workflows and their outcomes.

| Workflow_ID | Workflow_Name | Trigger | Outcome | Related_Spec_IDs |
|---|---|---|---|---|
| WF-001 | {{Workflow_Name}} | {{Trigger_Event}} | {{Expected_Outcome}} | {{FR_ID_List}} |

## Workflow Preconditions and Postconditions
Instruction: Define what must be true before and after each workflow.

| Workflow_ID | Preconditions | Postconditions | Success_Criteria | Related_NFR_IDs |
|---|---|---|---|---|
| WF-001 | {{Preconditions}} | {{Postconditions}} | {{Success_Criteria}} | {{NFR_ID_List}} |

## Step-by-Step Flow Definitions
Instruction: Provide deterministic steps and decision points.

| Step_ID | Workflow_ID | Actor | Action | System_Response | Decision_Rule | Next_Step |
|---|---|---|---|---|---|---|
| ST-001 | WF-001 | {{Actor}} | {{Action}} | {{Response}} | {{If_Condition}} | {{Next_Step_ID}} |

## State and Validation Rules
Instruction: Capture lifecycle states, transitions, validations, and authorization checks implied by each workflow.

| State_Rule_ID | Workflow_ID | Entity_or_Object | From_State | To_State | Trigger | Validation_or_Authorization_Rule | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|
| SR-001 | WF-001 | {{Entity_or_Object}} | {{From_State}} | {{To_State}} | {{Trigger}} | {{Validation_or_Authorization_Rule}} | {{FR_NFR_ID_List}} |

## Data Movement Description
Instruction: Describe data created, transformed, or consumed per step.

| DataFlow_ID | Workflow_ID | Step_ID | Source | Destination | Data_Object | Operation | Validation_Rule | Data_Classification |
|---|---|---|---|---|---|---|---|---|
| DF-001 | WF-001 | ST-001 | {{Source}} | {{Destination}} | {{Data_Object}} | {{Create_Read_Update_Delete}} | {{Validation_Rule}} | {{Public_Internal_Confidential_Restricted}} |

## Exceptions and Alternate Paths
Instruction: Define negative and alternate paths for reliability.

| Exception_ID | Related_Workflow | Related_Step_ID | Condition | Alternate_Behavior | User_Impact | Recovery_or_Escalation | Related_NFR_IDs |
|---|---|---|---|---|---|---|---|
| EX-001 | WF-001 | ST-001 | {{Exception_Condition}} | {{Alternate_Path}} | {{Impact}} | {{Recovery_or_Escalation}} | {{NFR_ID_List}} |

## Cross-Channel and Integration Flows
Instruction: Document handoffs between users, systems, external services, batch jobs, notifications, or manual operations.

| Handoff_ID | Workflow_ID | From_Actor_or_System | To_Actor_or_System | Payload_or_Context | Timing | Failure_Handling | Related_IDs |
|---|---|---|---|---|---|---|---|
| HF-001 | WF-001 | {{From}} | {{To}} | {{Payload_or_Context}} | {{Timing}} | {{Failure_Handling}} | {{FR_NFR_CON_ID_List}} |

## Business Rules and Decisions
Instruction: Capture deterministic rules used by workflows without inventing implementation details.

| Rule_ID | Workflow_ID | Rule_or_Decision | Source_Reference | Related_FR_NFR_IDs |
|---|---|---|---|---|
| BR-001 | WF-001 | {{Rule_or_Decision}} | {{Source_Reference}} | {{FR_NFR_ID_List}} |

## Traceability Instructions
Instruction: Every workflow must map to specification requirements.

- Traceability_Rule_1: WF rows must include Related_Spec_IDs.
- Traceability_Rule_2: Each step must link to a Workflow_ID.
- Traceability_Rule_3: Every data flow must tie to a workflow step or requirement.
- Traceability_Rule_4: Exceptions and business rules must map to workflow steps and source IDs.
- Traceability_Rule_5: State rules and handoffs must map to workflow, requirement, constraint, or recommendation IDs.
