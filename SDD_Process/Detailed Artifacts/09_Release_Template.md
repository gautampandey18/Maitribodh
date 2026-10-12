# Release Template

## Metadata
Instruction: Reference all source artifacts used for release readiness.

- Project_Name: {{Project_Name}}
- Input_Artifacts: {{All_Artifact_List}}
- Version: {{Release_Version}}
- Date: {{Date}}

## Purpose
Instruction: Prepare deployment and release documentation in a standardized way.

- Release_Objective: {{Release_Objective}}
- Release_Scope: {{Release_Scope}}
- Release_Readiness_Source: {{08_Quality_Gate_Result}}

## Release Notes Structure
Instruction: Summarize what changed and why.

- Release_Summary: {{Release_Summary}}
- Included_Features: {{Feature_List}}
- Fixed_Defects: {{Defect_List}}
- Known_Issues: {{Known_Issues_List}}
- Backward_Compatibility_Notes: {{Compatibility_Notes}}

## Release Scope and Readiness
Instruction: Confirm what is included, excluded, blocked, or conditionally approved.

| Release_Item_ID | Item_Type | Item_ID | Status | Readiness_Evidence | Notes |
|---|---|---|---|---|---|
| REL-ITEM-001 | {{Feature_Defect_Risk_Waiver_Documentation}} | {{Related_ID}} | {{Included_Excluded_Blocked_Conditional}} | {{Evidence}} | {{Notes}} |

## Environment and Configuration Readiness
Instruction: Confirm target environments, configuration, secrets, data migrations, and operational prerequisites are ready.

| Readiness_ID | Area | Requirement | Owner | Status | Evidence |
|---|---|---|---|---|---|
| ENV-001 | {{Environment_Config_Secrets_Data_Migration_Operations}} | {{Requirement}} | {{Owner}} | {{Ready_Blocked_NA}} | {{Evidence_Reference}} |

## Source Control and Release Baseline
Instruction: Confirm the release candidate is traceable to a controlled source baseline and excludes files that must not be version controlled.

| Baseline_ID | Repository_State | Branch_or_Tag | Commit_or_Baseline_Reference | Ignore_File_Status | Exclusion_Check | Evidence |
|---|---|---|---|---|---|---|
| VCS-001 | {{New_Existing_Not_Applicable}} | {{Branch_or_Tag_or_NA}} | {{Commit_Baseline_or_NA}} | {{Present_Updated_Missing_NA}} | {{Passed_Failed_NA}} | {{Evidence_Reference}} |

## Deployment Checklist
Instruction: Verify readiness before and after deployment.

| Checklist_ID | Checklist_Item | Owner | Status | Evidence |
|---|---|---|---|---|
| DEPLOY-001 | {{Checklist_Item}} | {{Owner}} | {{Done_Pending_NA}} | {{Evidence_Ref}} |

## Communication and Support Plan
Instruction: Define release communication, support ownership, and escalation.

| Audience | Message_or_Action | Owner | Timing | Channel_or_Evidence |
|---|---|---|---|---|
| {{Audience}} | {{Message_or_Action}} | {{Owner}} | {{Timing}} | {{Channel_or_Evidence}} |

## Versioning Strategy
Instruction: Document version scheme and promotion policy.

- Versioning_Model: {{Versioning_Model}}
- Environment_Promotion_Rules: {{Promotion_Rules}}
- Rollback_Criteria: {{Rollback_Criteria}}
- Rollback_Steps: {{Rollback_Steps}}
- Post_Release_Verification: {{Post_Release_Verification}}

## Release Approval Record
Instruction: Capture explicit approval, conditional approval, or rejection before release.

| Approval_ID | Role_or_Approver | Decision | Conditions | Date | Evidence |
|---|---|---|---|---|---|
| APR-001 | {{Role_or_Approver}} | {{Approved_Conditional_Rejected}} | {{Conditions_or_None}} | {{YYYY-MM-DD}} | {{Evidence_Reference}} |

## Post-Release Validation and Feedback
Instruction: Capture production validation, monitoring outcomes, user/adoption feedback, and continuous-improvement actions after release.

| Feedback_ID | Source | Observation_or_Feedback | Impact | Action | Owner | Target_Date | Related_IDs |
|---|---|---|---|---|---|---|---|
| PRF-001 | {{Monitoring_UserFeedback_Support_QA_Business_Operations}} | {{Observation_or_Feedback}} | {{Impact}} | {{Action}} | {{Owner}} | {{YYYY-MM-DD}} | {{FR_NFR_BUG_REL_GOV_ID_List}} |

## Continuous Improvement Loop
Instruction: Route post-release learnings back to the correct ADLC artifact.

| Improvement_ID | Learning | Owning_Artifact | Required_Update | Priority | Governance_Needed | Status |
|---|---|---|---|---|---|---|
| CI-001 | {{Learning}} | {{01_Requirement_04_Backlog_08_Quality_09_Release_10_Governance_Other}} | {{Update_Needed}} | {{High_Medium_Low}} | {{Yes_No}} | {{Open_InProgress_Closed}} |

## Traceability Instructions
Instruction: Release content must map to approved work and quality outcomes.

- Traceability_Rule_1: Every included feature maps to Backlog IDs.
- Traceability_Rule_2: Release approval references Quality gate result.
- Traceability_Rule_3: Known issues reference defect IDs.
- Traceability_Rule_4: Release blockers, waivers, and rollback criteria map to Quality or Governance IDs.
- Traceability_Rule_5: Environment readiness and approvals map to release, quality, tech spec, or governance IDs.
- Traceability_Rule_6: Source-control baseline and ignore-file readiness map to 13_Technology_Specification.md, release evidence, or governance exceptions.
- Traceability_Rule_7: Post-release feedback and continuous-improvement actions must map to requirements, quality, release, backlog, defect, or governance IDs.
