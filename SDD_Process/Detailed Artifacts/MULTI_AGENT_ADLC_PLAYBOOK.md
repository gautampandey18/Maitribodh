# Multi-Agent ADLC Artifact Generation Playbook

## Purpose
Instruction: Use this playbook only when project size, source volume, timeline pressure, or specialist review needs justify multi-agent artifact generation.

- Default_Process: Use `STEP_BY_STEP_PROMPTS.md` sequentially for small or medium projects.
- Optional_Process: Use this multi-agent playbook for larger projects where parallel specialist work is useful.
- Governing_Source: `ADLC_MasterPrompt.md` remains the highest-priority instruction source for every agent.
- Output_Folder: `{{WORKING_FOLDER_PATH}}/Generated Artifacts`

## When to Use Multi-Agent Generation
Instruction: Choose multi-agent execution only when the coordination benefit outweighs governance overhead.

| Use_Case | Recommended_Process | Reason |
|---|---|---|
| One or two requirement files, limited UI/database evidence | Sequential | Lower coordination overhead and fewer consistency risks |
| Many requirement files, screenshots, schema references, and technical docs | Multi-agent | Parallel source analysis can save time |
| Tight timeline with specialist reviewers available | Multi-agent | Specialists can generate or review bounded artifacts in waves |
| High compliance, audit, or architecture complexity | Multi-agent with strict orchestrator control | Independent validation improves coverage |
| Greenfield enterprise intake, stakeholder signoff, or backlog export needed | Sequential or multi-agent with intake gate | Step 18 clarifies artifact depth and Step 19 prepares board import readiness |

## Non-Negotiable Rules
Instruction: These rules protect the ADLC chain from broken dependencies, drift, and conflicting outputs.

1. One Orchestrator owns sequencing, artifact acceptance, conflict routing, and final chain integrity.
2. Each artifact has exactly one writing owner at a time.
3. No downstream artifact may start until its required upstream artifacts are accepted by the Orchestrator.
4. Every agent must read `ADLC_MasterPrompt.md`, `STEP_BY_STEP_PROMPTS.md`, the relevant template, and required upstream artifacts before generating output.
5. Agents must not invent requirements, technologies, UI details, database entities, flows, quality targets, or implementation details.
6. Missing source support must be marked as `Not specified`, `[OPEN QUESTION]`, `[RECOMMENDATION]`, or `[RISK]`.
7. Conflicts must be reported to the Orchestrator; agents must not silently resolve conflicts.
8. Rework must happen upstream first, then affected downstream artifacts must be regenerated or explicitly confirmed unchanged.
9. Optional artifacts must be marked `Not Applicable` by the Orchestrator when skipped.
10. `15_Build_Prompt.md` must not be generated until all required upstream artifacts are accepted.

## Agent Roles
Instruction: Assign roles based on artifact ownership. One person or AI agent may hold multiple roles, but each artifact still needs one accountable owner.

| Role | Primary Responsibility | Typical Artifacts |
|---|---|---|
| Orchestrator / ADLC Lead | Controls execution waves, accepts artifacts, routes conflicts, maintains SSoT | All artifacts |
| Intake Lead | Classifies project type, source readiness, artifact depth, approval path, tool targets, and execution mode | `18_Project_Intake.md` |
| Requirements Analyst | Converts source requirements into structured requirements, assumptions, constraints, and open questions | `01_Requirement_Specification.md` |
| UI Analyst | Extracts screen/control/layout evidence from UI references and embedded requirement visuals | `11_UI.md` |
| Database Analyst | Extracts schema, entity, relationship, security, migration, and data reference evidence | `12_Database.md` |
| Flow Analyst | Defines personas, workflows, steps, decisions, exceptions, and data movement | `02_Flows.md` |
| Solution Architect | Defines logical architecture, components, integrations, data architecture, and architecture decisions | `03_Solution.md` |
| Technology Specification Agent | Defines concrete stack, project structure, configuration, deployment, and tooling details | `13_Technology_Specification.md` |
| Design System Agent | Normalizes UI evidence into reusable visual tokens and component presentation rules | `14_Design_System.md` |
| Backlog Planner | Decomposes approved scope into epics, features, stories, tasks, and deferred items | `04_Backlog.md` |
| Backlog Export Agent | Maps accepted backlog hierarchy into optional Azure Boards/Jira/board import guidance | `19_Backlog_Export.md` |
| Guidelines Agent | Defines stack-neutral engineering, security, maintainability, quality, and review standards | `05_Guidelines.md` |
| Delivery Planner | Defines phases, dependencies, milestones, handoffs, and change-control checkpoints | `06_Plan.md` |
| Code/Test Planner | Defines implementation units, contracts, module structure, test strategy, fixtures, and quality gates | `07_Code-And-Test.md` |
| QA Agent | Validates requirement/test/NFR coverage, defects, evidence, risks, and quality gate outcome | `08_Quality.md` |
| Release Agent | Defines release scope, readiness, communication, rollback, environment, and approval records | `09_Release.md` |
| Governance Agent | Maintains decisions, changes, exceptions, risks, compliance, approvals, and audit evidence | `10_Governance.md` |
| Build Prompt Agent | Consolidates accepted artifacts into final implementation prompt | `15_Build_Prompt.md` |
| Validation Agent | Validates the complete artifact chain and source folder consumption | `16_Validation_Summary.md` |
| Regression Test Agent | Generates manual and automation-ready regression suite from accepted ADLC artifacts | `17_Regression_Test_Suite.md` |

## Artifact Ownership Matrix
Instruction: Use this matrix to assign writing ownership and required inputs before each wave starts.

| Artifact | Owner Agent | Required Inputs | Acceptance Gate |
|---|---|---|---|
| `18_Project_Intake.md` | Intake Lead | Source folders, manifests, kickoff notes, `18_Project_Intake_Template.md` | Project type, artifact depth, source readiness, approval path, and execution mode are explicit |
| `01_Requirement_Specification.md` | Requirements Analyst | Requirements folder, notes, technical references when relevant, `01_Requirement_Specification_Template.md` | FR/NFR/CON/ASM IDs are stable, source inventory complete, open questions captured |
| `11_UI.md` | UI Analyst | `01_Requirement_Specification.md`, UI references, embedded requirement visuals, `11_UI_Template.md` | UI sources inventoried, controls/screens trace to FR/NFR/source IDs |
| `12_Database.md` | Database Analyst | `01_Requirement_Specification.md`, database references, `12_Database_Template.md` | Entities/schema evidence traces to FR/NFR/source IDs |
| `02_Flows.md` | Flow Analyst | `01_Requirement_Specification.md`, optional `11_UI.md`, optional `12_Database.md`, `02_Flows_Template.md` | Workflows, steps, data flows, exceptions trace to upstream IDs |
| `03_Solution.md` | Solution Architect | `01_Requirement_Specification.md`, `02_Flows.md`, optional `11_UI.md`, optional `12_Database.md`, technical references, `03_Solution_Template.md` | Components, integrations, data/security architecture, and decisions trace upstream |
| `13_Technology_Specification.md` | Technology Specification Agent | `01_Requirement_Specification.md`, `02_Flows.md`, `03_Solution.md`, optional technical references, `13_Technology_Specification_Template.md` | Stack and file layout choices are mandated, justified, or marked `[RECOMMENDATION]` |
| `14_Design_System.md` | Design System Agent | `01_Requirement_Specification.md`, `11_UI.md`, optional `13_Technology_Specification.md`, UI references, `14_Design_System_Template.md` | Tokens and component patterns trace to UI/source/NFR IDs |
| `04_Backlog.md` | Backlog Planner | `01_Requirement_Specification.md`, `02_Flows.md`, `03_Solution.md`, `04_Backlog_Template.md` | Epics/features/stories/tasks trace to approved scope |
| `19_Backlog_Export.md` | Backlog Export Agent | `04_Backlog.md`, optional `18_Project_Intake.md`, optional `06_Plan.md`, optional `16_Validation_Summary.md`, `19_Backlog_Export_Template.md` | Export mapping preserves hierarchy, fields, status, dependencies, and traceability |
| `05_Guidelines.md` | Guidelines Agent | `01_Requirement_Specification.md`, `02_Flows.md`, `03_Solution.md`, `04_Backlog.md`, optional `13_Technology_Specification.md`, optional `14_Design_System.md`, `05_Guidelines_Template.md` | Standards are technology-agnostic unless justified and traceable |
| `06_Plan.md` | Delivery Planner | `04_Backlog.md`, `05_Guidelines.md`, `06_Plan_Template.md` | Phases, dependencies, risks, and checkpoints trace to backlog/guidelines |
| `07_Code-And-Test.md` | Code/Test Planner | `01_Requirement_Specification.md` through `06_Plan.md`, optional `13_Technology_Specification.md`, optional `14_Design_System.md`, `07_Code-And-Test_Template.md` | Modules, contracts, tests, fixtures, gates trace to requirements/backlog |
| `08_Quality.md` | QA Agent | `01_Requirement_Specification.md`, `05_Guidelines.md`, `07_Code-And-Test.md`, optional `13_Technology_Specification.md`, `08_Quality_Template.md` | Coverage, NFR validation, defects, and quality gate are evidence-based |
| `09_Release.md` | Release Agent | Accepted artifacts through `08_Quality.md`, optional `13_Technology_Specification.md`, `09_Release_Template.md` | Release readiness maps to quality, risks, known issues, approvals |
| `10_Governance.md` | Governance Agent | All accepted artifacts through `09_Release.md`, `10_Governance_Template.md` | Decisions, changes, exceptions, risks, compliance, and approvals are recorded |
| `15_Build_Prompt.md` | Build Prompt Agent | Accepted artifacts through `10_Governance.md`, optional `13_Technology_Specification.md`, optional `14_Design_System.md`, `15_Build_Prompt_Template.md` | Implementation prompt includes only accepted, traceable content |
| `16_Validation_Summary.md` | Validation Agent | All generated artifacts and source manifests, `16_Validation_Summary_Template.md` | Chain passes or conditional/fail gaps are explicit |
| `17_Regression_Test_Suite.md` | Regression Test Agent | `01_Requirement_Specification.md`, `02_Flows.md`, `04_Backlog.md`, `07_Code-And-Test.md`, `08_Quality.md`, optional `11_UI.md`, optional `12_Database.md`, optional `13_Technology_Specification.md`, optional `16_Validation_Summary.md`, `17_Regression_Test_Suite_Template.md` | Test cases are traceable, executable manually, and automation-ready where applicable |

## Dependency Waves
Instruction: Agents may work in parallel only inside a wave when all required upstream inputs are accepted.

| Wave | Artifacts | Parallelism | Orchestrator Gate |
|---|---|---|---|
| 0 | Optional `18_Project_Intake.md` | None | Accept project classification, artifact depth, approval path, and execution mode |
| 1 | `01_Requirement_Specification.md` | None | Accept requirements baseline |
| 2 | `11_UI.md`, `12_Database.md` | Parallel when both source types exist | Accept optional extraction artifacts or mark `Not Applicable` |
| 3 | `02_Flows.md` | None | Accept behavior/data-flow baseline |
| 4 | `03_Solution.md` | None | Accept architecture baseline |
| 5 | `13_Technology_Specification.md`, `14_Design_System.md` | Conditional parallel; `14_Design_System.md` may reference accepted `13_Technology_Specification.md` when needed | Accept implementation/detail alignment |
| 6 | `04_Backlog.md`, optional early `19_Backlog_Export.md`, `05_Guidelines.md` | Conditional parallel after backlog is accepted | Accept scope decomposition, optional board export mapping, and standards |
| 7 | `06_Plan.md`, `07_Code-And-Test.md` | Sequential preferred; `07_Code-And-Test.md` depends on accepted plan when sequencing matters | Accept delivery and implementation/test plan |
| 8 | `08_Quality.md`, `09_Release.md`, `10_Governance.md` | Sequential preferred for release/governance accuracy | Accept quality, release, and governance baseline |
| 9 | `15_Build_Prompt.md`, `16_Validation_Summary.md`, optional `17_Regression_Test_Suite.md`, optional final `19_Backlog_Export.md` | Sequential; validation after build prompt when generated; regression/export after validation when needed | Accept final handoff, validation, regression test suite, and export readiness |

## Agent Startup Checklist
Instruction: Every agent must complete this checklist before writing or rewriting an artifact.

- Read `ADLC_MasterPrompt.md`.
- Read this playbook if multi-agent execution is active.
- Read the exact step prompt in `STEP_BY_STEP_PROMPTS.md`.
- Read the matching numbered template.
- Read all required upstream generated artifacts.
- Read relevant source manifests and input folders.
- Confirm artifact ownership with the Orchestrator.
- Confirm whether optional inputs are applicable or marked `Not Applicable`.
- Identify conflicts, gaps, and ambiguous source evidence before generation.

## Orchestrator Acceptance Checklist
Instruction: The Orchestrator must approve each artifact before downstream work begins.

| Check | Required Outcome |
|---|---|
| Template conformance | Artifact follows matching template sections or marks sections `Not Applicable` |
| Source traceability | Major claims map to source files, manifests, or upstream artifact IDs |
| ID stability | Existing IDs are preserved; new IDs use the artifact namespace |
| Artifact ownership | Content belongs in the artifact or references the owning artifact |
| No unsupported invention | Unsupported content is removed or marked `[RECOMMENDATION]`, `[OPEN QUESTION]`, or `[RISK]` |
| Conflict handling | Conflicts are routed upstream or recorded in governance |
| Downstream readiness | Required inputs for the next wave are accepted |

## Conflict and Rework Protocol
Instruction: Use this protocol whenever agents disagree or a downstream artifact exposes an upstream gap.

1. Stop affected downstream generation.
2. Record the conflict with source references, impacted artifacts, severity, and proposed options.
3. Orchestrator identifies the owning artifact.
4. Owning agent updates the upstream artifact or marks the issue as `[OPEN QUESTION]`, `[RISK]`, or `[RECOMMENDATION]`.
5. Governance Agent records major decisions, exceptions, or deviations in `10_Governance.md` when applicable.
6. Orchestrator identifies downstream artifacts requiring regeneration or confirmation.
7. Downstream agents regenerate only affected artifacts.

## Optional Artifact Handling
Instruction: Optional artifacts must be explicit to avoid silent gaps.

- Generate `11_UI.md` when UI reference files or embedded requirement visuals exist.
- Generate `12_Database.md` when database/schema/data-sync references exist.
- Generate `14_Design_System.md` when UI/design inputs exist or reusable visual standards are needed.
- Generate `15_Build_Prompt.md` when an implementation agent will build from the ADLC chain.
- Generate `17_Regression_Test_Suite.md` when a formal manual or automation-ready regression suite is needed.
- Generate `18_Project_Intake.md` before Step 1 when greenfield enterprise intake, artifact-depth selection, stakeholder signoff, or tool/export expectations must be captured.
- Generate `19_Backlog_Export.md` when Azure Boards, Jira, or another board import package is needed.
- If skipped, the Orchestrator records `Not Applicable` and rationale in the next applicable artifact and validation summary.

## Communication Contract
Instruction: Each agent handoff must be short, structured, and traceable.

```text
Artifact:
Owner Agent:
Inputs Used:
Output Path:
Status: Draft | Accepted | Blocked | Not Applicable
New IDs Created:
Open Questions:
Risks or Conflicts:
Downstream Notes:
```

## Build Phase Handoff
Instruction: Multi-agent artifact generation ends before application code work begins.

- Application build agents must use `15_Build_Prompt.md` as the primary implementation instruction.
- `MULTI_AGENT_APP_BUILD_PLAYBOOK.md` is an optional reference for a separate application-build phase; do not start app creation automatically after artifact generation.
- Build agents may reference source ADLC artifacts only to resolve traceability or clarify accepted content.
- Build agents must not add scope, dependencies, screens, APIs, data entities, or deployment behavior not present in `15_Build_Prompt.md` or accepted upstream artifacts.
- QA, release, and governance agents should validate implementation against `07_Code-And-Test.md`, `08_Quality.md`, `09_Release.md`, `10_Governance.md`, and `16_Validation_Summary.md`.
