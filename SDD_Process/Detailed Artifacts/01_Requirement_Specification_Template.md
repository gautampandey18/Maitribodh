# Requirement Specification Template

## Metadata
Instruction: Fill metadata first. Keep values concise and objective.

- Template_Version: {{Template_Version}}
- Document_Version: {{Document_Version}}
- Project_Name: {{Project_Name}}
- Project_Code: {{Project_Code}}
- Author: {{Author}}
- Reviewed_By: {{Reviewed_By}}
- Date: {{Date}}

## Purpose
Instruction: Transform raw requirements into structured, testable, technology-agnostic requirement specifications.

- Requirements_Source_Folder: {{Requirements_Folder_Path}}
- Requirements_Manifest: {{Requirements_Manifest_Path}}
- General_Notes_Folder: {{General_Notes_Folder_Path_or_Not_Applicable}}
- General_Notes_Manifest: {{General_Notes_Manifest_Path_or_Not_Applicable}}
- Technical_Reference_Folder: {{Technical_Reference_Folder_Path_or_Not_Applicable}}
- Technical_Reference_Manifest: {{Technical_Reference_Manifest_Path_or_Not_Applicable}}
- Scope_Summary: {{Scope_Summary}}

## Source Inventory
Instruction: List every source file consumed from the requirements, notes, and technical reference folders. Ignore temporary editor files such as files beginning with `~$`.

| Source_ID | Source_File_or_Folder | Source_Type | Status | Priority | Usage | Notes |
|---|---|---|---|---|---|---|
| SRC-001 | {{Source_File_or_Folder}} | {{Requirement_Note_Technical_Reference}} | {{Approved_Draft_Reference_Only}} | {{Primary_Supporting_Reference}} | {{Used_For}} | {{Notes}} |

## Project Overview
Instruction: Summarize the project context in business terms.

- Problem_Statement: {{Problem_Statement}}
- Business_Objectives: {{Business_Objectives_List}}
- Success_Criteria: {{Success_Criteria_List}}
- In_Scope: {{In_Scope_List}}
- Out_Of_Scope: {{Out_Of_Scope_List}}

## Functional Requirements
Instruction: Extract capabilities from raw requirements. Use unique IDs and measurable statements.

| Requirement_ID | Requirement_Statement | Priority | Source_Reference | Rationale |
|---|---|---|---|---|
| FR-001 | {{Functional_Requirement}} | {{High_Medium_Low}} | {{RawReq_Section_or_ID}} | {{Why_Required}} |

## Non-Functional Requirements
Instruction: Define quality attributes with measurable targets.

| NFR_ID | Category | Requirement_Statement | Metric | Target | Source_Reference |
|---|---|---|---|---|---|
| NFR-001 | {{Availability_Performance_Security_etc}} | {{NFR_Statement}} | {{Metric_Name}} | {{Target_Value}} | {{RawReq_Section_or_ID}} |


## In_Scope
Instruction: Capture In Scope explicitly to avoid hidden dependencies.

| InScope_ID | InScope | Validation_Method | Owner |
|---|---|---|---|
| INSCP-001 | {{InScope_Text}} | {{Validation_Method}} | {{Owner}} |

## Out_Of_Scope
Instruction: Capture out of scope explicitly to avoid hidden dependencies.

| OuOfScope_ID | OutofScope | Validation_Method | Owner |
|---|---|---|---|
| OTSCP-001 | {{OutOfScope_Text}} | {{Validation_Method}} | {{Owner}} |


## Assumptions
Instruction: Capture assumptions explicitly to avoid hidden dependencies.

| Assumption_ID | Assumption | Validation_Method | Owner |
|---|---|---|---|
| ASM-001 | {{Assumption_Text}} | {{Validation_Method}} | {{Owner}} |

## Constraints
Instruction: Capture hard limits only.

| Constraint_ID | Constraint_Type | Constraint_Statement | Source_Reference |
|---|---|---|---|
| CON-001 | {{Time_Budget_Compliance_etc}} | {{Constraint_Text}} | {{RawReq_Section_or_ID}} |

## Acceptance Criteria
Instruction: Define completion criteria for this specification artifact.

- {{Acceptance_Criterion_1}}
- {{Acceptance_Criterion_2}}
- {{Acceptance_Criterion_3}}

## UI & UX Requirements
Instruction: Capture only high-level interface requirements, screen needs, accessibility expectations, and source references. Do not duplicate screen-by-screen controls, exact placement, spacing, or visual tokens owned by 11_UI.md and 14_Design_System.md.

- UI_Design_Objective: {{UI_Design_Objective}}
- Primary_Screens: {{Primary_Screens}}
- Control_Definitions: {{Control_Definitions}}
- Layout_Constraints: {{Layout_Constraints}}
- Accessibility_Requirements: {{Accessibility_Requirements}}
- UI_Traceability: {{UI_Traceability}}
- Embedded_UI_Evidence: {{Requirement_Document_Images_Wireframes_or_Not_Applicable}}
- UI_Detail_Routing: Extract detailed screen/control/layout evidence into 11_UI.md when UI visuals exist in the requirements source folder or UI reference folder.

## Database Requirements
Instruction: Capture only high-level data and storage requirements. Do not duplicate entity-level schema, DDL, indexes, migrations, or data dictionary content owned by 12_Database.md.

- Database_Objective: {{Database_Objective}}
- Data_Domains: {{Data_Domains}}
- Storage_Constraints: {{Storage_Constraints}}
- Retention_and_Retention_Rules: {{Retention_and_Retention_Rules}}
- Data_Security_Requirements: {{Data_Security_Requirements}}
- Database_Traceability: {{Database_Traceability}}

## Open Questions
Instruction: List unresolved points that block certainty.

| Question_ID | Question | Owner | Due_Date |
|---|---|---|---|
| Q-001 | {{Open_Question}} | {{Owner}} | {{YYYY-MM-DD}} |

## Traceability Instructions
Instruction: Every FR/NFR/Constraint must map to raw requirements.

- Traceability_Rule_1: Each requirement row must include Source_Reference.
- Traceability_Rule_2: IDs must remain stable across downstream artifacts.
- Traceability_Rule_3: If source changes, impacted IDs must be revalidated.
- Traceability_Rule_4: Every consumed source file must appear in Source Inventory.
- Traceability_Rule_5: Multiple requirement files must be reconciled through source priority, open questions, assumptions, or risks.
