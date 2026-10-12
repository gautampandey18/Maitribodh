# Legacy Reverse Engineering Template

## Metadata
Instruction: Use this optional legacy template after codebase inventory to reconstruct current-state capabilities, workflows, architecture, integrations, and constraints.

- Project_Name: {{Project_Name}}
- Codebase_Inventory_Document: {{20_Codebase_Inventory_Document_Name}}
- Requirements_Document: {{01_Requirement_Specification_Document_Name_or_Not_Available}}
- Version: {{Document_Version}}
- Date: {{Date}}
- Reverse_Engineering_Owner: {{Owner}}

## Purpose
Instruction: Convert observed legacy evidence into structured as-is understanding. Do not define target-state design here except as gaps, risks, or modernization candidates.

- Reverse_Engineering_Objective: {{Objective}}
- System_Boundary: {{System_Boundary}}
- Current_State_Confidence: {{High_Medium_Low}}

## As-Is Capability Map
Instruction: Map observed modules, screens, APIs, jobs, and data operations to business capabilities.

| Capability_ID | Capability_Name | Observed_From | Current_Behavior | Business_Value_or_Unknown | Confidence | Related_Codebase_IDs |
|---|---|---|---|---|---|---|
| LRE-CAP-001 | {{Capability_Name}} | {{Module_Screen_API_Job_Data}} | {{Current_Behavior}} | {{Business_Value_or_Unknown}} | {{High_Medium_Low}} | {{CBI_ID_List}} |

## As-Is Workflow Reconstruction
Instruction: Reconstruct current workflows from code, UI, logs, APIs, jobs, and database evidence.

| Legacy_Workflow_ID | Trigger | Actors_or_Systems | Steps_Summary | Inputs | Outputs | Exceptions | Evidence |
|---|---|---|---|---|---|---|---|
| LRE-WF-001 | {{Trigger}} | {{Actors_or_Systems}} | {{Steps_Summary}} | {{Inputs}} | {{Outputs}} | {{Exceptions}} | {{Evidence}} |

## As-Is Architecture Summary
Instruction: Summarize observed architecture and boundaries. Detailed target architecture belongs in 03_Solution.md.

| Legacy_Component_ID | Component | Responsibility | Dependencies | Data_Owned_or_Used | External_Touchpoints | Evidence | Confidence |
|---|---|---|---|---|---|---|---|
| LRE-CMP-001 | {{Component}} | {{Responsibility}} | {{Dependencies}} | {{Data}} | {{External_Touchpoints}} | {{Evidence}} | {{High_Medium_Low}} |

## Business Rule and Data Behavior Extraction
Instruction: Capture observed rules, validations, calculations, data transformations, and state transitions.

| Legacy_Rule_ID | Rule_or_Behavior | Applies_To | Evidence | Business_Criticality | Target_Artifact_Route | Notes |
|---|---|---|---|---|---|---|
| LRE-BR-001 | {{Rule_or_Behavior}} | {{Module_Workflow_Data_UI_API}} | {{Evidence}} | {{High_Medium_Low_Unknown}} | {{01_Requirement_02_Flows_12_Database_03_Solution}} | {{Notes}} |

## As-Is Constraints and Risks
Instruction: Capture constraints that affect future requirements, modernization, migration, release, or support.

| Legacy_Constraint_ID | Constraint_or_Risk | Source | Impact | Severity | Owner | Downstream_Route |
|---|---|---|---|---|---|---|
| LRE-CON-001 | {{Constraint_or_Risk}} | {{Source}} | {{Impact}} | {{Critical_High_Medium_Low}} | {{Owner}} | {{01_Requirement_03_Solution_10_Governance_22_Technical_Debt}} |

## Open Questions
Instruction: Record unclear current behavior, missing source evidence, and areas requiring SME validation.

| Question_ID | Question | Evidence_Gap | Impact | Owner | Blocking | Target_Resolution |
|---|---|---|---|---|---|---|
| LRE-Q-001 | {{Question}} | {{Evidence_Gap}} | {{Impact}} | {{Owner}} | {{Yes_No}} | {{Date_or_Gate}} |

## Traceability Instructions
Instruction: Reverse-engineered facts must be routed into the owning ADLC artifact before implementation use.

- Traceability_Rule_1: Every capability, workflow, component, rule, or constraint must map to one or more 20_Codebase_Inventory.md IDs or legacy source references.
- Traceability_Rule_2: Future-state requirements must be created in 01_Requirement_Specification.md only after evidence or SME approval supports them.
- Traceability_Rule_3: Architecture implications route to 03_Solution.md or 13_Technology_Specification.md; technical debt routes to 22_Technical_Debt_Assessment.md.

