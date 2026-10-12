# Technical Debt Assessment Template

## Metadata
Instruction: Use this optional legacy template to assess technical debt, dependency risk, security exposure, test gaps, maintainability, and modernization priority.

- Project_Name: {{Project_Name}}
- Codebase_Inventory_Document: {{20_Codebase_Inventory_Document_Name}}
- Legacy_Reverse_Engineering_Document: {{21_Legacy_Reverse_Engineering_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}
- Assessment_Owner: {{Owner}}

## Purpose
Instruction: Convert observed legacy weaknesses into prioritized, evidence-based modernization and remediation candidates.

- Assessment_Objective: {{Objective}}
- Assessment_Scope: {{Dependencies_Security_CodeQuality_Testing_Operations_Data_Architecture}}
- Risk_Model: {{Risk_Model_or_Scoring_Method}}

## Debt and Risk Register
Instruction: List technical debt items with impact, evidence, severity, and remediation priority.

| Debt_ID | Debt_Category | Description | Evidence | Impact | Severity | Likelihood | Priority | Owner | Related_Codebase_IDs |
|---|---|---|---|---|---|---|---|---|---|
| TDA-001 | {{Dependency_Security_Maintainability_Performance_Testing_Operations_Data_Architecture}} | {{Description}} | {{Evidence}} | {{Impact}} | {{Critical_High_Medium_Low}} | {{High_Medium_Low}} | {{P0_P1_P2_P3}} | {{Owner}} | {{CBI_LRE_ID_List}} |

## Dependency and Lifecycle Risk
Instruction: Capture outdated, unsupported, vulnerable, unused, or unapproved dependencies and platform risks.

| Dependency_Risk_ID | Technology_or_Package | Observed_Version | Risk_Type | Evidence | Remediation_Option | Target_Artifact_Route |
|---|---|---|---|---|---|---|
| TDA-DEP-001 | {{Technology_or_Package}} | {{Version}} | {{Security_EOL_Unused_License_Unknown}} | {{Evidence}} | {{Remediation_Option}} | {{13_Technology_Specification_04_Backlog_10_Governance}} |

## Test, Quality, and Observability Gaps
Instruction: Identify gaps that increase change risk or support risk.

| Gap_ID | Area | Gap | Impact | Recommended_Control | Related_NFR_or_Module | Target_Artifact_Route |
|---|---|---|---|---|---|---|
| TDA-GAP-001 | {{Testing_Observability_Quality_Security_Performance}} | {{Gap}} | {{Impact}} | {{Control}} | {{NFR_or_Module}} | {{07_CodeAndTest_08_Quality_17_Regression_03_Solution}} |

## Modernization Candidates
Instruction: Convert technical debt into candidate remediation backlog items without changing scope unless approved.

| Candidate_ID | Candidate | Rationale | Expected_Benefit | Risk_Reduction | Suggested_Priority | Related_Debt_IDs | Governance_Needed |
|---|---|---|---|---|---|---|---|
| MOD-001 | {{Candidate}} | {{Rationale}} | {{Benefit}} | {{Risk_Reduction}} | {{P0_P1_P2_P3}} | {{Debt_ID_List}} | {{Yes_No}} |

## Traceability Instructions
Instruction: Technical debt must be evidence-based and routed to backlog, solution, quality, release, or governance before action.

- Traceability_Rule_1: Every debt item must map to codebase evidence, reverse-engineered behavior, source report, or SME-confirmed finding.
- Traceability_Rule_2: Remediation candidates must map to 04_Backlog.md only when approved for delivery scope or marked deferred.
- Traceability_Rule_3: Security, compliance, release, and high-risk exceptions must map to 10_Governance.md.

