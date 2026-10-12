# Source Baseline

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Document_Version: 5.4
- Date: 2026-10-09
- Source_Baseline_Owner: Vineet Agrawal, Business_Sponsor

## Purpose
- Baseline_Objective: Re-establish the source of truth from the complete current input set and replace the stale SRC-BL-002 baseline.
- Source_Root: `SDD_Process/Inputs Artifacts/` (actual folder name; master prompt and templates say `Input Artifacts/`)
- Output_Root: `SDD_Process/Generated Artifacts/`
- Evidence_Rule: Inputs are reference evidence until their facts are extracted into optimized artifacts.
- Input_Organization_Rule: Current inputs are directly in the root and one SQL subfolder; no manifest is present.
- Auto_Classification_Rule: Classified from path, filename, extension, document headings/content, HTML, and SQL contents. PDF content could not be extracted in this run and is explicitly marked unverified.
- Baseline_Mode: Change_Impact; approved blocker decisions applied with G3 conditions
- Baseline_ID: SRC-BL-005
- Baseline_Created_At: 2026-10-08
- Previous_Baseline_ID: SRC-BL-004
- Current_Baseline_Status: Current; approved decisions recorded, validator Pass and G1 approval recorded 2026-10-09

## Consolidated Source Inventory

| Source_ID | File_or_Folder | Original_Location | Source_Type | Classification_Method | Format | Status | Priority | Consumed_By_Artifacts | Key_Facts_Extracted | Gaps_or_Risks |
|---|---|---|---|---|---|---|---|---|---|---|
| SRC-001 | Maitribodh_AMS_Business_Requirements_Document_v1.2.docx | Inputs Artifacts/ root | Requirement | Filename and document content | DOCX | Review draft | Primary | 00, 02, 04, 06, 07, 08, 09 | Business objectives, scope, BR-01–BR-30, role and category rules, DPDP applicability, success measures, risks, dependencies, and open items | Review draft; open items include category/broad-category mapping, privacy, approval, audit retention, bulk-upload template, and business signoff |
| SRC-002 | Maitribodh_AMS_Functional_Requirements_Document_v1.2.docx | Inputs Artifacts/ root | Requirement | Filename and document headings/content | DOCX | Version 1.2; approval status not stated | Primary | 02, 04, 05, 06, 07, 08, 09 | Detailed role permissions, field validation, registration/approval, QR, gate, occupancy, reports, notifications, audit and error behavior | Detailed rules must be reconciled with BRD and SQL; unresolved OI references remain open |
| SRC-003 | Maitribodh_AMS_Solution_Architecture_v2.docx | Inputs Artifacts/ root | Technical / Architecture | Filename and document headings/content | DOCX | Version 2; approval status not stated | Primary | 04, 05, 06, 07, 08, 09 | React 19/Vite, Redux Toolkit, MUI, Node.js 22/Express 5, PostgreSQL 16, S3, ECS Fargate, Terraform, GitHub Actions; JWT, KMS, network, deployment, NFR targets | Redis is explicitly deferred; architecture's public QR decision has no OTP/CAPTCHA/rate limit despite exposure; 99.5% target has production and pilot alternatives |
| SRC-004 | Maitribodh_AMS_Database_Design_Document_v2.0.docx | Inputs Artifacts/ root | Database | Filename and document headings/content | DOCX | Version 2.0; approval status not stated | Primary | 02, 04, 05, 06, 07, 09 | 12-table PostgreSQL schema, relationships, JSON columns, DB/API business-rule split, query catalog, deployment and open items | Must be reconciled against supplied SQL files; includes unresolved decisions and proposed constraints |
| SRC-005 | Maitribodh_AMS_End_to_End_Application_Flow_v1.2.pdf | Inputs Artifacts/ root | Technical / Workflow | Filename and extension | PDF | Present; content extraction unavailable in this run | Supporting | 02, 04, 06, 07 | Intended end-to-end flow reference by title | Content was not readable through available local extraction; do not treat unverified details as authoritative; request a text-readable copy if it adds requirements not in SRC-001/002 |
| SRC-006 | Maitribodh_AMS_Mockup_v2 (2).html | Inputs Artifacts/ root | UI | Filename, HTML/CSS/JS content | HTML/CSS/JS | Reference only | Primary for visual layout | 02, 05, 07, 09 | Interactive prototype with login and AMS operational screens; ivory/marigold/charcoal palette and Cambria/Georgia wordmark | Prototype is not a production implementation; no business logic/backend implied by demo interactions; visual evidence must not override explicit BRD/FRD rules |
| SRC-007 | Maitribodh_AMS_Database_SQL_v2/01_schema.sql | Inputs Artifacts/ nested SQL folder | Database / Codebase | Extension, SQL DDL and comments | PostgreSQL SQL | Draft technical reference | Primary for physical schema | 01, 02, 04, 05, 07, 09 | 12 tables, constraints and indexes; PostgreSQL 16; DB-enforced one open visit and one active blacklist entry; duplicates across person registrations allowed | SQL is a design input, not an executed migration; check inconsistent field/cardinality rules before implementation |
| SRC-008 | Maitribodh_AMS_Database_SQL_v2/02_seed_data.sql | Inputs Artifacts/ nested SQL folder | Database | Extension, SQL inserts, SAMPLE comments | PostgreSQL SQL | Sample data; replace/confirm before production | Supporting | 01, 02, 04, 06, 07, 09 | Sample permission levels, departments, jobs, proof types, reasons, categories, subcategories, gates and areas | Explicitly sample; category seed omits any final broad/base mapping, and its list differs in structure from the requirements; not approved production master data |
| SRC-009 | Maitribodh_AMS_Database_SQL_v2/03_api_queries.sql | Inputs Artifacts/ nested SQL folder | Technical / Database | Extension, named query comments and SQL | PostgreSQL SQL | Draft technical reference | Primary for API/data behavior | 02, 04, 05, 06, 07, 09 | Login lockout, registration, approvals, public QR, gate checks, visits, jobs, blacklist, upload, notifications, reports, audit | Validate transactions, authorization, retention/deletion, query behavior, timezone consistency, and alignment with FRD before build |
| SRC-011 | MAMS Blocker Resolution Pack v1.pdf | Inputs Artifacts/ root | Governance / Approved_Decision_Pack | Filename, PDF text and signed Section 8 record | PDF v1.2, 20 pages | Approved; signed 2026-10-08 | Primary for approved blocker decisions and CR-001–003 | 00, 01, 02, 04, 06, 07, 08, 09, 10 | DEC-001–004, POL-001, RACI-001, RB-001–006, TEP-001, WVR-001/005/006 and CR-001–003 approved; closes build blockers 001–004 and waives 005/006 to G3; Section 9 specifies artifact updates | G1 was pending when the pack was signed and was subsequently approved 2026-10-09; public QR pen test, DPDP counsel review, drills and full evidence remain G3 gates; WARN-005 mockup fix referenced in pack is not present in current HTML source |

## Data Source And Table Profile Register
Not Applicable — Domain=Software. PostgreSQL tables are application persistence, not a Data_And_Analytics warehouse or pipeline deliverable.

## Auto-Classification Summary

| Classification_ID | Signal | Source_Type_Assigned | Files_Matched | Confidence | Review_Needed |
|---|---|---|---|---|---|
| CLASSIFY-001 | Business Requirements filename and business objectives/scope | Requirement | SRC-001 | High | Yes, draft signoff |
| CLASSIFY-002 | Functional Requirements filename and module/rule headings | Requirement | SRC-002 | High | Yes, reconcile open items |
| CLASSIFY-003 | Solution Architecture filename and technology/platform sections | Technical / Architecture | SRC-003 | High | Yes, approval status not stated |
| CLASSIFY-004 | Database Design filename and relational design sections | Database | SRC-004 | High | Yes, reconcile with SQL |
| CLASSIFY-005 | End-to-End Application Flow PDF filename | Technical / Workflow | SRC-005 | Medium | Yes, contents unreadable in this run |
| CLASSIFY-006 | HTML mockup filename and embedded CSS/JS screens | UI | SRC-006 | High | Yes, prototype-only behaviors |
| CLASSIFY-007 | SQL schema, seed and API query filenames | Database / Technical | SRC-007–SRC-009 | High | Yes, validate before migration |
| CLASSIFY-008 | Blocker Resolution Pack title/version and signed decision record | Governance / Approved_Decision_Pack | SRC-011 | High | Yes, verify artifact propagation and remaining gates |

## Source Version Register

| Source_ID | File_or_Folder | Baseline_Version | Fingerprint_or_Timestamp | Size_or_Revision | Baseline_Status | Last_Seen | Notes |
|---|---|---|---|---|---|---|---|
| SRCVER-001 | SRC-001 | v1.2 | Not captured | 1,171,185 bytes | New to current baseline | 2026-10-08 | BRD identifies itself as review draft |
| SRCVER-002 | SRC-002 | v1.2 | Not captured | 1,780,493 bytes | New to current baseline | 2026-10-08 | Functional requirements document |
| SRCVER-003 | SRC-003 | v2 | Not captured | 497,448 bytes | New to current baseline | 2026-10-08 | Current architecture source replaces prior proposal reference |
| SRCVER-004 | SRC-004 | v2.0 | Not captured | 407,008 bytes | New to current baseline | 2026-10-08 | Database design document |
| SRCVER-005 | SRC-005 | v1.2 | Not captured | 43,257 bytes | New to current baseline | 2026-10-08 | PDF extraction unavailable |
| SRCVER-006 | SRC-006 | v2 (filename) | Not captured | 290,775 bytes | Renamed/replaced baseline entry | 2026-10-08 | New filename includes `(2)`; compare content before assuming unchanged |
| SRCVER-007 | SRC-007 | v2 folder | Not captured | 16,912 bytes | New to current baseline | 2026-10-08 | DDL source |
| SRCVER-008 | SRC-008 | v2 folder | Not captured | 3,837 bytes | New to current baseline | 2026-10-08 | Sample seed data |
| SRCVER-009 | SRC-009 | v2 folder | Not captured | 16,983 bytes | New to current baseline | 2026-10-08 | API query reference |
| SRCVER-010 | Superseded MAMS Blocker Resolution Pack.pdf | v1.0 | SHA-256 `E6BA2722049EBE60A7950BEF28512F1315377A59EB2D3ADE83A0C38C88511F25` | 195,054 bytes; 16 pages | Removed/Superseded | 2026-10-08 | Replaced by signed v1.2 pack |
| SRCVER-011 | SRC-011 | v1.2 | SHA-256 `974E28F8DC15E88A324B5FF8BAC0C807C242B5AC19AA7ECD4E8C12AB43FD59D5` | 211,149 bytes; 20 pages | New approved revision | 2026-10-08 | Signed Section 8 approvals dated 2026-10-08 |

## Post-Generation Source Change Log

| Change_ID | Detected_At | Source_ID | Change_Type | Change_Severity | Change_Summary | Previous_Baseline | New_Baseline | Impact_Status | Owner |
|---|---|---|---|---|---|---|---|---|---|
| SRC-CHG-002 | 2026-10-08 | SRC-001–SRC-009 | Replaced, added, renamed and reclassified | Critical | Current input set differs materially from SRC-BL-002: prior requirement-discovery PDF and vendor proposal are absent; current BRD, FRD, architecture, database design, flow PDF and three SQL references are present; mockup filename changed. Requirements and target stack also differ from prior generated artifacts. | SRC-BL-002 | SRC-BL-003 | Impacted | [OPEN QUESTION] Product_Owner |
| SRC-CHG-003 | 2026-10-08 | SRC-010 | Added | High | New decision pack proposes dispositions for six validation blockers and selected warnings; pack itself says proposed/unsigned and forbids treating placeholders as approvals. | SRC-BL-003 | SRC-BL-004 | Assessed; approval pending | Business_Sponsor |
| SRC-CHG-004 | 2026-10-08 | SRC-011 (replaces SRC-010) | Updated/Renamed | Critical | Approved pack v1.2 supersedes proposed v1.0; names/signatures approve DEC-001–004, POL-001, RACI-001, runbooks, TEP-001, waivers and CR-001–003; Section 9 prescribes artifact changes; G1, validator and G3 release conditions remain outstanding. | SRC-BL-004 | SRC-BL-005 | Approved; targeted regeneration required | Vineet Agrawal, Business_Sponsor |

## Changed Source Impact Summary

| Impact_ID | Change_ID | Affected_Facts_or_IDs | Impacted_Artifacts | Regeneration_Action | Downstream_Dependencies | Validation_Impact | Build_Prompt_Impact | Governance_Needed |
|---|---|---|---|---|---|---|---|---|
| IMPACT-002 | SRC-CHG-002 | BR-01–BR-30, FRD module rules, current stack/security/NFRs, 12-table schema and API queries, screen evidence, open items | 00, 01, 02, 04, 05, 06, 07, 08, 09, 10 | Full_Regeneration | 02 → 04/05 → 06/07/08 → 09 → 10 | Re-run structural/traceability validator; manually assess substantive Enterprise gates and source conflicts | Stale until regenerated | Yes; record acceptance and baseline approval in 08 |
| IMPACT-003 | SRC-CHG-003 | Proposed disposition of BLOCK-001–006 and related warnings; owner names, signatures, waivers and evidence | 00, 01, 02, 04, 06, 07, 08, 09, 10 | Record proposal; defer substantive decisions until signed | Refresh source/readiness records now (00, 01, 08, 09, 10); after signature, apply relevant Section 9 outputs to 02, 04, 06, 07, 08, 09, 10 | Revalidate after accepted decisions; pack requires validator run | Not_Ready; refresh to SRC-BL-004 | Yes; named decision owners/signatures required |
| IMPACT-004 | SRC-CHG-004 | DEC-001–004, POL-001, RACI-001, WVR-001/005/006, CR-001–003, CAP/SLO, consent/retention, runbooks, TEP-001 and Section 9 text | 00, 01, 02, 04, 05 (WARN-005 discrepancy), 06, 07, 08, 09, 10 | Apply signed decisions and waivers; preserve G2/G3 conditions; do not claim mockup v2.10 is present | Update requirements, architecture, backlog, quality, governance, build prompt and report; refresh source/owners | Run Python validator after propagation; manual review for substantive gates | Build prompt was awaiting validator/G1 at impact assessment; validator Pass and G1 approval recorded 2026-10-09 | Yes; approval is recorded, technical outputs/evidence remain gated |

## Regeneration Decision Matrix Applied
SRC-CHG-002 changes requirements, architecture/technology, UI, database/data, and operational/security evidence. The impact is cross-cutting and cannot be isolated to a narrow subset; full regeneration of every applicable optimized artifact is required. `03_Current_State_Analysis.md` remains not applicable because no existing application source code or runtime evidence is supplied.

SRC-CHG-003's proposed pack was superseded by signed SRC-CHG-004. Apply its Section 9 outputs to the specified artifacts. DEC-001–004 and approved waivers authorize build preparation. The validator passed and G1 approval was recorded on 2026-10-09; G2/G3 conditions remain mandatory.

## Regeneration Decision Matrix

| Change_Area | Default_Impacted_Artifacts | Default_Action |
|---|---|---|
| Requirements | 02, 04, 05, 06, 07, 08, 09, 10 | Regenerate affected artifacts and downstream dependents |
| UI | 05, 06 if backlog affected, 07, 09, 10 | Revise UI/design/build/test sections |
| Database_or_Data | 04, 05, 06, 07, 08, 09, 10 | Revise data architecture, validation, release and build prompt |
| Technical_Stack_or_Architecture | 04, 05, 06, 07, 08, 09, 10 | Regenerate target architecture and downstream dependents |
| Governance_or_Release | 08, 09, 10 | Revise governance/release and readiness |

## Source Precedence And Conflict Rules
- BRD (SRC-001) governs business objectives, scope and business policy, subject to explicit review-draft status.
- FRD (SRC-002) supplies detailed behavior; conflicts with BRD remain open and are not silently resolved.
- Solution Architecture (SRC-003) is the target technical reference, but its approval status is unstated; architecture choices require owner confirmation before production provisioning.
- Database Design (SRC-004) and SQL files (SRC-007–009) define a proposed physical model and API query behavior; discrepancies against BRD/FRD are recorded as conflicts, not treated as business decisions.
- Mockup (SRC-006) is visual/UI evidence only. Its demo data and prototype interactions do not override BRD/FRD policies.
- Flow PDF (SRC-005) remains unverified because text extraction was unavailable; use only after review.
- Approved Blocker Resolution Pack (SRC-011) is authoritative for DEC-001–004, POL-001, RACI-001, RB-001–006, TEP-001, waivers and CR-001–003. Copy Section 9 outputs into owning artifacts, retain Section 8 approval evidence, run validator, and preserve G1/G3 gates.
- Older SRC-BL-002 content, including the vendor proposal and prior generated assumptions, is superseded where inconsistent with this source set.

## Source Conflict Register

| Conflict_ID | Source_A | Source_B | Conflict | Impact | Proposed_Resolution | Owner | Status |
|---|---|---|---|---|---|---|---|
| CONFLICT-001 | SRC-001 BR-05 / SRC-002 FR-REG-02 | SRC-006 mockup login headline (“One record per person”); SRC-007 schema and SRC-009 queries | Business/functional rules explicitly allow duplicate registrations and repeated mobile numbers; the schema/query design does not enforce person/mobile uniqueness, but mockup copy implies the opposite | Registration UX, profile search, shared-mobile lookup and QR identity | BR-05/FR-REG-02 govern behavior; retain duplicate-allowed semantics, change misleading mockup copy in production UI, and show all matching registrations with category | Product_Owner | Open for copy/design correction; business rule authoritative |
| CONFLICT-002 | SRC-001 BR-28 and SRC-002 location rules | SRC-007 location/person_location constraints and SRC-008 sample locations | Restricted-area access is manually validated by Security; schema can store assignments but does not enforce eligibility in DB | Gate workflow and authorization tests | CR-007 sets warning-only API behavior for unassigned restricted locations; Security Guard manually verifies and records the decision. No automatic physical enforcement. | Security_Owner | Resolved by approved CR-007 / ARCH-CHG-005 on 2026-10-09; requester-confirmed, no separate evidence ID supplied |
| CONFLICT-003 | SRC-001 broad categories and base categories; OI-16 | SRC-008 category seed values | Business requires base and broad categories and says mapping is unresolved; sample inserts seed broad entries but do not populate broad_category_id mappings | Category master and migration seed | Treat seed as sample only; obtain approved category mapping before production seed | Product_Owner | Open |
| CONFLICT-004 | SRC-002 QR requirements | SRC-011 DEC-001/CR-001 | Original no-rate-limit/full-name disclosure is replaced by signed Option A: 10/minute and 50/day per IP, first name + last initial/category/QR only, uniform non-active response, WAF and CloudWatch alarm | Public lookup, threat model and tests | Apply CTRL-01–06; retain no-login/no-OTP/no-CAPTCHA decision; require independent pen test before G3 under WVR-001 | Security_Owner | Resolved for build; pen test remains G3 gate |
| CONFLICT-005 | SRC-001 DPDP/retention open items and SRC-003 architecture defaults | SRC-011 DEC-002/POL-001/CR-002 | Interim privacy notice, consent/guardian capture, rights and RET-01–12 approved for build/UAT; counsel review remains due before G3 | Data model, consent UI, retention job, S3 lifecycle and release | Apply POL-001/CR-002; do not release before legal review and evidence | Compliance_Owner | Resolved for build/UAT; legal review pending before G3 |
| CONFLICT-006 | SRC-001 BRD sizing and SRC-003 capacity/topology alternatives | SRC-011 DEC-003/CR-003 | Approved distinction: daily attendance, lifetime records and concurrency; selects pilot and production profiles with CAP-01–06 and SLO-01–06 | Infrastructure, load test and release | Apply selected topology/targets; production load test and budget evidence remain due before G2/G3 | Architecture_Owner | Resolved; tests/provisioning pending |
| CONFLICT-007 | SRC-001/002 business roles and approval rules | SRC-003 authentication policy and SRC-006 prototype session behavior | Role responsibilities are consistent; source wording differs on token lifetime and idle behavior. | Session/token expiration and security acceptance tests | CR-004 sets 12-hour absolute JWT expiry for Security Guard and 30-minute absolute JWT expiry for other roles; do not claim a sliding idle timeout. | Security_Owner | Resolved by approved CR-004 / ARCH-CHG-002 on 2026-10-09; requester-confirmed, no separate evidence ID supplied |
| CONFLICT-008 | SRC-002 first-login password lifecycle and SRC-009 null password on user creation/reset | Username/email-only setup has no identity proof and permits account takeover | First-password establishment, account bootstrap and reset | CR-005 requires an Admin-issued random temporary password, bcrypt hash at rest, single successful login, 24-hour expiry, one-time display and out-of-band delivery; force password change. Username/email alone is insufficient. | Security_Owner | Resolved by approved CR-005 / ARCH-CHG-003 on 2026-10-09; requester-confirmed, no separate evidence ID supplied |
| CONFLICT-009 | SRC-002 approval workflow and SRC-009 APR-02 self-approval check | Requirements note a sole-Admin exception but do not define its conditions | Approval decisions and audit evidence | CR-006 allows an ADMIN to decide their own submission only when exactly one active ADMIN account exists; SUPER_ADMIN is excluded from that count and APPROVER self-decisions are denied. | Product_Owner | Resolved by approved CR-006 / ARCH-CHG-004 on 2026-10-09; requester-confirmed, no separate evidence ID supplied |

## Source Coverage Map

| Artifact | Required_Source_Types | Available | Missing | Impact |
|---|---|---|---|---|
| 02_Requirements_And_Scope.md | BRD, FRD, flow, UI | Partial | Flow PDF unverified; approved clarifications absent | Generate from current BRD/FRD and mockup; preserve uncertainties |
| 03_Current_State_Analysis.md | Existing codebase/runtime | Not_Applicable | No application source or runtime evidence | Skip for greenfield |
| 04_Target_Solution_Architecture.md | Requirements, architecture, database design | Yes | Approval status and policy decisions | Use documented target architecture; mark unresolved decisions |
| 05_Technology_Engineering_And_Design.md | Architecture, UI, DB, coding standards | Yes | No implementation repository | Define target stack and UI inventory from inputs |
| 06_Backlog_Delivery_And_Migration_Plan.md | Requirements, architecture, dependencies | Partial | Approved delivery schedule/capacity | Phase by dependency; no vendor schedule assumed |
| 07_Quality_Test_And_Validation.md | Requirements, NFRs, test reports | Partial | No executed tests or scan evidence | Define tests and mark evidence not yet produced |
| 08_Release_Operations_And_Governance.md | Architecture, NFRs, approvals, compliance | Partial | Named owners, approved retention and production signoffs | Enterprise readiness remains conditional/blocked |
| 09_Build_Prompt.md | Accepted optimized artifacts | Yes, after regeneration | Human approval and unresolved production blockers | Build prompt conditional; implementation is not authorized by this baseline |

## Traceability Instructions
- Every current input appears above; SRC-005 is present but unverified and no claims are attributed to its unextracted contents.
- Requirements, architecture, backlog, tests, release evidence and build instructions reference the SRC IDs above.
- SRC-BL-003 artifacts were regenerated for the prior critical source-set change. SRC-BL-004 added a proposed pack; SRC-BL-005 replaces it with signed decisions and applies Section 9 outputs. Validator Pass and G1 approval were recorded on 2026-10-09. Approval was confirmed by the requester in this conversation; no separate approval evidence ID was provided.
- Source changes after 2026-10-08 require a new change record, impact assessment, governance decision and validation report.