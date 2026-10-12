# Code-And-Test Template

## Metadata
Instruction: Reference all prior artifacts for implementation context.

- Project_Name: {{Project_Name}}
- Input_Artifacts: {{Requirement_Specification}}, {{Flows}}, {{Solution}}, {{Backlog}}, {{Guidelines}}, {{Plan}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Guide implementation and testing in a deterministic structure.

- Implementation_Goal: {{Implementation_Goal}}
- Source_Artifacts: {{01_Requirement_Specification_02_Flows_03_Solution_04_Backlog_05_Guidelines_06_Plan_13_Technology_Specification_or_Not_Applicable}}
- Implementation_Status: {{Ready_Blocked_Deferred}}

## Code Structure Guidelines
Instruction: Define code organization independent of language or framework.

- Layering_Model: {{Layering_Model}}
- Module_Boundary_Rules: {{Module_Boundary_Rules}}
- Interface_Contract_Rules: {{Interface_Contract_Rules}}
- Data_Access_Rules: {{Data_Access_Rules}}
- Error_Handling_Model: {{Error_Handling_Model}}
- Configuration_and_Secrets_Model: {{Configuration_and_Secrets_Model}}
- Separation_of_Concerns_Rule: Do not combine interfaces/contracts, UI markup, styles/tokens, business logic, data access, configuration, and tests in monolithic files.
- Reuse_Rule: Shared behavior, contracts, fixtures, styles, and helpers must be defined once and reused through explicit boundaries.

## Module Definition Format
Instruction: Use this table for every planned module.

| Module_ID | Module_Name | Responsibility | Inputs | Outputs | Dependencies | Interfaces_or_Contracts | Related_Story_IDs |
|---|---|---|---|---|---|---|---|
| MOD-001 | {{Module_Name}} | {{Responsibility}} | {{Inputs}} | {{Outputs}} | {{Dependencies}} | {{Contract_ID_List}} | {{US_ID_List}} |

## Interface and Contract Inventory
Instruction: Define APIs, events, internal contracts, and data shapes needed for implementation.

| Contract_ID | Contract_Name | Contract_Type | Producer | Consumer | Request_or_Input | Response_or_Output | Validation_Rules | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|---|
| CT-001 | {{Contract_Name}} | {{API_Event_Internal_Data}} | {{Producer}} | {{Consumer}} | {{Input}} | {{Output}} | {{Validation_Rules}} | {{FR_NFR_ID_List}} |

## Implementation Unit Checklist
Instruction: Define what must be produced for each story or module before coding starts.

| Unit_ID | Related_Module_or_Story_ID | Required_Contracts | Required_Data_Objects | Required_Test_Cases | Required_Config | Open_Questions |
|---|---|---|---|---|---|---|
| IU-001 | {{MOD_or_US_ID}} | {{Contract_ID_List}} | {{Data_Object_List}} | {{TC_ID_List}} | {{Config_Key_List}} | {{Open_Questions_or_None}} |

## Testing Strategy
Instruction: Define test layers and quality gates.

- Test_Levels: {{Unit_Integration_System_Acceptance}}
- Coverage_Targets: {{Coverage_Targets}}
- Test_Data_Strategy: {{Test_Data_Strategy}}
- Entry_Criteria: {{Entry_Criteria}}
- Exit_Criteria: {{Exit_Criteria}}
- Automation_Strategy: {{Automation_Strategy}}

## Sample Test Case Format
Instruction: Use this format for test case generation.

| Test_Case_ID | Related_Requirement_ID | Related_Story_ID | Preconditions | Steps | Expected_Result | Priority |
|---|---|---|---|---|---|---|
| TC-001 | {{FR_or_NFR_ID}} | {{US_ID}} | {{Preconditions}} | {{Step_List}} | {{Expected_Result}} | {{High_Medium_Low}} |

## Test Data and Environment Needs
Instruction: Define reusable test data, mocks, environments, and evidence expectations.

| Test_Asset_ID | Asset_Type | Purpose | Owner | Related_Test_Case_IDs | Notes |
|---|---|---|---|---|---|
| TA-001 | {{Fixture_Mock_SeedData_Environment_Evidence}} | {{Purpose}} | {{Owner}} | {{TC_ID_List}} | {{Notes}} |

## Build and Test Quality Gates
Instruction: Define measurable gates that implementation must satisfy before quality validation.

| Gate_ID | Gate_Name | Applies_To | Required_Check | Pass_Criteria | Evidence |
|---|---|---|---|---|---|
| GATE-001 | {{Gate_Name}} | {{Module_Story_or_Release_ID}} | {{Required_Check}} | {{Pass_Criteria}} | {{Evidence_Reference}} |

## Traceability Instructions
Instruction: Implementation and tests must map to requirements and backlog.

- Traceability_Rule_1: Each module maps to one or more Story IDs.
- Traceability_Rule_2: Each test case maps to requirement IDs.
- Traceability_Rule_3: Every requirement must have at least one validating test case.
- Traceability_Rule_4: Contracts and test assets must map to modules, requirements, or test cases.
- Traceability_Rule_5: Implementation units and gates must map to backlog, module, requirement, or quality IDs.
