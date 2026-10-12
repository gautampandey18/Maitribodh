# Source Baseline Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Source_Baseline_Owner: {{Owner}}

## Purpose
Instruction: Create a complete evidence baseline from all project files placed in `Input Artifacts/`. This artifact replaces scattered manifests as the generated project's single source inventory.

- Baseline_Objective: {{Baseline_Objective}}
- Source_Root: `{{WORKING_FOLDER_PATH}}/Input Artifacts/`
- Output_Root: `{{WORKING_FOLDER_PATH}}/Generated Artifacts/`
- Evidence_Rule: Inputs are reference evidence until extracted into optimized ADLC artifacts.
- Input_Organization_Rule: Users may place files directly under `Input Artifacts/`; category subfolders and manifests are optional.
- Auto_Classification_Rule: Classify sources by path, filename, extension, and content signals. When uncertain, classify as `Other` and record the uncertainty.
- Baseline_Mode: {{Initial_Generation_Change_Impact_Regeneration}}
- Baseline_ID: {{SRC-BL-001}}
- Baseline_Created_At: {{YYYY-MM-DD_or_DateTime}}
- Previous_Baseline_ID: {{Previous_Baseline_ID_or_Not_Applicable}}
- Current_Baseline_Status: {{Current_Stale_Superseded_Under_Review}}

## Consolidated Source Inventory
Instruction: Inventory every usable file from the root of `Input Artifacts/` and all nested folders. Include requirements, meeting notes, emails, PDFs, Excel/CSV files, UI images, database files, API specs, architecture diagrams, source-code snapshots, dependency files, configs, logs, and test reports.

| Source_ID | File_or_Folder | Original_Location | Source_Type | Classification_Method | Format | Status | Priority | Consumed_By_Artifacts | Key_Facts_Extracted | Gaps_or_Risks |
|---|---|---|---|---|---|---|---|---|---|---|
| SRC-001 | {{Path}} | {{Root_or_Subfolder}} | {{Requirement_MeetingNote_Email_PDF_Spreadsheet_UI_Database_API_Architecture_Codebase_Config_Log_Test_Pipeline_Config_Notebook_BI_Artifact_Data_Catalog_Entry_Other_Out_Of_Domain_Scope}} | {{Path_Filename_Extension_Content_Manifest_Manual}} | {{Format}} | {{Approved_Draft_Reference_Only_Unknown}} | {{Primary_Supporting_Reference}} | {{Artifact_List}} | {{Facts}} | {{Gaps_or_Risks}} |

## Data Source And Table Profile Register
Instruction: Populate when `Domain: Data_And_Analytics` in `00_Project_Intake_And_Mode.md`. Extends the Consolidated Source Inventory with data-specific profiling for datasets, tables, and reports; leave Not Applicable for Software-domain projects.

| Profile_ID | Source_ID | Dataset_or_Table_or_Report | Row_or_Record_Count | Refresh_Cadence | System_Of_Record_Owner | Classification | PII_Tag | Quality_Risk_Flag |
|---|---|---|---|---|---|---|---|---|
| PROFILE-001 | {{SRC_ID}} | {{Name}} | {{Count_or_Unknown}} | {{Cadence_or_Not_Applicable}} | {{Owner}} | {{Public_Internal_Confidential_Restricted}} | {{Yes_No_Unknown}} | {{None_Low_Medium_High}} |

## Auto-Classification Summary
Instruction: Summarize how root-level and subfolder files were classified.

| Classification_ID | Signal | Source_Type_Assigned | Files_Matched | Confidence | Review_Needed |
|---|---|---|---|---|---|
| CLASSIFY-001 | {{Signal_or_Rule}} | {{Source_Type}} | {{File_List_or_Count}} | {{High_Medium_Low}} | {{Yes_No}} |

## Source Version Register
Instruction: Record a comparable baseline for every consumed source. Use whatever identifier is available: file timestamp, checksum/hash, version number, document revision, commit ID, email date, or manual baseline note.

| Source_ID | File_or_Folder | Baseline_Version | Fingerprint_or_Timestamp | Size_or_Revision | Baseline_Status | Last_Seen | Notes |
|---|---|---|---|---|---|---|---|
| SRCVER-001 | {{Path}} | {{Version_or_Revision_or_Commit_or_Not_Available}} | {{Hash_Timestamp_or_Manual_Fingerprint}} | {{Size_or_Revision}} | {{New_Unchanged_Changed_Removed_Unknown}} | {{YYYY-MM-DD_or_DateTime}} | {{Notes}} |

## Post-Generation Source Change Log
Instruction: Use this section when input files change after first-generation. Do not blindly regenerate all artifacts; record the delta, impact, and regeneration decision first.

| Change_ID | Detected_At | Source_ID | Change_Type | Change_Severity | Change_Summary | Previous_Baseline | New_Baseline | Impact_Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| SRC-CHG-001 | {{YYYY-MM-DD_or_DateTime}} | {{Source_ID}} | {{Added_Modified_Removed_Renamed_Reclassified}} | {{Low_Medium_High_Critical}} | {{Summary}} | {{Previous_Baseline}} | {{New_Baseline}} | {{No_Impact_Impact_Assessment_Needed_Impacted_Approved_Rejected}} | {{Owner}} |

## Changed Source Impact Summary
Instruction: Map each post-generation source change to affected optimized artifacts and downstream regeneration needs.

| Impact_ID | Change_ID | Affected_Facts_or_IDs | Impacted_Artifacts | Regeneration_Action | Downstream_Dependencies | Validation_Impact | Build_Prompt_Impact | Governance_Needed |
|---|---|---|---|---|---|---|---|---|
| IMPACT-001 | {{SRC_CHG_ID}} | {{FR_NFR_WF_UI_DATA_INT_CUR_IDs_or_Facts}} | {{Artifact_List}} | {{No_Regeneration_Regenerate_Revise_Review_Clarify}} | {{Artifact_List}} | {{Revalidate_Not_Required}} | {{None_Stale_Regenerate_Review}} | {{Yes_No}} |

## Regeneration Decision Matrix
Instruction: Apply these default rules unless a governance decision overrides them.

| Change_Area | Default_Impacted_Artifacts | Default_Action |
|---|---|---|
| Requirements | 02, 04, 05, 06, 07, 08, 09, 10 | Regenerate affected artifacts and all downstream dependents |
| UI | 05, 06 if backlog affected, 07, 09, 10 | Revise UI/design/build/test sections |
| Database_or_Data | 04, 05, 06, 07, 08, 09, 10 | Revise data architecture, migration, validation, release, and build prompt |
| Data_Pipeline_Or_BI_Artifact | 03, 04, 05, 06, 07, 08, 09, 10 | Revise pipeline/orchestration inventory and architecture, data quality validation, and build prompt (Domain: Data_And_Analytics only) |
| Technical_Stack_or_Architecture | 04, 05, 06, 07, 08, 09, 10 | Regenerate target architecture, technology, plan, validation, release, and build prompt |
| Codebase_Current_State | 03, 04, 06, 07, 08, 09, 10 | Refresh current-state analysis and impacted target/transition artifacts |
| Governance_or_Release | 08, 09, 10 | Revise governance/release and rebuild readiness |
| Validation_Rules | 10, and 09 if build readiness changes | Re-run validation and update build prompt status |

## Source Precedence And Conflict Rules
Instruction: Resolve input priority without inventing facts.

- Approved business requirements outrank notes, emails, and draft references.
- Approved clarifications outrank earlier ambiguous statements.
- Existing source code is current-state evidence, not automatic future-state scope.
- Technical references can justify implementation choices only after being mapped to requirements, architecture, or governance.
- If sources conflict, record the conflict and route it to 02_Requirements_And_Scope.md, 04_Target_Solution_Architecture.md, or 08_Release_Operations_And_Governance.md.

## Source Conflict Register
| Conflict_ID | Source_A | Source_B | Conflict | Impact | Proposed_Resolution | Owner | Status |
|---|---|---|---|---|---|---|---|
| CONFLICT-001 | {{Source_ID}} | {{Source_ID}} | {{Conflict}} | {{Impact}} | {{Resolution_or_Open_Question}} | {{Owner}} | {{Open_Resolved_Governance_Needed}} |

## Source Coverage Map
| Artifact | Required_Source_Types | Available | Missing | Impact |
|---|---|---|---|---|
| 02_Requirements_And_Scope.md | Requirements, notes, emails, business PDFs, spreadsheets | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |
| 03_Current_State_Analysis.md | Codebase, configs, dependency reports, logs, tests | {{Yes_No_Partial_NA}} | {{Missing}} | {{Impact}} |
| 04_Target_Solution_Architecture.md | Requirements, technical references, current-state analysis | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |
| 05_Technology_Engineering_And_Design.md | Tech refs, UI refs, design notes, architecture | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |
| 06_Backlog_Delivery_And_Migration_Plan.md | Requirements, target architecture, current-state analysis when applicable | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |
| 07_Quality_Test_And_Validation.md | Requirements, NFRs, test reports, regression needs | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |
| 08_Release_Operations_And_Governance.md | Quality gates, release needs, approvals, compliance, ops evidence | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |
| 09_Build_Prompt.md | Approved generated artifacts | {{Yes_No_Partial}} | {{Missing}} | {{Impact}} |

## Traceability Instructions
- Every downstream requirement, architecture element, backlog item, test, release item, and build instruction must reference one or more Source_IDs or generated artifact IDs.
- Files not consumed must be listed with a reason.
- Sensitive, redacted, inaccessible, or unreadable files must be recorded as risks.
- Every post-generation source change must have a Change_ID, impact assessment, regeneration decision, validation impact, and build-prompt impact.
- If any source change marks `Build_Prompt_Impact` as `Stale`, `09_Build_Prompt.md` must not be used until regenerated or approved by governance.
