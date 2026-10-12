# ADLC Step-by-Step Prompt Playbook

This is the default sequential execution playbook. For larger projects that need controlled parallel artifact generation, use `MULTI_AGENT_ADLC_PLAYBOOK.md` while still applying this file's step prompts and `ADLC_MasterPrompt.md`.

## How to use
Instruction:
1. Run prompts in the dependency order shown in this file; prompt numbers match their output artifact numbers.
2. Do not skip non-optional core artifacts; only skip Step 11 when no UI reference inputs or embedded requirement-document UI visuals are available, and only skip Step 12 when no database reference inputs are available.
3. Step 11 and Step 12 are optional extraction steps and should run after Step 1 but before Step 2 when their source folders or requirement documents contain usable inputs.
4. If no UI or database reference artifacts exist, capture UI and database requirements directly in 01_Requirement_Specification.md.
5. At each step, provide ADLC_MasterPrompt.md, the requirements source folder, all required upstream artifacts, and the matching template file.
6. Save output using the exact output filename for that step.
7. If any conflict appears between the Master Prompt, the requirements source folder, and upstream artifacts, freeze the chain and resolve the conflict upstream before regenerating downstream artifacts.
8. Run Step 13 after Step 3, Step 14 after Step 13 when UI/design inputs exist, Step 15 after Step 10, and Step 16 after Step 15 or after Step 10 when no build prompt is needed.
9. Run Step 18 before Step 1 when greenfield enterprise intake, artifact-depth selection, approval path, or tool/export expectations must be formally captured.
10. Run Step 19 after Step 4 when backlog export is needed for early planning, or after Step 16 when export should use the fully validated artifact baseline.
11. Treat external uploads as reference inputs until their facts are extracted into the appropriate ADLC artifact with source references.
12. Keep technology choices in 13_Technology_Specification.md, design tokens in 14_Design_System.md, policy standards in 05_Guidelines.md, implementation/test structure in 07_Code-And-Test.md, and approvals/change records in 10_Governance.md.
13. If a generated item violates SSoT, traceability, security, privacy, accessibility, performance, resilience, maintainability, or artifact-boundary rules, flag the issue and record the compliant alternative before continuing.

Common placeholders you should replace before each run:
- {{PROJECT_NAME}}
- {{PROJECT_TYPE}}  # optional for Step 18 project classification
- {{ARTIFACT_DEPTH}}  # optional for Step 18 artifact-depth decision
- {{EXECUTION_MODE}}  # optional sequential or multi-agent execution decision
- {{TARGET_BACKLOG_TOOL}}  # optional for Step 19 backlog export mapping
- {{WORKING_FOLDER_PATH}}
- {{REQUIREMENTS_FOLDER_PATH}}
- {{REQUIREMENTS_MANIFEST_PATH}}
- {{UI_REFERENCE_FOLDER_PATH}}  # optional for Step 11 UI extraction and Step 14 design system
- {{UI_REFERENCE_MANIFEST_PATH}}  # optional UI reference manifest
- {{DATABASE_REFERENCE_FOLDER_PATH}}  # optional for Step 12 database extraction
- {{DATABASE_REFERENCE_MANIFEST_PATH}}  # optional database reference manifest
- {{GENERAL_NOTES_FOLDER_PATH}}  # optional supporting notes for Step 1 and validation
- {{GENERAL_NOTES_MANIFEST_PATH}}  # optional supporting notes manifest
- {{CLARIFICATIONS_FILE_PATH}}  # optional approved clarification answers, default {{GENERAL_NOTES_FOLDER_PATH}}/Clarifications.md
- {{TECHNICAL_REFERENCE_FOLDER_PATH}}  # optional for 03_Solution.md and 13_Technology_Specification.md
- {{TECHNICAL_REFERENCE_MANIFEST_PATH}}  # optional technical reference manifest

Recommended output folder:
- {{WORKING_FOLDER_PATH}}/Generated Artifacts

Recommended execution order:
1. Step 18 -> 18_Project_Intake.md when greenfield enterprise intake is needed
2. Step 1 -> 01_Requirement_Specification.md
3. Step 11 -> 11_UI.md when UI reference inputs exist
4. Step 12 -> 12_Database.md when database reference inputs exist
5. Step 2 -> 02_Flows.md
6. Step 3 -> 03_Solution.md
7. Step 13 -> 13_Technology_Specification.md
8. Step 14 -> 14_Design_System.md when UI/design inputs exist
9. Step 4 -> 04_Backlog.md
10. Step 19 -> 19_Backlog_Export.md when backlog export is needed before planning
11. Step 5 -> 05_Guidelines.md
12. Step 6 -> 06_Plan.md
13. Step 7 -> 07_Code-And-Test.md
14. Step 8 -> 08_Quality.md
15. Step 9 -> 09_Release.md
16. Step 10 -> 10_Governance.md
17. Step 15 -> 15_Build_Prompt.md when an implementation prompt is needed
18. Step 16 -> 16_Validation_Summary.md
19. Step 17 -> 17_Regression_Test_Suite.md when a regression suite is needed
20. Step 19 -> 19_Backlog_Export.md when backlog export is needed after full validation

Global context required in every non-optional step:
- Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
- Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
- General notes folder: {{GENERAL_NOTES_FOLDER_PATH}} (manifest: {{GENERAL_NOTES_MANIFEST_PATH}})
- Step-specific template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/{{NUMBERED_TEMPLATE_FILE}}
- Finalized upstream artifacts from {{WORKING_FOLDER_PATH}}/Generated Artifacts

Global enforcement required in every step:
- Perform a pre-generation consistency check across the Master Prompt, requirements source folder, required upstream artifacts, optional external artifacts, and the current template.
- Check `{{GENERAL_NOTES_MANIFEST_PATH}}` and `{{CLARIFICATIONS_FILE_PATH}}` before regeneration or validation. If approved clarifications answer open questions, update the owning upstream artifact first and then revalidate/regenerate impacted downstream artifacts.
- Do not invent scope, requirements, technologies, data entities, screens, flows, controls, integrations, quality targets, or implementation details.
- Use `Not specified`, `[RECOMMENDATION]`, `[OPEN QUESTION]`, `[RISK]`, or the template-specific risk marker when source support is incomplete.
- Preserve stable IDs from upstream artifacts and map new IDs back to their source IDs.
- Prefer reference over repetition: when an artifact consumes details owned by another artifact, summarize the implication and link to the owning artifact ID instead of duplicating full content.
- If a conflict changes scope, architecture, security, compliance, release readiness, or artifact ownership, freeze downstream generation until the upstream artifact or 10_Governance.md records the decision.
- Record exception details with rationale, owner, approver, affected artifacts, mitigation, review date, and related IDs wherever the step template provides a place for risks, decisions, exceptions, or governance notes.

Clarification regeneration workflow:
1. Read `{{GENERAL_NOTES_MANIFEST_PATH}}`.
2. If `Clarifications.md` is listed as Approved or contains approved clarification entries, read `{{CLARIFICATIONS_FILE_PATH}}`.
3. Map each approved clarification to `Related_Question_ID` and `Source_Artifact`.
4. Update the source artifact where the question originated.
5. Mark the question resolved, superseded, or converted into an assumption/requirement/constraint/decision.
6. Regenerate or revise every impacted artifact listed in `Impacted_Artifacts`.
7. Record material decisions and exceptions in `10_Governance.md`.
8. Record consumed clarifications and remaining gaps in `16_Validation_Summary.md`.

---

## Step 18 Prompt (Project Intake)
Use this before Step 1 when greenfield enterprise intake, artifact-depth selection, stakeholder approval path, source readiness, execution mode, or backlog/tool export expectations must be captured.

Use with template: 18_Project_Intake_Template.md
Input document(s): Input artifact folders, manifests, general notes, project kickoff notes
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/18_Project_Intake.md

```text
You are generating Step 18 artifact for project "{{PROJECT_NAME}}".

Task:
Create 18_Project_Intake.md using 18_Project_Intake_Template.md before Step 1 artifact generation.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) UI reference folder: {{UI_REFERENCE_FOLDER_PATH}} (manifest: {{UI_REFERENCE_MANIFEST_PATH}})
4) Database reference folder: {{DATABASE_REFERENCE_FOLDER_PATH}} (manifest: {{DATABASE_REFERENCE_MANIFEST_PATH}})
5) General notes folder: {{GENERAL_NOTES_FOLDER_PATH}} (manifest: {{GENERAL_NOTES_MANIFEST_PATH}})
6) Technical references folder: {{TECHNICAL_REFERENCE_FOLDER_PATH}} (manifest: {{TECHNICAL_REFERENCE_MANIFEST_PATH}})
7) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/18_Project_Intake_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Classify the project as greenfield and define artifact depth, execution mode, stakeholder roles, approval path, source readiness, and optional tool/export targets.
- Do not generate detailed requirements, architecture, UI inventories, database schema, backlog items, or implementation choices in this artifact.
- Mark unavailable or unnecessary source areas and artifacts as Not Applicable with rationale.
- Identify blocking intake gaps and route them to owners before Step 1.
- Keep all tool targets optional and export-oriented unless later approved in 10_Governance.md or 13_Technology_Specification.md.

Traceability requirements:
- Artifact applicability decisions must map to source readiness, delivery need, approval path, or governance rationale.
- Blocking intake gaps must map to source folders, manifests, owners, and target resolution gates.
- Tool/export expectations must map to 19_Backlog_Export.md, 09_Release.md, 10_Governance.md, or Not Applicable.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/18_Project_Intake.md
```

---

## Step 1 Prompt (Specification)
Use with template: 01_Requirement_Specification_Template.md
Input document(s): Requirements source folder, General notes folder, Technical references folder
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md

```text
You are generating Step 1 artifact for project "{{PROJECT_NAME}}".

Task:
Create 01_Requirement_Specification.md using the template 01_Requirement_Specification_Template.md.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) General notes folder: {{GENERAL_NOTES_FOLDER_PATH}} (manifest: {{GENERAL_NOTES_MANIFEST_PATH}})
4) Clarifications file: {{CLARIFICATIONS_FILE_PATH}}
5) Technical references folder: {{TECHNICAL_REFERENCE_FOLDER_PATH}} (manifest: {{TECHNICAL_REFERENCE_MANIFEST_PATH}})
6) Template file: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/01_Requirement_Specification_Template.md


Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Follow the template section-by-section.
- Keep content technology-agnostic.
- Convert raw requirements into structured functional and non-functional requirements.
- If the requirements folder contains one usable requirement file, treat it as the primary source.
- If the requirements folder contains multiple usable files, consume all files listed in the requirements manifest and record each source in 01_Requirement_Specification.md.
- Capture UI and database requirements from the requirements source folder when no existing application artifacts are available.
- If requirements documents contain embedded screenshots, wireframes, mockups, or UI diagrams, catalog them as embedded UI evidence and route screen/control/layout extraction to 11_UI.md.
- Consume approved general notes as requirements, assumptions, constraints, or open questions; keep draft/reference-only notes as non-authoritative context.
- Consume approved clarification entries only when they answer open questions or supersede assumptions from previous artifact versions.
- Use technical references only when they provide requirement evidence; otherwise route them to 03_Solution.md or 13_Technology_Specification.md.
- Use stable IDs (FR-xxx, NFR-xxx, CON-xxx, ASM-xxx).
- Populate Source_Reference for every requirement.
- Do not invent requirements that are not implied by the input.
- Treat external reference material as evidence only; extract facts into requirements only when the source text supports them.
- If requirements are contradictory, missing, or infeasible, document them as Open Questions, Constraints, Assumptions, or Risks rather than resolving silently.

Traceability requirements:
- Every FR/NFR/Constraint must map to source requirement text.
- Every UI and database requirement must map to source requirement or specification IDs.
- Embedded UI visuals must be listed with enough document/page/section context for Step 11 extraction.
- Include unresolved items under Open Questions.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
```

---

## Step 11 Prompt (UI/UX Extraction)
Use with template: 11_UI_Template.md
Input document(s): UI reference folder, Requirements source folder including embedded UI visuals, 01_Requirement_Specification.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md

```text
You are generating Step 11 artifact for project "{{PROJECT_NAME}}".

Task:
Create 11_UI.md from UI reference evidence, including standalone UI references and UI visuals embedded in requirements documents.

Inputs:
1) UI reference folder: {{UI_REFERENCE_FOLDER_PATH}} (manifest: {{UI_REFERENCE_MANIFEST_PATH}})
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
4) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
5) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/11_UI_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Extract screen names, controls, placement, alignment, spacing, states, labels, and behaviors from screenshots.
- Extract UI details from embedded requirement-document screenshots, wireframes, mockups, or UI diagrams when no separate UI reference files exist.
- Match UI elements to functional requirements, NFRs, and design guidelines.
- Capture differences between existing UI and the target requirements.
- Include clear mapping between each screen/control and related FR/NFR IDs.
- Use exact layout descriptions that enable an AI agent to generate the new app’s interface.
- This step is optional: use when an existing application UI is available or when the requirements source folder contains embedded UI visuals.
- Treat screenshots and mockups as reference inputs until extracted into 11_UI.md; do not let them override 01_Requirement_Specification.md without recording the conflict.
- Do not define concrete design tokens here unless directly visible or specified; reusable visual tokens belong in 14_Design_System.md.
- Do not duplicate full FR/NFR text from 01_Requirement_Specification.md; reference IDs and capture only UI-specific interpretation, evidence, or gaps.

Traceability requirements:
- Each UI screen section must reference source screenshot names.
- Embedded UI visuals must reference the requirement document, page/section, image label, or nearest heading.
- Each control must reference the related FR/NFR ID.
- Any missing or ambiguous UI behavior must be documented as an open question.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md
```

---

## Step 12 Prompt (Database Extraction)
Use with template: 12_Database_Template.md
Input document(s): Database reference folder, Requirements source folder, 01_Requirement_Specification.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/12_Database.md

```text
You are generating Step 12 artifact for project "{{PROJECT_NAME}}".

Task:
Create 12_Database.md from existing application database details and requirements.

Inputs:
1) Database reference folder: {{DATABASE_REFERENCE_FOLDER_PATH}} (manifest: {{DATABASE_REFERENCE_MANIFEST_PATH}})
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
4) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
5) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/12_Database_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Extract database type, schema entities, relationships, indexing, security controls, and operational constraints.
- Match database details to functional requirements, NFRs, and security requirements.
- Document whether the existing application has a database and any migration considerations.
- Include clear mapping between database entities and related FR/NFR IDs.
- This step is optional: use only when an existing application database is available.
- Treat schema exports and database documents as reference inputs until extracted into 12_Database.md; do not let them override 01_Requirement_Specification.md without recording the conflict.
- Record unknown ownership, retention, privacy, migration, or integrity details as open questions or risks.

Traceability requirements:
- Each database section must reference source database documentation or schema export names.
- Each entity must reference the related FR/NFR ID.
- Any missing or ambiguous database behavior must be documented as an open question.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/12_Database.md
```

---

## Step 2 Prompt (Flows)
Use with template: 02_Flows_Template.md
Input document(s): 01_Requirement_Specification.md, optional 11_UI.md, optional 12_Database.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md

```text
You are generating Step 2 artifact for project "{{PROJECT_NAME}}".

Task:
Create 02_Flows.md using 02_Flows_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Optional UI extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md
5) Optional Database extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/12_Database.md
6) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/02_Flows_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Identify personas, workflows, detailed steps, data movement, and alternate paths.
- Keep flow definitions deterministic and implementation-neutral.
- Use IDs (PER-xxx, WF-xxx, ST-xxx, DF-xxx, EX-xxx).
- If 11_UI.md or 12_Database.md exists, incorporate UI layout and data/database interaction details.
- Reference screen/control evidence from 11_UI.md and schema/entity evidence from 12_Database.md without duplicating full inventories.
- Do not create new requirements through flows; if a flow implies missing scope, document it as an open question or recommendation tied back to 01_Requirement_Specification.md.
- Flag conflicts between user journeys, data movement, UI evidence, and database evidence before generating downstream architecture.

Traceability requirements:
- Every workflow must reference related spec IDs.
- Every step must map to a workflow.
- Every data flow must link to a workflow step or requirement ID.
- Any UI or database impact must reference the optional 11_UI.md or 12_Database.md source.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
```

---

## Step 3 Prompt (Solution)
Use with template: 03_Solution_Template.md
Input document(s): 01_Requirement_Specification.md, 02_Flows.md, optional 11_UI.md, optional 12_Database.md, optional Technical references folder
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md

```text
You are generating Step 3 artifact for project "{{PROJECT_NAME}}".

Task:
Create 03_Solution.md using 03_Solution_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Optional UI extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md
6) Optional Database extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/12_Database.md
7) Optional technical references folder: {{TECHNICAL_REFERENCE_FOLDER_PATH}} (manifest: {{TECHNICAL_REFERENCE_MANIFEST_PATH}})
8) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/03_Solution_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Define end-to-end solution architecture, including system boundaries, logical architecture, component breakdown, integrations, data architecture, infrastructure, security, scalability, resilience, monitoring, operations, roadmap, risks, and traceability.
- Keep the design technology-agnostic unless the input document or upstream artifacts mandate a stack-specific choice.
- Add design decisions with rationale, alternatives, impact, and upstream traceability.
- Populate diagram-ready architecture tables for nodes, connections, external systems, data flows, and diagram views.
- Include Mermaid-compatible placeholders for context, component/integration, and data-flow diagrams.
- Mark non-source-derived architecture choices as `[RECOMMENDATION]`.
- Mark contradictions, missing integration details, or infeasible requirements as `[ARCHITECTURE RISK]`.
- If 11_UI.md exists, include only UI architecture implications and references to screen requirements; do not duplicate detailed control inventories.
- If 12_Database.md exists, include only database architecture implications and references to schema constraints; do not duplicate full schema details.
- Use technical references only as evidence for architecture, integration, or constraints; map every used fact to source references.
- Apply constructive friction to architecture choices that weaken security, privacy, resilience, accessibility, performance, traceability, or artifact boundaries.
- Do not put concrete project file layout or framework-specific implementation rules in 03_Solution.md; capture those later in 13_Technology_Specification.md.

Traceability requirements:
- Map components to FR/NFR IDs.
- Map data flows to WF/DF IDs.
- Map decisions to constraints and quality needs.
- Map integrations, infrastructure decisions, security controls, risks, and diagram nodes/connections to upstream IDs.
- Reference 11_UI.md or 12_Database.md when using external app artifacts.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
```

---

## Step 13 Prompt (Technology Specification)
Use with template: 13_Technology_Specification_Template.md
Input document(s): 01_Requirement_Specification.md, 02_Flows.md, 03_Solution.md, optional 11_UI.md, optional 12_Database.md, optional Technical references folder
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md

```text
You are generating Step 13 artifact for project "{{PROJECT_NAME}}".

Task:
Create 13_Technology_Specification.md using 13_Technology_Specification_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Optional UI extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md
7) Optional Database extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/12_Database.md
8) Optional technical references folder: {{TECHNICAL_REFERENCE_FOLDER_PATH}} (manifest: {{TECHNICAL_REFERENCE_MANIFEST_PATH}})
9) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/13_Technology_Specification_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Define concrete technology stack, versions, project structure, integrations, environment configuration, and implementation constraints only when source inputs or upstream artifacts justify them.
- Define version-control expectations, repository initialization approach, ignore-file requirements, and prohibited source-controlled file patterns as implementation hygiene rules.
- Use technical references as implementation evidence only after their facts are mapped to 03_Solution.md, 01_Requirement_Specification.md, or explicit source references.
- Mark non-source-derived technology choices or project-structure choices as `[RECOMMENDATION]`.
- Keep visual tokens and reusable styling in 14_Design_System.md; define only the implementation alignment points that 14_Design_System.md must later satisfy.
- Apply constructive friction to technologies, dependencies, configuration, or deployment patterns that conflict with security, performance, maintainability, or upstream architecture.

Traceability requirements:
- Every technology, dependency, project-structure decision, version-control rule, integration pattern, security control, and deployment setting must map to Solution components, FR/NFR/CON IDs, or be marked `[RECOMMENDATION]`.
- Any conflict with 05_Guidelines.md, 03_Solution.md, design requirements, or source requirements must be recorded as a risk or open question.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
```

---

## Step 14 Prompt (Design System)
Use with template: 14_Design_System_Template.md
Input document(s): UI reference folder, 11_UI.md, 01_Requirement_Specification.md, 13_Technology_Specification.md when available
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md

```text
You are generating Step 14 artifact for project "{{PROJECT_NAME}}".

Task:
Create 14_Design_System.md using 14_Design_System_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) UI reference folder: {{UI_REFERENCE_FOLDER_PATH}} (manifest: {{UI_REFERENCE_MANIFEST_PATH}})
4) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
5) UI extraction: {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md
6) Optional Technology Specification alignment context: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
7) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/14_Design_System_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Define reusable visual tokens, component styling patterns, accessibility styling rules, and UI consistency standards from 11_UI.md and source evidence.
- Keep this artifact focused on design tokens and reusable component presentation; do not define project file layout, framework-specific implementation, or business logic.
- Normalize repeated visual observations from 11_UI.md into reusable standards; do not duplicate every screen-specific control or placement detail.
- Mark any non-source-derived visual pattern as `[RECOMMENDATION]`.
- If 11_UI.md is not available, generate this artifact only when the requirements source folder provides enough visual design requirements.
- Apply constructive friction to visual choices that conflict with accessibility, usability, brand, or source UI evidence.

Traceability requirements:
- Tokens and component patterns must map to UI screens, source artifacts, FR IDs, or NFR IDs.
- Accessibility standards must map to relevant NFRs or source requirements.
- Any missing or conflicting visual standard must be documented as an open question or risk.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
```

---

## Step 4 Prompt (Backlog)
Use with template: 04_Backlog_Template.md
Input document(s): 03_Solution.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md

```text
You are generating Step 4 artifact for project "{{PROJECT_NAME}}".

Task:
Create 04_Backlog.md using 04_Backlog_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/04_Backlog_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Decompose solution into Epics, Features, User Stories, and Tasks.
- Ensure each item is testable and actionable.
- Use IDs (EP-xxx, FEAT-xxx, US-xxx, TSK-xxx).
- Do not add backlog items that are not traceable to 01_Requirement_Specification.md, 02_Flows.md, or 03_Solution.md.
- If a requested feature is outside approved scope, place it only in a deferred/backlog category when the template supports it and record the source or governance decision.

Traceability requirements:
- Epics must map to solution components.
- Stories must map to features.
- Tasks must map to stories.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
```

---

## Step 5 Prompt (Guidelines)
Use with template: 05_Guidelines_Template.md
Input document(s): 01_Requirement_Specification.md, 02_Flows.md, 03_Solution.md, 04_Backlog.md, optional 13_Technology_Specification.md, optional 14_Design_System.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md

```text
You are generating Step 5 artifact for project "{{PROJECT_NAME}}".

Task:
Create 05_Guidelines.md using 05_Guidelines_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
7) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
8) Optional Design System: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
9) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/05_Guidelines_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Define coding guidelines, design principles, naming conventions, and security/performance guidelines.
- Keep all guidance stack-neutral and policy-oriented.
- Enforce artifact boundaries: technology choices belong in 13_Technology_Specification.md, visual tokens and reusable styling belong in 14_Design_System.md, and implementation/test structure belongs in 07_Code-And-Test.md.
- Include constructive-friction rules for standards violations and exception documentation.
- Require reusable separation of contracts, domain logic, adapters, UI components, style tokens, configuration, and tests where applicable.

Traceability requirements:
- Map each guideline area to relevant NFR or solution quality attributes.
- Document exception handling approach.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
```

---

## Step 6 Prompt (Plan)
Use with template: 06_Plan_Template.md
Input document(s): 04_Backlog.md + 05_Guidelines.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md

```text
You are generating Step 6 artifact for project "{{PROJECT_NAME}}".

Task:
Create 06_Plan.md using 06_Plan_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
7) Guidelines: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
8) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/06_Plan_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Create phases/sprints, priorities, dependencies, and risk handling.
- Ensure execution plan is feasible and measurable.
- Include estimation method, capacity assumptions, forecast confidence, and delivery forecast scenarios for leadership planning.
- Do not change backlog scope in 06_Plan.md; plan only approved backlog items and record sequencing risks or dependency gaps.
- Include change-control checkpoints for scope, architecture, quality, release, and governance updates.

Traceability requirements:
- All tasks referenced in plan must exist in backlog.
- Phase and risk controls must reference guideline constraints.
- Estimates and capacity assumptions must map to backlog IDs, assumptions, risks, or governance decisions.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
```

---

## Step 7 Prompt (Code-And-Test)
Use with template: 07_Code-And-Test_Template.md
Input document(s): 01_Requirement_Specification.md, 02_Flows.md, 03_Solution.md, 04_Backlog.md, 05_Guidelines.md, 06_Plan.md, optional 13_Technology_Specification.md, optional 14_Design_System.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md

```text
You are generating Step 7 artifact for project "{{PROJECT_NAME}}".

Task:
Create 07_Code-And-Test.md using 07_Code-And-Test_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
7) Guidelines: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
8) Plan: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
9) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
10) Optional Design System: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
11) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/07_Code-And-Test_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Define code structure guidance and module definition format.
- Define deterministic testing strategy and test case format.
- Keep language and tooling neutral unless the input document or upstream artifacts specify a stack.
- Include a generated codebase structure section that defines /src, /tests, and /docs contents or explicitly states why implementation code is deferred.
- Enforce separation of contracts, domain logic, adapters, UI components, configuration, fixtures, and tests according to 05_Guidelines.md and 13_Technology_Specification.md when available.
- If a test, module, or code structure cannot be traced to backlog, requirements, or solution components, mark it as `[RECOMMENDATION]` or remove it.

Traceability requirements:
- Modules must map to Story IDs.
- Test cases must map to FR/NFR IDs.
- Every requirement must have at least one validation path.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md
```

---

## Step 8 Prompt (Quality)
Use with template: 08_Quality_Template.md
Input document(s): 07_Code-And-Test.md + Requirements source folder + General notes folder + optional 13_Technology_Specification.md + optional 14_Design_System.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/08_Quality.md

```text
You are generating Step 8 artifact for project "{{PROJECT_NAME}}".

Task:
Create 08_Quality.md using 08_Quality_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) General notes folder: {{GENERAL_NOTES_FOLDER_PATH}} (manifest: {{GENERAL_NOTES_MANIFEST_PATH}})
4) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
5) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
6) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
7) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
8) Guidelines: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
9) Plan: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
10) Code-And-Test: {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md
11) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
12) Optional Design System: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
13) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/08_Quality_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Build requirement traceability matrix.
- Summarize test coverage validation.
- Capture defect tracking format and quality gate decision.
- Include standards coverage for security, privacy, accessibility, performance, resilience, observability, maintainability, and traceability where applicable.
- Convert each NFR into measurable acceptance criteria with metric, target, threshold, validation method, evidence, frequency, owner, and pass/fail status.
- Treat unmet gates as explicit gaps with owner, impact, required fix, and affected artifact IDs.

Traceability requirements:
- All quality rows must reference requirement IDs.
- Gaps must be explicit where coverage is incomplete.
- Every measurable NFR row must reference an NFR ID and evidence source.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/08_Quality.md
```

---

## Step 9 Prompt (Release)
Use with template: 09_Release_Template.md
Input document(s): All artifacts
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/09_Release.md

```text
You are generating Step 9 artifact for project "{{PROJECT_NAME}}".

Task:
Create 09_Release.md using 09_Release_Template.md and required upstream context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
7) Guidelines: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
8) Plan: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
9) Code-And-Test: {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md
10) Quality: {{WORKING_FOLDER_PATH}}/Generated Artifacts/08_Quality.md
11) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
12) Optional Design System: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
13) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/09_Release_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Provide release notes structure, deployment checklist, and versioning strategy.
- Include source-control baseline readiness, branch/tag or baseline reference when available, ignore-file status, and checks proving prohibited files are excluded.
- Include post-release validation, monitoring outcomes, adoption/user feedback, and continuous-improvement routing to the owning ADLC artifacts.
- Keep release process generic and environment-agnostic.
- Do not approve release readiness when quality gates, known issues, unresolved risks, or governance approvals block release.
- Map release exceptions to 10_Governance.md decision or deviation records.

Traceability requirements:
- Included features map to backlog IDs.
- Release recommendation references quality gate outcome.
- Known issues map to defect IDs.
- Source-control baseline and ignore-file readiness map to 13_Technology_Specification.md, release evidence, or governance exceptions.
- Post-release feedback and continuous-improvement actions map to requirements, quality, release, backlog, defect, or governance IDs.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/09_Release.md
```

---

## Step 10 Prompt (Governance)
Use with template: 10_Governance_Template.md
Input document(s): All artifacts
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/10_Governance.md

```text
You are generating Step 10 artifact for project "{{PROJECT_NAME}}".

Task:
Create 10_Governance.md using 10_Governance_Template.md and all generated artifacts.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
7) Guidelines: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
8) Plan: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
9) Code-And-Test: {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md
10) Quality: {{WORKING_FOLDER_PATH}}/Generated Artifacts/08_Quality.md
11) Release: {{WORKING_FOLDER_PATH}}/Generated Artifacts/09_Release.md
12) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
13) Optional Design System: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
14) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/10_Governance_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Populate decision log, change log, risk register, and compliance checklist.
- Define governance cadence and escalation path.
- Record decisions, deviations, approvals, and compliance evidence accumulated across Steps 1-9.
- Capture formal artifact signoff checkpoints for BA, Product Owner, Architect, QA, Security/Compliance, PM, and Release Owner where applicable.
- Record all standards exceptions, constructive-friction outcomes, conflict resolutions, and cross-artifact change impacts.
- 10_Governance.md must identify owners, approvers, mitigation, review dates, and impacted artifact IDs for decisions, changes, risks, and deviations.

Traceability requirements:
- Decision/change entries must reference impacted artifact IDs.
- Compliance entries must reference requirements or constraints.
- Signoff checkpoints must map to artifact baselines, quality gates, release gates, or implementation handoff decisions.
- Open risks must reference plan/release impacts.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/10_Governance.md
```

---

## Step 15 Prompt (Build Prompt)
Use with template: 15_Build_Prompt_Template.md
Input document(s): All finalized artifacts
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/15_Build_Prompt.md

```text
You are generating Step 15 artifact for project "{{PROJECT_NAME}}".

Task:
Create 15_Build_Prompt.md using 15_Build_Prompt_Template.md and all finalized ADLC artifacts.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Solution: {{WORKING_FOLDER_PATH}}/Generated Artifacts/03_Solution.md
6) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
7) Guidelines: {{WORKING_FOLDER_PATH}}/Generated Artifacts/05_Guidelines.md
8) Plan: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
9) Code-And-Test: {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md
10) Quality: {{WORKING_FOLDER_PATH}}/Generated Artifacts/08_Quality.md
11) Release: {{WORKING_FOLDER_PATH}}/Generated Artifacts/09_Release.md
12) Governance: {{WORKING_FOLDER_PATH}}/Generated Artifacts/10_Governance.md
13) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
14) Optional Design System: {{WORKING_FOLDER_PATH}}/Generated Artifacts/14_Design_System.md
15) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/15_Build_Prompt_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving behavior, SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Consolidate only approved, traceable decisions into a deterministic implementation prompt.
- Preserve artifact boundaries: do not invent implementation details not present in 13_Technology_Specification.md, 07_Code-And-Test.md, 05_Guidelines.md, or approved recommendations.
- Include repository initialization or existing-repository instructions, stack-appropriate ignore-file requirements, and never-commit exclusions from 13_Technology_Specification.md and 09_Release.md.
- Include constructive-friction instructions for standards violations, scope changes, and unresolved governance blockers.
- Do not include deferred scope, unresolved open questions, or unapproved recommendations as implementation requirements.

Traceability requirements:
- Every build instruction must map back to one or more ADLC artifacts.
- Repeated details are allowed only because 15_Build_Prompt.md is a final handoff artifact; each repeated item must preserve source meaning and traceability.
- Known limitations, risks, assumptions, and governance blockers must remain visible to the implementation agent.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/15_Build_Prompt.md
```

---

## Step 16 Prompt (Validation Summary)
Use this after Step 15, or after Step 10 when Step 15 is not required, to check completeness.

Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/16_Validation_Summary.md

```text
Validate the full artifact chain for project "{{PROJECT_NAME}}".

Master prompt instruction:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before running validation.
- Treat ADLC_MasterPrompt.md rules as higher priority than this validation prompt when assessing SSoT, traceability, conflict handling, external artifact handling, change-control, and constructive-friction compliance.

Artifacts to validate:
- 18_Project_Intake.md when generated
- 01_Requirement_Specification.md
- 11_UI.md when generated
- 12_Database.md when generated
- 02_Flows.md
- 03_Solution.md
- 04_Backlog.md
- 05_Guidelines.md
- 06_Plan.md
- 07_Code-And-Test.md
- 08_Quality.md
- 09_Release.md
- 10_Governance.md
- 13_Technology_Specification.md when generated
- 14_Design_System.md when generated
- 15_Build_Prompt.md when generated
- 17_Regression_Test_Suite.md when generated
- 19_Backlog_Export.md when generated

Checks:
1) Every file follows its template sections.
2) IDs are unique and stable.
3) Traceability links are complete from requirements to governance.
4) No technology-specific lock-in was introduced unless explicitly required.
5) External artifacts were converted into ADLC artifacts before downstream use.
6) Conflicts, recommendations, risks, exceptions, and open questions are explicitly marked and routed to the correct artifact.
7) Scope, architecture, quality, release, and governance changes are reflected in all impacted downstream artifacts.
8) Cross-artifact duplication is either avoided, reference-only, or justified by handoff/validation needs.
9) Optional Step 18 intake and Step 19 backlog export artifacts are present, validated, or marked Not Applicable when relevant.

Return:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/16_Validation_Summary.md
```

---

## Step 17 Prompt (Regression Test Suite)
Use this after Step 16 when a manual and automation-ready regression suite is needed.

Use with template: 17_Regression_Test_Suite_Template.md
Input document(s): 01_Requirement_Specification.md, 02_Flows.md, 04_Backlog.md, 07_Code-And-Test.md, 08_Quality.md, optional 11_UI.md, optional 12_Database.md, optional 13_Technology_Specification.md, optional 16_Validation_Summary.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/17_Regression_Test_Suite.md

```text
You are generating Step 17 artifact for project "{{PROJECT_NAME}}".

Task:
Create 17_Regression_Test_Suite.md using 17_Regression_Test_Suite_Template.md and accepted upstream ADLC artifacts.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Requirements source folder: {{REQUIREMENTS_FOLDER_PATH}} (manifest: {{REQUIREMENTS_MANIFEST_PATH}})
3) Requirement Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/01_Requirement_Specification.md
4) Flows: {{WORKING_FOLDER_PATH}}/Generated Artifacts/02_Flows.md
5) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
6) Code-And-Test: {{WORKING_FOLDER_PATH}}/Generated Artifacts/07_Code-And-Test.md
7) Quality: {{WORKING_FOLDER_PATH}}/Generated Artifacts/08_Quality.md
8) Optional UI: {{WORKING_FOLDER_PATH}}/Generated Artifacts/11_UI.md
9) Optional Database: {{WORKING_FOLDER_PATH}}/Generated Artifacts/12_Database.md
10) Optional Technology Specification: {{WORKING_FOLDER_PATH}}/Generated Artifacts/13_Technology_Specification.md
11) Optional Validation Summary: {{WORKING_FOLDER_PATH}}/Generated Artifacts/16_Validation_Summary.md
12) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/17_Regression_Test_Suite_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Treat ADLC_MasterPrompt.md rules as higher priority than this step prompt when resolving SSoT, traceability, conflict, external artifact, change-control, and constructive-friction questions.
- Perform the global pre-generation consistency check before writing the artifact.
- Create a comprehensive regression test suite that supports both manual execution and automation readiness.
- Keep the suite technology-agnostic; do not reference specific test frameworks, tools, browsers, platforms, or automation libraries unless mandated upstream.
- Derive test cases only from accepted requirements, workflows, backlog items, code/test guidance, quality risks, UI evidence, database evidence, integrations, and known defects or risks.
- Include smoke, sanity, regression, and full test classifications where applicable.
- Include priorities P0-P3 based on business risk, release risk, security/privacy impact, and critical workflows.
- Mark automation status as Manual, Automated, or To Be Automated using deterministic readiness criteria.
- Include preconditions, test data needs, numbered steps, expected results, post-conditions, traceability, execution result fields, evidence fields, and reporting fields.
- Do not duplicate full requirement text; reference upstream IDs and capture only the test scenario and pass criteria.
- If a requirement is not testable, mark it as a coverage gap with reason, owner, and related requirement ID.

Traceability requirements:
- Every test case must map to one or more FR/NFR/CON/WF/US/BUG/RISK IDs.
- UI tests must reference 11_UI.md screen/control IDs or screenshot evidence when available.
- Database, API, external system, integration, and job tests must reference relevant upstream artifact IDs.
- Regression coverage gaps must map back to 08_Quality.md, 10_Governance.md, or the applicable risk/defect path.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/17_Regression_Test_Suite.md
```

---

## Step 19 Prompt (Backlog Export)
Use this after Step 4 when backlog export is needed for early planning, or after Step 16 when export should use the fully validated artifact baseline.

Use with template: 19_Backlog_Export_Template.md
Input document(s): 04_Backlog.md, optional 18_Project_Intake.md, optional 06_Plan.md, optional 16_Validation_Summary.md, optional 10_Governance.md
Output file: {{WORKING_FOLDER_PATH}}/Generated Artifacts/19_Backlog_Export.md

```text
You are generating Step 19 artifact for project "{{PROJECT_NAME}}".

Task:
Create 19_Backlog_Export.md using 19_Backlog_Export_Template.md and accepted backlog context.

Inputs:
1) Master Prompt: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/ADLC_MasterPrompt.md
2) Optional Project Intake: {{WORKING_FOLDER_PATH}}/Generated Artifacts/18_Project_Intake.md
3) Backlog: {{WORKING_FOLDER_PATH}}/Generated Artifacts/04_Backlog.md
4) Optional Plan: {{WORKING_FOLDER_PATH}}/Generated Artifacts/06_Plan.md
5) Optional Governance: {{WORKING_FOLDER_PATH}}/Generated Artifacts/10_Governance.md
6) Optional Validation Summary: {{WORKING_FOLDER_PATH}}/Generated Artifacts/16_Validation_Summary.md
7) Template: {{WORKING_FOLDER_PATH}}/ADLC_Artifacts/19_Backlog_Export_Template.md

Instructions:
- Read and apply ADLC_MasterPrompt.md as the governing instruction source before using this step prompt.
- Prepare export-ready backlog mapping only; do not call live APIs, create board items, or assume a specific tool unless approved upstream.
- Preserve Epic -> Feature -> Story -> Task hierarchy and parent-child references from 04_Backlog.md.
- Map target fields for Azure Boards, Jira, or another approved board only as optional import guidance.
- Exclude deferred, unresolved, duplicate, rejected, or not-applicable backlog items unless explicitly marked for backlog parking.
- Identify import blockers, missing fields, hierarchy gaps, and governance approvals needed before import.

Traceability requirements:
- Every export item must map to 04_Backlog.md item IDs.
- Every child item must preserve parent source ID or be marked blocked.
- Field mappings, tool-specific deviations, and import exceptions must map to 18_Project_Intake.md or 10_Governance.md when applicable.
- Export readiness must map to 16_Validation_Summary.md when Step 19 runs after validation.

Output:
- Return only the full markdown content for {{WORKING_FOLDER_PATH}}/Generated Artifacts/19_Backlog_Export.md
```
