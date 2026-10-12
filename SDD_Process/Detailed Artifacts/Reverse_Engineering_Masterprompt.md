# Reverse Engineering Master Prompt

Use this file as the dedicated master prompt for legacy application reverse engineering, modernization, migration, or rebuild initiatives. This prompt works with `ADLC_MasterPrompt.md`, `STEP_BY_STEP_PROMPTS.md`, and the legacy templates `20` through `23`.

## Purpose
Guide an AI agent or multi-agent team to extract current-state knowledge from an existing codebase, convert it into ADLC SSoT artifacts, validate gaps, and prepare a controlled modernization or migration handoff.

This prompt must be used when:
- A customer provides an existing codebase.
- Existing behavior must be understood before modernization.
- Current code, APIs, database, jobs, configs, tests, or deployment behavior must be reverse engineered.
- A new modernized application will be built using a provided target technology specification.

## Non-Negotiable Rule
Do not generate artifacts immediately. First request and confirm the required user inputs listed in this prompt. Begin artifact generation only after the user confirms the inputs are available, not applicable, or intentionally deferred.

## Governing Sources
Instruction: Apply these sources in priority order.

1. `ADLC_MasterPrompt.md`
2. `Reverse_Engineering_Masterprompt.md`
3. `STEP_BY_STEP_PROMPTS.md`
4. Applicable numbered templates
5. Approved input artifacts and manifests
6. User-approved clarifications

If this prompt conflicts with `ADLC_MasterPrompt.md`, follow `ADLC_MasterPrompt.md` and record the conflict in `10_Governance.md`.

## Required User Inputs Before Artifact Generation
Instruction: Ask the user for these details before running any artifact-generation step. If the user does not have an item, ask them to confirm `Not Available`, `Not Applicable`, or `Deferred`.

| Input_ID | Question | Expected_User_Input | Why It Is Needed |
|---|---|---|---|
| REQ-IN-001 | What is the project objective? | Reverse engineering only, modernization, migration, rebuild, support stabilization, or assessment. | Determines artifact depth and target-state scope. |
| REQ-IN-002 | Where is the existing codebase located? | Path to source snapshot or repository copy. | Required for `20_Codebase_Inventory.md`. |
| REQ-IN-003 | Is the codebase complete and buildable? | Complete, partial, unknown, or not buildable. | Determines evidence confidence and gaps. |
| REQ-IN-004 | What technology stack is currently used? | Known current stack or `Extract from codebase`. | Helps inventory and dependency discovery. |
| REQ-IN-005 | What is the target technology specification? | Path/document/name of approved target technology spec, or `Not provided yet`. | Required for modernization/migration planning and `13_Technology_Specification.md`. |
| REQ-IN-006 | Are requirement documents available? | Folder/file path or `Not available`. | Helps separate intended business scope from observed legacy behavior. |
| REQ-IN-007 | Are UI screenshots/design references available? | Folder/file path or `Not applicable`. | Determines whether `11_UI.md` and `14_Design_System.md` are needed. |
| REQ-IN-008 | Are database schema/DDL/ERD/data dictionary files available? | Folder/file path or `Extract from codebase`. | Determines whether `12_Database.md` is needed. |
| REQ-IN-009 | Are API specs or integration documents available? | Folder/file path or `Extract from codebase`. | Helps reconstruct integrations and contracts. |
| REQ-IN-010 | Are dependency reports available? | Folder/file path or `Extract from package/build files`. | Supports dependency risk and technical debt assessment. |
| REQ-IN-011 | Are runtime logs, scheduler/job details, or production notes available? | Folder/file path or `Not available`. | Helps reconstruct runtime behavior and jobs. |
| REQ-IN-012 | Are build/deployment configs available? | Folder/file path or `Extract from codebase`. | Helps identify environments, build process, and release constraints. |
| REQ-IN-013 | Are existing tests or test reports available? | Folder/file path or `Extract from codebase`. | Helps test inventory and regression planning. |
| REQ-IN-014 | Should all legacy behavior be retained? | Retain all, retain selected, modernize selected, retire selected, unknown. | Prevents blindly rebuilding obsolete behavior. |
| REQ-IN-015 | Who can answer business/SME questions? | SME names/roles or `Unknown`. | Needed for open questions and validation. |
| REQ-IN-016 | What artifact depth is expected? | Full, focused, or lightweight. | Controls whether full ADLC chain is generated. |
| REQ-IN-017 | Is backlog export needed? | Azure Boards, Jira, other, or not applicable. | Determines whether Step 19 is needed. |
| REQ-IN-018 | Should multi-agent execution be used? | Sequential or multi-agent. | Determines whether to use `MULTI_AGENT_ADLC_PLAYBOOK.md`. |

## Required Input Placement
Instruction: Ask the user to place source evidence in the following folders before generation whenever possible.

| Evidence_Type | Folder |
|---|---|
| Existing codebase | `Input Artifacts/Codebase References/Source Snapshot/` |
| Dependency reports | `Input Artifacts/Codebase References/Dependency Reports/` |
| API inventory/specs from codebase | `Input Artifacts/Codebase References/API Inventory/` |
| Runtime logs/jobs evidence | `Input Artifacts/Codebase References/Runtime Logs/` |
| Build configs | `Input Artifacts/Codebase References/Build Config/` |
| Deployment configs | `Input Artifacts/Codebase References/Deployment Config/` |
| Existing tests/reports | `Input Artifacts/Codebase References/Test Reports/` |
| Requirements documents | `Input Artifacts/Requirements/` |
| UI references | `Input Artifacts/UI References/` |
| Database references | `Input Artifacts/Database References/` |
| Technical references | `Input Artifacts/Technical References/` |
| Notes/clarifications | `Input Artifacts/Notes/` |

After files are placed, update the relevant manifest, especially:
- `Input Artifacts/Codebase References/00_Codebase_Source_Manifest.md`
- `Input Artifacts/Requirements/00_Source_Manifest.md`
- `Input Artifacts/Technical References/00_Technical_Source_Manifest.md`

## Mandatory Reverse Engineering Execution Steps
Instruction: For a full legacy modernization or migration, run the following steps in order. Optional steps may be marked `Not Applicable` only with rationale.

| Order | Step | Artifact | Mandatory_For_Legacy | Purpose |
|---|---|---|---|---|
| 1 | Step 18 | `18_Project_Intake.md` | Yes | Confirm project type, artifact depth, source readiness, approval path, and applicability of Steps 20-23. |
| 2 | Step 20 | `20_Codebase_Inventory.md` | Yes | Inventory code structure, dependencies, APIs, jobs, configs, tests, and evidence gaps. |
| 3 | Step 21 | `21_Legacy_Reverse_Engineering.md` | Yes | Reconstruct as-is capabilities, workflows, rules, components, integrations, constraints, and open questions. |
| 4 | Step 1 | `01_Requirement_Specification.md` | Yes | Convert approved legacy/current/future needs into requirements, NFRs, constraints, assumptions, and risks. |
| 5 | Step 11 | `11_UI.md` | Conditional | Extract UI screens, controls, layout, states, and behaviors when UI evidence or UI code exists. |
| 6 | Step 12 | `12_Database.md` | Conditional | Extract database/schema/entity/migration details when DB evidence or persistence code exists. |
| 7 | Step 2 | `02_Flows.md` | Yes | Capture current and target workflows, data movement, exceptions, and handoffs. |
| 8 | Step 3 | `03_Solution.md` | Yes | Define target logical architecture and migration/modernization implications. |
| 9 | Step 13 | `13_Technology_Specification.md` | Yes | Capture approved target stack, versions, project structure, config, repository hygiene, and tooling. |
| 10 | Step 22 | `22_Technical_Debt_Assessment.md` | Yes | Assess dependency risk, maintainability, test gaps, security exposure, and modernization candidates. |
| 11 | Step 23 | `23_AsIs_To_Target_Mapping.md` | Yes | Map legacy as-is behavior to retain, modify, replace, retire, defer, or open decisions. |
| 12 | Step 14 | `14_Design_System.md` | Conditional | Define reusable design tokens and component presentation rules for UI modernization. |
| 13 | Step 4 | `04_Backlog.md` | Yes | Convert approved modernization/migration scope into epics, features, stories, tasks, and deferred items. |
| 14 | Step 5 | `05_Guidelines.md` | Yes | Define engineering, maintainability, security, performance, accessibility, and repository standards. |
| 15 | Step 6 | `06_Plan.md` | Yes | Define phased migration/modernization plan, dependencies, estimates, capacity, risks, and gates. |
| 16 | Step 7 | `07_Code-And-Test.md` | Yes | Define implementation modules, contracts, test strategy, fixtures, and validation paths. |
| 17 | Step 8 | `08_Quality.md` | Yes | Validate coverage, measurable NFRs, debt risks, quality gates, defects, and evidence. |
| 18 | Step 9 | `09_Release.md` | Yes | Define migration/release readiness, rollback, source baseline, post-release validation, and feedback. |
| 19 | Step 10 | `10_Governance.md` | Yes | Record modernization decisions, exceptions, approvals, risks, signoffs, and change-control impact. |
| 20 | Step 15 | `15_Build_Prompt.md` | Yes if build is planned | Consolidate only approved target-state scope for implementation. |
| 21 | Step 16 | `16_Validation_Summary.md` | Yes | Validate source consumption, traceability, artifact completeness, and unresolved gaps. |
| 22 | Step 17 | `17_Regression_Test_Suite.md` | Strongly recommended | Protect retained behavior, migration compatibility, high-risk debt remediation, and critical workflows. |
| 23 | Step 19 | `19_Backlog_Export.md` | Conditional | Prepare Azure Boards/Jira/board import mapping when needed. |

## Reverse Engineering Guardrails
- Codebase behavior describes what exists today; it is not automatically approved future scope.
- Do not rebuild obsolete behavior unless it is explicitly retained through `23_AsIs_To_Target_Mapping.md`, `01_Requirement_Specification.md`, `04_Backlog.md`, or `10_Governance.md`.
- Do not treat package versions, architecture patterns, APIs, database structures, or job schedules as approved target-state design until they are reviewed and routed to the correct artifact.
- Dependency risks and technical debt must be captured in `22_Technical_Debt_Assessment.md` before becoming backlog items.
- Migration, compatibility, retirement, or replacement decisions must be captured in `23_AsIs_To_Target_Mapping.md`, `09_Release.md`, or `10_Governance.md`.
- Build agents must use `15_Build_Prompt.md` as the implementation source and must not implement raw legacy observations unless approved.

## Required Clarification Behavior
If any of these are unknown, stop and ask before downstream generation:
- Whether the target system should retain, modify, or retire a major legacy capability.
- Whether a discovered behavior is a valid business rule or an accidental implementation detail.
- Whether sensitive data, secrets, regulated data, or customer data appears in code/config/logs.
- Whether the provided target technology specification is approved or only a recommendation.
- Whether migration compatibility is required for existing users, data, integrations, jobs, or reports.

Store approved answers in:
- `Input Artifacts/Notes/Clarifications.md`

Then update:
- owning artifact first
- impacted downstream artifacts next
- `10_Governance.md`
- `16_Validation_Summary.md`

## Agent Startup Instruction
When this prompt is used, the agent must begin with this message pattern:

```text
Before I generate reverse-engineering artifacts, please confirm the required reverse-engineering inputs:
1. Existing codebase path
2. Project objective
3. Target technology specification
4. Whether requirements/UI/database/API/dependency/runtime/build/test evidence is available
5. Whether all legacy behavior should be retained, selectively retained, modernized, retired, or decided later
6. Artifact depth: Full, Focused, or Lightweight
7. Execution mode: Sequential or Multi-Agent
```

If the user has already provided these inputs, summarize the interpreted answers and ask for confirmation before generation.

## Output Discipline
- Generate only one artifact at a time unless the user explicitly requests multi-agent execution.
- Save each generated artifact in `Generated Artifacts/` using the numbered output filename.
- Preserve IDs and traceability.
- Mark gaps as `[OPEN QUESTION]`, `[RISK]`, `[RECOMMENDATION]`, or `Not Applicable`.
- Never overwrite accepted downstream artifacts without impact analysis.

