# Quality Test And Validation Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Requirements: 02_Requirements_And_Scope.md
- Backlog_Plan: 06_Backlog_Delivery_And_Migration_Plan.md
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Owner: {{Owner}}

## Purpose
Instruction: Consolidate code/test guidance, test strategy, quality gates, regression suite, validation summary, evidence, defects, and enterprise readiness scoring.

- Quality_Objective: {{Quality_Objective}}
- Gate_Scope: {{PreImplementation_PostImplementation_Release_Readiness}}

## Quality Gate Thresholds By Tier
Instruction: Define minimum pass thresholds before implementation, release, or build-prompt approval.

| Tier | Required_Gates | Minimum_Result | Waiver_Allowed | Waiver_Approver | Notes |
|---|---|---|---|---|---|
| Lite | {{Core_Traceability_Basic_Testing}} | {{Pass_or_Conditional}} | {{Yes_No}} | {{Approver}} | {{Notes}} |
| Standard | {{Traceability_NFR_Testing_Release_Readiness}} | {{Pass_or_Conditional}} | {{Yes_No}} | {{Approver}} | {{Notes}} |
| Enterprise | {{Traceability_Security_Data_Testing_Release_Ops_Governance}} | {{Pass}} | {{Conditional_With_Approval}} | {{Security_QA_Release_Owner}} | {{Notes}} |
| Regulated | {{Traceability_Security_Data_Compliance_Testing_Release_Ops_Audit_Governance}} | {{Pass}} | {{Exceptional_Only}} | {{Compliance_Security_Executive_Approver}} | {{Notes}} |

## Minimum Required Tests By Mode
| Execution_Mode | Required_Test_Types | Required_Evidence | Missing_Test_Impact |
|---|---|---|---|
| Forward_Engineering | {{Unit_Integration_E2E_Accessibility_Security_Performance_as_applicable}} | {{Evidence}} | {{Impact}} |
| Reverse_Engineering_Only | {{Inventory_Validation_Current_State_Traceability_Risk_Review}} | {{Evidence}} | {{Impact}} |
| Reverse_To_Forward_Engineering | {{Unit_Integration_E2E_Regression_Migration_Reconciliation_Security_Performance_Accessibility}} | {{Evidence}} | {{Impact}} |
| Migration_Modernization | {{Migration_Rehearsal_Data_Reconciliation_Rollback_Regression_Security_Performance}} | {{Evidence}} | {{Impact}} |

## Minimum Required Tests By Domain
Instruction: Domain and Execution_Mode are orthogonal — apply both tables together. Required only when `Domain: Data_And_Analytics`.

| Data_Analytics_Subtype | Required_Test_Types | Required_Evidence | Missing_Test_Impact |
|---|---|---|---|
| Data_Pipeline_ETL, Data_Warehouse_Lakehouse, Data_Migration | {{Data_Quality_Schema_SourceTargetReconciliation_Idempotency_BackfillTest}} | {{Evidence}} | {{Impact}} |
| BI_Reporting_Analytics | {{Dashboard_UAT_KPI_Reconciliation_Refresh_SLA_Test}} | {{Evidence}} | {{Impact}} |
| Data_Governance_Quality_MDM | {{Data_Quality_Dimension_Test_MDM_Match_Merge_Test_Access_Control_Test}} | {{Evidence}} | {{Impact}} |

## Test Suite Rules And Field Definitions
Instruction: Preserve regression suite rules and field definitions from the detailed regression template.

| Definition_ID | Field_or_Rule | Description | Expected_Format_or_Guidance |
|---|---|---|---|
| TEST-DEF-001 | {{Field_or_Rule}} | {{Description}} | {{Guidance}} |

## Implementation Unit And Test Strategy
| Module_or_Unit_ID | Responsibility | Interfaces | Test_Types | Test_Data_Needs | Fixtures_or_Mocks | Related_Backlog_FR_IDs |
|---|---|---|---|---|---|---|
| UNIT-001 | {{Responsibility}} | {{Interfaces}} | {{Unit_Integration_E2E_Accessibility_Performance_Security}} | {{Data}} | {{Fixtures}} | {{IDs}} |

## Requirement Traceability And Coverage
| Requirement_ID | Backlog_IDs | Implemented_By_Module_IDs | Validated_By_Test_Case_IDs | Coverage_Status | Evidence_Link | Gap_Summary |
|---|---|---|---|---|---|---|
| {{FR_or_NFR_ID}} | {{Backlog_IDs}} | {{Module_IDs}} | {{TC_IDs}} | {{Covered_Partial_Missing}} | {{Evidence}} | {{Gap}} |

## Measurable NFR Acceptance Matrix
| NFR_ID | Quality_Attribute | Metric | Target | Threshold_or_Tolerance | Validation_Method | Evidence_Required | Frequency | Owner | Acceptance_Status |
|---|---|---|---|---|---|---|---|---|---|
| NFR-001 | {{Attribute}} | {{Metric}} | {{Target}} | {{Threshold}} | {{Review_Test_Scan_Monitoring_Audit_Other}} | {{Evidence}} | {{Per_Build_Per_Release_Per_Sprint_On_Demand}} | {{Owner}} | {{Pass_Fail_Partial_NA}} |

## Evidence And Scan Validation Matrix
Instruction: Required for Enterprise and Regulated tiers; mark not applicable with rationale when a scan type does not apply.

| Evidence_ID | Evidence_Type | Required_For | Tool_or_Method | Target | Result | Evidence_Link | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| QEV-001 | {{SecurityScan_DependencyScan_SecretsScan_SAST_DAST_Accessibility_Performance_MigrationValidation_DataReconciliation_Regression_Build_Lint_Typecheck_SBOM_License_DataQualityScan_SchemaDriftCheck_DataLineageCheck}} | {{Tier_or_Mode}} | {{Tool_or_Method}} | {{Target}} | {{Result}} | {{Evidence}} | {{Owner}} | {{Pass_Fail_Partial_NA}} |

## Data Quality Validation Matrix
Instruction: Required when `Domain: Data_And_Analytics`; mark Not Applicable with rationale otherwise.

| DQ_ID | Dataset_or_Pipeline_ID | Dimension | Metric | Threshold | Validation_Method | Frequency | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| DQ-001 | {{Dataset_or_Pipeline_ID}} | {{Completeness_Accuracy_Consistency_Timeliness_Uniqueness_Validity}} | {{Metric}} | {{Threshold}} | {{Validation_Method}} | {{Per_Load_Daily_Weekly_On_Demand}} | {{Owner}} | {{Pass_Fail_Partial_NA}} |

## BI Dashboard UAT And KPI Reconciliation
Instruction: Required when `BI_Reporting_Analytics ∈ Data_Analytics_Subtype`; mark Not Applicable with rationale otherwise.

| BI_UAT_ID | Dashboard_ID | KPI_ID | Reconciliation_Method | Expected_Result | Actual_Result | Business_Tester | Status |
|---|---|---|---|---|---|---|---|
| BI-UAT-001 | {{Dashboard_ID}} | {{KPI_ID}} | {{Method}} | {{Expected}} | {{Actual}} | {{Tester}} | {{Not_Run_Pass_Fail_Blocked}} |

## Regression Test Suite
| Test_Case_ID | Test_Type | Priority | Automation_Status | Module | Scenario | Preconditions | Test_Data | Steps | Expected_Result | Postconditions | Requirement_IDs | Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-001 | {{Smoke_Sanity_Regression_Full}} | {{P0_P1_P2_P3}} | {{Manual_Automated_ToBeAutomated}} | {{Module}} | {{Scenario}} | {{Preconditions}} | {{Data}} | {{Steps}} | {{Expected}} | {{Postconditions}} | {{IDs}} | {{Evidence}} | {{Not_Run_Pass_Fail_Blocked_Skipped}} |

## Automation Readiness
| Readiness_ID | Test_Case_ID | Deterministic_Preconditions | Data_Reset_or_Isolation | Observable_Result | External_Dependency_Control | Cleanup_Defined | Evidence_Capture | Status |
|---|---|---|---|---|---|---|---|---|
| AR-001 | {{TC_ID}} | {{Ready_NotReady_NA}} | {{Ready_NotReady_NA}} | {{Ready_NotReady_NA}} | {{Ready_NotReady_NA}} | {{Ready_NotReady_NA}} | {{Ready_NotReady_NA}} | {{Ready_NotReady_NA}} |

## Regression Coverage And Execution Summary
| Coverage_or_Execution_ID | Type | Module_or_Cycle | Requirement_or_Story_IDs | Total_Tests | P0_Count | P1_Count | Automated_Count | Manual_Count | Passed | Failed | Blocked | Skipped | Evidence | Coverage_Gap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REG-COV-001 | {{Coverage_Execution}} | {{Module_or_Cycle}} | {{IDs}} | {{Total}} | {{P0}} | {{P1}} | {{Automated}} | {{Manual}} | {{Passed}} | {{Failed}} | {{Blocked}} | {{Skipped}} | {{Evidence}} | {{Gap}} |

## Defects Risks Waivers And Triage
| Item_ID | Type | Related_IDs | Severity | Status | Root_Cause_or_Rationale | Resolution_or_Mitigation | Owner | Approval |
|---|---|---|---|---|---|---|---|---|
| QA-001 | {{Defect_Risk_Waiver_Gap}} | {{IDs}} | {{Critical_High_Medium_Low}} | {{Open_InProgress_Closed_Approved_Rejected}} | {{Cause_or_Rationale}} | {{Resolution}} | {{Owner}} | {{Approver_or_NA}} |

## Validation Summary
| Validation_Area | Status | Evidence | Gaps | Required_Fixes | Owner |
|---|---|---|---|---|---|
| Requirements_Traceability | {{Pass_Partial_Fail}} | {{Evidence}} | {{Gaps}} | {{Fixes}} | {{Owner}} |
| Source_Consumption | {{Pass_Partial_Fail}} | {{Evidence}} | {{Gaps}} | {{Fixes}} | {{Owner}} |
| Architecture_Consistency | {{Pass_Partial_Fail}} | {{Evidence}} | {{Gaps}} | {{Fixes}} | {{Owner}} |
| Security_Privacy | {{Pass_Partial_Fail}} | {{Evidence}} | {{Gaps}} | {{Fixes}} | {{Owner}} |
| Test_Coverage | {{Pass_Partial_Fail}} | {{Evidence}} | {{Gaps}} | {{Fixes}} | {{Owner}} |
| Release_Readiness | {{Pass_Partial_Fail}} | {{Evidence}} | {{Gaps}} | {{Fixes}} | {{Owner}} |

## Detailed Validation Controls
Instruction: Preserve validation summary details: pass/fail summary, artifacts validated, open questions, gaps, inconsistencies, fixes, source consumption, clarification consumption, master prompt compliance, and artifact ID inventory.

| Validation_Control_ID | Control_Type | Item | Status | Evidence | Gap_or_Action | Related_IDs |
|---|---|---|---|---|---|---|
| VAL-CTRL-001 | {{PassFail_ArtifactValidated_OpenQuestion_Gap_Inconsistency_Fix_SourceConsumption_ClarificationConsumption_MasterPromptCompliance_ArtifactIDInventory_ReviewEvidence}} | {{Item}} | {{Pass_Fail_Partial_Open_Closed_NA}} | {{Evidence}} | {{Gap_or_Action}} | {{IDs}} |

## Build Prompt Validation
Instruction: Validate that `09_Build_Prompt.md` is safe to hand to a coding agent.

| Build_Validation_ID | Check | Expected | Status | Evidence | Blocking | Required_Action |
|---|---|---|---|---|---|---|
| BPV-001 | {{No_Unapproved_Scope_No_Unapproved_Dependencies_No_Unresolved_Blockers_Traceability_Complete_Migration_Constraints_Included_Validation_Report_Referenced}} | {{Expected}} | {{Pass_Fail_Partial_NA}} | {{Evidence}} | {{Yes_No}} | {{Action}} |

## Enterprise Readiness Score
| Readiness_Area | Rating | Evidence | Blocking_Gaps | Owner |
|---|---|---|---|---|
| Requirements | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |
| Architecture | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |
| Security | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |
| Data | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |
| Quality_Testing | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |
| Release_Operations | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |
| Governance | {{Green_Amber_Red}} | {{Evidence}} | {{Gaps}} | {{Owner}} |

## Quality Gate Decision
- Gate_Result: {{Pass_Conditional_Fail}}
- Decision_Rationale: {{Rationale}}
- Required_Followups: {{Followups}}
- Build_or_Release_Impact: {{Impact}}

## Traceability Instructions
- Every FR must map to backlog, implementation unit, test case, and build prompt section.
- Every NFR must map to metric, evidence, validation method, owner, and gate result.
- Enterprise and Regulated tiers must include scan/evidence validation or an approved waiver.
- Build prompt validation must pass before `09_Build_Prompt.md` is marked ready.
- Every gap or waiver must map to governance in 08.
- Every Data Quality Validation Matrix row must include dimension, metric, threshold, validation method, and owner (TRACE-DQ).
- Every BI Dashboard UAT row must map to a Dashboard_ID in 05_Technology_Engineering_And_Design.md and a KPI_ID in 02_Requirements_And_Scope.md.
