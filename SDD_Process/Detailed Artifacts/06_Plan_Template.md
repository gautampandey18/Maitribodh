# Plan Template

## Metadata
Instruction: Reference backlog and guidelines.

- Project_Name: {{Project_Name}}
- Backlog_Document: {{Backlog_Document_Name}}
- Guidelines_Document: {{Guidelines_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Create a phased execution plan with priorities, dependencies, and risk handling.

- Delivery_Objective: {{Delivery_Objective}}
- Planning_Assumptions: {{Planning_Assumptions}}
- Release_Strategy: {{Incremental_BigBang_Phased_Pilot_Other}}

## Planning Guardrails
Instruction: Define constraints that govern sequencing, scope changes, and evidence expectations.

- Source_Artifacts: {{04_Backlog_05_Guidelines_08_Quality_09_Release_10_Governance_or_Not_Applicable}}
- Scope_Control_Rule: Do not add or remove scope without recording impact in 10_Governance.md.
- Dependency_Rule: External, data, security, UI, and environment dependencies must be visible before affected work is scheduled.
- Validation_Rule: Each phase must include build, review, test, and acceptance evidence aligned to 08_Quality.md.

## Sprint Planning or Phases
Instruction: Define timeline slices and expected outcomes.

| Phase_ID | Phase_Name | Duration | Goals | Entry_Criteria | Exit_Criteria | Related_Backlog_IDs |
|---|---|---|---|---|---|---|
| PH-001 | {{Phase_Name}} | {{Duration}} | {{Goals}} | {{Entry_Criteria}} | {{Exit_Criteria}} | {{EP_FEAT_US_TSK_ID_List}} |

## Task Prioritization
Instruction: Prioritize tasks using agreed method.

| Priority_ID | Task_ID | Priority_Level | Priority_Method | Justification |
|---|---|---|---|---|
| PR-001 | {{Task_ID}} | {{High_Medium_Low}} | {{Method}} | {{Reason}} |

## Dependencies
Instruction: Capture task and phase dependencies explicitly.

| Dependency_ID | Depends_On | Blocks | Type | Mitigation |
|---|---|---|---|---|
| DEP-001 | {{Task_or_Phase_ID}} | {{Task_or_Phase_ID}} | {{Internal_External}} | {{Mitigation}} |

## Milestones and Decision Gates
Instruction: Define business, technical, quality, and release milestones with required evidence.

| Milestone_ID | Phase_ID | Milestone | Target_Window | Required_Evidence | Decision |
|---|---|---|---|---|---|
| MS-001 | PH-001 | {{Milestone}} | {{Target_Window}} | {{Evidence}} | {{Proceed_Hold_Replan}} |

## Resource and Ownership Plan
Instruction: Identify responsibility and capacity assumptions for execution.

| Owner_or_Role | Responsibilities | Capacity_Assumption | Backup_or_Escalation |
|---|---|---|---|
| {{Owner_or_Role}} | {{Responsibilities}} | {{Capacity_Assumption}} | {{Backup_or_Escalation}} |

## Estimation and Capacity Planning
Instruction: Capture effort, capacity, confidence, and delivery forecast assumptions without committing to dates unless approved.

| Estimate_ID | Scope_Item_ID | Estimate_Method | Effort_Estimate | Capacity_Assumption | Confidence | Key_Assumptions | Related_Risks |
|---|---|---|---|---|---|---|---|
| EST-001 | {{EP_FEAT_US_TSK_ID}} | {{TShirt_StoryPoints_IdealDays_Range_Other}} | {{Estimate}} | {{Capacity_Assumption}} | {{High_Medium_Low}} | {{Assumptions}} | {{Risk_ID_List}} |

## Delivery Forecast
Instruction: Summarize forecast scenarios for leadership and planning discussions.

| Forecast_ID | Scenario | Scope_Included | Team_Capacity | Forecast_Window | Confidence | Constraints_or_Dependencies |
|---|---|---|---|---|---|---|
| FC-001 | {{Optimistic_Expected_Conservative}} | {{Backlog_ID_List}} | {{Capacity_Assumption}} | {{Target_Window_or_Range}} | {{High_Medium_Low}} | {{Constraints_or_Dependencies}} |

## Risk Handling
Instruction: List execution risks and responses.

| Risk_ID | Risk | Likelihood | Impact | Response | Owner |
|---|---|---|---|---|---|
| RSK-001 | {{Risk}} | {{Low_Medium_High}} | {{Low_Medium_High}} | {{Response}} | {{Owner}} |

## Validation and Handoff Plan
Instruction: Define how completed work is reviewed, accepted, documented, and handed off.

| Handoff_ID | Phase_ID | From_Role | To_Role | Handoff_Item | Acceptance_Check | Evidence |
|---|---|---|---|---|---|---|
| HO-001 | PH-001 | {{From_Role}} | {{To_Role}} | {{Handoff_Item}} | {{Acceptance_Check}} | {{Evidence}} |

## Change-Control Checkpoints
Instruction: Define points where scope, architecture, quality, release, or governance changes must be reviewed.

| Checkpoint_ID | Phase_ID | Review_Focus | Required_Evidence | Decision_Owner |
|---|---|---|---|---|
| CHK-001 | PH-001 | {{Scope_Architecture_Quality_Release_Governance}} | {{Evidence}} | {{Owner}} |

## Traceability Instructions
Instruction: Every plan element must map to backlog and guideline constraints.

- Traceability_Rule_1: All Task_ID values must exist in Backlog.
- Traceability_Rule_2: Each phase cites related backlog item IDs.
- Traceability_Rule_3: Each plan control references applicable guideline section.
- Traceability_Rule_4: Change checkpoints must map to impacted artifact or governance IDs.
- Traceability_Rule_5: Milestones and handoffs must map to phase, backlog, quality, release, or governance IDs.
- Traceability_Rule_6: Estimates, capacity assumptions, and forecasts must map to backlog IDs, risks, assumptions, or governance decisions.
