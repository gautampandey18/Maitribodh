# Validation Summary Template

## Metadata
Instruction: Fill after running Step 16 Prompt against all generated artifacts.

- Project_Name: {{Project_Name}}
- Validation_Date: {{YYYY-MM-DD}}
- Validator: {{Validator_Name}}
- Playbook: STEP_BY_STEP_PROMPTS.md Step 16 Prompt
- Master_Prompt: ADLC_MasterPrompt.md
- Artifact_Version: {{Artifact_Version}}

## Purpose
Instruction: Provide the final evidence-based validation record proving that the ADLC artifact chain is complete, traceable, internally consistent, and ready for implementation or further review.

- Validation_Objective: {{Validation_Objective}}
- Validation_Scope: {{All_Artifacts_Selected_Phase_or_Exception_Scope}}
- Validation_Method: {{Template_Conformance_Traceability_Cross_Artifact_Consistency_Source_Consumption}}
- Decision_Use: {{Implementation_Readiness_Review_Readiness_Rework_Required}}

## Pass/Fail Summary
Instruction: Run each check against the generated artifact chain and record Pass or Fail with notes.

| Check | Result | Notes |
|---|---|---|
| Requirements folder and manifest consumed or marked not applicable | {{Pass_Fail}} | {{Notes}} |
| UI reference folder and manifest consumed or marked not applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Database reference folder and manifest consumed or marked not applicable | {{Pass_Fail_NA}} | {{Notes}} |
| General notes folder and manifest consumed or marked not applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Clarifications file consumed or marked not applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Technical references folder and manifest consumed or marked not applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Step 18 artifact (18_Project_Intake.md) present if greenfield enterprise intake is applicable | {{Pass_Fail_NA}} | {{Notes}} |
| All mandatory Step 1-10 artifacts present | {{Pass_Fail}} | {{Notes}} |
| Step 11 artifact (11_UI.md) present if applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Step 12 artifact (12_Database.md) present if applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Step 13 artifact (13_Technology_Specification.md) present and consistent | {{Pass_Fail}} | {{Notes}} |
| Step 14 artifact (14_Design_System.md) present and consistent with 11_UI.md | {{Pass_Fail_NA}} | {{Notes}} |
| Step 19 artifact (19_Backlog_Export.md) present if backlog export is applicable | {{Pass_Fail_NA}} | {{Notes}} |
| Template section coverage | {{Pass_Fail}} | {{Notes}} |
| ID stability and uniqueness | {{Pass_Fail}} | {{Notes}} |
| End-to-end traceability chain | {{Pass_Fail}} | {{Notes}} |
| Cross-artifact duplication is owned, justified, or reference-only | {{Pass_Fail}} | {{Notes}} |
| No implementation code generated | {{Pass_Fail}} | {{Notes}} |
| No deployment scripts generated | {{Pass_Fail}} | {{Notes}} |
| Phase/scope boundaries respected | {{Pass_Fail}} | {{Notes}} |
| No unsupported business requirements invented | {{Pass_Fail}} | {{Notes}} |
| Technology lock-in minimized | {{Pass_Fail}} | {{Notes}} |
| NFR test case coverage 100% | {{Pass_Fail}} | {{Notes}} |

**Overall: {{PASS_CONDITIONAL_FAIL}}** - {{Overall_Summary}}

## Artifacts Validated
Instruction: List every generated artifact with step, version, status, and notes.

| Artifact | Step | Version | Status | Notes |
|---|---|---|---|---|
| 01_Requirement_Specification.md | 1 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 18_Project_Intake.md | 18 (optional greenfield intake) | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |
| 11_UI.md | 11 (optional extraction) | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |
| 12_Database.md | 12 (optional extraction) | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |
| 02_Flows.md | 2 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 03_Solution.md | 3 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 04_Backlog.md | 4 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 05_Guidelines.md | 5 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 06_Plan.md | 6 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 07_Code-And-Test.md | 7 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 08_Quality.md | 8 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 09_Release.md | 9 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 10_Governance.md | 10 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 13_Technology_Specification.md | 13 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 14_Design_System.md | 14 | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |
| 15_Build_Prompt.md | 15 | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |
| 16_Validation_Summary.md | 16 | {{Version}} | {{Complete_Partial_Missing}} | {{Notes}} |
| 17_Regression_Test_Suite.md | 17 (optional regression suite) | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |
| 19_Backlog_Export.md | 19 (optional backlog export) | {{Version}} | {{Complete_Partial_Missing_NA}} | {{Notes}} |

## Open Questions Remaining
Instruction: Carry forward all unresolved questions from across the artifact chain.

| Question_ID | Source | Question | Severity | Owner | Due |
|---|---|---|---|---|---|
| {{Question_ID}} | {{Source_Artifact}} | {{Question}} | {{High_Medium_Low}} | {{Owner}} | {{Due_Date}} |

## Gaps Identified
Instruction: Document any gaps found during validation with the fix applied or fix required.

| File | Gap Identified | Fix Applied |
|---|---|---|
| {{File}} | {{Gap_Description}} | {{Fix_Description}} |

## Inconsistencies Resolved
Instruction: Track cross-artifact inconsistencies discovered and resolved across validation passes.

| Item | Pre-Resolution | Resolution_Version |
|---|---|---|
| {{Item}} | {{Pre_Resolution_State}} | {{Version_Fixed}} |

## Required Fixes Remaining
Instruction: List outstanding fixes that require human decisions or post-implementation evidence.

| File | Fix |
|---|---|
| {{File}} | {{Fix_Description}} |

## Traceability Chain Confirmation
Instruction: Document the end-to-end traceability chain from source documents to final governance artifact.

```
{{Source_Documents}}
        |
{{Step_1_Artifacts}}
        |
{{Step_2_through_10_Artifact_Chain}}
        |
{{Supplementary_Artifacts}}
```

## Source Folder Consumption
Instruction: Confirm whether each input source folder was consumed, skipped, or marked not applicable.

| Source_Folder | Manifest | Consumption_Status | Consumed_By_Artifacts | Notes |
|---|---|---|---|---|
| Requirements | {{Requirements_Manifest_Path}} | {{Consumed_Not_Applicable_Gap}} | {{Artifact_List}} | {{Notes}} |
| UI References | {{UI_Manifest_Path}} | {{Consumed_Not_Applicable_Gap}} | {{Artifact_List}} | {{Notes}} |
| Database References | {{Database_Manifest_Path}} | {{Consumed_Not_Applicable_Gap}} | {{Artifact_List}} | {{Notes}} |
| Notes | {{Notes_Manifest_Path}} | {{Consumed_Not_Applicable_Gap}} | {{Artifact_List}} | {{Notes}} |
| Clarifications | {{Clarifications_File_Path}} | {{Consumed_Not_Applicable_Gap}} | {{Artifact_List}} | {{Notes}} |
| Technical References | {{Technical_Manifest_Path}} | {{Consumed_Not_Applicable_Gap}} | {{Artifact_List}} | {{Notes}} |

## Clarification Consumption
Instruction: Confirm whether approved clarification answers were applied to owning artifacts and downstream impacts were regenerated or validated.

| Clarification_ID | Related_Question_ID | Source_Artifact | Approval_Status | Applied_To_Artifact | Downstream_Impact | Regeneration_Status | Remaining_Gap |
|---|---|---|---|---|---|---|---|
| {{Clarification_ID}} | {{Question_ID}} | {{Source_Artifact}} | {{Approved_Draft_Rejected_NA}} | {{Artifact_Name_or_NA}} | {{Impacted_Artifact_List}} | {{Regenerated_Validated_Not_Applicable_Gap}} | {{Gap_or_None}} |

## ADLC Master Prompt Compliance
Instruction: Verify every Master Prompt requirement was met.

| Master Prompt Requirement | Status |
|---|---|
| Numbered ADLC templates with traceability | {{Status}} |
| Step-by-step playbook followed in order | {{Status}} |
| 11_UI_Template - optional | {{Status}} |
| 12_Database_Template - optional | {{Status}} |
| 13_Technology_Specification_Template - Step 13 | {{Status}} |
| 14_Design_System_Template - Step 14 optional when no UI/design inputs exist | {{Status}} |
| 15_Build_Prompt_Template - Step 15 optional when no implementation prompt is needed | {{Status}} |
| 16_Validation_Summary_Template - Step 16 | {{Status}} |
| 17_Regression_Test_Suite_Template - Step 17 optional when regression suite is needed | {{Status}} |
| 18_Project_Intake_Template - Step 18 optional before Step 1 for greenfield enterprise intake | {{Status}} |
| 19_Backlog_Export_Template - Step 19 optional when board import/export is needed | {{Status}} |
| Non-hallucination | {{Status}} |

## Artifact ID Inventory
Instruction: List all ID namespaces, ranges, and source artifacts for reference and uniqueness verification.

| Namespace | ID Range | Source Artifact |
|---|---|---|
| {{Namespace}} | {{ID_Range}} | {{Source_Artifact}} |

## Traceability Instructions
Instruction: The validation summary must provide evidence for every pass/fail judgment and retain unresolved gaps as actionable fixes.

- Traceability_Rule_1: Every validation finding must reference one or more source, artifact, requirement, risk, exception, or governance IDs.
- Traceability_Rule_2: Every missing or inconsistent item must be listed in Gaps Identified or Required Fixes Remaining.
- Traceability_Rule_3: Every conditional pass must reference owner, rationale, evidence, and follow-up action.
- Traceability_Rule_4: Source folder consumption must reconcile with each manifest and identify skipped or not-applicable inputs.
- Traceability_Rule_5: Step 18 intake and Step 19 backlog export applicability must be validated when those artifacts are generated or explicitly marked not applicable.
