# Maitribodh AMS — Complete Feature List (from UI Mockup v2.4.1)

> **Purpose:** Implementation spec for GitHub Copilot. Every feature visible or coded in `Maitribodh_AMS_Mockup_v2_4_1.html` is listed here with fields, validations, business rules and acceptance criteria.
> **How to use with Copilot:** Don't paste the whole file in one go. Paste **Section 0 (Context)** + **one module section** per Copilot session, and ask it to implement that module end-to-end (DB → API → UI). Reference feature IDs (e.g. `F-GATE-04`) in prompts.

---

## 0. Project Context (paste this with every module)

| Item | Value |
|---|---|
| Project | `Maitribudh-AMS` |
| Backend | `Maitribudh-API` — Node.js / Express, port **6200** |
| Frontend | `Maitribudh-UI` — React (PWA), port **3000** |
| Database | PostgreSQL (AWS RDS) |
| Config | Separate config per environment (dev / qa / prod) |
| Coding standards | ES6, small modular React components, higher-order components, shared logic in `utils/`, **all hard-coded values in a constants config file**, ESLint, documented & formatted code |
| Auth | JWT + bcrypt (server-side). No SMTP / email / WhatsApp integrations. |

### 0.1 Design tokens (from mockup CSS)

```css
--primary-600:#F47C20; --primary-700:#D95712; --primary-100:#FFF0DF;
--marigold:#FFB52E; --marigold-dark:#E68A10; --marigold-100:#FFF4D9;
--neutral-900:#2D2926; --neutral-600:#6E6259; --neutral-300:#E8D9C8; --neutral-100:#FFF9F3;
--surface:#FFFFFF;
--success-600:#2E7D46; --success-100:#E6F3EA;
--warning-600:#B8790A; --warning-100:#FCF1DD;
--danger-600:#C4281B;  --danger-100:#FBE7E5;
--critical-700:#7A1414; --critical-100:#F7E2E0;
--info-600:#0B6E7A;   --info-100:#E0F0F1;
--radius:8px;
```
- Font: `'Segoe UI', system-ui, Arial`; headings on login: `Cambria, Georgia, serif`
- Icons: Font Awesome 6.5.2
- Responsive breakpoint `max-width:1100px` → KPI grid 3 columns; charts / widgets / split panels / gate grid / category picker collapse to 1 column.

### 0.2 Module index

| # | Module | Screen ID | Section |
|---|---|---|---|
| 1 | Login & public pages | `login` | §1 |
| 2 | App shell, navigation, RBAC | — | §2 |
| 3 | Dashboard | `dashboard` | §3 |
| 4 | Person Management (list / detail / edit) | `person-list`, `person-detail`, `person-edit` | §4 |
| 5 | Register Person | `register` | §5 |
| 6 | Approval Center | `approval` | §6 |
| 7 | QR / Identity Management | `qr` | §7 |
| 8 | Security Gate | `gate` | §8 |
| 9 | Blacklist Management | `blacklist` | §9 |
| 10 | Reports & Analytics | `reports` | §10 |
| 11 | User Management | `users` | §11 |
| 12 | Master Data | `master` | §12 |
| 13 | Audit & Compliance | `audit` | §13 |
| 14 | Notifications | drawer | §14 |
| 15 | Cross-cutting rules | — | §15 |

---

## 1. Login & Public Pages

Layout: split screen — left brand panel (orange gradient, arch SVG motif, logo "MAITRIBODH ASHRAM · AMS", tagline *"One record per person. Every gate, every time."*, sub-text listing the 6 categories); right panel holds one of 4 forms (only one visible at a time).

### F-AUTH-01 Sign in
- Fields: **Username** (required), **Password** (required), **Remember me** checkbox, **Forgot password?** link, **Sign In** button.
- On success: hide login, show app shell, land on the role's landing screen (§2.3), write audit event `User Login` (old: `Signed out`, new: `Session active`).
- Security footer text: "Secured connection · Session auto-timeout after inactivity · Access is logged for compliance."
- Strip `username`, `password`, `remember` from the URL query string on page load (never accept credentials via query params).
- **AC:** Wrong credentials show an error without saying which field is wrong. Successful login issues a JWT; logout / timeout clears it.

### F-AUTH-02 Forgot password
- Mockup shows: "Username or email" field → **Send reset instructions** → confirmation panel "Check your email" → **Return to sign in**.
- ⚠️ **Conflicts with the agreed decision** (see §16). Agreed behaviour: forgot/change password happens on the login portal using **username + old password + new password + confirm**; no reset link, OTP, email or WhatsApp.

### F-AUTH-03 First-time administrator setup
- Entry: notice box on the login form "First-time administrator? …" + button **First-time admin login**.
- Step 1 — verify identity: **Registered mobile number** (required, exactly 10 digits) + **Registered email** (required, valid email) → **Verify details**.
- Step 2 — outcomes:
  | Mobile found | Email found | Same account | Result |
  |---|---|---|---|
  | Yes | Yes | Yes | Mode = **reset**. Show "Reset Password" button. |
  | No | No | — | Mode = **create**. Show "Create Password" button. |
  | Any other combination | | | Warning: "The mobile number and email do not belong to the same account, or only one is registered…" — stop. |
- Step 3 — password form: **Current password** (only in reset mode, required), **New password** (min 8), **Confirm new password** (min 8).
- Validations: new = confirm; length ≥ 8; in reset mode current password must match stored hash; in create mode reject if mobile or email got registered meanwhile.
- On success: prefill login username with the email, clear password, show "Password created/updated. Sign in with … " + **Continue to sign in**.
- **Production:** hashing must be server-side bcrypt (mockup uses browser SHA-256 + localStorage only for demo). Per agreed decision, Super Admin is seeded by IT in DB; users are created without password and set it on first login.

### F-AUTH-04 Public QR retrieval (no login)
- Entry: ghost button **Retrieve your QR code** on login page.
- Field: **Registered mobile number** (required, `[0-9+\- ]{10,14}`; normalise to last 10 digits) → **Find my QR**.
- Found & Active: card with QR image, name, category, Person ID, buttons **Download** and **Print**.
- Not found: warning "No person found for this mobile number. Check the number or contact the Registration Team."
- No OTP (per client clarification). Only **Active** persons with a generated QR are returned (Pending / Rejected never).
- Download file name: `Maitribodh-QR-<PersonID>` (PNG or SVG). QR must be **scannable** in production and encode the **Person ID**.

### F-AUTH-05 Navigation between login panels
- **Back to sign in** on every sub-panel returns to the main form and hides all others.

---

## 2. App Shell, Navigation & Role-Based Access

### F-SHELL-01 Sidebar
- Header "MAITRIBODH AMS" + collapse toggle (`⟨⟩`) → collapsed mode shows icons only.
- Groups & items (with icons):
  - Dashboard
  - **Operations:** Person Management, Register Person, Approval Center, QR / Identity
  - **Security:** Security Gate, Blacklist
  - **Analytics:** Reports & Analytics
  - **Administration:** User Management, Master Data, Audit & Compliance
- Active item highlighted. Person detail/edit keep "Person Management" highlighted.
- Items the role can't access are **hidden**; a group header is hidden when it has no visible items.

### F-SHELL-02 Top bar
- Global search box placeholder "Search by name, mobile, or ID…" (searches persons).
- Notification bell with unread count badge (§14).
- Avatar menu with initials + full name of logged-in user.
- *(Mockup has a "View as" role switcher — demo only; in production the role comes from the logged-in user's JWT. Do not build the switcher.)*

### F-SHELL-03 Breadcrumb
- `Home › <Current screen title>`.

### F-SHELL-04 Right-side drawer
- Reusable slide-in drawer with overlay; closes on overlay click or ✕. Used by: Notifications, Add/Update User, Add to Blacklist, Share QR, Audit detail, success messages.

### 2.1 Portal roles

| Role | Access tier | Permissions label |
|---|---|---|
| System Administrator | Full | All Modules |
| Registration Officer | Moderate | Create & Update Profiles |
| Approver | Moderate | View + Approve |
| Security Guard | Limited | Scan + Verify + Check In/Out |
| Viewer | View-Only | Dashboard + Reports |
| *Custom roles* | Created in Master Data → Portal Roles (§12.4) | |

### 2.2 Screen access matrix

| Screen | Sys Admin | Reg. Officer | Approver | Security Guard | Viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| Dashboard | ✅ | ✅ | ✅ | ❌ | ✅ |
| Person Management (list/detail/edit) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Register Person | ✅ | ✅ | ✅ | ✅ (Visitor only) | ❌ |
| Approval Center | ✅ | ❌ | ✅ | ❌ | ❌ |
| QR / Identity | ✅ | ❌ | ❌ | ❌ | ❌ |
| Security Gate | ✅ | ❌ | ❌ | ✅ | ❌ |
| Blacklist | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports & Analytics | ✅ | ✅ | ✅ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Master Data | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit & Compliance | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Landing screen** | Dashboard | Dashboard | Dashboard | **Security Gate** | Dashboard |

### 2.3 Action permissions

| Flag | Sys Admin | Reg. Officer | Approver | Security Guard | Viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| `canEdit` (edit person, Edit & Resubmit) | ✅ | ✅ | ✅ | ❌ | ❌ |
| `canDelete` (delete person) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `canApprove` (approve/reject, bulk, approval export) | ✅ | ❌ | ✅ | ❌ | ❌ |
| `canManage` (users, master data) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Blacklist add/remove | ✅ only | | | | |
| Close open visit (reconcile) | ✅ only | | | | |

### 2.4 Categories each role can register

| Role | Categories |
|---|---|
| Sys Admin / Reg. Officer / Approver | All active categories |
| Security Guard | **Visitor only** (on-the-spot gate fallback) |
| Viewer | None |

- **AC:** Enforce on **both** UI (hide) and API (403). Hidden buttons alone are not enough.

---

## 3. Dashboard

Header: "Dashboard" + "Last sync: Xs ago · Live monitoring".

### F-DASH-01 KPI cards (6)
| Card | Value | Sub-text |
|---|---|---|
| Active Members | count of Active persons | % change this month |
| Registrations Today | count | vs yesterday |
| Check-Ins Today | count (live, updates after gate check-in) | this shift |
| Check-Outs Today | count (live) | "On pace" |
| Pending Approvals | count | "Needs review" (warning colour) |
| Blacklist Alerts | count of blocked attempts today (live) | "Action required" |

### F-DASH-02 Current Occupancy table
- Title "Current Occupancy" + badge "`N` inside". Sub-text "Open check-ins require manual review before reconciliation."
- Columns: Person, Category, Location, Checked In (time), Checked By (guard), Device, Action.
- Action: Sys Admin → **Review / Close** button (§F-DASH-06); others → text "Admin review".
- Empty state: "No open check-ins."

### F-DASH-03 Daily Check-In Trend — line/area chart, last 7 days.
### F-DASH-04 Category Mix — donut/pie, this week (e.g. Staff / Visitor+Participant / Vendor+Contractor+Parivar %).
### F-DASH-05 Widgets
- **Recent Activity** table: Person (avatar initials), Category, Location, Time, Event badge (Check-In / Check-Out / Registered).
- **Pending Approval Queue**: list "Name — Category" + Pending badge.
- **Security Alerts**: e.g. "Blacklisted match attempt — Main Gate".

### F-DASH-06 Manual visit reconciliation (Admin)
- Confirm dialog: "Manually close the open visit for X? Confirm only after checking the person is no longer on site."
- Closes the open visit, refreshes occupancy, audit event `Manual Visit Reconciliation` (result `Closed`, with location).

---

## 4. Person Management

### F-PER-01 Person list
- Header button **+ Register Person** → Register screen.
- Toolbar filters (all combine with AND):
  - Search (ID, name or mobile — contains)
  - Category (options from Master Data categories, + "All")
  - Status: All / Active / Pending / Blacklisted
  - Date (last visit): All / Today / Last 7 days / Older visits
  - Mobile number (contains)
  - **Export** button (exports current filtered view, CSV)
- Table columns: ☐ (row checkbox), Member ID, Name (avatar initials), Category badge, Department / Role, Mobile (masked e.g. `98200 XXXXX`), Status badge, Last Visit, ⋮ row menu.
- Row click → Person detail.
- Row menu (⋮): **Update** (needs `canEdit`), **Delete** (needs `canDelete`, confirm "Delete X from Person Management?"). Menu closes on outside click.
- Server-side pagination: "Showing 1–5 of 640" + page links.

### F-PER-02 Person detail
- Back link "← Back to Person Management".
- Header: large avatar, name, category badge · Member ID · Department/Role/Subcategory · Status badge (Active=green, Blacklisted=critical, else warning).
- Actions: **Edit** (`canEdit`), **View QR**, ⋮ more.
- Tabs: **Overview** · Documents · Access Details · Activity · Audit.
  - Overview → *Personal Information* (Full Name, Mobile, Email, Category, Department/Role/Subcategory, Alternate Mobile) and *Access & Identity* (Member ID, QR Status, Verification Mode "QR + Mobile", Approval Status). All read-only.
  - Documents → uploaded docs list with view/download.
  - Access Details → allowed locations, access validity.
  - Activity → this person's check-in/out history.
  - Audit → audit entries where entity = this person.

### F-PER-03 Edit profile
- Back link "Back to profile". Header shows Member ID.
- **Personal Information:** Full Name* , Mobile Number* (`[0-9Xx+() -]{7,20}`), Alternate Mobile, Email (email), Category (read-only), Member ID (read-only).
- **Category Details** (dynamic):
  | Category | Section title | Fields |
  |---|---|---|
  | Staff | Employment Details | Department* (select from master) → Job Role* (select, **cascades** from department; keep previous value if still valid) |
  | Parivar Member | Membership Details | Subcategory* (select from Parivar subcategories) |
  | Others | `<Category> Details` | Department / Role / Function (text) |
- **Emergency Contact:** Contact Name, Contact Mobile, Residential / Business Address (textarea).
- Buttons: **Cancel** (back to detail), **Save Changes**.
- On save: update record, list reflects new name/mobile/department, audit event `Update` with full old JSON and new JSON.
- **Rule:** If **mobile number changes → mark the person's QR as "Reissue required"** (old QR becomes invalid — see §7).

---

## 5. Register Person

### F-REG-01 Wizard header
- Steps: 1 Category → 2 Profile → 3 Access → 4 Documents → 5 Review (current step highlighted, done steps ✓).
- Footer: **Back**, **Save Draft**, **Review & Submit →**.

### F-REG-02 Step 1 — Category picker
- Cards (icon, name, description) for each **active** category from Master Data.
- Card disabled (with tooltip "Not permitted for your role") when role can't register it or category inactive.
- Role notice: Security Guard → "Security Guard can register **Visitor only** (on-the-spot fallback at the gate)." Viewer → "Viewer role is view-only — registration is not permitted."

### F-REG-03 Step 2 — Common profile fields (all categories)
| Field | Type | Required | Validation |
|---|---|:-:|---|
| Member ID | text, read-only | — | "Auto-generated" (format `MB-xxxx`) |
| First Name | text | ✅ | max 100, letters/space/hyphen `[A-Za-zÀ-ÿ -]+` |
| Last Name | text | ✅ | same as above |
| Mobile Number | text | ✅ | exactly 10 digits; hint "primary lookup key at the gate"; **must be unique** |
| Alternate Mobile | text | | optional |
| Gender | select | ✅ | Male / Female / Other |
| Date of Birth | date | | |
| Address | textarea | | |
| Email | email | | |
| Photograph | file | ✅ | JPG/PNG only, **max 5 MB** — error "Choose a JPG or PNG image no larger than 5 MB." |

**Identity verification** (all categories):
| ID Proof Type* | select: Aadhaar Card, PAN Card, Driving Licence, Voter ID, Passport |
|---|---|
| ID Proof Number* | text; **masked after save** |

### F-REG-04 Category-specific fields

**Staff** 👔 — "Ashram employees & functional staff" — **approval required**
- *Employment details:* Department* (master), Job Role* (cascades from Department), Employee Code (e.g. EMP-0231), Date of Joining*, Employment Type (Full-time / Part-time / Seva-Honorary), Shift (General 09–17 / Morning 06–14 / Evening 14–22 / Night 22–06)
- *Address & emergency contact:* Residential Address*, Emergency Contact Name*, Emergency Contact Mobile*
- Docs: ID Proof*, Address Proof*, Appointment Letter, Police Verification

**Visitor** 🧑 — "General visitor to the ashram" — no approval
- Extra common: City / Coming From
- *Visit details:* Purpose of Visit* (Darshan / Meeting / Satsang / Family visit / Other), Person / Department to Meet, Visit Date*, Expected Duration (Few hours / Full day / Overnight stay), Accompanying Persons (number), Vehicle Number
- Docs: ID Proof*

**Vendor** 📦 — "External supplier of goods/services" — no approval
- *Vendor details:* Company / Firm Name*, Goods / Services Supplied*, GSTIN, Receiving Department* (departments + Kitchen + Stores), Delivery Frequency (One-time / Daily / Weekly / Monthly / As required), Vehicle Number, Business Address
- Docs: ID Proof*, GST Certificate, Purchase Order / Delivery Challan

**Contractor** 🔧 — "External party doing contract work" — no approval
- *Contract details:* Company / Agency Name*, Nature of Work*, Expected Laborer Count (hint: each laborer registered separately), Work Order / Contract No., Supervising Department* (master), Contract Start Date*, Contract End Date* (hint "Access auto-expires after this date"), Work Location in Ashram
- Info notice: "Contractor teams are not managed as a group. Register each accompanying laborer separately; each person needs an individual profile and QR, and must check in independently."
- Docs: ID Proof*, Work Order / Contract Copy*, Laborer ID Proofs, Labour Licence

**Participant** 🎓 — "Joining an ashram program or course" — no approval
- Extra common: Age, City
- *Program details:* Program / Course* (Meditation Retreat / Yoga Shibir / Gurukul Workshop / Seva Camp), Batch / Session*, Program Start Date*, Program End Date* (hint "Access valid only for program duration"), Accommodation Required (No / Dormitory / Guest Room), Dietary / Medical Notes
- *Emergency contact:* Name*, Mobile*
- Docs: ID Proof*, Program Registration Receipt

**Parivar Member** 🙏 — "Registered ashram member" — **approval required**
- *Membership details:* Subcategory* (active Parivar subcategories from master — e.g. Sevak, Matri), Member Since, Seva Area (departments + Kitchen + General Seva), Referred By, Residential Address*
- *Emergency contact:* Name*, Mobile*
- Docs: ID Proof*, Address Proof*, Membership Form

**Devotee** 🪷 — approval rule **pending client confirmation** (`approval = null`)
- Extra common: Email
- *Devotee details:* Introduced / Referred By, Visit Purpose (Darshan / Satsang / Seva / Other)
- Docs: ID Proof*
- Notice: "Devotee is a confirmed category, but its approval requirement is still awaiting client confirmation."
- **Rule:** Submit is blocked — "Submission is paused for Devotee until the approval rule is confirmed. No active profile or QR has been created."

> Implement categories as **data-driven config** (DB table + field schema), not hard-coded forms — admins can add categories in Master Data (§12.2). New categories get a default section "Category details → Purpose / Details" and doc "ID Proof*".

### F-REG-05 Step 3 — Access
- Allowed Check-in Locations: select ("All locations" + master locations).
- Access Validity: if category needs approval → *Until revoked / Fixed end date*; else → *Single day / Visit/program duration / Contract duration / Until revoked*.

### F-REG-06 Step 4 — Documents
- One row per document for the category, label + "*" if mandatory or "(optional)", **Upload** button. Mandatory docs block submit.

### F-REG-07 Approval notice (shown above footer)
- Approval required → ⏳ "**X** registrations go to the Approval Center. Access and QR are enabled only after an Approver/Admin approves."
- No approval → ✓ "**X** registration is live immediately — QR is generated on submit, no approval needed."

### F-REG-08 Submit
1. Validate all required fields (browser + server); show first invalid field.
2. Generate Member ID.
3. Status = **Active** (no approval) or **Pending** (approval).
4. If Active → generate QR immediately + make available on public QR lookup.
5. If Pending → create Approval Center entry (name, mobile, category, department/subcategory, submitted by, submitted date).
6. Show result: "**Name** registered as Category · Status · Person ID MB-xxxx · QR generated / QR will be generated after approval".
7. Audit event `Create`; in-app notification "Registration Submitted".

### F-REG-09 Save Draft
- Saves partially filled form; notice "Draft saved for <Name>". Drafts listed/resumable later.

### F-REG-10 Back
- From gate flow → back to Gate. From resubmission → back to Approval Center. Otherwise → previous screen (Person list) or Dashboard if no access.

### F-REG-11 Gate visitor fast-path
- Triggered from Gate "Register Visitor" (§F-GATE-05). Category forced to Visitor; remembers selected gate location.
- On successful Active submit → return to Gate, auto-search new Member ID, **auto Check-In** at the remembered location.

### F-REG-12 Re-registration / Resubmission prefill
- Banner: "Re-registering **Name** as **Category**. Existing details can be reviewed and updated before continuing." + **Cancel** (clears prefill).
- Prefills Member ID (same ID kept), first/last name, mobile.
- On submit: approval entry goes back to **Pending**, rejection reason cleared, audit `Resubmit Registration` (Rejected → Pending).

---

## 6. Approval Center

Header note: "Only staff and Parivar registrations require approval" (i.e. any category with approval = required).

### F-APR-01 Tabs
- **Pending** (with count badge) · **Approved** · **Rejected**. Counts update live. Bulk Approve button visible only on Pending tab.

### F-APR-02 Toolbar
- **Export CSV** (header area).
- "Select all pending" checkbox (supports indeterminate state) + "`N` selected" counter.
- Filters: Category (All / Staff / Parivar / Visitor / Vendor / Contractor / Participant), Date (All / Today / Last 7 days / Older requests), Mobile (contains).
- **Approve** (bulk) button.
- Hidden rows are auto-unchecked.

### F-APR-03 Table
- Columns: ☐, Member (name bold + ID), Category, Department / Subcategory, Mobile, Submitted By, Submitted (date-time), Status badge, Actions.
- Checkbox disabled when status ≠ Pending.

### F-APR-04 Row actions by status
| Status | Actions |
|---|---|
| Pending | **Reject**, **Approve** |
| Approved | **Reject** (can revoke) |
| Rejected | **Edit & Resubmit** (needs `canEdit`) |

### F-APR-05 Approve
- Status → Approved; person status → **Active**; **generate QR**; enable public QR lookup; record decided by + decided at.
- Audit `Approve` (old: previous status, new: Active); notification "Registration Approved — X · approved by <user>".

### F-APR-06 Reject
- Inline editor in the row: "Rejection reason (minimum 10 characters) *" textarea + **Confirm Rejection** / **Cancel**.
- Reason < 10 chars → validation error "Rejection reason must be at least 10 characters."
- On confirm: status → Rejected; person status → Rejected; **delete/invalidate QR**; remove from public QR lookup; store reason.
- Audit `Reject` with reason; notification "Registration Rejected — X · reason: …".

### F-APR-07 Bulk approve
- Approves all checked rows that are still Pending. None selected → "Select at least one pending registration."

### F-APR-08 Edit & Resubmit → opens Register (§F-REG-12) with prefill.

### F-APR-09 Export CSV
- Columns: Member ID, Name, Category, Department / Subcategory, Mobile, Submitted By, Submitted, Status. File `maitribodh-approval-center.csv`.

---

## 7. QR / Identity Management

Header note: "QR is generated per profile and is invalidated when mobile number changes."

### F-QR-01 KPI cards — Total Registered · Current QR (green) · Reissue Pending (warning).
### F-QR-02 QR list
- Search (person ID, name, mobile) + Category filter (from master).
- Columns: Name, Category, Mobile, QR Status (**Current** / **Reissue required**). Row click selects.
### F-QR-03 QR preview panel (selected person)
- QR image, name, Person ID; rows: Generated (date), Encodes = **Person ID**, Expiry = **Never**, Status badge.
- Buttons: **Download**, **Print**, **Share**.
- **Reissue on profile change** — enabled only when status = Reissue required.
### F-QR-04 Reissue
- Confirm: "Generate a replacement QR for X? The previous QR will become invalid immediately."
- New QR + new generated date; status → Current; audit `QR Reissue` (Previous QR active → Replacement QR current); notification "QR Reissued".
### F-QR-05 Share
- Drawer with Email / WhatsApp options. ⚠️ **Conflicts with agreed decision** (QR is not sent via WhatsApp/email) — see §16.

### QR rules (summary)
- QR generated **once** after registration completes (Active) or after approval — no periodic regeneration.
- Encodes Person ID; no expiry; invalidated only on mobile change (reissue) or rejection.
- Must be a real, scannable QR in production.

---

## 8. Security Gate

Header: "Security Gate" + badge "Shift: <Guard name> · <shift time>".

### F-GATE-01 Scanner + manual lookup
- Camera QR scanner frame ("Scan QR or enter mobile number").
- Manual input: "Mobile number, name or Person ID" + **Find Person** (exact match on Member ID, name or mobile, case-insensitive).
- Scanned QR → Person ID → same lookup.

### F-GATE-02 Result panel states
| State | Icon / colour | Title | Sub-text | Check-In | Check-Out |
|---|---|---|---|:-:|:-:|
| Initial | ID card / neutral | READY TO VERIFY | Search by registered mobile number, name, or Person ID. | disabled | disabled |
| Not found | ? / neutral | PERSON NOT FOUND | A valid person record is required before entry. + **Register Visitor** button | disabled | disabled |
| Active, outside | ✓ / green | PROFILE FOUND | Active profile · No blacklist match | **enabled** | disabled |
| Active, inside | ✓ / green | PERSON ALREADY INSIDE | Open visit at <location>. Check out before another check-in. | disabled | **enabled** |
| Pending / not active | 🕒 / denied | PENDING APPROVAL | Only Active profiles may check in. | disabled | enabled only if inside |
| Blacklisted | ⛔ / critical | BLACKLISTED — ENTRY NOT ALLOWED | Blacklist match blocks check-in. Alert recorded. | disabled | enabled only if inside |

### F-GATE-03 Person card (shown when found)
- Avatar initials, name, category badge; Person ID, Mobile, Status badge, Blacklist badge (Clear / Blacklisted).

### F-GATE-04 Check-In / Check-Out
- **Location** select (from master Check-in Locations) — required.
- Check-In creates an **open visit**: person, category, location, time, guard, device (e.g. "Gate Terminal 01"). Audit `Check-In` (Outside → Inside · location).
- Check-Out closes the open visit. Audit `Check-Out` (Inside · location → Outside).
- Guards (server-side too):
  - Blacklisted → block, re-show blacklist state.
  - Not Active → "APPROVAL REQUIRED — Pending profiles cannot be checked in."
  - Already inside → "Person Already Inside · Complete the active check-out first." (**one open visit per person**)
  - Check-out with no open visit → "No Active Check-In Found · The person is not currently inside."
- After each event refresh result panel + dashboard counts/occupancy.

### F-GATE-05 Register Visitor from gate → §F-REG-11 (auto check-in after registration).

### F-GATE-06 Blacklist attempt
- On lookup of an actively blacklisted person: in-app notification "Blacklist Alert — X blocked at <location>", audit `Blacklist Attempt` (Eligible → Blocked), dashboard Blacklist Alerts +1.

### Gate session
- Security guard session must last **≥ 12 hours** (not the generic short timeout).

---

## 9. Blacklist Management (Sys Admin only)

- Warning banner: "⚠ A blacklisted match blocks entry regardless of category. The gate must stop all access and register the event."
- Header button **Add to Blacklist** (danger style).

### F-BL-01 List
- Columns: Person (avatar), Category, Reason, Start Date, End Date (— if open), Remarks, Created By, Status badge, Actions (**Remove**).

### F-BL-02 Add to Blacklist (drawer)
| Field | Rule |
|---|---|
| Person* | select of persons not already actively blacklisted ("Name · Category · ID") |
| Reason* | max 200 chars |
| Remarks* | textarea |
| Start Date* | default today |
| End Date | optional; **must be ≥ Start Date** ("End Date cannot be before Start Date.") |
- Already blacklisted → "This person is already blacklisted."
- On save: row added, success notice "X is now blocked from check-in.", audit `Blacklist` (reason, remarks, dates), notification "Blacklist Alert".

### F-BL-03 Remove
- Confirm "Remove X from the blacklist? This lifts the blacklist restriction." → row removed, person cleared, success notice, audit `Remove Blacklist`.

### F-BL-04 Active-blacklist rule
- Blacklist is **active** when `start_date ≤ today` AND (`end_date` is empty OR `end_date ≥ today`). Only active entries block at the gate.

---

## 10. Reports & Analytics

Layout: left sub-nav (6 reports) + right panel. Each report: title + record count, filter grid, toolbar (**Export CSV**, **Export Excel**, **Print / PDF**), table.

| Report | Filters | Columns |
|---|---|---|
| **Visit History** | Name or mobile (search), Category, Date From, Date To, Location | Person, Mobile, Category, Date, Location, Event, Checked By |
| **Person Registrations** | Category, Status (Active/Pending/Rejected/Blacklisted), Department, Date From, Date To | Person ID, Name, Category, Department / Role, Status, Registration Date |
| **Occupancy** | Date, Location | Date, Location, Check-Ins, Check-Outs, Current Occupancy |
| **Approvals** | Category, Status (Pending/Approved/Rejected), Submitted Date | Person ID, Name, Category, Submitted By, Submitted Date, Status |
| **Blacklist** | Reason or person (search), Date From, Date To | Person, Category, Reason, Start Date, End Date, Created By |
| **Staff** | Department, Job Role | Person ID, Name, Department, Job Role, Status |

- Filter dropdown options come from master data ("All …" first).
- Filters apply instantly; date range inclusive.
- Exports contain **only the currently filtered rows**. File names `maitribodh-<report>-report.csv` / `.xlsx`.
- Production: filtering + export server-side with pagination.

---

## 11. User Management (portal users — Sys Admin only)

### F-USR-01 List
- Columns: Username (mono), Full Name (avatar), Access Tier badge (Full / Moderate / Limited / View-Only), Role, Permissions summary, Status (Active / Inactive), ⋮ menu (Update, Delete).

### F-USR-02 Create / Update user (drawer)
| Field | Rule |
|---|---|
| First Name* | max 100 |
| Last Name* | max 100 |
| Mobile Number* | exactly 10 digits |
| Email* | valid email |
| Username* | |
| Portal Role* | from Portal Role master (incl. custom roles) |
| Status | Active / Inactive |
- **Username, email and mobile must each be unique** → "Username, email, and mobile number must be unique."
- Access tier + permissions summary derived from role.
- Create: no password set; user sets own password on first login (agreed decision). Success drawer "User created".
- Audit `Create User` / `Update User`.

### F-USR-03 Delete user
- Sys Admin only; confirm "Delete portal user <username>?"; audit `Delete User`.

---

## 12. Master Data (Sys Admin only)

Left sub-nav: Departments & Roles · Categories · Check-in Locations · Portal Roles. All changes persist in DB and **immediately reflect** in registration forms, filters and gate.

### F-MD-01 Departments & Roles
- Note: "These values appear in Staff, Vendor, Contractor, and Parivar registration forms."
- Table: Department, Roles / Functions (tags), Actions (Edit, Delete).
- Add / Edit: department name + roles (comma-separated; trimmed, duplicates removed case-insensitively).
- Department name unique (case-insensitive) → "That department already exists."
- Delete: confirm "Delete X and its roles from master data?"
- Seed: Gurukul (Teacher, Admin, Helper, Guard, Driver), Goushala (Supervisor, Worker), Accounts (—), Housekeeping (Housekeeper, Gardener), Security (Guard, Head of Security).

### F-MD-02 Person Categories
- Table: Category, Definition, Approval (Required / Not required / Decision pending), Status (Active / Inactive), Actions (Edit, Activate/Deactivate, Delete).
- Add: name (unique), description, approval required yes/no → default field schema (§F-REG-04 note).
- Edit: name, description, approval flag.
- Deactivate: **at least one category must remain active**. Delete: **at least one category must remain**.
- Inactive categories don't appear (or appear disabled) in Register.

### F-MD-03 Parivar Subcategories (inside Categories tab)
- Tags with Edit, ×(Delete), Activate/Deactivate; **Add subcategory**.
- Unique names; **at least one must remain active**. Inactive ones dimmed and hidden from registration select.
- Seed: Sevak, Matri.

### F-MD-04 Check-in Locations
- Note: "Locations are available in registration access settings." (also used in gate & reports)
- Table: Location, Actions (Edit, Delete). Unique names.
- Seed: Main Gate, Kitchen, Goushala, Hostel, Admin Office, Gurukul.

### F-MD-05 Portal Roles
- Note: "Portal roles control screen and operation access; they are separate from Staff Job Roles."
- Table: Portal Role, Access Tier, Allowed Screens, Actions (**Edit Access**; **Delete** only for custom roles).
- Add role: unique name + "copy access from" an existing role (screens, flags, landing, allowed categories copied) → marked custom.
- Edit Access: choose allowed screens (≥ 1), flags `canEdit`, `canDelete`, `canApprove`, `canManage` (System Administrator always keeps `canManage`). Landing = Dashboard if allowed else first allowed screen.
- Build as a proper permission matrix UI (checkboxes), not browser prompts.

---

## 13. Audit & Compliance (Sys Admin only)

- Header buttons: **Export CSV** (`maitribodh-audit-log.csv`, filtered rows only), **Print / PDF**.
- Filters: User (distinct users), Action (distinct actions), Search (entity or module).
- Table: Timestamp, User, Action, Module, Entity, Old Value, New Value, Result badge (Success = green, Blocked/Rejected = red, other = neutral).
- Row click → drawer "Audit Detail": action · entity · time, then timeline **Before / After / Actor / Result**.
- Audit log is **append-only** (no edit/delete).

### Events that must be logged

| Action | Module | Old → New / Result |
|---|---|---|
| User Login | Auth | Signed out → Session active |
| Create (registration) | Operations | — → status · Member ID |
| Update (profile) | Operations | full old JSON → full new JSON |
| Resubmit Registration | Approvals | Rejected → Pending |
| Approve | Approvals | Pending → Active |
| Reject | Approvals | Pending → Rejected (+ reason) |
| QR Reissue | QR | Previous QR active → Replacement QR current |
| Share QR | QR | channel |
| Check-In | Gate | Outside → Inside · location (+ device) |
| Check-Out | Gate | Inside · location → Outside |
| Blacklist Attempt | Gate | Eligible → Blocked |
| Blacklist | Blacklist | reason, remarks, start/end |
| Remove Blacklist | Blacklist | Removed |
| Manual Visit Reconciliation | Gate | Closed (+ location) |
| Create / Update / Delete User | Users | role · status |
| Master data changes | Master Data | (recommended — not in mockup) |
| Delete person | Operations | (recommended — not in mockup) |

---

## 14. In-app Notifications

- Bell icon with **unread count** badge (hidden when 0).
- Drawer: title "Notifications", sub "In-app updates for registrations and security events", **Mark all as read**, list (title, time, message, "New" badge if unread).
- Triggers: Registration Submitted · Registration Approved · Registration Rejected (with reason) · Blacklist Alert (added / blocked at gate) · QR Reissued.
- In-app only — no email/SMS/WhatsApp.

---

## 15. Cross-cutting Rules

1. **One record per person**; mobile number is the primary lookup key and must be unique.
2. Mobile shown **masked** in lists (`98200 XXXXX`); ID proof number masked after save.
3. Person statuses: `Pending` → `Active` / `Rejected`; `Blacklisted` is an overlay flag with date range.
4. Only **Active + not actively blacklisted** persons can check in; one open visit per person.
5. Contractor / Participant access ends after contract / program end date (auto-expire).
6. All permission checks enforced in the API, not only by hiding UI.
7. Every state change writes an audit row (§13).
8. All dropdown values come from Master Data — no hard-coded lists in components (put seeds in constants/DB seed).
9. Tables: avatar with initials, badges for category/status, ⋮ row menu closes on outside click.
10. Forms: required fields marked with red `*`, hints under fields, inline validation messages, `aria-live` regions for results.
11. Confirmation dialog before every destructive action (delete, remove blacklist, reissue QR, close visit, reject).

---

## 16. ⚠️ Mockup vs Agreed Decisions — resolve before coding

| # | Mockup shows | Agreed decision | Implement |
|---|---|---|---|
| 1 | Forgot password → email reset link ("Check your email") | No reset link / OTP / email. Change password on login portal with old + new password. | Agreed decision |
| 2 | QR **Share** via Email / WhatsApp | QR not sent via WhatsApp or email; user downloads it from lookup page via registered mobile. | Remove Share, or keep only Download/Print |
| 3 | Login footer: "auto-timeout after 15 minutes" | Security guard session ≥ 12 hours | Role-based session timeout |
| 4 | First-time admin creates own account via mobile+email verification | Super Admin seeded by IT in DB; Super Admin adds Admins; users created without password and set it on first login | Agreed decision (use the mockup screen only as "set password on first login") |
| 5 | "View as" role switcher in top bar | — (demo only) | Don't build |
| 6 | Client-side SHA-256 + localStorage | JWT + bcrypt server-side | Server-side |
| 7 | QR preview not scannable | Real QR encoding Person ID | Use a QR library (e.g. `qrcode`) |
| 8 | Devotee approval rule = pending | Awaiting client | Keep submit blocked until confirmed |

---

## 17. Suggested build order for Copilot

1. DB schema + seed (master data, roles, Super Admin)
2. Auth (§1) + RBAC middleware (§2)
3. Master Data (§12)
4. Register Person (§5) — data-driven category forms
5. Person Management (§4)
6. Approval Center (§6)
7. QR (§7) + public QR lookup (F-AUTH-04)
8. Security Gate (§8)
9. Blacklist (§9)
10. Audit (§13) + Notifications (§14) — wire events from all modules
11. Dashboard (§3)
12. Reports (§10)
13. User Management (§11)

**Prompt template per module:**
> "Using the Project Context below, implement **§8 Security Gate** (features F-GATE-01 to F-GATE-06) end-to-end: PostgreSQL tables/migration, Express routes with RBAC checks, service layer with all business rules and validations listed, React components following our coding standards, and Jest tests for each rule in the table. Do not skip any field, validation message or state."
