# ADLC Validation Report Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Validation_Rules: ADLC_Artifact_Validation_Rules.md
- Source_Folder: {{Generated_Artifacts_Folder}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Validator: {{Validator_or_Agent}}

## Validation Summary
- Overall_Result: {{Pass_Conditional_Pass_Fail}}
- Build_Prompt_Status: {{Ready_Not_Ready_Conditional}}
- Blocker_Count: {{Blocker_Count}}
- Warning_Count: {{Warning_Count}}
- Info_Count: {{Info_Count}}
- Decision_Rationale: {{Decision_Rationale}}

## Required Artifact Check
| Artifact | Required | Present | Status | Notes |
|---|---|---|---|---|
| 00_Project_Intake_And_Mode.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 01_Source_Baseline.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 02_Requirements_And_Scope.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 03_Current_State_Analysis.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 04_Target_Solution_Architecture.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 05_Technology_Engineering_And_Design.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 06_Backlog_Delivery_And_Migration_Plan.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 07_Quality_Test_And_Validation.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 08_Release_Operations_And_Governance.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |
| 09_Build_Prompt.md | {{Yes_No}} | {{Yes_No}} | {{Pass_Fail_NA}} | {{Notes}} |

## Section Completeness Check
| Check_ID | Artifact | Section | Severity | Status | Gap_or_Action |
|---|---|---|---|---|---|
| SEC-CHECK-001 | {{Artifact}} | {{Section}} | {{Blocker_Warning_Info}} | {{Pass_Fail_NA}} | {{Gap_or_Action}} |

## Traceability Coverage Check
| Traceability_ID | Rule | Expected | Actual | Status | Gap_or_Action |
|---|---|---|---|---|---|
| TRACE-CHECK-001 | {{Rule_ID}} | {{Expected}} | {{Actual}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} |

## Source Change And Baseline Freshness Check
Instruction: Validate that generated artifacts reflect the latest accepted input baseline.

| Freshness_Check_ID | Check | Source_Baseline_ID | Change_IDs | Status | Impact | Required_Action |
|---|---|---|---|---|---|---|
| FRESH-001 | {{No_Post_Generation_Changes_Open_Changes_Assessed_Impacted_Artifacts_Regenerated_Build_Prompt_Current}} | {{Baseline_ID}} | {{SRC_CHG_IDs_or_None}} | {{Pass_Fail_Warning_NA}} | {{Impact}} | {{Action}} |

## Impacted Artifact Regeneration Check
| Regeneration_Check_ID | Source_Change_ID | Impacted_Artifact | Expected_Action | Actual_Action | Status | Evidence |
|---|---|---|---|---|---|---|
| REGEN-CHECK-001 | {{SRC_CHG_ID}} | {{Artifact}} | {{Regenerate_Revise_Revalidate_No_Action}} | {{Actual}} | {{Pass_Fail_Warning_NA}} | {{Evidence}} |

## Build Prompt Staleness Check
| Staleness_Check_ID | Build_Prompt_Baseline | Latest_Source_Baseline | Source_Change_Status | Build_Prompt_Status | Status | Required_Action |
|---|---|---|---|---|---|---|
| STALE-001 | {{Baseline_ID}} | {{Baseline_ID}} | {{No_Changes_Changes_Assessed_Open_Changes}} | {{Current_Stale_Conditional}} | {{Pass_Fail_Warning_NA}} | {{Action}} |

## Build Orchestration Readiness Check
Instruction: Validate that multi-agent or multi-session build execution has a formal handoff contract when applicable.

| Orchestration_Check_ID | Check | Required | Evidence | Status | Gap_or_Action |
|---|---|---|---|---|---|
| ORCH-CHECK-001 | {{Build_Orchestrator_Agent_Ownership_Shared_File_Policy_Session_Handoff_Conflict_Protocol_Acceptance_Gates}} | {{Yes_No}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} |

## Enterprise Readiness Check
| Readiness_Area | Required_For_Tier | Evidence_Found | Status | Gap_or_Action | Owner |
|---|---|---|---|---|---|
| Security | {{Enterprise_Regulated}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| Data_Governance | {{Enterprise_Regulated}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| Compliance | {{Regulated_or_NA}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| DevSecOps | {{Enterprise_Regulated}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| Operations | {{Enterprise_Regulated}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| Governance_Approvals | {{Enterprise_Regulated}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| Data_Quality | {{Enterprise_Regulated_or_Data_And_Analytics_Domain_Any_Tier}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |
| MDM_Stewardship | {{Enterprise_Regulated_or_Data_Governance_Quality_MDM_Subtype}} | {{Evidence}} | {{Pass_Fail_Warning_NA}} | {{Gap_or_Action}} | {{Owner}} |

## Blocking Conditions
| Blocker_ID | Condition | Artifact | Impact | Required_Resolution | Owner | Status |
|---|---|---|---|---|---|---|
| BLOCK-001 | {{Condition}} | {{Artifact}} | {{Impact}} | {{Resolution}} | {{Owner}} | {{Open_Resolved_Waived}} |

## Warnings And Recommendations
| Warning_ID | Finding | Artifact | Recommendation | Owner | Status |
|---|---|---|---|---|---|
| WARN-001 | {{Finding}} | {{Artifact}} | {{Recommendation}} | {{Owner}} | {{Open_Resolved_Accepted}} |

## Build Prompt Approval Decision
- Build_Prompt_File: 09_Build_Prompt.md
- Build_Allowed: {{Yes_No_Conditional}}
- Approval_Basis: {{Validation_Pass_Approved_Exceptions_Not_Ready}}
- Required_Before_Build: {{Required_Actions}}
- Approved_By: {{Approver_or_Not_Approved}}
- Approval_Date: {{YYYY-MM-DD_or_Not_Approved}}

## Traceability Instructions
- Every failed check must map to a blocking condition or warning.
- Every blocker must identify owner, impact, and required resolution.
- A build prompt cannot be marked Ready while any Blocker is Open.
- A build prompt cannot be marked Ready when post-generation source changes are open, unassessed, or not reflected in impacted artifacts.
- Multi-agent or multi-session builds cannot be marked Ready without orchestration ownership, handoff, shared-file, and conflict protocols.
