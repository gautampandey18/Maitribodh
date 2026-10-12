# Multi-Agent App Build Playbook

## Purpose
Instruction: Use this playbook after ADLC artifacts are generated and accepted, especially after `15_Build_Prompt.md` is available.

- Default_Process: Use one coding agent for small applications or prototypes.
- Optional_Process: Use this multi-agent build playbook for medium or large applications where frontend, backend, database, QA, release, and governance work can proceed in controlled parallel.
- Primary_Build_Source: `{{WORKING_FOLDER_PATH}}/Generated Artifacts/15_Build_Prompt.md`
- Supporting_Sources: Accepted ADLC artifacts in `{{WORKING_FOLDER_PATH}}/Generated Artifacts`
- Build_Output_Target: Project source folder selected by the Orchestrator.

## Entry Criteria
Instruction: Do not begin multi-agent app creation until these conditions are met.

| Entry_Check | Required_State |
|---|---|
| `15_Build_Prompt.md` | Generated and accepted, unless Orchestrator explicitly approves building from accepted upstream artifacts |
| `13_Technology_Specification.md` | Generated and accepted when concrete stack, versions, file layout, or tooling are needed |
| `07_Code-And-Test.md` | Generated and accepted for module/test/fixture guidance |
| `08_Quality.md` | Generated and accepted for quality gates and NFR validation |
| `17_Regression_Test_Suite.md` | Generated and accepted when regression execution is in scope |
| `09_Release.md` | Generated and accepted when deployment or release readiness is in scope |
| `10_Governance.md` | Generated and accepted for decisions, exceptions, and approvals |
| Version control decision | Existing repository or new repository initialization approach is identified by the Orchestrator |
| Open blockers | Resolved, deferred, or approved by Orchestrator |

## Non-Negotiable Rules
Instruction: These rules protect the application build from scope drift, broken integration, and agent conflicts.

1. `15_Build_Prompt.md` is the primary implementation instruction.
2. No agent may add scope, routes, screens, APIs, dependencies, data entities, jobs, deployment behavior, or business rules not present in accepted ADLC artifacts.
3. Every agent must read this playbook, `15_Build_Prompt.md`, and the relevant supporting artifacts before editing code.
4. Every agent must have a bounded ownership area before starting work.
5. Agents must not overwrite or revert another agent's work.
6. Shared files require Orchestrator approval before editing.
7. Dependency or stack changes require Orchestrator approval and must be traceable to `13_Technology_Specification.md` or `10_Governance.md`.
8. Security, privacy, accessibility, resilience, observability, and maintainability rules from `05_Guidelines.md` must be followed.
9. Tests must map to `07_Code-And-Test.md` and `08_Quality.md`.
10. Build/release changes must map to `09_Release.md`.
11. Exceptions must be recorded in `10_Governance.md` or reported back to the Orchestrator for governance update.
12. Agents must stop and report blockers rather than silently inventing behavior.
13. Repository initialization, ignore-file setup, and source-control hygiene must follow `13_Technology_Specification.md`, `09_Release.md`, and Orchestrator direction.
14. No agent may commit or include secrets, credentials, tokens, local environment files, dependency folders, build outputs, logs, caches, coverage reports, temporary files, or machine-specific files.

## Agent Roles
Instruction: Assign only the roles needed for the project. One person or AI agent may hold multiple roles, but each workstream still needs explicit ownership.

| Role | Primary Responsibility | Typical Ownership |
|---|---|---|
| Build Orchestrator | Coordinates agents, owns sequencing, resolves conflicts, approves shared-file edits, accepts integration | Whole build |
| Implementation Planner | Converts `15_Build_Prompt.md` into an implementation task plan and ownership map | Build task plan |
| Scaffold Agent | Creates project structure, dependency baseline, configuration shell, routing/app shell, and initial build wiring | Root project structure, config, app shell |
| Frontend Agent | Builds screens, layouts, components, client-side behavior, and UI accessibility | UI source folders, component folders, client tests |
| Design System Agent | Implements reusable tokens, style utilities, theme rules, and shared UI primitives | Design tokens, shared components, styles |
| Backend/API Agent | Builds API endpoints, services, auth enforcement, validation, and integrations | API routes, service layer, auth middleware |
| Database Agent | Builds schema, migrations, seed data, data access patterns, and data integrity checks | Migrations, schema, seed/fixtures |
| Integration Agent | Wires frontend/backend/database flows, background jobs, external services, and cross-module contracts | Integration modules, jobs, wiring tests |
| QA/Test Agent | Builds and runs tests, validates quality gates, records gaps and defects | Test suites, fixtures, test reports |
| Security/Compliance Agent | Reviews auth, authorization, data protection, secrets, privacy, and compliance rules | Security review notes, security tests |
| Release/Build Agent | Validates build commands, packaging, environment configuration, deployment readiness, and rollback notes | Build/deploy config, release checks |
| Governance/Audit Agent | Confirms traceability, exceptions, risks, and acceptance evidence | Audit notes, governance update requests |

## Agent Creation Prompt Pattern
Instruction: Use this prompt pattern when creating each build agent.

```text
You are the {{AGENT_ROLE}} for this multi-agent app build.

Read first:
1) Supporting Material/ADLC_Artifacts/MULTI_AGENT_APP_BUILD_PLAYBOOK.md
2) Supporting Material/Generated Artifacts/15_Build_Prompt.md
3) Supporting Material/Generated Artifacts/{{RELEVANT_SUPPORTING_ARTIFACTS}}

Your ownership area:
- {{OWNED_FILES_OR_MODULES}}

Rules:
- Do not edit outside your ownership area without Orchestrator approval.
- Do not add dependencies, routes, screens, APIs, schema, business rules, or deployment behavior not traceable to accepted ADLC artifacts.
- Do not commit or include secrets, local environment files, dependencies, build outputs, logs, caches, coverage reports, temporary files, or machine-specific files.
- Do not revert or overwrite other agents' work.
- If blocked, report the blocker, impacted artifact IDs, and recommended resolution.
- Implement changes directly in your assigned files.
- Return changed file paths, validation performed, unresolved risks, and downstream notes.
```

## Work Ownership Matrix
Instruction: The Orchestrator must complete this before agents start coding.

| Workstream | Owner Agent | Owned Files/Folders | Shared Files | Required Inputs | Acceptance Gate |
|---|---|---|---|---|---|
| Scaffold | Scaffold Agent | {{Root_Config_AppShell_Paths}} | {{Shared_Files}} | `13_Technology_Specification.md`, `15_Build_Prompt.md` | App starts/builds at baseline |
| Version Control / Repository Hygiene | Scaffold Agent with Release/Build approval | {{Repository_Config_Ignore_File_Paths}} | {{Dependency_Config_Environment_Files}} | `13_Technology_Specification.md`, `09_Release.md`, `15_Build_Prompt.md` | Repository initialized or confirmed, ignore file present, prohibited files excluded |
| Frontend Screens | Frontend Agent | {{Screen_Component_Paths}} | {{Shared_Files}} | `11_UI.md`, `14_Design_System.md`, `15_Build_Prompt.md` | Screens match accepted UI evidence and accessibility rules |
| Design System | Design System Agent | {{Token_Style_Shared_Component_Paths}} | {{Shared_Files}} | `14_Design_System.md`, `05_Guidelines.md` | Tokens/components reusable and not duplicated |
| Backend/API | Backend/API Agent | {{API_Service_Auth_Paths}} | {{Shared_Files}} | `03_Solution.md`, `13_Technology_Specification.md`, `15_Build_Prompt.md` | APIs/auth/contracts match accepted specs |
| Database | Database Agent | {{Schema_Migration_Seed_Paths}} | {{Shared_Files}} | `12_Database.md`, `13_Technology_Specification.md` | Schema/migrations trace to accepted data model |
| Integration | Integration Agent | {{Integration_Job_Wiring_Paths}} | {{Shared_Files}} | `02_Flows.md`, `03_Solution.md`, `13_Technology_Specification.md` | End-to-end flows and jobs wired |
| QA/Test | QA/Test Agent | {{Test_Fixture_Paths}} | {{Shared_Files}} | `07_Code-And-Test.md`, `08_Quality.md`, optional `17_Regression_Test_Suite.md` | Tests pass or defects are documented |
| Release/Build | Release/Build Agent | {{Build_Deploy_Config_Paths}} | {{Shared_Files}} | `09_Release.md`, `13_Technology_Specification.md` | Build/release checks pass |
| Governance/Audit | Governance/Audit Agent | {{Audit_Report_Paths}} | {{Shared_Files}} | `10_Governance.md`, `16_Validation_Summary.md` | Traceability and exceptions reviewed |

## Execution Waves
Instruction: Parallelize only within a wave after required upstream build outputs are stable.

| Wave | Workstreams | Parallelism | Orchestrator Gate |
|---|---|---|---|
| 0 | Build planning and ownership map | None | Task plan approved, ownership boundaries set |
| 1 | Scaffold and baseline configuration | None | Project builds/starts with baseline structure |
| 2 | Design system, database foundation, backend contracts | Parallel with clear ownership | Shared contracts and schema baseline accepted |
| 3 | Frontend screens, backend/API implementation, integrations/jobs | Parallel after Wave 2 baseline | Feature slices compile and contract checks pass |
| 4 | Cross-module wiring and end-to-end flow integration | Limited parallelism | Main workflows execute against integrated stack |
| 5 | QA, security, accessibility, performance/resilience checks | Parallel where tooling allows | Quality gates pass or defects are triaged |
| 6 | Build/release readiness and governance/audit review | Sequential preferred | Release readiness and audit evidence accepted |

## Task Delegation Rules
Instruction: Delegation must be small enough to avoid collisions and large enough to deliver a coherent slice.

- Assign tasks by bounded files, modules, routes, screens, schemas, or test suites.
- Prefer vertical feature slices only when ownership boundaries are clear.
- Do not assign two agents to the same file unless one is reviewer-only.
- Keep shared constants, contracts, types, schemas, configuration, and design tokens under Orchestrator control.
- Require every agent to list changed files and validation commands in the handoff.
- Run integration checks after each wave, not only at the end.

## Shared File Policy
Instruction: Shared files are high-conflict and must be controlled.

| Shared_File_Type | Edit Rule |
|---|---|
| Dependency manifests | Orchestrator approval required |
| Version-control config and ignore files | Scaffold owner plus Release/Build and Orchestrator approval required |
| App entrypoint/root routing | Scaffold or Orchestrator approval required |
| Shared contracts/types | Contract owner approval required |
| Database schema/migrations | Database owner approval required |
| Design tokens/theme files | Design System owner approval required |
| Environment/config files | Release/Build owner and Orchestrator approval required |
| CI/CD or deployment files | Release/Build owner approval required |
| Security/auth configuration | Security/Compliance and Backend owner approval required |

## Conflict and Merge Protocol
Instruction: Use this protocol when code, tests, or interpretation conflicts appear.

1. Stop the affected workstream.
2. Identify changed files, impacted artifacts, and conflicting instructions.
3. Orchestrator identifies the owning agent and source artifact.
4. Owning agent proposes a fix or requests artifact clarification.
5. If source artifacts are insufficient, Orchestrator routes update back to ADLC artifacts or governance.
6. Apply the smallest safe code change.
7. Re-run impacted tests/build checks.
8. Record unresolved risk or accepted exception.

## Validation Strategy
Instruction: Start with narrow checks and expand as confidence grows.

| Validation_Level | Owner | When |
|---|---|---|
| Local unit/component checks | Owning implementation agent | Before handoff |
| Contract/API/schema checks | Backend/API, Database, Integration agents | After Wave 2 and Wave 3 |
| UI accessibility and visual consistency checks | Frontend and Design System agents | After UI screens are implemented |
| Integration/e2e checks | Integration and QA agents | After Wave 4 |
| Build/lint/type checks | Release/Build and QA agents | End of each major wave when feasible |
| Release readiness checks | Release/Build Agent | Wave 6 |
| Governance/audit checks | Governance/Audit Agent | Wave 6 |

## Agent Handoff Format
Instruction: Every agent must use this format when finishing a task or reporting a blocker.

```text
Agent:
Task:
Status: Completed | Blocked | Partial | Needs Review
Files Changed:
Artifacts Referenced:
Validation Run:
Validation Result:
Risks or Open Questions:
Shared Files Touched:
Downstream Notes:
```

## Done Criteria
Instruction: The build is not complete until all criteria are met or explicitly waived.

- Required screens, APIs, jobs, data flows, and modules from `15_Build_Prompt.md` are implemented.
- Repository is initialized or confirmed as existing, the stack-appropriate ignore file is present, and prohibited local/secret/generated files are excluded.
- Tests required by `07_Code-And-Test.md` and `08_Quality.md` pass or defects are documented.
- Security/privacy/accessibility/performance/resilience expectations are validated or waived.
- Build and release checks from `09_Release.md` pass or blockers are documented.
- No unapproved dependencies, scope, routes, screens, schemas, or deployment behavior were introduced.
- Governance exceptions are documented and approved when applicable.
- Final handoff includes changed files, validation results, known limitations, and next actions.
