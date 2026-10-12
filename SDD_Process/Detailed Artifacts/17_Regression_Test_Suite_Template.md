# Regression Test Suite Template

## Metadata
Instruction: Reference upstream ADLC artifacts and keep this suite technology-agnostic.

- Project_Name: {{Project_Name}}
- Test_Suite_Name: {{Regression_Test_Suite_Name}}
- Test_Suite_Version: {{Document_Version}}
- Source_Artifacts: {{01_Requirement_Specification_02_Flows_04_Backlog_07_Code-And-Test_08_Quality_11_UI_12_Database_13_Technology_Specification_or_Not_Applicable}}
- Test_Owner: {{Test_Owner}}
- Reviewed_By: {{Reviewed_By}}
- Date: {{Date}}

## Purpose
Instruction: Define a reusable regression test suite format that supports manual execution, automation readiness, requirement traceability, evidence capture, and reporting.

- Suite_Objective: {{Suite_Objective}}
- Regression_Scope: {{Full_Application_Module_Feature_Risk_Based}}
- Execution_Context: {{Pre_Release_Post_Fix_Scheduled_On_Demand}}
- Automation_Objective: {{Automation_Objective}}

## Test Suite Rules
Instruction: Apply these rules while generating or executing regression tests.

- SSoT_Rule: Test cases must be derived from accepted ADLC artifacts and source requirement IDs; do not invent behavior.
- Traceability_Rule: Every test case must map to at least one requirement, user story, workflow, defect, risk, or recommendation ID.
- Technology_Agnostic_Rule: Describe actions, data, validations, and evidence without naming a specific automation framework or platform.
- Automation_Readiness_Rule: Include stable preconditions, deterministic data needs, clear expected results, and evidence expectations.
- Data_Privacy_Rule: Test data must be synthetic, masked, or approved for testing; do not require real sensitive data unless explicitly approved.
- Maintenance_Rule: Prefer reusable setup, cleanup, data, and validation patterns across tests.

## Field Definitions
Instruction: Use these definitions to keep manual and automated test generation consistent.

| Field | Description | Expected Format / Guidance |
|---|---|---|
| Test_Case_ID | Unique stable test identifier | `TC_MODULENAME_001`; do not renumber once used |
| Test_Type | Test execution category | `Smoke`, `Sanity`, `Regression`, or `Full` |
| Priority | Business and release risk priority | `P0 - Critical`, `P1 - High`, `P2 - Medium`, `P3 - Low` |
| Automation_Status | Current automation readiness | `Manual`, `Automated`, or `To Be Automated` |
| Estimated_Execution_Time | Expected execution duration | Minutes or time range, e.g., `5 min`, `10-15 min` |
| Module | Functional or technical area under test | Example: `Authentication`, `Dashboard`, `User Management` |
| Feature_or_User_Story | Linked feature/story reference | Use IDs from `04_Backlog.md`, e.g., `US-001`, or source requirement IDs |
| Test_Scenario | Clear description of the behavior being validated | One concise scenario per row |
| Pre_Conditions | State required before execution | User role, environment state, data state, feature availability |
| Test_Data_Requirements | Synthetic records, roles, payloads, files, or conditions needed | Reference reusable test assets where possible |
| Test_Steps | Numbered manual or automation-ready actions | Use ordered steps: `1) ... 2) ... 3) ...` |
| Expected_Result | Pass criteria | Observable result, state change, response, message, or evidence |
| Post_Conditions | Expected final state and cleanup | Include cleanup or rollback needs when applicable |
| Requirement_ID | Requirement source traceability | FR/NFR/CON/WF/US/BUG/RISK IDs |
| Related_Screenshots | Optional visual evidence or UI source | Screenshot file/path/ID or blank |
| External_System_or_API_Involved | External dependency, API, integration, or batch job | Name/ID or `Not Applicable` |
| Pass_Fail_Status | Execution result | `Pass`, `Fail`, `Blocked`, `Not Run`, or `Skipped` |
| Failed_Reason | Reason for failure or blockage | Required when status is `Fail` or `Blocked` |
| Evidence_Logs_Screenshots | Proof of execution or failure | Evidence link, log reference, screenshot path, run ID |
| Tested_By | Tester or automation executor | Name, role, or agent |
| Date_Tested | Execution date | `YYYY-MM-DD` |

## Sample Filled Test Case
Instruction: Use this sample as a format example only; replace values with project-specific requirements during generation.

| Test_Case_ID | Test_Type | Priority | Automation_Status | Estimated_Execution_Time | Module | Feature_or_User_Story | Test_Scenario | Pre_Conditions | Test_Data_Requirements | Test_Steps | Expected_Result | Post_Conditions | Requirement_ID | Related_Screenshots | External_System_or_API_Involved | Pass_Fail_Status | Failed_Reason | Evidence_Logs_Screenshots | Tested_By | Date_Tested |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC_AUTH_001 | Regression | P1 - High | To Be Automated | 5 min | Authentication | US-001 | Verify an active user can sign in with valid credentials | Application is available; active test user exists | Synthetic active user with valid credentials | 1) Open sign-in page<br>2) Enter valid username<br>3) Enter valid password<br>4) Submit sign-in form | User is authenticated and lands on the authorized default page without error | User session can be signed out or reset | FR-001, NFR-SEC-001 | {{Screenshot_or_Blank}} | {{Auth_Service_or_Not_Applicable}} | Not Run |  |  | {{Tester_or_Agent}} | {{YYYY-MM-DD}} |

## Empty Regression Test Case Template
Instruction: Populate one row per test scenario. Keep each scenario atomic and traceable.

| Test_Case_ID | Test_Type | Priority | Automation_Status | Estimated_Execution_Time | Module | Feature_or_User_Story | Test_Scenario | Pre_Conditions | Test_Data_Requirements | Test_Steps | Expected_Result | Post_Conditions | Requirement_ID | Related_Screenshots | External_System_or_API_Involved | Pass_Fail_Status | Failed_Reason | Evidence_Logs_Screenshots | Tested_By | Date_Tested |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| {{Test_Case_ID}} | {{Smoke_Sanity_Regression_Full}} | {{P0_P1_P2_P3}} | {{Manual_Automated_To_Be_Automated}} | {{Estimated_Time}} | {{Module}} | {{Feature_or_User_Story_ID}} | {{Scenario}} | {{Pre_Conditions}} | {{Test_Data_Requirements}} | {{Numbered_Test_Steps}} | {{Expected_Result}} | {{Post_Conditions}} | {{Requirement_ID_List}} | {{Screenshot_Reference_or_Blank}} | {{External_System_API_or_Not_Applicable}} | {{Pass_Fail_Blocked_NotRun_Skipped}} | {{Failed_Reason_or_Blank}} | {{Evidence_Reference_or_Blank}} | {{Tester}} | {{YYYY-MM-DD}} |

## Automation Readiness Checklist
Instruction: Use this checklist to decide whether a manual test can be automated safely.

| Readiness_ID | Test_Case_ID | Check | Status | Notes |
|---|---|---|---|---|
| AR-001 | {{Test_Case_ID}} | Preconditions are deterministic and repeatable | {{Ready_Not_Ready_NA}} | {{Notes}} |
| AR-002 | {{Test_Case_ID}} | Test data can be created, reset, masked, or isolated | {{Ready_Not_Ready_NA}} | {{Notes}} |
| AR-003 | {{Test_Case_ID}} | Expected result is observable without subjective judgment | {{Ready_Not_Ready_NA}} | {{Notes}} |
| AR-004 | {{Test_Case_ID}} | External dependencies are controllable, stable, mocked, or explicitly allowed | {{Ready_Not_Ready_NA}} | {{Notes}} |
| AR-005 | {{Test_Case_ID}} | Cleanup or rollback is defined | {{Ready_Not_Ready_NA}} | {{Notes}} |
| AR-006 | {{Test_Case_ID}} | Evidence capture is defined | {{Ready_Not_Ready_NA}} | {{Notes}} |

## Regression Coverage Matrix
Instruction: Summarize coverage by module, requirement, priority, and automation readiness.

| Coverage_ID | Module | Requirement_or_Story_IDs | Total_Test_Cases | P0_Count | P1_Count | P2_Count | P3_Count | Automated_Count | Manual_Count | To_Be_Automated_Count | Coverage_Gap |
|---|---|---|---|---|---|---|---|---|---|---|---|
| COV-001 | {{Module}} | {{Requirement_or_Story_ID_List}} | {{Total}} | {{P0}} | {{P1}} | {{P2}} | {{P3}} | {{Automated}} | {{Manual}} | {{To_Be_Automated}} | {{Gap_or_None}} |

## Execution Summary
Instruction: Record execution results for each regression cycle.

| Execution_ID | Cycle_Name | Scope | Environment_or_Context | Total_Tests | Passed | Failed | Blocked | Skipped | Not_Run | Defects_Raised | Evidence_Location | Executed_By | Execution_Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EXEC-001 | {{Cycle_Name}} | {{Scope}} | {{Environment_or_Context}} | {{Total}} | {{Passed}} | {{Failed}} | {{Blocked}} | {{Skipped}} | {{Not_Run}} | {{Defect_ID_List}} | {{Evidence_Location}} | {{Tester_or_Agent}} | {{YYYY-MM-DD}} |

## Traceability Instructions
Instruction: Regression tests must remain linked to requirements, implementation, quality, and evidence.

- Traceability_Rule_1: Every test case must include `Requirement_ID`.
- Traceability_Rule_2: Every automated or to-be-automated test must identify deterministic preconditions, test data, expected result, cleanup, and evidence needs.
- Traceability_Rule_3: Failed or blocked tests must include failed reason, evidence reference, and related defect or risk ID when available.
- Traceability_Rule_4: Tests involving UI must reference `11_UI.md` screen/control IDs or screenshot evidence when available.
- Traceability_Rule_5: Tests involving database, external systems, APIs, integrations, or jobs must reference the relevant ADLC artifact IDs.
- Traceability_Rule_6: Coverage gaps must be carried into `08_Quality.md`, `10_Governance.md`, or the applicable defect/risk tracking artifact.
