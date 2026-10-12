# Technology Specification Template

## Metadata
Instruction: Capture technology decisions, project structure, and implementation-specific constraints that complement the technology-agnostic ADLC artifacts.

- Project_Name: {{Project_Name}}
- Requirement_Specification_Document: {{Requirement_Specification_Document_Name}}
- Solution_Document: {{Solution_Document_Name}}
- Technical_Reference_Folder: {{Technical_Reference_Folder_Path_or_Not_Applicable}}
- Technical_Reference_Manifest: {{Technical_Reference_Manifest_Path_or_Not_Applicable}}
- Database_Reference_Folder: {{Database_Reference_Folder_Path_or_Not_Applicable}}
- UI_Reference_Folder: {{UI_Reference_Folder_Path_or_Not_Applicable}}
- Design_System_Document: {{Design_System_Document_Name_or_Not_Applicable}}
- Version: {{Document_Version}}
- Date: {{Date}}
- Author: {{Author}}

## Purpose
Instruction: Define the concrete technology stack, project structure, integration patterns, and operational guidelines so an implementation agent can build the application without ambiguity.

- Technology_Specification_Objective: {{Technology_Specification_Objective}}

## Technical Source Inventory
Instruction: List technical references used to justify technology, integration, deployment, configuration, or implementation decisions. Mark recommendations clearly when no source mandates a choice.

| Technology_Source_ID | Source_File_or_Folder | Source_Type | Decision_Area | Status | Usage | Related_IDs |
|---|---|---|---|---|---|---|
| TECH-SRC-001 | {{Source_File_or_Folder}} | {{API_Spec_Architecture_IntegrationNote_DatabaseReference_UIReference}} | {{Stack_Integration_Deployment_Config_Security}} | {{Approved_Draft_Reference_Only}} | {{Used_For}} | {{FR_NFR_CMP_INT_ID_List}} |

## Technology Stack
Instruction: List every technology, library, and tool with pinned version ranges. Do not introduce unlisted dependencies during implementation.

| Layer | Technology | Version | Notes |
|---|---|---|---|
| {{Layer}} | {{Technology}} | {{Version}} | {{Notes}} |

## Project Structure
Instruction: Define the directory layout, file naming conventions, and module organization.

```
{{Project_Directory_Tree}}
```

- Routing_Model: {{Routing_Model}}
- API_Style: {{API_Style}}
- Module_Organization: {{Module_Organization}}

## Version Control and Repository Hygiene
Instruction: Define source-control expectations for the generated application without prescribing a hosting vendor or branching tool unless mandated upstream.

- Repository_Initialization: {{Initialize_New_Repository_Use_Existing_Repository_Not_Applicable}}
- Ignore_File_Rule: Include an ignore file appropriate to the selected stack and exclude dependencies, build outputs, local environment files, secrets, logs, caches, coverage reports, temporary files, and machine-specific files.
- Commit_Readiness_Rule: The implementation handoff must be commit-ready with no secrets, credentials, tokens, local paths, or generated transient artifacts included.
- Branching_Model: {{Branching_Model_or_Not_Specified}}
- Protected_File_Patterns: {{Files_or_Patterns_Never_To_Commit}}
- Baseline_Handoff: {{Initial_Baseline_Tag_Branch_or_Commit_Expectation_or_Not_Applicable}}
- Related_IDs: {{NFR_CON_GOV_REL_ID_List}}

## Authentication and Authorization
Instruction: Document identity provider integration, session management, and RBAC implementation details.

- Identity_Provider: {{Identity_Provider}}
- Auth_Library: {{Auth_Library}}
- Session_Strategy: {{Session_Strategy}}
- Role_Definitions: {{Role_Definitions}}
- Scope_Enforcement: {{Scope_Enforcement}}

## Database Configuration
Instruction: Document database connection, ORM setup, migration strategy, and schema conventions.

- Database_Technology: {{Database_Technology}}
- ORM: {{ORM}}
- Connection_Strategy: {{Connection_Strategy}}
- Migration_Tool: {{Migration_Tool}}
- Schema_Conventions: {{Schema_Conventions}}
- Seed_Data_Strategy: {{Seed_Data_Strategy}}

## Integration Patterns
Instruction: Document how each external system is connected, including protocols, SDKs, and error handling.

| Integration_ID | External_System | SDK_or_Protocol | Auth_Method | Error_Strategy | Related_FR_IDs |
|---|---|---|---|---|---|
| INTG-001 | {{External_System}} | {{SDK_or_Protocol}} | {{Auth_Method}} | {{Error_Strategy}} | {{Related_FR_IDs}} |

## Scheduler and Background Jobs
Instruction: Document job trigger mechanism, execution environment, and monitoring approach.

- Trigger_Mechanism: {{Trigger_Mechanism}}
- Execution_Environment: {{Execution_Environment}}
- Job_Definitions:

| Job_ID | Trigger_Schedule | Route_Handler | Description | Related_WF_IDs |
|---|---|---|---|---|
| {{Job_ID}} | {{Cron_Schedule}} | {{Route_Handler}} | {{Description}} | {{Related_WF_IDs}} |

- Monitoring_Strategy: {{Monitoring_Strategy}}
- Retry_Policy: {{Retry_Policy}}

## Security Controls
Instruction: Document OWASP alignment, input validation, rate limiting, and network security.

- OWASP_Controls: {{OWASP_Controls}}
- Input_Validation: {{Input_Validation}}
- Rate_Limiting: {{Rate_Limiting}}
- CORS_Policy: {{CORS_Policy}}
- CSP_Headers: {{CSP_Headers}}
- Secret_Management: {{Secret_Management}}

## Observability
Instruction: Document logging, monitoring, alerting, and performance tracking.

- Logging_Framework: {{Logging_Framework}}
- Log_Levels: {{Log_Levels}}
- Metrics_Collection: {{Metrics_Collection}}
- Alerting_Rules: {{Alerting_Rules}}

## Environment Configuration
Instruction: Document environment variable strategy and deployment configuration.

- Config_Strategy: {{Config_Strategy}}
- Required_Environment_Variables:

| Variable | Description | Required | Default |
|---|---|---|---|
| {{Variable}} | {{Description}} | {{Yes_No}} | {{Default}} |

## Deployment
Instruction: Document deployment target, CI/CD approach, and infrastructure requirements.

- Deployment_Target: {{Deployment_Target}}
- CI_CD_Pipeline: {{CI_CD_Pipeline}}
- Build_Command: {{Build_Command}}
- Health_Check_Endpoint: {{Health_Check_Endpoint}}
- Scaling_Strategy: {{Scaling_Strategy}}

## Traceability Instructions
Instruction: Link technology decisions back to solution components and requirements.

- Traceability_Rule_1: Each tech stack entry maps to one or more Solution Component IDs.
- Traceability_Rule_2: Each integration pattern maps to FR/NFR IDs.
- Traceability_Rule_3: Security controls map to NFR IDs and Guidelines sections.
- Traceability_Rule_4: Job definitions map to Flows WF IDs.
- Traceability_Rule_5: Every source-derived technology decision maps to Technical Source Inventory or upstream ADLC artifacts.
- Traceability_Rule_6: Non-source-derived technology or file-structure choices must be marked `[RECOMMENDATION]`.
- Traceability_Rule_7: Version-control and ignore-file rules map to maintainability, security, release, or governance IDs.
