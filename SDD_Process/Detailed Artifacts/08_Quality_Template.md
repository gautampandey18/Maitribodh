# Quality Template

## Metadata
Instruction: Reference implementation and requirements sources.

- Project_Name: {{Project_Name}}
- Code_And_Test_Document: {{Code_And_Test_Document_Name}}
- Requirements_Source: {{REQUIREMENTS_FOLDER_PATH_or_01_Requirement_Specification.md}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Validate implementation outcomes against defined requirements.

- Quality_Objective: {{Quality_Objective}}
- Source_Artifacts: {{01_Requirement_Specification_07_Code_And_Test_05_Guidelines_13_Technology_Specification_or_Not_Applicable}}
- Quality_Gate_Scope: {{Artifact_Only_PreImplementation_PostImplementation_Release_Readiness}}

## Requirement Traceability Matrix
Instruction: Link requirements to implementation and tests.

| Requirement_ID | Implemented_By_Module_IDs | Validated_By_Test_Case_IDs | Validation_Status | Evidence_Link |
|---|---|---|---|---|
| {{FR_or_NFR_ID}} | {{Module_ID_List}} | {{TC_ID_List}} | {{Pass_Fail_Partial}} | {{Evidence_Reference}} |

## Test Coverage Validation
Instruction: Summarize coverage across requirement categories.

| Coverage_Area | Total_Requirements | Covered_Requirements | Coverage_Percentage | Gap_Summary |
|---|---|---|---|---|
| {{Coverage_Area}} | {{Total}} | {{Covered}} | {{Percent}} | {{Gaps}} |

## NFR and Standards Validation
Instruction: Validate non-functional requirements and standards from Guidelines and Technology Specification.

| Validation_ID | Area | Target_or_Standard | Evidence | Status | Related_NFR_or_Guideline_IDs |
|---|---|---|---|---|---|
| VAL-001 | {{Security_Performance_Accessibility_Resilience_Observability_Maintainability}} | {{Target_or_Standard}} | {{Evidence_Reference}} | {{Pass_Fail_Partial_NA}} | {{NFR_GUIDE_ID_List}} |

## Measurable NFR Acceptance Matrix
Instruction: Convert each NFR into measurable validation criteria with owner, frequency, evidence, and pass/fail threshold.

| NFR_ID | Quality_Attribute | Metric | Target | Threshold_or_Tolerance | Validation_Method | Evidence_Required | Frequency | Owner | Acceptance_Status |
|---|---|---|---|---|---|---|---|---|---|
| NFR-001 | {{Performance_Security_Accessibility_Availability_Resilience_Observability_Maintainability}} | {{Metric_Name}} | {{Target_Value}} | {{Threshold}} | {{Review_Test_Scan_Monitoring_Audit_Other}} | {{Evidence}} | {{Per_Build_Per_Release_Per_Sprint_On_Demand}} | {{Owner}} | {{Pass_Fail_Partial_NA}} |

## Defect Tracking Format
Instruction: Track quality issues and resolution state.

| Defect_ID | Related_Requirement_ID | Severity | Status | Root_Cause | Resolution | Owner |
|---|---|---|---|---|---|---|
| BUG-001 | {{FR_or_NFR_ID}} | {{Critical_High_Medium_Low}} | {{Open_InProgress_Closed}} | {{Root_Cause}} | {{Resolution}} | {{Owner}} |

## Quality Risks and Waivers
Instruction: Capture risks, waivers, and conditional approvals before release.

| Quality_Risk_ID | Risk_or_Waiver | Impact | Mitigation | Owner | Approval_Status | Related_IDs |
|---|---|---|---|---|---|---|
| QR-001 | {{Risk_or_Waiver}} | {{Impact}} | {{Mitigation}} | {{Owner}} | {{Proposed_Approved_Rejected}} | {{FR_NFR_BUG_ID_List}} |

## Quality Gate Decision
Instruction: Record release recommendation based on evidence.

- Gate_Result: {{Pass_Conditional_Fail}}
- Decision_Rationale: {{Decision_Rationale}}
- Required_Followups: {{Followup_Actions}}
- Release_Impact: {{Release_Impact}}

## Review Evidence Checklist
Instruction: Confirm required evidence exists before declaring a quality gate result.

| Evidence_ID | Evidence_Type | Source | Required_For | Status | Gap_or_Action |
|---|---|---|---|---|---|
| QE-001 | {{Test_Result_Review_Log_Scan_Report_Accessibility_Check_Performance_Result}} | {{Source_Reference}} | {{Gate_or_NFR_ID}} | {{Available_Missing_NA}} | {{Gap_or_Action}} |

## Defect Severity and Triage Policy
Instruction: Define how defects are classified, escalated, and accepted or rejected.

| Severity | Definition | Response_Target | Release_Blocking | Approval_Needed_For_Waiver |
|---|---|---|---|---|
| {{Critical_High_Medium_Low}} | {{Definition}} | {{Response_Target}} | {{Yes_No_Conditional}} | {{Approver_or_Not_Applicable}} |

## Traceability Instructions
Instruction: Quality evidence must resolve back to requirements.

- Traceability_Rule_1: Every quality row references requirement IDs.
- Traceability_Rule_2: Uncovered requirements must be listed as explicit gaps.
- Traceability_Rule_3: NFR validations and waivers must map to NFR, guideline, defect, or governance IDs.
- Traceability_Rule_4: Evidence and triage policy must map to quality gate, release, or governance IDs.
- Traceability_Rule_5: Every measurable NFR acceptance row must map to an NFR ID, validation method, owner, and evidence source.
