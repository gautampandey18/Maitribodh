# Requirements And Scope Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Source_Baseline: 01_Source_Baseline.md
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Owner: {{Owner}}

## Purpose
Instruction: Consolidate business requirements, scope, workflows, high-level UI/data needs, NFRs, assumptions, constraints, and acceptance criteria.

- Requirements_Objective: {{Requirements_Objective}}
- Current_State_Caution: For reverse-to-forward projects, observed legacy behavior is not a target requirement unless approved here.

## Project Overview
- Problem_Statement: {{Problem_Statement}}
- Business_Objectives: {{Business_Objectives}}
- Success_Criteria: {{Success_Criteria}}
- Primary_Users_or_Personas: {{Personas}}
- Business_Capabilities: {{Capabilities}}

## User Personas
Instruction: Preserve persona-level flow detail from the detailed flows template.

| Persona_ID | Persona_or_Role | Goals | Permissions_or_Access | Pain_Points | Related_Workflows | Source_IDs |
|---|---|---|---|---|---|---|
| PER-001 | {{Persona_or_Role}} | {{Goals}} | {{Permissions}} | {{Pain_Points}} | {{WF_IDs}} | {{Source_IDs}} |

## Scope
| Scope_ID | Type | Scope_Item | Priority | Validation_Method | Source_IDs | Owner |
|---|---|---|---|---|---|---|
| SCP-001 | {{In_Scope_Out_Of_Scope_Deferred}} | {{Scope_Item}} | {{High_Medium_Low}} | {{Validation_Method}} | {{Source_ID_List}} | {{Owner}} |

## Functional Requirements
| Requirement_ID | Requirement_Statement | Priority | Source_IDs | Related_Current_State_IDs | Rationale | Acceptance_Criteria |
|---|---|---|---|---|---|---|
| FR-001 | {{Functional_Requirement}} | {{High_Medium_Low}} | {{Source_ID_List}} | {{CBI_LRE_IDs_or_NA}} | {{Rationale}} | {{Acceptance_Criteria}} |

## Non-Functional Requirements
| NFR_ID | Category | Requirement_Statement | Metric | Target | Threshold_or_Tolerance | Validation_Method | Owner | Source_IDs |
|---|---|---|---|---|---|---|---|---|
| NFR-001 | {{Performance_Security_Accessibility_Availability_Resilience_Observability_Maintainability_Compliance_Privacy_Data_Quality_Data_Freshness_Data_Access_Control}} | {{NFR}} | {{Metric}} | {{Target}} | {{Threshold}} | {{Method}} | {{Owner}} | {{Source_ID_List}} |

Instruction: `Data_Quality` and `Data_Freshness` categories apply when `Domain: Data_And_Analytics`; use them for completeness/accuracy/timeliness/consistency/uniqueness/validity targets and dataset staleness SLAs. `Data_Access_Control` covers ABAC, masking/tokenization, and row/column-level security requirements — validated in `04_Target_Solution_Architecture.md` and `08_Release_Operations_And_Governance.md`.

## KPI Tree And Data Product Ownership
Instruction: Populate when `Domain: Data_And_Analytics` and `BI_Reporting_Analytics ∈ Data_Analytics_Subtype`; leave Not Applicable otherwise.

| KPI_ID | KPI_or_Metric | Parent_KPI_ID | Formula_or_Definition | Owning_Data_Product | Business_Owner | Refresh_SLA | Related_NFR_IDs |
|---|---|---|---|---|---|---|---|
| KPI-001 | {{KPI_or_Metric}} | {{Parent_ID_or_None}} | {{Formula}} | {{Data_Product}} | {{Owner}} | {{SLA}} | {{NFR_IDs}} |

## Workflow And Flow Summary
Instruction: Consolidates the essential information from `02_Flows_Template.md`.

| Workflow_ID | Persona_or_System | Workflow_Name | Trigger | Preconditions | Main_Steps | Decisions | Exceptions | Postconditions | Related_FR_IDs |
|---|---|---|---|---|---|---|---|---|---|
| WF-001 | {{Persona_or_System}} | {{Workflow}} | {{Trigger}} | {{Preconditions}} | {{Steps}} | {{Decision_Rules}} | {{Exceptions}} | {{Postconditions}} | {{FR_ID_List}} |

## Detailed Flow Rules
Instruction: Preserve state, validation, data movement, alternate paths, and cross-channel flow details.

| Flow_Detail_ID | Workflow_ID | Detail_Type | Detail | Data_Moved | State_or_Validation_Rule | Alternate_or_Exception_Path | Integration_or_Channel | Related_IDs |
|---|---|---|---|---|---|---|---|---|
| FLOW-DET-001 | {{WF_ID}} | {{Step_State_Validation_DataMovement_Exception_AlternatePath_CrossChannel_Integration}} | {{Detail}} | {{Data}} | {{Rule}} | {{Path}} | {{Channel_or_Integration}} | {{FR_BR_INT_IDs}} |

## Business Rules And Decisions
Instruction: For `Data_Governance_Quality_MDM` projects, record master-data survivorship, golden-record, and match/merge business rules here; the architecture-level classification scheme lives in `04_Target_Solution_Architecture.md`.

| Rule_ID | Rule | Applies_To | Source_IDs | Related_FR_or_WF_IDs | Validation_Method |
|---|---|---|---|---|---|
| BR-001 | {{Rule}} | {{Area}} | {{Source_ID_List}} | {{FR_WF_ID_List}} | {{Method}} |

## High-Level UI And Data Requirements
Instruction: Capture UI/data needs without replacing detailed architecture, design, or database sections downstream. `UI` is Not Applicable for Data & Analytics projects unless `Dashboard_Frontend_In_Scope: Yes`.

| Requirement_Area | Need | Evidence | Related_FR_NFR_IDs | Downstream_Owner |
|---|---|---|---|---|
| UI | {{Screens_Controls_Layout_Accessibility_Need_or_Not_Applicable}} | {{Source_IDs}} | {{FR_NFR_IDs}} | 05_Technology_Engineering_And_Design.md |
| Data | {{Data_Domains_Storage_Retention_Security_Need}} | {{Source_IDs}} | {{FR_NFR_IDs}} | 04_Target_Solution_Architecture.md |
| BI_Semantic_Layer | {{Dashboard_Report_KPI_Semantic_Model_Need_or_Not_Applicable}} | {{Source_IDs}} | {{FR_NFR_IDs}} | 04_Target_Solution_Architecture.md and 05_Technology_Engineering_And_Design.md |

## Assumptions Constraints And Open Questions
| Item_ID | Type | Statement | Impact | Owner | Due_Date | Blocking | Related_IDs |
|---|---|---|---|---|---|---|---|
| ASM-001 | {{Assumption_Constraint_Open_Question_Risk}} | {{Statement}} | {{Impact}} | {{Owner}} | {{YYYY-MM-DD}} | {{Yes_No}} | {{Source_FR_NFR_WF_IDs}} |

## Traceability Instructions
- Every FR, NFR, workflow, rule, assumption, constraint, and question must map to Source_IDs or current-state evidence.
- Every FR must later map to at least one backlog item, test/validation row, and build instruction.
- Every NFR must later map to metric, validation method, owner, evidence, and release or governance status.
