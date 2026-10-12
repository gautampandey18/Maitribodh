# Legacy Reverse Engineering Change Tracker

## Summary
This tracker records updates made to close legacy reverse-engineering gaps in the ADLC SSoT process.

| Change_ID | Area | Files_or_Folders | Change_Summary | Purpose |
|---|---|---|---|---|
| LEG-001 | Input Artifacts | `Input Artifacts/Codebase References/` | Added codebase reference folder structure with source snapshot, dependency reports, API inventory, runtime logs, build config, deployment config, and test reports. | Provide SSoT intake for legacy codebase evidence. |
| LEG-002 | Source Manifest | `Input Artifacts/Codebase References/00_Codebase_Source_Manifest.md` | Added manifest for approved/draft/reference-only codebase sources. | Prevent uncontrolled use of legacy code evidence. |
| LEG-003 | Template | `20_Codebase_Inventory_Template.md` | Added current-state codebase inventory template. | Capture source structure, dependencies, interfaces, runtime behavior, configs, tests, and gaps. |
| LEG-004 | Template | `21_Legacy_Reverse_Engineering_Template.md` | Added legacy reverse-engineering template. | Reconstruct as-is capabilities, workflows, business rules, architecture observations, and constraints. |
| LEG-005 | Template | `22_Technical_Debt_Assessment_Template.md` | Added technical debt assessment template. | Assess debt, dependency risk, security exposure, test gaps, operations risk, and modernization candidates. |
| LEG-006 | Template | `23_AsIs_To_Target_Mapping_Template.md` | Added as-is to target mapping template. | Bridge legacy evidence to approved requirements, solution, backlog, release, and governance decisions. |
| LEG-007 | Variables | `ADLC_Variables.md` | Added `CODEBASE_REFERENCE_FOLDER_PATH` and `CODEBASE_REFERENCE_MANIFEST_PATH`. | Standardize runtime prompt variables for legacy evidence. |
| LEG-008 | Master Rules | `ADLC_MasterPrompt.md` | Added legacy source handling, artifact ownership, deliverables, execution order, and folder structure. | Make legacy reverse engineering first-class in the ADLC chain. |
| LEG-009 | Sequential Playbook | `STEP_BY_STEP_PROMPTS.md` | Added Step 20-23 prompts and wired legacy inputs into Step 1, Step 3, Step 4, Step 8, Step 9, Step 10, Step 15, Step 16, and Step 17. | Ensure agents can generate, use, validate, and hand off legacy artifacts safely. |
| LEG-010 | Multi-Agent ADLC | `MULTI_AGENT_ADLC_PLAYBOOK.md` | Added codebase inventory, reverse-engineering, technical debt, and as-is/target mapping agents, ownership, waves, and optional artifact rules. | Enable controlled parallel legacy artifact generation. |
| LEG-011 | App Build Playbook | `MULTI_AGENT_APP_BUILD_PLAYBOOK.md` | Added legacy modernization entry check, rule, agent, workstream, and wave alignment. | Prevent coding agents from implementing unapproved observed legacy behavior. |
| LEG-012 | Validation | `16_Validation_Summary_Template.md` | Added codebase source consumption and Step 20-23 validation checks. | Ensure legacy artifacts are present, validated, or explicitly not applicable. |
| LEG-013 | Build Prompt | `15_Build_Prompt_Template.md` | Expanded artifact baseline and added legacy modernization scope section. | Ensure implementation prompts include only approved legacy retained/changed/remediated behavior. |
| LEG-014 | User Guide | `ADLC_SSoT_UserGuide.md`, `ADLC_SSoT_UserGuide.docx` | Added legacy reverse-engineering route, templates, agents, and usage guidance. | Keep user/leadership documentation aligned. |

## Legacy Execution Path
Recommended legacy reverse-engineering order:

1. Step 18 -> Project intake when classification or artifact depth must be confirmed.
2. Step 20 -> Codebase inventory when source evidence exists.
3. Step 21 -> Legacy reverse engineering when as-is behavior must be reconstructed.
4. Step 1 -> Requirement specification using approved legacy evidence only.
5. Step 2/3/13 -> Flows, solution, and technology specification.
6. Step 22 -> Technical debt assessment.
7. Step 23 -> As-is to target mapping.
8. Step 4 onward -> Backlog, plan, code/test, quality, release, governance, build prompt, validation, and regression suite.

## Guardrails
- Codebase evidence describes current behavior; it is not automatically approved future scope.
- Observed legacy behavior must be routed through requirements, solution, backlog, release, or governance before implementation.
- Technical debt remediation must be approved before it becomes delivery scope.
- Regression coverage should protect approved retained behavior and high-risk modernization areas.

