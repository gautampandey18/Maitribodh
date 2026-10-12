# Governance Template

## Metadata
Instruction: Reference all lifecycle artifacts.

- Project_Name: {{Project_Name}}
- Input_Artifacts: {{All_Artifact_List}}
- Version: {{Document_Version}}
- Date: {{Date}}

## Purpose
Instruction: Maintain decision logs, change control, risk visibility, and compliance evidence.

- Governance_Objective: {{Governance_Objective}}
- Governed_Artifacts: {{01_to_16_Artifact_List}}
- Governance_Model: {{Review_Cadence_Approval_Model}}

## Artifact Baseline and Ownership
Instruction: Record authoritative artifact versions, owners, review status, and downstream impact.

| Artifact_ID | Artifact_Name | Version | Owner | Status | Last_Reviewed | Downstream_Artifacts |
|---|---|---|---|---|---|---|
| ART-001 | {{Artifact_Name}} | {{Version}} | {{Owner}} | {{Draft_Approved_Superseded}} | {{YYYY-MM-DD}} | {{Artifact_ID_List}} |

## Decision Log
Instruction: Record major project decisions and rationale.

| Decision_ID | Date | Decision | Context | Alternatives | Owner | Approval | Impacted_Artifact_IDs |
|---|---|---|---|---|---|---|---|
| DEC-001 | {{YYYY-MM-DD}} | {{Decision_Text}} | {{Context}} | {{Alternatives}} | {{Owner}} | {{Approver}} | {{Artifact_ID_List}} |

## Change Log
Instruction: Track artifact and scope changes over time.

| Change_ID | Date | Changed_Item | Change_Type | Reason | Impact | Affected_Artifacts | Approved_By |
|---|---|---|---|---|---|---|---|
| CHG-001 | {{YYYY-MM-DD}} | {{Artifact_or_Scope_Item}} | {{Add_Modify_Remove}} | {{Reason}} | {{Impact}} | {{Artifact_ID_List}} | {{Approver}} |

## Exception and Deviation Log
Instruction: Track approved deviations from guidelines, quality gates, release criteria, or source precedence.

| Exception_ID | Area | Deviation | Rationale | Owner | Approver | Mitigation | Review_Date | Related_IDs |
|---|---|---|---|---|---|---|---|---|
| EXC-001 | {{Area}} | {{Deviation}} | {{Rationale}} | {{Owner}} | {{Approver}} | {{Mitigation}} | {{YYYY-MM-DD}} | {{Related_ID_List}} |

## Risk Register
Instruction: Keep active risks and treatment plans current.

| Risk_ID | Risk | Likelihood | Impact | Mitigation | Contingency | Owner | Status |
|---|---|---|---|---|---|---|---|
| RSK-001 | {{Risk_Description}} | {{Low_Medium_High}} | {{Low_Medium_High}} | {{Mitigation}} | {{Contingency}} | {{Owner}} | {{Open_Closed}} |

## Compliance Checklist
Instruction: Track required policy and regulatory conformance.

| Compliance_ID | Requirement | Evidence | Status | Owner | Review_Date |
|---|---|---|---|---|---|
| CMP-001 | {{Compliance_Requirement}} | {{Evidence_Ref}} | {{Compliant_NonCompliant_Partial}} | {{Owner}} | {{YYYY-MM-DD}} |

## Approval Matrix
Instruction: Define required approvals for scope, architecture, security, quality, release, and exceptions.

| Approval_Area | Required_Approver | Applies_To | Evidence_Required | Escalation_Path |
|---|---|---|---|---|
| {{Scope_Architecture_Security_Quality_Release_Exception}} | {{Approver}} | {{Artifact_or_Decision_Type}} | {{Evidence_Required}} | {{Escalation_Path}} |

## Artifact Signoff Checkpoints
Instruction: Capture formal stakeholder signoff before implementation handoff, release readiness, or governance closure.

| Signoff_ID | Artifact_or_Gate | Required_Role | Approver | Decision | Conditions | Evidence | Date |
|---|---|---|---|---|---|---|---|
| SIGN-001 | {{Artifact_or_Gate}} | {{BA_ProductOwner_Architect_QA_Security_PM_ReleaseOwner}} | {{Approver}} | {{Approved_Conditional_Rejected_Pending}} | {{Conditions_or_None}} | {{Evidence_Reference}} | {{YYYY-MM-DD}} |

## Audit Evidence Index
Instruction: List evidence that proves decisions, reviews, approvals, and exceptions were handled.

| Evidence_ID | Evidence_Type | Related_IDs | Location_or_Reference | Owner | Retention_Notes |
|---|---|---|---|---|---|
| GOV-EV-001 | {{Review_Approval_Decision_Test_Result_External_Source}} | {{Related_ID_List}} | {{Location_or_Reference}} | {{Owner}} | {{Retention_Notes}} |

## Security Oversight
Instruction: Document security control ownership and monitoring.

- RBAC_Governance: {{RBAC_Governance}}
- WAF_Firewall_Oversight: {{WAF_Firewall_Oversight}}
- Security_Review_Frequency: {{Security_Review_Frequency}}
- Incident_Response_Plan: {{Incident_Response_Plan}}

## Governance Cadence
Instruction: Define review rhythm and escalation path.

- Review_Frequency: {{Weekly_Monthly_Quarterly}}
- Participants: {{Participant_List}}
- Escalation_Path: {{Escalation_Path}}
- Decision_SLA: {{Decision_SLA}}

## Traceability Instructions
Instruction: Governance must connect decisions, changes, risks, and compliance to artifact IDs.

- Traceability_Rule_1: Decision and change entries reference impacted artifact IDs.
- Traceability_Rule_2: Compliance entries reference source requirements or constraints.
- Traceability_Rule_3: Open risks must link to impacted plan or release items.
- Traceability_Rule_4: Exceptions and deviations must map to source, guideline, quality, release, or governance IDs.
- Traceability_Rule_5: Artifact baselines, approvals, and audit evidence must map to governed artifact, decision, change, risk, or compliance IDs.
- Traceability_Rule_6: Formal signoff checkpoints must map to artifact baselines, release gates, quality gates, or implementation handoff decisions.
