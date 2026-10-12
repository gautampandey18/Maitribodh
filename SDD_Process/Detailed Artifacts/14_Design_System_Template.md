# Design System Template

## Metadata
Instruction: Define visual design tokens and component standards so all UI implementation follows a consistent, documented system.

- Project_Name: {{Project_Name}}
- UI_Document: {{UI_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}
- Author: {{Author}}

## Purpose
Instruction: Establish a single source of truth for color, typography, spacing, and component styling tokens used across all screens.

- Design_System_Objective: {{Design_System_Objective}}

## Design Source Inventory
Instruction: Record UI sources used to derive the design system; do not invent brand or styling choices without marking them as recommendations.

| Source_ID | Source_Type | Source_Name_or_Path | Used_For | Status |
|---|---|---|---|---|
| DSRC-001 | {{UI_Document_Screenshot_Wireframe_Figma_Design_Note_Recommendation}} | {{Source_Name_or_Path}} | {{Colors_Typography_Layout_Component_State}} | {{Approved_Assumed_Recommendation}} |

## Design System Boundaries
Instruction: Keep this artifact focused on reusable visual standards, not implementation file layout.

- Owns: Visual tokens, reusable component patterns, interaction states, accessibility styling rules, responsive design rules.
- Does_Not_Own: Screen-by-screen control inventories, exact per-screen placement, application folder structure, framework component files, API wiring, business logic, or deployment configuration.
- Implementation_Link: File layout and technical implementation belong in 13_Technology_Specification.md and 07_Code-And-Test.md.
- UI_Evidence_Link: Screen-specific evidence belongs in 11_UI.md; this artifact normalizes repeated observations into reusable standards.

## Color Palette
Instruction: Define all color tokens with technology-neutral values. Include framework-specific class mappings only if mandated by 13_Technology_Specification.md.

### Primary Colors
| Token | Value | Optional_Implementation_Alias | Usage |
|---|---|---|---|
| {{Token}} | {{Hex_RGBA_HSL_or_Named_Value}} | {{Alias_or_Not_Applicable}} | {{Usage}} |

### Neutral Colors
| Token | Value | Optional_Implementation_Alias | Usage |
|---|---|---|---|
| {{Token}} | {{Hex_RGBA_HSL_or_Named_Value}} | {{Alias_or_Not_Applicable}} | {{Usage}} |

### Semantic Colors
| Token | Value | Optional_Implementation_Alias | Usage |
|---|---|---|---|
| {{Token}} | {{Hex_RGBA_HSL_or_Named_Value}} | {{Alias_or_Not_Applicable}} | {{Usage}} |

### Dark Mode Overrides
| Light_Token | Dark_Token | Optional_Implementation_Alias |
|---|---|---|
| {{Light_Token}} | {{Dark_Token}} | {{Alias_or_Not_Applicable}} |

## Typography
Instruction: Define font families, sizes, weights, and line heights.

- Font_Family: {{Font_Family}}
- Fallback_Stack: {{Fallback_Stack}}

| Scale_Name | Optional_Implementation_Alias | Size | Weight | Line_Height | Usage |
|---|---|---|---|---|---|
| {{Scale_Name}} | {{Alias_or_Not_Applicable}} | {{Size}} | {{Weight}} | {{Line_Height}} | {{Usage}} |

## Spacing and Layout
Instruction: Define spacing units, grid system, and layout tokens.

- Base_Unit: {{Base_Unit}}
- Grid_System: {{Grid_System}}
- Container_Max_Width: {{Container_Max_Width}}
- Breakpoints:

| Breakpoint | Min_Width | Optional_Implementation_Alias |
|---|---|---|
| {{Breakpoint}} | {{Min_Width}} | {{Alias_or_Not_Applicable}} |

## Border and Shape
Instruction: Define border radius, border widths, and shadow tokens.

| Token | Optional_Implementation_Alias | Value | Usage |
|---|---|---|---|
| {{Token}} | {{Alias_or_Not_Applicable}} | {{Value}} | {{Usage}} |

## Component Patterns
Instruction: Define reusable component styling patterns.

### Buttons
| Variant | Visual_Tokens_or_Rules | States | Usage |
|---|---|---|---|
| {{Variant}} | {{Tokens_or_Rules}} | {{States}} | {{Usage}} |

### Cards and Panels
| Variant | Visual_Tokens_or_Rules | Usage |
|---|---|---|
| {{Variant}} | {{Tokens_or_Rules}} | {{Usage}} |

### Tables
| Element | Visual_Tokens_or_Rules | Notes |
|---|---|---|
| {{Element}} | {{Tokens_or_Rules}} | {{Notes}} |

### Form Controls
| Control | Visual_Tokens_or_Rules | States | Notes |
|---|---|---|---|
| {{Control}} | {{Tokens_or_Rules}} | {{States}} | {{Notes}} |

### Badges and Status Indicators
| Variant | Visual_Tokens_or_Rules | Usage |
|---|---|---|
| {{Variant}} | {{Tokens_or_Rules}} | {{Usage}} |

## Component Inventory and Reuse Rules
Instruction: Define reusable UI components, variants, composition rules, and anti-duplication expectations.

| Component_ID | Component_Name | Purpose | Variants | Reuse_Rule | Related_Screen_or_FR_IDs |
|---|---|---|---|---|---|
| CMP-001 | {{Component_Name}} | {{Purpose}} | {{Variants}} | {{Reuse_Rule}} | {{Screen_FR_ID_List}} |

## Interaction States and Feedback
Instruction: Define visual treatment for common states consistently across components.

| State_ID | Applies_To | State | Visual_Treatment | Accessibility_Requirement |
|---|---|---|---|---|
| IST-001 | {{Component_or_Pattern}} | {{Default_Hover_Focus_Active_Loading_Empty_Error_Success_Disabled}} | {{Visual_Treatment}} | {{Accessibility_Requirement}} |

## Iconography
Instruction: Define icon library, sizing, and usage patterns.

- Icon_Library: {{Icon_Library}}
- Default_Size: {{Default_Size}}
- Color_Inheritance: {{Color_Inheritance}}

## Accessibility Standards
Instruction: Define accessibility requirements for the design system.

- Contrast_Ratio_Target: {{Contrast_Ratio_Target}}
- Focus_Ring_Style: {{Focus_Ring_Style}}
- Motion_Preferences: {{Motion_Preferences}}
- ARIA_Conventions: {{ARIA_Conventions}}

## Responsive and Theming Rules
Instruction: Define how tokens and component patterns adapt across viewport, density, theme, and accessibility preferences.

| Rule_ID | Applies_To | Condition | Expected_Behavior | Related_NFR_IDs |
|---|---|---|---|---|
| RSP-001 | {{Token_Component_or_Layout}} | {{Viewport_Theme_Density_Motion_Preference}} | {{Expected_Behavior}} | {{NFR_ID_List}} |

## Traceability Instructions
Instruction: Link design tokens to UI document and requirements.

- Traceability_Rule_1: Color and typography tokens map to 11_UI.md screen definitions.
- Traceability_Rule_2: Component patterns map to FR IDs where specific UI behavior is required.
- Traceability_Rule_3: Accessibility standards map to NFR IDs.
- Traceability_Rule_4: Source inventory and component reuse rules must map to UI sources, screen IDs, FR IDs, or recommendations.
