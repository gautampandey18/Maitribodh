# Build Prompt Template

## Metadata
Instruction: Use this template to generate the final consolidated implementation prompt from all ADLC artifacts. This prompt is given to an AI coding agent to build the application.

- Project_Name: {{Project_Name}}
- Source_Artifacts: {{Comma_Separated_Artifact_List_With_Versions}}
- Generated_Date: {{Date}}
- Scope: {{Phase_Scope}}

## Purpose
Instruction: Consolidate all artifact decisions into a single, deterministic prompt that an AI coding agent can follow to build the application without referencing individual ADLC artifacts.

## Consolidation Rules
Instruction: Build_Prompt is allowed to repeat selected details from upstream artifacts only because it is the final implementation handoff.

- Duplication_Rule: Every repeated instruction must map to the source artifact baseline and preserve the original meaning.
- Conflict_Rule: If two artifacts disagree, do not resolve silently; stop and route the conflict to the owning upstream artifact or 10_Governance.md.
- Scope_Rule: Do not promote recommendations, open questions, deferred items, or unresolved risks into implementation requirements.

## SOURCE ARTIFACT BASELINE
Instruction: List every ADLC artifact version used to create this build prompt. If an artifact is not applicable, state why.

| Artifact | Version | Status | Used_For | Notes |
|---|---|---|---|---|
| {{01_to_16_Artifact_Name}} | {{Version}} | {{Approved_Draft_Not_Applicable}} | {{Used_For}} | {{Notes}} |

## BUILD SCOPE AND NON-GOALS
Instruction: Define exactly what the coding agent must build, must not build, and must stop to clarify.

- In_Scope: {{In_Scope_Items}}
- Out_Of_Scope: {{Out_Of_Scope_Items}}
- Deferred_Items: {{Deferred_Backlog_or_Governance_IDs}}
- Clarification_Triggers: {{Ambiguity_Conflict_or_Missing_Evidence_Triggers}}

## MISSION
Instruction: Write a 2-3 sentence mission statement summarizing what the application does, who it serves, and its core value proposition. Derive from 01_Requirement_Specification.md Purpose and Project Overview.

{{Mission_Statement}}

## TECH STACK
Instruction: Copy the exact tech stack table from 13_Technology_Specification.md. Include the directive: "Implement exactly the following versions. Do not introduce any unlisted dependency."

| Layer | Technology | Version |
|---|---|---|
| {{Layer}} | {{Technology}} | {{Version}} |

## PROJECT STRUCTURE
Instruction: Copy the project directory tree from 13_Technology_Specification.md. Include the directive: "Scaffold the project exactly as follows."

```
{{Project_Directory_Tree}}
```

## VERSION CONTROL AND IGNORE FILE
Instruction: Include repository hygiene from 13_Technology_Specification.md and 09_Release.md. If no existing repository is provided, instruct the coding agent to initialize source control and create an ignore file appropriate to the selected stack.

- Repository_Expectation: {{Initialize_New_Repository_Use_Existing_Repository_Not_Applicable}}
- Ignore_File_Requirements: {{Ignore_File_Rules}}
- Never_Commit: {{Secrets_Credentials_Tokens_LocalEnv_DependencyFolders_BuildOutputs_Logs_Caches_Coverage_TemporaryFiles_MachineSpecificFiles}}
- Baseline_Handoff: {{Commit_Ready_Baseline_or_Not_Applicable}}
- Governance_or_Exception_Reference: {{GOV_REL_NFR_IDs_or_Not_Applicable}}

## DATABASE SCHEMA
Instruction: List every table from 12_Database.md with columns, types, constraints, and relationships. Include migration order from MIG-xxx entries.

### {{Table_Name}} ({{Entity_ID}})
- Primary_Key: {{Primary_Key}}
- Columns:

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| {{Column}} | {{Type}} | {{Nullable}} | {{Default}} | {{Description}} |

- Indexes: {{Indexes}}
- Foreign_Keys: {{Foreign_Keys}}

## AUTHENTICATION AND AUTHORIZATION
Instruction: Consolidate auth details from 13_Technology_Specification.md and 03_Solution.md Security Architecture into actionable implementation instructions.

{{Auth_Implementation_Instructions}}

## SCREEN DEFINITIONS
Instruction: For each screen in 11_UI.md, list the route, layout, component hierarchy, data source API endpoint, and behavioral notes. Reference 14_Design_System.md for styling tokens.

### Screen: {{Screen_Name}}
- Route: {{Route_Path}}
- Layout: {{Layout_Description}}
- Components: {{Component_List}}
- Data_Source: {{API_Endpoint}}
- Behavioral_Notes: {{Behavioral_Notes}}

## API ENDPOINTS
Instruction: List every API route handler with method, path, request/response shape, auth requirements, and related FR IDs.

| Method | Path | Description | Auth | Related_FR_IDs |
|---|---|---|---|---|
| {{Method}} | {{Path}} | {{Description}} | {{Auth_Required}} | {{Related_FR_IDs}} |

## BACKGROUND JOBS
Instruction: List every scheduled sync job from 12_Database.md and 13_Technology_Specification.md with trigger, route handler, logic steps, and error handling.

### {{Job_Name}} ({{Job_ID}})
- Trigger: {{Trigger_Schedule}}
- Route_Handler: {{Route_Handler_Path}}
- Steps: {{Ordered_Steps}}
- Error_Handling: {{Error_Strategy}}
- Related_WF_IDs: {{Related_WF_IDs}}

## DESIGN SYSTEM
Instruction: Include the key design tokens from 14_Design_System.md: colors, typography, spacing, component patterns.

{{Design_System_Summary}}

## SECURITY CHECKLIST
Instruction: Consolidate security controls from 13_Technology_Specification.md, 05_Guidelines.md, and 03_Solution.md into actionable implementation rules.

{{Security_Implementation_Rules}}

## TESTING GUIDANCE
Instruction: Summarize test case expectations from 07_Code-And-Test.md. List test types, coverage targets, and critical test scenarios.

{{Testing_Summary}}

## IMPLEMENTATION ORDER
Instruction: Provide the recommended build sequence based on 06_Plan.md, dependencies, and risk controls.

| Build_Order | Work_Item | Depends_On | Acceptance_Check | Evidence_Expected |
|---|---|---|---|---|
| {{Order}} | {{Module_Story_Endpoint_Screen_or_Job}} | {{Dependency_List}} | {{Acceptance_Check}} | {{Evidence_Expected}} |

## DEPLOYMENT NOTES
Instruction: Include deployment configuration from 09_Release.md and 13_Technology_Specification.md.

{{Deployment_Notes}}

## GENERATION RULES
Instruction: Include these standing rules at the end of every build prompt.

1. Follow the tech stack exactly. Do not add unlisted dependencies.
2. Implement every screen, endpoint, and background job described above.
3. Enforce authentication and customer-scoped authorization on every data query.
4. Use the design system tokens for all UI styling.
5. Do not generate deployment scripts or CI/CD pipelines unless explicitly listed.
6. If any requirement is ambiguous, stop and request clarification.
7. Do not combine contracts, styles, UI markup, business logic, data access, and tests into monolithic files.
8. Do not introduce facts, dependencies, routes, schemas, screens, or business rules that are not present in the source artifact baseline.
9. Initialize or use the approved version-control repository as instructed, create/update the stack-appropriate ignore file, and never commit secrets, local environment values, dependency folders, build outputs, logs, caches, coverage reports, temporary files, or machine-specific files.

## DELIVERY REPORT REQUIREMENTS
Instruction: Tell the coding agent what to report after implementation.

- Changed_Files: {{Expected_Changed_File_Report_Format}}
- Validation_Commands: {{Expected_Test_Build_Lint_Report_Format}}
- Unimplemented_or_Blocked_Items: {{Blocked_Item_Report_Format}}
- Traceability_Summary: {{FR_NFR_Backlog_to_Implementation_Report_Format}}

## Traceability Instructions
Instruction: The build prompt must be traceable back to ADLC artifacts.

- Traceability_Rule_1: Every section maps to one or more ADLC artifact (Specification, Flows, Solution, etc.).
- Traceability_Rule_2: Every screen and endpoint maps to FR IDs.
- Traceability_Rule_3: Every security rule maps to NFR IDs or Guidelines sections.
- Traceability_Rule_4: Scope, non-goals, implementation order, and delivery report requirements map to ADLC baseline artifacts.
