# ADLC SSoT User Guide

## Document Control

| Field | Value |
|---|---|
| Document Name | ADLC_SSoT_UserGuide |
| Audience | Business Analysts, Developers, Architects, QA Leads, Project Managers, Delivery Leadership |
| Purpose | Explain the SSoT-based ADLC process, artifact chain, template library, multi-agent execution model, and app-build readiness approach |
| Scope | Requirements intake, artifact generation, validation, implementation handoff, testing, governance, and release readiness |
| Status | Ready for leadership review |

## 1. Introduction

### What Is the ADLC SSoT Process?

The ADLC SSoT process is a structured Application Development Life Cycle approach that uses a single-source-of-truth discipline to convert requirement inputs into complete, traceable, implementation-ready delivery artifacts. Instead of relying on fragmented documents, informal notes, and manual interpretation, the process organizes requirement evidence into controlled input folders, generates standardized artifacts through reusable templates, validates consistency across the artifact chain, and then produces an implementation prompt that can be used by a coding agent or a multi-agent build team.

The process is technology-agnostic by design. Business rules, workflows, UI evidence, database details, integrations, quality expectations, release controls, and governance decisions are captured in the right artifact before any implementation begins. Concrete technology choices are introduced only when source material or approved technical decisions justify them.

### Why We Built It

Manual application building is often slow and inconsistent because requirement documents, screenshots, database notes, architecture decisions, testing expectations, and release rules are scattered across many places. This creates repeated interpretation effort, inconsistent assumptions, weak traceability, and late discovery of gaps.

The ADLC SSoT process solves these problems by creating a repeatable generation chain:

- Requirements are collected once and used consistently across all artifacts.
- Each artifact has a clear ownership boundary.
- Open questions and conflicts are captured early.
- Downstream artifacts are regenerated only when upstream facts change.
- Implementation teams receive a consolidated, traceable build prompt.
- QA, release, and governance controls are built into the process instead of added late.

### Key Benefits

| Benefit | Description |
|---|---|
| Speed | Reduces repeated manual analysis by using reusable templates and controlled prompt execution. |
| Quality | Ensures every artifact captures required sections, acceptance criteria, risks, validation rules, and review evidence. |
| Traceability | Links requirements to flows, backlog, solution design, UI, database, test cases, quality gates, release controls, and implementation instructions. |
| Scalability | Supports small projects through sequential prompts and larger projects through controlled multi-agent artifact generation and app creation. |
| Governance | Captures decisions, exceptions, approvals, risks, and downstream impact in a durable governance artifact. |
| Maintainability | Encourages modular design, separation of concerns, reusable components, version control, and repository hygiene. |

## 2. Process Overview

### High-Level Flow

```text
Input Artifacts
   |
   v
Requirement Discovery
   |
   v
Artifact Generation
   |
   v
Validation, Gap Fixing, and Clarifications
   |
   v
Build Prompt Creation
   |
   v
Code Generation and Integration
   |
   v
Testing and Regression Validation
   |
   v
Release and Deployment Readiness
```

### Step 1: Requirement Discovery

Requirement discovery begins from `Supporting Material/Input Artifacts/`. The process supports requirement documents, screenshots, wireframes, Figma exports, database references, technical notes, API specifications, architecture inputs, and general clarification notes.

Recommended input folders include:

| Folder | Purpose |
|---|---|
| `Input Artifacts/Requirements/` | Primary and supporting requirement documents. |
| `Input Artifacts/UI References/` | Screenshots, wireframes, Figma exports, and UI/design notes. |
| `Input Artifacts/Database References/` | Schema, ERD, DDL, data dictionary, migration, and data-sync references. |
| `Input Artifacts/Technical References/` | API specs, architecture notes, and integration references. |
| `Input Artifacts/Notes/` | General notes, assumptions, and approved clarifications. |

Each source folder should have a manifest file that lists source status, priority, handling notes, and whether the source is approved, draft, supporting, or reference-only.

### Step 2: Artifact Generation

Artifact generation can be executed in two ways:

| Execution Mode | Best For | Control Model |
|---|---|---|
| Sequential Process | Small to medium projects, first-time runs, controlled baselining | Use `STEP_BY_STEP_PROMPTS.md` in dependency order. |
| Multi-Agent Artifact Process | Larger projects with parallelizable UI, database, technical, QA, and governance analysis | Use `MULTI_AGENT_ADLC_PLAYBOOK.md` with explicit ownership and dependency gates. |

The sequential process is the default because it is deterministic and easier to audit. The multi-agent process is optional and should be used when project size or complexity justifies controlled parallel execution.

For enterprise greenfield projects, an optional intake step can be run before requirement generation. `18_Project_Intake.md` confirms project type, artifact depth, source readiness, stakeholder signoff path, execution mode, and optional backlog/tool export expectations before the ADLC chain starts.

### Step 3: Validation and Gap Fixing

Validation ensures that generated artifacts remain complete, consistent, and traceable. If open questions appear, the answers should be added to `Input Artifacts/Notes/Clarifications.md` and approved in the notes manifest. The owning upstream artifact is updated first, followed by impacted downstream artifacts.

### Step 4: Code Generation and Integration

After the ADLC artifacts are accepted, `15_Build_Prompt.md` consolidates approved implementation instructions into one deterministic handoff for an AI coding agent or development team. This build prompt must not introduce new scope, dependencies, routes, schemas, screens, or business rules beyond the accepted artifact baseline.

### Step 5: Testing

Testing is covered through `07_Code-And-Test.md`, `08_Quality.md`, and optional `17_Regression_Test_Suite.md`. These artifacts define test strategy, coverage expectations, quality gates, manual test readiness, and automation readiness.

### Step 6: Deployment Ready

Release readiness is captured in `09_Release.md`, including environment readiness, deployment checklist, rollback strategy, source-control baseline, known issues, approval status, and release evidence.

## 3. Template Library

The ADLC template library is stored under `Supporting Material/ADLC_Artifacts/`. Templates define what must be captured in generated artifacts. Generated artifacts are stored under `Supporting Material/Generated Artifacts/`.

### Core Artifact Templates

| Step | Template | Output | Purpose |
|---|---|---|---|
| 1 | `01_Requirement_Specification_Template.md` | `01_Requirement_Specification.md` | Captures business requirements, scope, assumptions, constraints, NFRs, risks, and open questions. |
| 2 | `02_Flows_Template.md` | `02_Flows.md` | Captures user flows, system flows, decisions, exceptions, and data movement. |
| 3 | `03_Solution_Template.md` | `03_Solution.md` | Defines logical architecture, component boundaries, integration approach, and solution decisions. |
| 4 | `04_Backlog_Template.md` | `04_Backlog.md` | Converts requirements into epics, features, stories, tasks, dependencies, and acceptance criteria. |
| 5 | `05_Guidelines_Template.md` | `05_Guidelines.md` | Defines technology-agnostic engineering guidelines, separation of concerns, naming, security, performance, accessibility, and review criteria. |
| 6 | `06_Plan_Template.md` | `06_Plan.md` | Defines delivery plan, sequencing, milestones, dependencies, and execution risks. |
| 7 | `07_Code-And-Test_Template.md` | `07_Code-And-Test.md` | Defines module implementation expectations, test strategy, fixtures, and code/test organization. |
| 8 | `08_Quality_Template.md` | `08_Quality.md` | Defines quality gates, NFR validation, review evidence, and acceptance thresholds. |
| 9 | `09_Release_Template.md` | `09_Release.md` | Defines release notes, readiness checks, versioning, rollback, approvals, and source-control baseline. |
| 10 | `10_Governance_Template.md` | `10_Governance.md` | Records decisions, exceptions, approvals, risks, deviations, and change-control impact. |

### Specialized Extraction and Implementation Templates

| Step | Template | Output | Purpose |
|---|---|---|---|
| 11 | `11_UI_Template.md` | `11_UI.md` | Extracts screen inventory, UI controls, layouts, behaviors, states, and visual evidence from screenshots, Figma exports, wireframes, and embedded requirement-document images. |
| 12 | `12_Database_Template.md` | `12_Database.md` | Captures entities, relationships, schema details, constraints, migrations, data lineage, and database reference evidence. |
| 13 | `13_Technology_Specification_Template.md` | `13_Technology_Specification.md` | Defines concrete stack, versions, project structure, configuration, integrations, tooling, version control, and repository hygiene. |
| 14 | `14_Design_System_Template.md` | `14_Design_System.md` | Defines reusable design tokens, typography, spacing, component styling, responsive behavior, and visual consistency standards. |
| 15 | `15_Build_Prompt_Template.md` | `15_Build_Prompt.md` | Consolidates approved artifact decisions into one implementation prompt for app creation. |
| 16 | `16_Validation_Summary_Template.md` | `16_Validation_Summary.md` | Validates source consumption, artifact completeness, traceability, unresolved gaps, and regeneration impact. |
| 17 | `17_Regression_Test_Suite_Template.md` | `17_Regression_Test_Suite.md` | Produces manual and automation-ready regression scenarios with metadata, steps, expected results, evidence fields, and traceability. |
| 18 | `18_Project_Intake_Template.md` | `18_Project_Intake.md` | Optional greenfield enterprise intake artifact for project classification, artifact depth, stakeholder approval path, source readiness, tool targets, and execution mode. |
| 19 | `19_Backlog_Export_Template.md` | `19_Backlog_Export.md` | Optional backlog export artifact for Azure Boards, Jira, or other board import mapping while preserving hierarchy and traceability. |

### Supporting Prompt and Playbook Files

| File | Purpose |
|---|---|
| `ADLC_MasterPrompt.md` | Canonical instruction source for SSoT rules, artifact boundaries, conflict handling, external artifact handling, change control, and constructive friction. |
| `ADLC_Variables.md` | Centralizes path variables, source folders, manifest paths, and reusable execution placeholders. |
| `STEP_BY_STEP_PROMPTS.md` | Sequential prompt playbook for generating each artifact in controlled order. |
| `MULTI_AGENT_ADLC_PLAYBOOK.md` | Optional playbook for multi-agent artifact generation with roles, dependencies, gates, and handoff rules. |
| `MULTI_AGENT_APP_BUILD_PLAYBOOK.md` | Optional playbook for controlled multi-agent application creation after artifacts are accepted. |

### Requested Template Categories Mapped to the ADLC Library

| Requested Category | ADLC Template or Artifact |
|---|---|
| Requirements Template | `01_Requirement_Specification_Template.md` |
| Database Schema Template | `12_Database_Template.md` |
| API/Integration Template | `03_Solution_Template.md`, `13_Technology_Specification_Template.md`, and `15_Build_Prompt_Template.md` |
| UI/Frontend Component Template | `11_UI_Template.md`, `14_Design_System_Template.md`, and `07_Code-And-Test_Template.md` |
| Regression Test Suite Template | `17_Regression_Test_Suite_Template.md` |
| Architecture Decision Record | `10_Governance_Template.md` decision records and `03_Solution_Template.md` architecture decisions |
| Traceability Matrix | Traceability sections across every artifact, consolidated and verified in `16_Validation_Summary_Template.md` |
| Project Intake | `18_Project_Intake_Template.md` |
| Backlog Export / Board Import | `19_Backlog_Export_Template.md` |

## 4. Multi-Agent Architecture

### Multi-Agent Artifact Generation

For large or complex projects, artifact generation can be split across specialized agents while preserving strict SSoT control. `MULTI_AGENT_ADLC_PLAYBOOK.md` defines how agents collaborate without breaking the artifact chain.

Typical artifact-generation agents include:

| Agent | Responsibility |
|---|---|
| Orchestrator Agent | Owns sequence, dependencies, source precedence, conflict handling, and acceptance gates. |
| Intake Lead | Classifies greenfield project type, artifact depth, source readiness, stakeholder approvals, and execution mode. |
| Requirement Analyst Agent | Extracts requirements, assumptions, constraints, risks, and open questions. |
| UI Extraction Agent | Extracts screen inventory and UI evidence from screenshots, wireframes, Figma exports, and embedded requirement visuals. |
| Database Analysis Agent | Extracts entities, relationships, schema evidence, constraints, and migration inputs. |
| Solution Architect Agent | Produces architecture, components, integration patterns, and technology decision inputs. |
| QA/Validation Agent | Validates completeness, traceability, NFR coverage, and unresolved gaps. |
| Governance Agent | Captures decisions, exceptions, approvals, and change-control impact. |
| Backlog Export Agent | Converts approved backlog hierarchy into optional Azure Boards/Jira/board import guidance. |

The orchestrator prevents agents from inventing facts, overwriting ownership areas, or generating downstream artifacts before upstream dependencies are stable.

### Multi-Agent App Creation

After `15_Build_Prompt.md` is accepted, application creation can be performed by one coding agent or by a controlled multi-agent build team using `MULTI_AGENT_APP_BUILD_PLAYBOOK.md`.

Typical app-build agents include:

| Agent | Responsibility |
|---|---|
| Build Orchestrator | Coordinates implementation waves, resolves conflicts, owns shared files, and accepts integration. |
| Scaffold Agent | Creates project structure, repository baseline, configuration shell, routing/app shell, and version-control hygiene. |
| Frontend Agent | Implements screens, layouts, UI behavior, accessibility, and component composition. |
| Design System Agent | Implements reusable tokens, shared components, styles, and theming rules. |
| Backend/API Agent | Implements endpoints, services, validation, authorization, and integration contracts. |
| Database Agent | Implements schema, migrations, seed data, fixtures, and data access patterns. |
| Integration Agent | Wires end-to-end flows, jobs, external systems, and cross-module contracts. |
| QA/Test Agent | Builds and runs tests, validates regression coverage, and records defects. |
| Security/Compliance Agent | Reviews security, privacy, secrets, authorization, and compliance rules. |
| Release/Build Agent | Validates build commands, packaging, environment configuration, release checks, and rollback readiness. |
| Governance/Audit Agent | Confirms traceability, exceptions, risks, and acceptance evidence. |

This model allows parallel execution while protecting shared files, source-control hygiene, and architectural consistency.

## 5. Standards and Best Practices Implemented

### Version Control Strategy

The process now explicitly requires version-control guidance during implementation planning. `13_Technology_Specification.md` defines whether to initialize a new repository or use an existing one. `15_Build_Prompt.md` passes repository instructions to the implementation agent. `09_Release.md` validates source-control baseline, branch or tag reference, ignore-file status, and prohibited file exclusions.

The generated app should include an ignore file appropriate to the selected stack. The ignore file must exclude secrets, local environment values, dependency folders, build outputs, logs, caches, coverage reports, temporary files, and machine-specific files.

### Greenfield Enterprise Readiness

For greenfield projects, the process includes optional enterprise-readiness controls:

- `18_Project_Intake.md` confirms project classification, source readiness, artifact depth, stakeholder signoff path, execution mode, and tool/export expectations before artifact generation.
- `06_Plan.md` captures estimation, capacity assumptions, confidence, and delivery forecasts.
- `08_Quality.md` converts NFRs into measurable validation criteria with target, threshold, method, owner, evidence, frequency, and acceptance status.
- `10_Governance.md` captures formal artifact signoff checkpoints for business, product, architecture, QA, security, PM, and release roles.
- `19_Backlog_Export.md` prepares Azure Boards/Jira/board import mapping without requiring live tool integration.
- `09_Release.md` captures post-release validation, monitoring outcomes, user feedback, and continuous-improvement actions.

### Traceability Maintenance

Traceability is maintained across the full chain:

```text
Requirement ID
   -> Flow / UI / Database / Solution ID
   -> Backlog Item
   -> Code and Test Guidance
   -> Quality Gate
   -> Release Evidence
   -> Build Prompt Instruction
   -> Regression Test Case
```

Every major artifact includes traceability instructions. `16_Validation_Summary.md` confirms whether source folders, manifests, clarifications, requirements, and downstream artifacts were consumed correctly.

### Gap Identification and Correction

When an artifact identifies an open question, conflict, missing source, or unresolved risk, the process avoids guessing. Approved answers are captured in `Input Artifacts/Notes/Clarifications.md`, recorded in the notes manifest, and applied first to the owning upstream artifact. Impacted downstream artifacts are then regenerated or revised.

### Quality and Hygiene Checks

The process includes:

- SSoT source discipline.
- Artifact ownership boundaries.
- Non-hallucination rules.
- Conflict handling.
- Change-control rules.
- Security and privacy controls.
- Accessibility and usability expectations.
- Performance, resilience, and observability guidance.
- Regression test readiness.
- Release readiness and rollback checks.
- Repository hygiene and ignore-file expectations.

## 6. How to Use This Process

### For Business Analysts

1. Place primary and supporting requirement documents in `Input Artifacts/Requirements/`.
2. Update `00_Source_Manifest.md` with document priority, status, and handling notes.
3. For greenfield enterprise projects, review or generate `18_Project_Intake.md` before Step 1.
4. Add general business notes to `Input Artifacts/Notes/`.
5. Add answers to generated open questions in `Input Artifacts/Notes/Clarifications.md`.
6. Review `01_Requirement_Specification.md`, `02_Flows.md`, `04_Backlog.md`, and `16_Validation_Summary.md` for business completeness.

### For Developers

1. Use `13_Technology_Specification.md` for stack, versions, project layout, configuration, tooling, and source-control expectations.
2. Use `07_Code-And-Test.md` for module/test organization and test fixture guidance.
3. Use `11_UI.md` and `14_Design_System.md` for UI structure, component reuse, and design consistency.
4. Use `12_Database.md` for schema and migration implementation.
5. Use `15_Build_Prompt.md` as the final implementation instruction source.
6. Do not add unapproved dependencies, routes, schemas, screens, or business rules.

### For Architects

1. Validate `03_Solution.md` for architecture, component boundaries, integration patterns, and security architecture.
2. Confirm concrete technology decisions in `13_Technology_Specification.md` are justified by requirements, technical references, or approved recommendations.
3. Ensure UI, database, integration, testing, and release artifacts do not duplicate or contradict architectural boundaries.
4. Review `10_Governance.md` for decisions, exceptions, approvals, and impact analysis.

### For Project Managers

1. Use `04_Backlog.md` for epics, features, stories, tasks, dependencies, and acceptance criteria.
2. Use `19_Backlog_Export.md` when Azure Boards, Jira, or another board import package is needed.
3. Use `06_Plan.md` for sequencing, milestones, dependency management, capacity assumptions, estimates, and delivery forecasting.
4. Use `08_Quality.md` and `09_Release.md` to track quality, release readiness, post-release feedback, and continuous-improvement actions.
5. Use `16_Validation_Summary.md` to confirm artifact completeness and unresolved gaps.
6. Use governance records to track approvals, risks, deviations, and decision history.

## 7. Comparison: Manual vs. ADLC Process

| Area | Manual App Building | ADLC SSoT Process |
|---|---|---|
| Requirement Interpretation | Repeated by each role, often inconsistently | Centralized in requirement specification and validated through traceability |
| UI Understanding | Screenshots and notes may be interpreted late | UI evidence is extracted into `11_UI.md` and normalized in `14_Design_System.md` |
| Database Understanding | Schema details may be discovered during build | Database evidence is captured in `12_Database.md` before implementation |
| Architecture | Often evolves informally | Solution and technology specification separate logical architecture from implementation detail |
| Backlog | Manually created and frequently disconnected from source requirements | Backlog is generated from requirements with IDs, dependencies, and acceptance criteria |
| Testing | Often starts after implementation | Test strategy, quality gates, and regression scenarios are generated before or alongside implementation |
| Traceability | Usually partial or manual | Built into every artifact and validated in `16_Validation_Summary.md` |
| Release Readiness | Often checklist-driven at the end | Release controls, rollback, quality, governance, and source baseline are planned earlier |
| Scalability | Hard to scale without increasing coordination risk | Supports sequential and multi-agent execution with ownership and conflict rules |

### Timeline Reduction Estimates

Actual savings depend on project complexity and input quality. Typical expected reductions are:

| Activity | Expected Improvement |
|---|---|
| Requirements analysis | 25-40% faster due to structured extraction and manifests. |
| Backlog creation | 40-60% faster due to generated epics, stories, tasks, and acceptance criteria. |
| Test planning | 30-50% faster due to reusable quality and regression templates. |
| Implementation handoff | 30-45% faster due to consolidated `15_Build_Prompt.md`. |
| Gap review | 20-35% faster due to validation summary and clarification workflow. |

### Quality Improvement Metrics

Recommended metrics for adoption include:

| Metric | What It Measures |
|---|---|
| Requirement Traceability Coverage | Percentage of requirements mapped to downstream artifacts. |
| Open Question Closure Rate | Percentage of questions resolved before implementation. |
| Artifact Completeness Score | Percentage of required template sections completed or marked not applicable. |
| Defect Leakage | Defects found after implementation that should have been caught by artifacts or tests. |
| Rework Reduction | Reduction in changes caused by missed requirements or unclear assumptions. |
| Regression Coverage | Percentage of critical flows covered by regression scenarios. |

### Risk Reduction

The ADLC process reduces risk by forcing decisions and gaps into visible artifacts. It avoids silent assumptions, protects artifact boundaries, records governance exceptions, and ensures implementation agents use a stable, approved baseline.

## 8. Conclusion

The ADLC SSoT process provides a scalable, traceable, and governance-ready way to move from requirement documents to implementation-ready application artifacts. It improves alignment between business, architecture, development, QA, release, and leadership by ensuring every major decision is captured in the right place and validated before build execution.

The process is strong because it combines:

- Structured input folders and manifests.
- Template-driven artifact generation.
- Sequential and multi-agent execution options.
- Clear artifact ownership.
- Traceability across requirements, design, code, tests, quality, release, and governance.
- Clarification and regeneration rules for controlled change.
- Version-control and repository hygiene for implementation readiness.

## Next Steps for Team Adoption

1. Confirm the folder structure and manifests are ready for each new project.
2. Train business analysts to maintain requirement and clarification inputs.
3. Train architects and leads to review solution, technology, governance, and validation artifacts.
4. Run the sequential process for the first project baseline.
5. Adopt the multi-agent artifact playbook for larger projects after the team is comfortable with the sequential chain.
6. Use `15_Build_Prompt.md` and, when needed, `MULTI_AGENT_APP_BUILD_PLAYBOOK.md` for controlled application creation.
7. Track adoption metrics such as traceability coverage, artifact completeness, rework reduction, regression coverage, and release readiness defects.
