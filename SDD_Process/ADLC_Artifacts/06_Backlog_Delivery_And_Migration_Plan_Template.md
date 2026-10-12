# Backlog Delivery And Migration Plan Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Requirements: 02_Requirements_And_Scope.md
- Architecture: 04_Target_Solution_Architecture.md
- Technology: 05_Technology_Engineering_And_Design.md
- Current_State: {{03_Current_State_Analysis.md_or_Not_Applicable}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Owner: {{Owner}}

## Purpose
Instruction: Consolidate backlog, plan, estimates, sequencing, migration strategy, dependencies, milestones, and optional board export mapping.

- Delivery_Objective: {{Delivery_Objective}}
- Release_Strategy: {{Incremental_BigBang_Phased_Pilot_Other}}
- Migration_Strategy: {{Not_Applicable_Strangler_Rewrite_Replatform_Refactor_Retire_Parallel_Run_Other}}

## Backlog Hierarchy
| Backlog_ID | Type | Parent_ID | Title | Description | Priority | Acceptance_Criteria | Related_FR_NFR_WF_CMP_IDs | Source_IDs |
|---|---|---|---|---|---|---|---|---|
| EP-001 | {{Epic_Feature_UserStory_Task}} | {{Parent_ID_or_None}} | {{Title}} | {{Description}} | {{High_Medium_Low}} | {{Acceptance}} | {{IDs}} | {{Source_IDs}} |

## Backlog Intake Prioritization And Review Criteria
| Backlog_Control_ID | Backlog_ID | Priority_Method | Justification | Review_Criteria | Release_Group | Deferred_or_Out_Of_Scope_Reason |
|---|---|---|---|---|---|---|
| BLG-CTRL-001 | {{Backlog_ID}} | {{MoSCoW_WSJF_RICE_ValueRisk_Other}} | {{Justification}} | {{Criteria}} | {{Release_or_Phase}} | {{Reason_or_NA}} |

## Migration And Transition Plan
Instruction: Required for reverse-to-forward projects; mark Not Applicable for pure greenfield.

| Migration_ID | Current_State_ID | Target_Item_ID | Treatment | Migration_Steps | Data_or_Interface_Impact | Rollback_or_Fallback | Risk | Related_Backlog_IDs |
|---|---|---|---|---|---|---|---|---|
| MIG-001 | {{CUR_ID_or_NA}} | {{Target_ID}} | {{Retain_Modernize_Replace_Retire_Rebuild_Defer}} | {{Steps}} | {{Impact}} | {{Fallback}} | {{Risk}} | {{Backlog_IDs}} |

## Retained Replaced Retired Component Summary
Instruction: Required for reverse-to-forward, migration, modernization, rewrite, or enhancement projects.

| Component_Treatment_ID | Current_State_ID | Component_or_Capability | Treatment | Target_State_ID | Rationale | Risk | Approval_Status |
|---|---|---|---|---|---|---|---|
| TRT-001 | {{CUR_ID}} | {{Component_or_Capability}} | {{Retain_Modernize_Replace_Retire_Rebuild_Defer_Investigate}} | {{Target_ID}} | {{Rationale}} | {{Risk}} | {{Proposed_Approved_Rejected_Open}} |

## Migration Cutover And Reconciliation Strategy
Instruction: Required for any project with migration, modernization, replacement, or production cutover risk.

| Cutover_ID | Strategy_Area | Decision_or_Plan | Owner | Evidence_Required | Rollback_or_Fallback | Status |
|---|---|---|---|---|---|---|
| CUT-001 | {{Cutover_Model_Parallel_Run_Phased_Rollout_BigBang_Data_Reconciliation_Migration_Rehearsal_Rollback_Test_Production_Cutover}} | {{Decision_or_Plan}} | {{Owner}} | {{Evidence}} | {{Rollback_or_Fallback}} | {{Planned_Ready_Blocked_NA}} |

## Data Migration Reconciliation Checklist
Instruction: Directly reusable for Data_Migration-subtype Data & Analytics projects and for ongoing data-quality reconciliation on Data_Pipeline_ETL/Data_Warehouse_Lakehouse projects — this checklist already fits both purposes without structural change.

| Reconciliation_ID | Data_Set_or_Interface | Source_State | Target_State | Validation_Method | Acceptance_Threshold | Owner | Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| RECON-001 | {{Data_Set_or_Interface}} | {{Source}} | {{Target}} | {{Method}} | {{Threshold}} | {{Owner}} | {{Evidence}} | {{Not_Started_Pass_Fail_Blocked_NA}} |

## Delivery Phases And Milestones
Instruction: For Data & Analytics projects with a fixed engagement timeline, split backlog by data domain and include pilot/hypercare-style milestones (for example a pilot phase covering a subset of datasets, followed by a broader operational rollout inclusive of hypercare support).

| Phase_ID | Phase_Name | Duration_or_Window | Goals | Entry_Criteria | Exit_Criteria | Required_Evidence | Related_Backlog_IDs |
|---|---|---|---|---|---|---|---|
| PH-001 | {{Phase}} | {{Duration}} | {{Goals}} | {{Entry}} | {{Exit}} | {{Evidence}} | {{Backlog_IDs}} |

## Resource Ownership Handoff And Change Checkpoints
| Plan_Control_ID | Control_Type | Phase_ID | From_Role | To_Role_or_Owner | Item_or_Review_Focus | Acceptance_or_Evidence | Decision_Owner |
|---|---|---|---|---|---|---|---|
| PLAN-CTRL-001 | {{Resource_Ownership_Handoff_Change_Checkpoint_Decision_Gate}} | {{PH_ID}} | {{From_Role_or_NA}} | {{To_Role_or_Owner}} | {{Item_or_Focus}} | {{Evidence}} | {{Decision_Owner}} |

## Dependencies And Sequencing
| Dependency_ID | Depends_On | Blocks | Type | Owner | Mitigation | Related_Backlog_or_Migration_IDs |
|---|---|---|---|---|---|---|
| DEP-001 | {{Item}} | {{Item}} | {{Internal_External_Data_Security_UI_Environment_Vendor}} | {{Owner}} | {{Mitigation}} | {{IDs}} |

## Estimation Capacity And Forecast
| Estimate_ID | Scope_Item_ID | Estimate_Method | Effort_Estimate | Capacity_Assumption | Confidence | Key_Assumptions | Related_Risks |
|---|---|---|---|---|---|---|---|
| EST-001 | {{Backlog_ID}} | {{TShirt_StoryPoints_IdealDays_Range_Other}} | {{Estimate}} | {{Capacity}} | {{High_Medium_Low}} | {{Assumptions}} | {{Risk_IDs}} |

| Forecast_ID | Scenario | Scope_Included | Team_Capacity | Forecast_Window | Confidence | Constraints_or_Dependencies |
|---|---|---|---|---|---|---|
| FC-001 | {{Optimistic_Expected_Conservative}} | {{Backlog_IDs}} | {{Capacity}} | {{Window}} | {{High_Medium_Low}} | {{Constraints}} |

## Board Export Mapping
| Tool_Field | Source_Value | Export_Value | Required | Notes |
|---|---|---|---|---|
| {{AzureBoards_or_Jira_Field}} | {{Backlog_Field}} | {{Export_Value}} | {{Yes_No}} | {{Notes}} |

## Export Readiness And Parent Child Validation
| Export_Check_ID | Check_Type | Check | Status | Gap_or_Action | Related_Backlog_IDs |
|---|---|---|---|---|---|
| EXPORT-001 | {{FieldMapping_ParentChild_ImportPackage_NonExported_Blocked_Deferred}} | {{Check}} | {{Ready_Blocked_NA}} | {{Gap_or_Action}} | {{Backlog_IDs}} |

## Delivery Risks And Open Questions
| Risk_ID | Risk_or_Question | Likelihood | Impact | Response | Owner | Blocking | Related_IDs |
|---|---|---|---|---|---|---|---|
| PLAN-RISK-001 | {{Risk}} | {{Low_Medium_High}} | {{Low_Medium_High}} | {{Response}} | {{Owner}} | {{Yes_No}} | {{IDs}} |

## Traceability Instructions
- Every backlog item must map to requirements, architecture, current-state treatment, or governance decision.
- Every migration item must map current state to target state and have rollback/fallback guidance.
- Every reverse-to-forward component must have a treatment: retain, modernize, replace, retire, rebuild, defer, or investigate.
- Every migration/cutover plan must include cutover strategy, rehearsal or readiness evidence, data/interface reconciliation when applicable, and rollback/fallback.
- Every phase must include acceptance evidence and quality/release handoff expectations.
