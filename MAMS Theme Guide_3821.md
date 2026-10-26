# Maitribodh AMS — Facebook-Style Theme Guide (Orange)

**Scope:** visual theme only (colour, typography, components, motion). No functionality or business rules.
**Reference build:** `Maitribodh_AMS_Mockup_Facebook_Theme.html`
**Version:** 2.3 · 23 Oct 2026 (orange theme; real QR codes, gate identity card, filter and table polish)

---

## 1. Design principles

1. **Clean grey canvas, white cards.** Content lives on white cards over a soft grey (`#F0F2F5`) page.
2. **One accent colour.** Orange `#E17324` carries every action, selection and focus state. Everything else is neutral.
3. **Soft depth.** Use light shadows instead of heavy borders.
4. **Calm motion.** Short, eased animations that confirm an action. Nothing loops except the live status dot.
5. **Readable first.** Body text and buttons meet WCAG AA contrast (4.5:1).

---

## 2. Colour tokens

### 2.1 Brand / primary

| Token | Hex | Use |
|---|---|---|
| `--th-accent` | `#E17324` | Brand orange: logo mark, icons, active tab underline, chart lines, focus. Not for small text on white |
| `--th-primary` | `#B55A12` | Primary button fill and brand text (white on it = 4.7:1, passes AA) |
| `--th-primary-h` | `#9A4C0F` | Primary hover / pressed |
| `--th-ink` | `#9A4C0F` | Orange text on light tint (secondary buttons, links in tint) |
| `--th-soft` | `#FDF0E6` | Light orange tint: secondary button, active nav, row hover, category badge |
| `--th-soft-h` | `#FADFC9` | Tint hover |
| `--th-ring` | `#F9D3B4` | Focus ring around inputs |
| Link / brand text | `#B55A12` | Text links, wordmark, top bar brand name |

### 2.2 Neutrals

| Token | Hex | Use |
|---|---|---|
| `--th-text` | `#1C1E21` | Primary text, headings |
| `--th-text-strong` | `#050505` | Text on grey buttons |
| `--th-muted` | `#65676B` | Secondary text, labels, captions |
| `--th-subtle` | `#8A8D91` | Placeholder, disabled text |
| `--th-line` | `#CED0D4` | Input borders |
| `--th-border` | `#DADDE1` | Dividers, card borders (when used) |
| `--th-fill` | `#E4E6EB` | Grey chips, disabled fill |
| `--th-canvas` | `#F0F2F5` | Page background |
| `--th-surface` | `#FFFFFF` | Cards, top bar, sidebar, inputs |

### 2.3 Status colours

| State | Text / icon | Background tint |
|---|---|---|
| Success / Active / Approve | `#1E6B2E` | `#E3F4E7` |
| Warning / Pending | `#B8790A` | `#FCF1DD` |
| Danger / Reject / Blacklist | `#B01F30` (button `#D0293B`) | `#FDE7EA` |
| Critical | `#7A1414` | `#F7E2E0` |
| Info | `#0B6E7A` | `#E0F0F1` |
| Notification badge | `#FFFFFF` on `#E41E3F` | — |

### 2.4 Chart palette

| Series | Hex |
|---|---|
| Series 1 (primary) / Staff | `#E17324` |
| Series 1 area fill | `#F9D3B4` |
| Series 2 / Visitor & Participant | `#2E9E6B` |
| Series 3 / Vendor, Contractor & Parivar | `#5B6B7A` |
| Neutral series | `#1C1E21` |

### 2.5 CSS variables (copy-ready)

```css
:root{
  --th-accent:#E17324; --th-primary:#B55A12; --th-primary-h:#9A4C0F;
  --th-ink:#9A4C0F; --th-soft:#FDF0E6; --th-soft-h:#FADFC9; --th-ring:#F9D3B4;
  --th-text:#1C1E21; --th-text-strong:#050505; --th-muted:#65676B; --th-subtle:#8A8D91;
  --th-line:#CED0D4; --th-border:#DADDE1; --th-fill:#E4E6EB;
  --th-canvas:#F0F2F5; --th-surface:#FFFFFF;
  --th-head:#FDF0E6; --th-head-text:#8A3F0B; --th-head-line:#F5C9A6;
  --th-card-border:#F3D2B6; --th-card-border-h:#E9A26C;
  --th-table-border:#E6D5C7; --th-cell-line:#DADDE1; --th-cell-divider:#E4E6EB; --th-row-hover:#FFF8F2;
  --th-r:8px; --th-btn-r:6px; --th-field-r:10px;
  --th-shadow-card:0 1px 2px rgba(0,0,0,.2);
  --th-shadow-hover:0 6px 16px rgba(0,0,0,.12);
  --th-shadow-bar:0 1px 2px rgba(0,0,0,.1),0 2px 4px rgba(0,0,0,.04);
  --th-shadow-pop:0 2px 4px rgba(0,0,0,.1),0 8px 16px rgba(0,0,0,.1);
}
```

---

## 3. Typography

### 3.1 Font family

```css
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
```
System sans-serif only (no web-font download). Numbers in IDs and mobile fields use `Consolas, monospace` with `tabular-nums`.

### 3.2 Type scale (unchanged from the original mockup)

| Role | Size | Weight | Colour | Notes |
|---|---|---|---|---|
| Login hero heading | 32px | 800 | `#1C1E21` | letter-spacing −0.5px |
| Page title (H1) | 22–24px | 700 | `#1C1E21` | |
| Login form title (H2) | 21px | 600 | `#1C1E21` | |
| Card title (H3) | 14.5px | 700 | `#1C1E21` | line-height 1.35 |
| Body / table cell | 13–13.2px | 400 | `#1C1E21` | |
| Input text | 13–14px | 400 | `#1C1E21` | |
| Button | 13.5px | 600 | per button | line-height 20px |
| Small button (row actions) | 12px | 600 | per button | |
| Nav item | 13px | 500 (active 700) | `#1C1E21` / active `#B55A12` | |
| Field label | 13px (filters 11.5px) | 500–600 | `#1C1E21` / filters `#65676B` | |
| Card subtitle / caption | 11.5–12px | 400 | `#65676B` | |
| Eyebrow / section group | 10–10.5px | 700 | `#65676B` | UPPERCASE |
| Table header | 11px | 700 | `#8A3F0B` | UPPERCASE, letter-spacing 0.3px |
| Badge | 11px | 700 | status colour | |
| KPI value | 24px | 700 | `#1C1E21` | line-height 1 |
| KPI label | 11.5px | 600 | `#65676B` | |

### 3.3 Brand wordmark
- Text: **MAITRIBODH AMS**
- Weight 800, colour `#B55A12`, letter-spacing 0.2px
- Next to the wordmark: a pulsing orange dot (9px, `#E17324`)

### 3.4 Top bar brand
- **Logo mark:** a 34px circle, `#E17324`, with a white bold "M" (18px / 800) and the shadow `0 4px 10px rgba(225,115,36,.3)`
- **Brand name:** "MAITRIBODH ASHRAM", 15px / 800, `#B55A12`, letter-spacing 0.2px
- **Subtitle:** "Access operations", 12px / 400, `#65676B`

---

## 4. Shape, spacing and elevation

| Element | Radius | Shadow |
|---|---|---|
| Card | 8px | `1px solid #F3D2B6` (light orange) + `0 1px 2px rgba(225,115,36,.06)` |
| Card hover (KPI) | 8px | border `#E9A26C` + `0 6px 16px rgba(225,115,36,.12)` + lift 2px |
| Button | 6px | none |
| Filter button | 999px (pill) | none |
| Form input / select | 10px | none; focus ring 3px `#F9D3B4` |
| Filter input / select | 999px (pill) | none |
| Textarea | 14px | none |
| Nav item | 6px | none |
| Badge / chip | 999px | none |
| Table (boxed) | 8px outer corners | `1px solid #E6D5C7` outer border, every cell bordered |
| Login form card | 8px | `0 2px 4px rgba(0,0,0,.1), 0 8px 16px rgba(0,0,0,.1)` |
| Top bar / sidebar header | 0 | `0 1px 2px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.04)` |

**Spacing:** use a 4px base grid: 4 / 8 / 10 / 12 / 16 / 24px. Gap between cards is 12–16px, and card padding is 14–20px.

---

## 5. Components

### 5.1 App shell
| Part | Style |
|---|---|
| Page background | `#F0F2F5` |
| Top bar | White, 62px high, bar shadow |
| Sidebar | White, `1px` right line `#DADDE1` |
| Nav item: default | Transparent, text `#1C1E21` |
| Nav item: hover | `#F0F2F5` background; the icon grows to 112% |
| Nav item: active | `#FDF0E6` background, `#B55A12` text, weight 700, orange icon |
| Profile avatar | Circle, `#FDF0E6` fill, `#8A3F0B` initials |

### 5.2 Buttons (one set for every screen)

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `#B55A12` | `#FFFFFF` | `#B55A12` | `#9A4C0F` |
| Secondary | `#FDF0E6` | `#9A4C0F` | `#FDF0E6` | `#FADFC9` |
| Ghost / link | transparent | `#9A4C0F` | none | `#FDF0E6` |
| Danger | `#D0293B` | `#FFFFFF` | `#D0293B` | `#B01F30` |
| Approve (icon, 34px round) | `#E3F4E7` | `#1E6B2E` | none | fill `#1E6B2E`, white icon |
| Reject (icon, 34px round) | `#FDE7EA` | `#B01F30` | none | fill `#B01F30`, white icon |
| Toggle: off (Check-In / Out) | `#FFFFFF` | `#9A4C0F` | `1px #B55A12` | — |
| Toggle: on | `#B55A12` | `#FFFFFF` | `#B55A12` | — |

- **Sizes:** default 38px min-height with `8px 16px` padding. Row actions are 32px with `5px 12px` padding. Filter bar buttons are 36px pills.
- **Pressed:** `transform: scale(.97)`.
- **Rule:** use one Primary button per area. All other actions there are Secondary or Ghost.

### 5.3 Form fields
| State | Style |
|---|---|
| Default | White, `1px #CED0D4`, radius 10px, min-height 44px (forms) |
| Focus | Border `#B55A12` + `0 0 0 3px #F9D3B4` ring |
| Disabled | Background `#E4E6EB`, text `#8A8D91` |
| Label | 13px / 500, `#1C1E21`, 6px below |
| Required mark | `#C4281B` |
| Checkbox / radio | `accent-color: #B55A12` |

### 5.4 Filters (compact)
| Part | Style |
|---|---|
| Inputs, selects, search | 36px high, `6px 14px` padding, 13px text, **pill radius 999px**, `1px #CED0D4` |
| Labels | 11.5px / 600, `#65676B`, 4px gap |
| Layout | One wrapping row, 10px gap, aligned to bottom; each field 170–240px wide |
| Multi-select summary | 36px pill; when open, orange border + ring |
| Dropdown panel | White, radius 12px, 6px padding; options radius 8px, hover `#FDF0E6` |

### 5.5 Tables
| Part | Style |
|---|---|
| Layout | **Boxed table**: sits inside the card with 16px side/bottom padding; `border-collapse:separate` |
| Outer border | `1px solid #E6D5C7`, radius 8px |
| Header row | Soft orange tint `#FDF0E6`, text `#8A3F0B` 11px uppercase bold; bottom line `#F5C9A6`; column dividers `#FADFC9` |
| Body cell | 13px `#1C1E21`, padding `10px 14px`; row line `#DADDE1`; column dividers `#E4E6EB` |
| Last column / last row | No right border / no bottom border (the outer border closes the box) |
| Row hover | `#FFF8F2` |
| Row menu (kebab) | Panel radius 6px; item hover `#FDF0E6` / delete hover `#FDE7EA` |

### 5.6 Tabs
- Default: 13px / 600, `#65676B`
- Active: `#B55A12` text with a **3px** `#E17324` underline
- Count pill: `#FDF0E6` background, `#9A4C0F` text

### 5.7 Badges
- Pill (999px), 11px / 700, `4px 9px` padding
- Use the status colour pairs in section 2.3
- Category badges use `#FDF0E6` with `#8A3F0B` text

### 5.8 KPI cards
- White card with 8px radius, light orange border `#F3D2B6`
- Label 11.5px `#65676B`, value 24px / 700, note 11px / 700 in its status colour
- On hover the card lifts 2px, the border deepens to `#E9A26C`, and it gets the hover shadow

### 5.9 Login screen
- Brand panel: `linear-gradient(165deg, #FDF0E6, #F0F2F5)`, with the arch lines in light orange
- Hero heading: 32px / 800, `#1C1E21`
- Form sits on a white card (8px radius, popup shadow, 24px padding)
- Primary button: full width, 48px high

---

## 6. Motion

### 6.1 Timing

| Token | Value |
|---|---|
| Fast (hover, colour) | 150ms `ease` |
| Standard (lift, shadow) | 200ms `ease` |
| Entrance | 450–550ms `cubic-bezier(.2,.8,.2,1)` |
| Chart grow | 800ms `cubic-bezier(.2,.8,.2,1)` |
| Live pulse | 1.8s infinite |

### 6.2 Keyframes

```css
@keyframes thUp   {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes thFade {from{opacity:0}to{opacity:1}}
@keyframes thPop  {0%{opacity:0;transform:scale(.94)}70%{transform:scale(1.015)}100%{opacity:1;transform:scale(1)}}
@keyframes thGrow {from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes thPulse{0%{box-shadow:0 0 0 0 rgba(225,115,36,.45)}70%{box-shadow:0 0 0 8px rgba(0,0,0,0)}100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}}
```

### 6.3 Where motion is used

| Element | Animation |
|---|---|
| Cards on screen load | `thUp` 450ms |
| KPI cards | `thUp`, staggered by 50ms (0.03s → 0.28s) |
| Second / third widgets in a row | `thUp` delayed 120ms / 200ms |
| Page heading | `thFade` 400ms |
| Login panel + form | `thUp` 550ms, staggered by 80ms |
| Chart bars | `thGrow` from the bottom, 800ms |
| Modals / dialogs | `thPop` 300ms |
| Brand dot | `thPulse` loop |
| Buttons | colour 150ms; press to `scale(.97)` |
| Nav icons | grow to `scale(1.12)` on hover, 200ms |
| KPI hover | 2px lift + hover shadow, 200ms |
| Table rows | background fades to `#FFF8F2`, 150ms |
| Top bar | slides down 14px + fade, 500ms, when the app opens |
| Sidebar | slides in from the left, 500ms; menu items follow one by one, 25ms apart |
| Top bar logo mark | scales and rotates in, 600ms |
| Notification bell | swings twice after 1s; the count badge pops in |
| KPI numbers and donut total | count up from 0, 900ms ease-out |
| Trend chart | the line draws left to right (1.2s); the area fades in; the points pop in one by one |
| Donut chart | each segment sweeps in, 1.1s |
| Table rows | fade up one by one, 35ms apart (up to 14 rows) |
| Tabs, report menu, register category cards | fade up in sequence |
| Dropdowns, row menus, profile menu | drop in 6px + fade, 180ms |
| Primary button hover | lifts 1px with a soft orange glow |
| Secondary / ghost button hover | lifts 1px |
| Avatar hover | grows to 108% |
| Badge on row hover | grows to 104% |

**Accessibility:** wrap all entrance animations in `@media (prefers-reduced-motion: no-preference)` so users who turn off motion see static screens.

---

## 7. Accessibility checklist
- White text appears only on `#B55A12` or darker (4.7:1). Never put white text on `#E17324` (3.1:1) except the large logo "M".
- Secondary text `#65676B` on white or `#F0F2F5` passes AA.
- Focus is always visible: a orange border plus a 3px `#F9D3B4` ring.
- Status is never shown by colour alone. Badges always include a text label.
- Touch targets are at least 34px for icon buttons and 36px for controls.

---

## 8. Do / Don't

| Do | Don't |
|---|---|
| Use one solid orange button per area | Put several primary buttons side by side |
| Keep filters in a single compact pill row | Stack filters in a tall two-column grid |
| Use the boxed table with soft orange header everywhere | Use a solid orange header band or unboxed tables |
| Use the type scale above | Enlarge fonts to imitate a social-app look |
| Use the light orange tint for selected states | Use bright orange backgrounds behind long text |
| Keep animations short and one-time | Add looping or bouncing motion to content |

---

## 9. Layout & screen patterns (v2.1)

### 9.1 Page layout (top-aligned)
| Part | Rule |
|---|---|
| Content padding | `16px 24px 48px` desktop · `12px 14px 40px` phone |
| Breadcrumb | 12px, sits 12px below the top bar |
| Page header | Eyebrow (10px / 700) → H1 21px / 700 → description 12px `#65676B`; the primary action sits top-right and goes full width on phones |
| Grids | Every row of cards aligns to the **top** (`align-items:start`) |
| Panel heading strip | `#FFF8F2` background, bottom line `#F3D2B6` |

### 9.2 Coloured KPI cards
Each KPI card has a tinted background, a matching border, a 4px colour bar along the top, and a faint circle in the corner. On hover, the border takes the full colour.

| Card | Accent | Background | Border |
|---|---|---|---|
| Active Members | `#E17324` | `#FFF6EF` | `#F6D5BA` |
| Registrations Today | `#2E9E6B` | `#F0FAF5` | `#C3E7D4` |
| Check-Ins Today | `#0E8C99` | `#EDF8F9` | `#C0E4E8` |
| Check-Outs Today | `#5B6B7A` | `#F4F6F8` | `#D6DDE3` |
| Pending Approvals | `#C98A0B` | `#FFF9EA` | `#F1DFAC` |
| Blacklist Alerts | `#D0293B` | `#FFF2F3` | `#F4C5CB` |

### 9.3 Table pagination (every table)
| Part | Style |
|---|---|
| Bar | Below the boxed table; left: "Showing **1–10** of **N** records"; right: rows per page + page buttons |
| Rows per page | Pill select, 32px high; options 5 / 10 / 25 / 50 (default 10, dashboard 5) |
| Page buttons | 32×32px, radius 8px, border `#E6D5C7`; hover `#FDF0E6`; current page solid `#B55A12` with white text |
| Prev / Next | ‹ › buttons; disabled at 40% opacity |
| Long ranges | 1 … 4 5 6 … 12 |
| Phone | Info line centred above the controls |

### 9.4 Person details: identity card (no tabs)
| Part | Style |
|---|---|
| Layout | Two columns: identity card (290–350px, sticky) + section cards; stacks below 1100px |
| Card band | Gradient `#E17324 → #B55A12`, "MAITRIBODH ASHRAM" 12px / 800 white + "IDENTITY CARD" pill |
| Photo | 96px circle, 4px white ring + 2px `#E17324` outer ring; initials `#8A3F0B` on `#FDF0E6` |
| Name / role / ID | 19px / 800 · 12.5px `#65676B` · Person ID in a monospace pill on `#FDF0E6` |
| Info rows | Label `#65676B` left, value 600 right; dashed dividers `#F0E2D6` |
| QR footer | `#FFF8F2` strip with a 76px QR, version and gate note |
| Actions | Edit profile (Primary), View QR (Secondary), Deactivate (Ghost, admins only) |
| Sections | Profile details and Access details full width; Documents, QR code, Visit activity and Audit trail in two columns |
| Section heading | 14.5px / 700 with an 8px orange dot; bottom line `#F3D2B6` |
| Edit mode | The section's border turns `#E17324` with a 3px `#FDF0E6` ring; inline fields with Cancel (Ghost) and Save (Primary) |

### 9.5 Reports & Analytics: coloured tabs
| Part | Style |
|---|---|
| Tab bar | A white box, radius 12px, border `#F3D2B6`, 6px padding; scrolls sideways on phones |
| Tab | 40px high, padding `8px 18px`, radius 8px, 13.5px / 600 `#4A4D52` |
| Hover | `#FDF0E6` background, `#9A4C0F` text |
| Selected | Solid `#B55A12`, white text, glow `0 4px 12px rgba(225,115,36,.28)` |
| Content | Only the selected report shows; it fades up (350ms) on each switch |
| Keyboard | Tabs take focus; Enter or Space selects |

### 9.6 Responsive breakpoints
| Width | Behaviour |
|---|---|
| > 1100px | Full layout |
| ≤ 1100px | Identity card stacks above the sections, centred, max 560px |
| ≤ 760px | Sidebar becomes a slide-out menu; the top bar shows the logo and brand name only; KPI cards go two per row; all sections and filters go single column; wide tables scroll sideways inside their box |

### 9.7 Category Mix chart (v2.2)
| Part | Style |
|---|---|
| Segments | Staff `#E17324` · Visitor / Participant `#0E8C99` · Vendor / Contractor / Parivar `#8E5BD8`; ring width 16 |
| Motion | The ring spins in (1.1s); segments sweep in; the total counts up; legend rows fade up in turn |
| Hover | The hovered segment thickens to 20 and the others fade to 55% |
| Legend | Rounded 12px swatch, percentage in the series colour, a 4px progress bar under each row that grows on load; the row tints and nudges 3px on hover |

### 9.8 Register Person (v2.2)
| Part | Style |
|---|---|
| Layout | Full width, aligned with the page heading |
| Stepper | A white box with a `#F3D2B6` border. Steps are 32px circles: done = solid `#B55A12` with a white number; current = `#FDF0E6` fill, `#E17324` ring, pulsing; connector line 3px, orange gradient once done |
| Category cards | Each card has its own colour: tinted background, 4px top bar, and a 44px icon tile in the category colour |
| Card colours | Staff `#E17324` · Visitor `#0E8C99` · Vendor `#8E5BD8` · Contractor `#5B6B7A` · Participant `#2E9E6B` · Parivar Member `#C98A0B` |
| Card states | Hover: lifts 3px, the icon tilts and grows. Selected: white background, 2px border in the category colour, a ✓ badge that pops in top-right |
| Form sections | White boxes, radius 12px, a heading with an orange dot; 3 columns of fields (2 below 1100px, 1 on phones) |
| Action bar | Back / Save Draft / Continue stay pinned to the bottom of the screen in a frosted white bar |
| Phone | Category cards become compact rows (icon left, text right) |

### 9.9 Security Gate: identity card with QR code (v2.3)
| Part | Style |
|---|---|
| Card | Appears when a person is found; flips in (600ms); same band, photo ring and info rows as the person page identity card |
| QR panel | A real, scannable QR code (120px, white tile, radius 12px) on a `#FFF8F2` panel with "Identity QR", a short note and the Person ID in an orange pill |
| QR content | The registered mobile number, matching what the QR / Identity screen says it encodes |
| Scan line | A red line sweeps twice over the QR when the card appears, then disappears so it never gets in the way of a real scan |
| Verification | The "I verified the person against the profile photo" checkbox sits in a `#FDF0E6` strip at the bottom of the card |
| Everywhere else | The QR / Identity, person page and public "Retrieve your QR" screens all show the same real QR in place of the old striped placeholder |

### 9.10 Filters, tables and buttons (v2.3)
| Part | Style |
|---|---|
| Filter section (standalone) | A white box, border `#F3D2B6`, radius 12px, padding 14px 16px, 16px gap below; fields align to the bottom |
| Filter section (inside a card) | A `#FFFCF9` strip with a bottom line `#F3D2B6`, padding 14px 16px |
| Table cells | Header `11px 16px`, body `12px 16px`, vertically centred |
| Actions column | Header and cells right-aligned only when the column holds buttons or a ⋮ menu; other last columns stay left-aligned |
| Buttons in tables | 32px high, padding `5px 12px`, 12.5px text, 6px apart, never wrapping |
| Panel heading | Title (15px) left, count right, padding 14px 16px |
| Page-head button | 40px high, padding `9px 18px` |
