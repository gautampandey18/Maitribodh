# Build Prompt Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Source_Artifacts: {{00_to_08_Optimized_Artifacts_With_Versions}}
- Generated_Date: {{Date}}
- Scope: {{Build_Phase_Scope}}
- Build_Target_Type: {{Application_Code | Data_Pipeline | BI_Semantic_Model_And_Dashboards | Mixed}}

## Purpose
Instruction: Produce the final deterministic implementation prompt for a coding agent, data/pipeline engineering agent, or development team. This artifact intentionally consolidates approved details from optimized ADLC artifacts. `Build_Target_Type` decides whether the Screens Components And Design System section applies or whether the Data Pipeline And Model Build Specification section applies (see below) — never populate a section that does not match `Build_Target_Type`.

## Validation Preconditions
Instruction: This build prompt is not ready for implementation until validation passes or exceptions are approved.

- Validation_Report: {{10_ADLC_Validation_Report.md_or_Not_Generated}}
- Validation_Result: {{Pass_Conditional_Pass_Fail_Not_Run}}
- Build_Prompt_Status: {{Ready_Conditional_Not_Ready}}
- Source_Baseline_ID: {{SRC-BL-ID}}
- Source_Baseline_Status: {{Current_Stale_Conditional}}
- Open_Source_Change_IDs: {{SRC_CHG_IDs_or_None}}
- Approved_Exceptions: {{Approved_Exception_IDs_or_None}}
- Required_Before_Build: {{Required_Actions_or_None}}

## Do Not Build If
Instruction: A coding agent must stop before implementation when any of these conditions are true.

| Blocker_ID | Do_Not_Build_Condition | Source_Artifact | Required_Resolution |
|---|---|---|---|
| DNB-001 | {{Unresolved_Blocking_Question_Unapproved_Scope_Missing_Validation_Report_Failed_Validation_Unapproved_Dependency_Missing_Migration_Rollback_Missing_Data_Reconciliation_Missing_Security_Approval}} | {{Artifact}} | {{Resolution}} |
| DNB-002 | {{Source_Baseline_Changed_Open_Source_Impact_Build_Prompt_Stale_Impacted_Artifacts_Not_Revalidated}} | {{01_Source_Baseline_10_ADLC_Validation_Report}} | {{Regenerate_or_Approve_Exception}} |

## Source Artifact Baseline
| Artifact | Version | Status | Used_For | Notes |
|---|---|---|---|---|
| 00_Project_Intake_And_Mode.md | {{Version}} | {{Approved_Draft}} | Mode, tier, applicability | {{Notes}} |
| 01_Source_Baseline.md | {{Version}} | {{Approved_Draft}} | Source evidence | {{Notes}} |
| 02_Requirements_And_Scope.md | {{Version}} | {{Approved_Draft}} | Requirements, scope, flows | {{Notes}} |
| 03_Current_State_Analysis.md | {{Version_or_NA}} | {{Approved_Draft_NA}} | Current-state constraints | {{Notes}} |
| 04_Target_Solution_Architecture.md | {{Version}} | {{Approved_Draft}} | Architecture, data, integrations, security | {{Notes}} |
| 05_Technology_Engineering_And_Design.md | {{Version}} | {{Approved_Draft}} | Stack, standards, UI, design | {{Notes}} |
| 06_Backlog_Delivery_And_Migration_Plan.md | {{Version}} | {{Approved_Draft}} | Build sequence, backlog, migration | {{Notes}} |
| 07_Quality_Test_And_Validation.md | {{Version}} | {{Approved_Draft}} | Test and quality gates | {{Notes}} |
| 08_Release_Operations_And_Governance.md | {{Version}} | {{Approved_Draft}} | Release, ops, approvals, exceptions | {{Notes}} |
| 10_ADLC_Validation_Report.md | {{Version_or_NA}} | {{Pass_Conditional_Fail_Not_Generated}} | Final validation and build readiness | {{Notes}} |

## Build Orchestration Handshake
Instruction: Required for enterprise-scale, multi-agent, or multi-session implementation. Mark single-agent/simple build explicitly when not applicable.

- Build_Orchestration_Mode: {{Single_Agent_Multi_Agent_Multi_Session_Hybrid}}
- Build_Session_ID: {{BUILD-SESSION-ID}}
- Build_Orchestrator: {{Owner_or_Agent}}
- Primary_Build_Source: 09_Build_Prompt.md
- Accepted_Artifact_Baseline: {{00_to_10_Artifact_Versions}}
- Source_Baseline_ID: {{SRC-BL-ID}}
- Shared_File_Approval_Model: {{Orchestrator_Approval_Required_or_Not_Applicable}}
- Final_Integration_Owner: {{Owner_or_Agent}}

## Agent Role And Ownership Matrix
| Agent_ID | Role | Owned_Files_or_Areas | Shared_Files | Required_Input_Artifacts | Allowed_Actions | Required_Validation | Handoff_Recipient |
|---|---|---|---|---|---|---|---|
| AGENT-001 | {{Build_Orchestrator_Scaffold_Frontend_Backend_Database_Integration_QA_Security_Release_Governance}} | {{Owned_Areas}} | {{Shared_Files_or_None}} | {{Artifact_List}} | {{Actions}} | {{Validation}} | {{Recipient}} |

## Shared File And Conflict Protocol
| Protocol_ID | Shared_File_or_Area | Edit_Rule | Approval_Required | Conflict_Detection | Conflict_Resolution | Related_Owner |
|---|---|---|---|---|---|---|
| SHARED-001 | {{File_or_Area}} | {{Edit_Rule}} | {{Yes_No}} | {{Detection_Method}} | {{Resolution_Path}} | {{Owner}} |

## Session Handoff Contract
| Handoff_ID | From_Agent_or_Session | To_Agent_or_Session | Handoff_Items | Required_Context | Validation_Result | Open_Risks | Acceptance_Status |
|---|---|---|---|---|---|---|---|
| HANDOFF-001 | {{From}} | {{To}} | {{Items}} | {{Context}} | {{Validation}} | {{Risks}} | {{Accepted_Rejected_Pending}} |

## Build Wave Plan
| Wave_ID | Workstreams | Entry_Criteria | Parallelism_Rule | Exit_Criteria | Integration_Gate | Owner |
|---|---|---|---|---|---|---|
| WAVE-001 | {{Workstreams}} | {{Entry_Criteria}} | {{None_Limited_Parallel}} | {{Exit_Criteria}} | {{Gate}} | {{Owner}} |

## Integration And Acceptance Gates
| Build_Gate_ID | Gate | Required_Evidence | Owner | Decision | Blocking_If_Failed | Related_IDs |
|---|---|---|---|---|---|---|
| BUILD-GATE-001 | {{Baseline_Build_Contract_Check_UI_Integration_Security_QA_Release_Readiness_Final_Handoff}} | {{Evidence}} | {{Owner}} | {{Pass_Fail_Conditional}} | {{Yes_No}} | {{IDs}} |

## Build Scope And Non-Goals
- In_Scope: {{In_Scope_Items}}
- Out_Of_Scope: {{Out_Of_Scope_Items}}
- Deferred_Items: {{Deferred_Backlog_or_Governance_IDs}}
- Migration_Constraints: {{Migration_Constraints_or_Not_Applicable}}
- Clarification_Triggers: {{Ambiguity_Conflict_Missing_Evidence_Triggers}}

## Mission
{{Mission_Statement}}

## Mandatory Tech Stack
Instruction: Implement exactly the following versions. Do not introduce unlisted dependencies.

| Layer | Technology | Version |
|---|---|---|
| {{Layer}} | {{Technology}} | {{Version}} |

## Project Structure
Instruction: Scaffold the project exactly as follows unless an approved governance exception exists.

```text
{{Project_Directory_Tree}}
```

## Repository And Ignore File Requirements
- Repository_Expectation: {{Initialize_New_Repository_Use_Existing_Repository_Not_Applicable}}
- Ignore_File_Requirements: Exclude secrets, credentials, tokens, local environment files, dependency folders, build outputs, logs, caches, coverage reports, temporary files, and machine-specific files.
- Never_Commit: {{Never_Commit_List}}
- Baseline_Handoff: {{Commit_Ready_Baseline_or_Not_Applicable}}

## Data Model And Migration
| Data_or_Table | Purpose | Fields_or_Objects | Constraints | Relationships | Migration_or_Seed_Needs | Related_IDs |
|---|---|---|---|---|---|---|
| {{Data_or_Table}} | {{Purpose}} | {{Fields}} | {{Constraints}} | {{Relationships}} | {{Migration}} | {{IDs}} |

## Migration-Specific Build Constraints
Instruction: Required for reverse-to-forward, migration, modernization, rewrite, or enhancement projects.

| Migration_Constraint_ID | Current_State_ID | Target_State_ID | Constraint | Cutover_or_Reconciliation_Need | Rollback_or_Fallback | Build_Impact | Related_IDs |
|---|---|---|---|---|---|---|---|
| MIG-BUILD-001 | {{CUR_ID_or_NA}} | {{Target_ID}} | {{Constraint}} | {{Need}} | {{Rollback_or_Fallback}} | {{Impact}} | {{IDs}} |

## Authentication Authorization Security
{{Auth_Authorization_Security_Implementation_Instructions}}

## Screens Components And Design System
Instruction: Applies when `Build_Target_Type` is `Application_Code` or `BI_Semantic_Model_And_Dashboards`. Not applicable for `Data_Pipeline` builds — omit this section rather than leaving it empty.

| Screen_or_Component | Route_or_Usage | Layout_or_Composition | Data_Source | Behavior | Design_Tokens_or_Patterns | Related_IDs |
|---|---|---|---|---|---|---|
| {{Screen_or_Component}} | {{Route}} | {{Layout}} | {{Data_Source}} | {{Behavior}} | {{Design}} | {{IDs}} |

## Data Pipeline And Model Build Specification
Instruction: Required when `Build_Target_Type` is `Data_Pipeline` or `BI_Semantic_Model_And_Dashboards`; mark Not Applicable for `Application_Code`.

| Build_Item_ID | Item_Type | Source_Dataset | Target_Dataset_or_Artifact | Logic_or_Transformation_Ref | Modeling_Pattern | Schedule_or_Trigger | Validation_Check | Related_IDs |
|---|---|---|---|---|---|---|---|---|
| DATA-BUILD-001 | {{Pipeline_Stage_DAG_Task_Transformation_Feature_Engineering_Serving_Endpoint}} | {{Source}} | {{Target}} | {{Logic_Ref}} | {{Data_Vault_Hub_Link_Satellite_or_Dimensional_Fact_Dim_SCD_or_Not_Applicable}} | {{Schedule}} | {{Validation_Check}} | {{IDs}} |

## API Endpoints Integrations And Jobs
| Type | Method_or_Trigger | Path_or_Name | Request_Input | Response_Output | Auth | Error_Handling | Monitoring | Related_IDs |
|---|---|---|---|---|---|---|---|---|
| {{API_Integration_Job_Event_File_Pipeline_Task}} | {{Method_or_Trigger}} | {{Path_or_Name}} | {{Input}} | {{Output}} | {{Auth}} | {{Error}} | {{Monitoring}} | {{IDs}} |

## Implementation Order
| Build_Order | Work_Item | Depends_On | Acceptance_Check | Evidence_Expected |
|---|---|---|---|---|
| {{Order}} | {{Module_Story_Endpoint_Screen_Job_Migration}} | {{Dependencies}} | {{Acceptance}} | {{Evidence}} |

## Testing And Validation Requirements
- Required_Test_Types: {{Test_Types}}
- Coverage_Targets: {{Coverage_Targets}}
- Critical_Test_Scenarios: {{Critical_Test_Scenarios}}
- Validation_Commands: {{Validation_Commands}}
- Evidence_Required: {{Evidence_Required}}
- ADLC_Validation_Report_Requirements: {{Traceability_Summary_Blocker_Status_Approved_Exceptions}}

## Deployment And Operations Notes
{{Deployment_Operations_Notes}}

## Generation Rules
1. Follow the approved tech stack exactly.
2. Do not add unapproved dependencies, routes, screens, APIs, schemas, jobs, deployment behavior, or business rules.
3. Enforce authentication, authorization, and scoped data access on every protected operation.
4. Use approved design tokens and component patterns.
5. Keep contracts, UI, styling, business logic, data access, integrations, configuration, and tests separated.
6. If a requirement is ambiguous or conflicting, stop and request clarification.
7. Do not commit or include secrets, local environment values, dependency folders, build outputs, logs, caches, coverage reports, temporary files, or machine-specific files.
8. For reverse-to-forward projects, do not reproduce current-state behavior unless it is explicitly retained in the target artifacts.
9. Do not start implementation if `10_ADLC_Validation_Report.md` is missing, failed, or contains open blockers, unless an approved governance exception is listed.
10. Do not start implementation if source baseline status is stale, any source impact is open, or impacted artifacts have not been regenerated/revalidated.
11. Multi-agent or multi-session builds must follow the orchestration handshake, ownership matrix, shared-file protocol, handoff contract, wave plan, and acceptance gates.
12. For `Build_Target_Type: Data_Pipeline` or `BI_Semantic_Model_And_Dashboards`, build idempotent pipeline stages, define a test-data strategy using synthetic or masked production-like datasets, and include observability hooks for every pipeline stage.

## Delivery Report Requirements
- Changed_Files: {{Expected_Changed_File_Report_Format}}
- Validation_Commands: {{Expected_Test_Build_Lint_Report_Format}}
- Unimplemented_or_Blocked_Items: {{Blocked_Item_Report_Format}}
- Traceability_Summary: {{FR_NFR_Backlog_to_Implementation_Report_Format}}
- Risks_And_Exceptions: {{Risk_Exception_Report_Format}}

## Traceability Instructions
- Every build instruction must map to 02, 04, 05, 06, 07, or 08.
- Every screen, endpoint, data object, job, migration, and test must map to requirements and backlog IDs.
- Scope, non-goals, migration constraints, and exceptions must map to governance or delivery IDs.
- Validation preconditions and do-not-build blockers must map to 07, 08, or 10.
- Source baseline status and open source changes must map to 01 and 10.
- Build orchestration ownership, shared-file exceptions, handoffs, and conflicts must map to 08 governance or build gate IDs.
- Every Data Pipeline And Model Build Specification row must map to a Data Pipeline And Storage Architecture or BI Semantic Model And Metric Layer Architecture element in 04_Target_Solution_Architecture.md.
