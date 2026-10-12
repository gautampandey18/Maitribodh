# UI/UX Extraction Template

## Metadata
Instruction: Capture UI evidence from screenshots, wireframes, Figma exports, design notes, or requirement-document embedded visuals and map it to requirements.

- Project_Name: {{Project_Name}}
- UI_Reference_Folder: {{UI_Reference_Folder_Path}}
- UI_Reference_Manifest: {{UI_Reference_Manifest_Path}}
- Screen_Name: {{Screen_Name}}
- Screenshot_Filename: {{Screenshot_Filename}}
- Source_App_Version: {{Source_App_Version}}
- Date: {{Date}}
- Author: {{Author}}

## Purpose
Instruction: Document screen-level UI controls, placement, alignment, spacing, states, copy, and behaviors from UI reference evidence so an AI agent can generate the intended layout without duplicating design-system standards.

- UI_Extraction_Objective: {{UI_Extraction_Objective}}

## UI Artifact Boundaries
Instruction: Clarify what this artifact owns and how UI evidence embedded in requirements should be handled.

- Owns: Screen inventory, source visual references, control inventory, screen-level layout observations, interaction behavior, accessibility observations, and UI gaps.
- Does_Not_Own: Business requirement authority, reusable visual token standards, implementation file layout, API wiring, or component code structure.
- Embedded_Requirements_Image_Rule: If screenshots, wireframes, mockups, or UI diagrams are embedded inside requirement documents, treat the requirement document as a UI source and extract those details here with source document, page, section, image label, or nearest heading.
- Token_Rule: Colors, typography, spacing, borders, and iconography observed here are evidence only; normalized reusable tokens and component presentation rules belong in 14_Design_System.md.
- Duplication_Rule: Do not restate full FR/NFR text; reference requirement IDs and capture only the UI-specific interpretation or gap.

## Screen Summary
Instruction: Summarize the screen and its business purpose.

- Screen_ID: {{Screen_ID}}
- Screen_Purpose: {{Screen_Purpose}}
- Primary_User_Role: {{Primary_User_Role}}
- Related_FR_IDs: {{Related_FR_IDs}}
- Related_NFR_IDs: {{Related_NFR_IDs}}
- Related_Guideline_Refs: {{Related_Guideline_Refs}}

## Screenshot Reference
Instruction: Keep screenshot references explicit and traceable.

- Screenshot_Path: {{Screenshot_Path}}
- Source_Manifest_ID: {{UI_Source_Manifest_ID}}
- Screenshot_Description: {{Screenshot_Description}}
- Observed_Device_Size: {{Observed_Device_Size}}
- Observed_Breakpoint: {{Observed_Breakpoint}}
- Embedded_Source_Reference: {{Requirement_Document_Page_Section_Image_Label_or_Not_Applicable}}

## UI Source Inventory
Instruction: List screenshots, wireframes, Figma exports, design notes, and requirement-document embedded visuals consumed as UI evidence.

| UI_Source_ID | Source_File_or_Folder | Source_Type | Screen_or_Flow | Status | Usage | Notes |
|---|---|---|---|---|---|---|
| UI-SRC-001 | {{Source_File_or_Folder}} | {{Screenshot_Wireframe_Figma_DesignNote_RequirementEmbeddedImage}} | {{Screen_or_Flow}} | {{Approved_Draft_Reference_Only}} | {{Used_For}} | {{Notes}} |

## Layout Overview
Instruction: Capture the high-level screen structure and spatial organization.

- Layout_Type: {{Layout_Type}}  # e.g. dashboard, form, details page
- Grid_Columns: {{Grid_Columns}}
- Grid_Rows: {{Grid_Rows}}
- Primary_Alignment: {{Primary_Alignment}}  # e.g. left-aligned, centered
- Spacing_Strategy: {{Spacing_Strategy}}  # e.g. consistent 16px gutters
- Visual_Hierarchy: {{Visual_Hierarchy}}

## Control Inventory
Instruction: Record each visible control and its exact placement.

| Control_ID | Control_Type | Label/Text | Screen_Region | Alignment | Size/Spacing | State/Behavior | FR/NFR Reference | Notes |
|---|---|---|---|---|---|---|---|---|
| UI-001 | {{Control_Type}} | {{Label_Text}} | {{Screen_Region}} | {{Alignment}} | {{Size_Spacing}} | {{State_Behavior}} | {{FR_NFR_Reference}} | {{Notes}} |

## Navigation and Interaction Patterns
Instruction: Capture navigation behavior and interaction flows.

- Primary_Navigation: {{Primary_Navigation}}
- Secondary_Navigation: {{Secondary_Navigation}}
- Action_Button_Placement: {{Action_Button_Placement}}
- Modal_Behavior: {{Modal_Behavior}}
- Form_Submission_Flow: {{Form_Submission_Flow}}
- Error_Message_Placement: {{Error_Message_Placement}}

## Visual Design Tokens
Instruction: Capture observed visual token evidence from the UI source. Do not normalize or define reusable token standards here; those belong in 14_Design_System.md.

- Primary_Color: {{Primary_Color}}
- Secondary_Color: {{Secondary_Color}}
- Accent_Color(s): {{Accent_Colors}}
- Typography_Family: {{Typography_Family}}
- Typography_Sizes: {{Typography_Sizes}}
- Spacing_Units: {{Spacing_Units}}
- Border_Radius: {{Border_Radius}}
- Iconography: {{Iconography}}

## Accessibility Notes
Instruction: Identify accessibility behaviors and opportunities.

- Keyboard_Focus_Order: {{Keyboard_Focus_Order}}
- Screen_Reader_Labels: {{Screen_Reader_Labels}}
- Contrast_Observations: {{Contrast_Observations}}
- ARIA_Considerations: {{ARIA_Considerations}}
- Notes_on_Keyboard_Access: {{Notes_on_Keyboard_Access}}

## UI Differences and Gaps
Instruction: Capture mismatches between the existing UI and the requirements.

- Existing_UI_Behaviors: {{Existing_UI_Behaviors}}
- Missing_Requirements: {{Missing_Requirements}}
- Deviations_From_FR: {{Deviations_From_FR}}
- Recommended_Adjustments: {{Recommended_Adjustments}}

## Traceability Instructions
Instruction: Link every UI item back to requirements and documentation.

- Traceability_Rule_1: Each control entry must reference one or more FR/NFR IDs.
- Traceability_Rule_2: Each screenshot section must include a screenshot filename.
- Traceability_Rule_3: Any inferred layout or behavior must be marked as "Inferred" and tied to a requirement or noted as ambiguous.
- Traceability_Rule_4: UI decisions must reference the source artifact or screenshot source.
- Traceability_Rule_5: Every consumed UI reference must appear in UI Source Inventory.
- Traceability_Rule_6: Embedded requirement-document visuals must reference document, page/section, image label, or nearest heading.
