# Technology Engineering And Design

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Forward_Engineering
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Requirements: 02_Requirements_And_Scope.md
- Architecture: 04_Target_Solution_Architecture.md
- Source_Baseline_ID: SRC-BL-005
- Document_Version: 3.3
- Date: 2026-10-09
- Owner: Architecture_Owner [OPEN QUESTION: individual not named]

## Purpose
Define implementation standards and preserve current mockup intent in line with the current architecture and approved business behavior. The mockup is a design reference, not an authoritative security or workflow implementation.

## Technology Source Inventory

| Tech_Source_ID | Source_ID_or_Artifact_ID | Source_Type | Decision_Area | Usage | Status | Related_IDs |
|---|---|---|---|---|---|---|
| TECH-SRC-001 | SRC-003 | Architecture | UI/API/platform/security/CI-CD | Proposed target stack and deployment | Approval status not stated | FR-001–FR-020, NFR-001–NFR-011 |
| TECH-SRC-002 | SRC-004, SRC-007–SRC-009 | Database/SQL | Schema, migrations and query behavior | Physical data design reference | Draft; review required | FR-002–FR-017 |
| TECH-SRC-003 | SRC-006 | UI mockup | Screens, layout, controls, palette | Requester-selected visual reference for production UI | Prototype only; UI implementation must retain approved API/security behavior | FR-001–FR-018 |
| TECH-SRC-004 | 02_Requirements_And_Scope.md | Requirements | Behavior and acceptance | Governing application rules | Review draft | FR-001–FR-020 |

## Target Technology Stack

| Layer | Technology | Version_or_Range | Decision_Status | Purpose_and_Constraints | Related_IDs |
|---|---|---|---|---|---|
| Frontend | React + Vite | React 19; Vite current at project start | Source target; confirm approval | Responsive role-based PWA | FR-001, FR-018 |
| State | Redux Toolkit | Current compatible version | Source target | Session, masters, modules and request state | FR-001–FR-016 |
| Routing | React Router | v7 | Source target | Role-aware navigation/route guards; server remains authorization authority | FR-001 |
| UI | Material UI | Current compatible version | Source target | Forms, tables, dialogs and responsive layouts; one theme | SRC-003, SRC-006 |
| Forms | React Hook Form + Zod | Current compatible versions | Source target | Form validation based on FRD schemas | FR-002–FR-005 |
| HTTP | Axios | Current compatible version | Source target | Single configured client/interceptors under services | FR-001–FR-020 |
| QR scanner | html5-qrcode | Current compatible version | Source target | Device camera scanning on guard phone/tablet | FR-009, FR-018 |
| PWA | vite-plugin-pwa | Current compatible version | Source target | Installable; offline operation explicitly not required | FR-018, FR-020 |
| UI tests | Vitest + React Testing Library | Current compatible versions | Source target | Component/unit tests | NFR-011 |
| Runtime/API | Node.js + Express | Node 22 LTS or newer LTS; Express 5 | Source target | ES module REST API, `/api/v1`, local port 6200 | FR-001–FR-020 |
| Persistence | PostgreSQL + `pg` | PostgreSQL 16 | Source target | Parameterized SQL and connection pool | FR-002–FR-016 |
| Auth | `jsonwebtoken` + `bcrypt` | Source target | Source target; policy needs review | JWT, bcrypt cost 12, token_version revocation | FR-001, FR-019 |
| Validation | Zod | Current compatible version | Source target | One request schema per endpoint | FR-002–FR-019 |
| Files | Multer + AWS SDK v3 | Current compatible versions | Source target | Memory-only upload handling; S3 KMS/private object store | FR-005, FR-017 |
| QR generation | `qrcode` | Current compatible version | Source target | PNG generated on demand, signed versioned payload; not stored | FR-007–FR-008 |
| Bulk/report files | ExcelJS | Current compatible version | Source target | XLSX/CSV bulk parsing and Visit History export | FR-005, FR-014 |
| API security/logging | Helmet, CORS, express-rate-limit, Pino | Current compatible versions | Source target | Headers, origin allow-list, login/IP throttling and structured JSON logs | NFR-006, FR-015, FR-019 |
| Jobs/API tests | node-cron; Jest + Supertest | Current compatible versions | Source target | Overstay/cleanup jobs; unit/API tests | FR-012–FR-015 |
| API docs | swagger-ui-express/OpenAPI | Current compatible version | Source target | `/api-docs`, disabled in production | Engineering support |
| Cloud | AWS ECS Fargate, ECR, RDS PostgreSQL, S3, CloudFront/WAF, ALB, Route53, ACM, KMS, Secrets Manager, IAM, CloudWatch, CloudTrail | Managed current versions | Source target; environment approval open | Production topology as in 04 | NFR-004, NFR-010 |
| IaC/CI-CD | Terraform, GitHub Actions | Current compatible versions | Source target | Separate environment state and reviewed deployment pipeline | FR-018–FR-020 |
| Cache | None in Phase 1 | N/A | Explicitly deferred | Consider Redis only after measured load and approval | NFR-003, NFR-005 |

## Project Structure And Repository Hygiene

```text
Maitribudh-AMS/
  Maitribudh-UI/
    src/ (screens, components, HOCs, redux, services, theme, utils)
    public/
  Maitribudh-API/
    src/ (config, constants, controllers, middleware, modules, repositories, services, utils)
    db/migrations/
    tests/
  infra/ (Terraform per environment)
  .github/workflows/ (UI/API pipelines)
```

- Source architecture proposes separate UI/API workflows and a shared GitHub repository; confirm repository URL and exact module tree before setup.
- Do not commit secrets, `.env` files, credentials, generated build output, dependencies, logs, caches or coverage output.
- Database changes are versioned migrations; supplied SQL is not a production migration until reviewed.
- Use separate Terraform state per environment and reviewed pipeline apply.

## Naming Conventions

| Artifact_Type | Convention | Example | Evidence |
|---|---|---|---|
| React component | PascalCase | `PersonListPage` | SRC-003 |
| Variables/functions | camelCase | `getPersonById` | SRC-003 |
| Constants | UPPER_SNAKE_CASE | `SESSION_TIMEOUT_MINUTES` | SRC-003 |
| Folders | kebab-case | `person-management` | Confirm exact structure during setup |
| API modules | `*.controller.js`, `*.service.js`, `*.repository.js` | Source examples | SRC-003 |
| Database | snake_case | `approval_history` | SRC-004, SRC-007 |

## Authentication Authorization And Configuration
- Roles: Super Admin, Admin, Approver, Registration Officer, Security Guard and Viewer. FRD role rules govern; code-level `SUPER_ADMIN` is an additional bootstrap role that needs an explicit role matrix.
- API must enforce authorization on every route; client-side guards only improve navigation.
- Passwords: bcrypt cost 12; minimum 10 characters with letters and digits; first-login password creation and old+new password reset; no email/OTP reset.
- Lockout: five failures in a 15-minute window locks the account for 15 minutes; login endpoint also rate-limited by IP.
- Session: CR-004 sets absolute JWT expiry to 12 hours for Security Guard and 30 minutes from issuance for other roles; it is not a rolling idle timeout. Logout/password reset increments `token_version` to revoke existing JWTs.
- First login: CR-005 requires an Admin-issued random temporary password, bcrypt-hashed at rest, single successful login, 24-hour expiry, one-time display to the Admin for out-of-band delivery, and forced password change. Username/email alone is never proof of identity. The temporary JWT may access only password change and logout until rotation completes.
- Logout/password reset increments `token_version` to revoke existing JWTs.
- Public QR lookup is unauthenticated and has no OTP/CAPTCHA/rate limit by source decision; this is a production blocker until risk acceptance or approved control change.
- Secrets live in Secrets Manager; environment-specific configuration is not committed.
- Data & Analytics pipeline/job-design standards: Not Applicable (Domain=Software; no subtype selected). Application background jobs remain in scope.

## Engineering Standards

| Standard_ID | Area | Mandatory_Standard | Evidence_Method | Related_IDs |
|---|---|---|---|---|
| STD-001 | JavaScript | ES modules, `const`/`let`, async/await, no `var`; import `.js` extensions in API | ESLint | SRC-003 |
| STD-002 | Code quality | ESLint 9 flat config, zero warnings; Prettier single quotes, semicolons, 2 spaces, 100 columns | CI lint/format | SRC-003 |
| STD-003 | UI | React Hooks/accessibility rules; MUI theme values, named imports, responsive Grid/breakpoints | Lint/review | FR-018 |
| STD-004 | API | Route handlers via asyncHandler; ApiError with FRD code; one error middleware; parameterized SQL only | Tests/review | FR-002–FR-019 |
| STD-005 | Design | Small modular components; shared logic in utils; no hard-coded roles/status/routes/messages/limits | Review/lint | FR-001–FR-020 |
| STD-006 | Documentation | JSDoc on exported functions/components/HOCs/services; README per app; OpenAPI for API | Review/CI | SRC-003 |
| STD-007 | Testing | Unit tests for services/utils/components and API tests for every endpoint; target >=70% line coverage | Jest/Vitest CI report | NFR-011 |
| STD-008 | Security | No `console.log`, secrets or unsafe SQL; upload magic-byte/type and size validation; least privilege | CI scans/review/tests | NFR-006, NFR-010 |
| STD-009 | Delivery | Husky/lint-staged, Conventional Commits, PR lint/format/tests/coverage/npm audit/build | CI evidence | SRC-003 |

## UI Screen And Control Inventory

| Screen_ID | Screen_Name | Route_or_Access_Point | Purpose_and_Primary_Controls | Roles_or_Access | Related_FRs | Source_IDs |
|---|---|---|---|---|---|---|
| UI-000 | Login | `/login` | Split brand/sign-in composition, secure credential form, public QR entry | Unauthenticated | FR-001, FR-008, FR-019 | SRC-002, SRC-003, SRC-006 |
| UI-001 | Dashboard | `/dashboard` | Occupancy widgets, inside list and status summaries | Portal roles per authorization matrix | FR-012, FR-014 | SRC-002, SRC-003, SRC-006 |
| UI-002 | Security Gate | `/gate` | Camera scan/mobile search, person/photo status, check-in/out, location, walk-in | Guard, Admin, Approver, Registration Officer as authorized | FR-009–FR-010 | SRC-002, SRC-003, SRC-006 |
| UI-003 | Person Management | `/persons` | Search by ID/name/mobile, status filter, duplicate-preserving results, paging and rejected-record resubmission | Admin, Approver, Registration Officer | FR-002, FR-006 | SRC-002, SRC-003, SRC-006 |
| UI-004 | Registration | `/persons/new` | Category, common fields, category details, photo/docs, review | Registration roles; Guard limited to Visitor walk-in | FR-002–FR-005 | SRC-002, SRC-003, SRC-006 |
| UI-005 | Person Detail | `/persons/:id` | Person profile, status, location, history and documents | Role-scoped | FR-002, FR-007, FR-015 | SRC-002, SRC-003, SRC-006 |
| UI-006 | Approvals | `/approvals` | Pending decision queue, approval confirmation and rejection reason | Admin, Approver | FR-004 | SRC-002, SRC-003, SRC-006 |
| UI-007 | Bulk Upload | `/bulk-upload` | Template/download, upload, validation results | Users granted permission | FR-005 | SRC-002, SRC-003, SRC-006 |
| UI-008 | Blacklist | `/blacklist` | Add/lift and review entries | Admin only | FR-011 | SRC-001–SRC-003, SRC-006 |
| UI-009 | Reports | `/reports` | Six report views; Visit History filters and CSV/XLSX export | Report roles | FR-014 | SRC-001–SRC-003, SRC-006 |
| UI-010 | Masters and Users | `/categories`, `/locations`, `/users` | Category, active gate/area and user-account administration | Admin; Super Admin for Admin-account creation | FR-001, FR-003, FR-016 | SRC-001–SRC-003, SRC-006 |
| UI-011 | Audit Log | `/audit` | Filtered audit rows and detail view | Admin only | FR-015 | SRC-001–SRC-003, SRC-006 |
| UI-012 | Public QR Lookup | `/public-qr` from login | Mobile lookup, every active duplicate match, QR display/download and rate-limit feedback | Unauthenticated | FR-006–FR-008 | SRC-001–SRC-003, SRC-006 |

## Design System
- Selected reference: `Inputs Artifacts/Maitribodh_AMS_Mockup_v2 (2).html` (SRC-006), requester-confirmed on 2026-10-09. Use its split brand/login composition, light collapsible sidebar, compact warm topbar, dense tables, status badges, registration steps, and restrained card treatment.
- Palette: marigold `#F7D327`, dark warm gray `#504C41`, light marigold `#FEED9F`, warm near-white `#FBFBF5`, and white surfaces. Preserve distinct semantic success `#2E7D46`, warning `#B8790A`, danger `#C4281B`, and info `#0B6E7A` colors from the reference.
- Typography: Segoe UI/system for interface text; Cambria/Georgia for the wordmark and selected display headings. Use compact page headings and the reference's dense operational hierarchy.
- Layout: login brand panel and sign-in form are side by side on desktop and stack on narrow screens; application shell uses a 238px sidebar that collapses to 76px and a 62px topbar; content remains scrollable with responsive page padding.
- Shape and density: keep controls and repeated surfaces at 8px radius or less; prefer thin borders and restrained shadows. Tables remain horizontally scrollable on small screens; action controls retain accessible text/tooltips and keyboard focus.
- Semantics: use labels and text alongside color/icon status; preserve touch targets, focus visibility and responsive wrapping. Formal contrast and accessibility validation remains due before G2.
- Content conflict: the mockup login headline “One record per person” conflicts with BR-05/FR-006, which explicitly allow duplicate registrations; production copy must not imply uniqueness, and the UI must show all matching registrations.
- Behavior boundary: treat prototype records, credentials, role switching, visual QR examples, and simulated metrics as non-production. Keep API authorization, consent, rate limits, audits, and real data behavior authoritative.
- Content conflict: the mockup login headline “One record per person” conflicts with BR-05/FR-REG-02, which explicitly allow duplicate registrations; production copy must not imply uniqueness, and the UI must show all matching registrations.
- Accessibility: preserve text/icon in addition to color; keyboard/focus, labels, screen-reader status, touch targets and contrast require formal validation. Target standard is not specified.
- Prototype-only demo role switch, sample records, hard-coded credentials, and preview states must not ship as production behavior.

## DevSecOps And Tooling
- Separate UI/API CI workflows: lint with zero warnings, Prettier check, unit/API tests with coverage, `npm audit` failing on high severity, build, security scans and deployment.
- API image is tagged by commit and pushed to ECR; UI build goes to environment S3 with CloudFront invalidation; migration executes before new API version.
- Branch flow in source: `feature/*` -> PR to `develop` (Dev) -> `uat` (UAT) -> `main` (Production); production requires named GitHub Environment approver.
- Required evidence: dependency audit, secrets scan, SAST/equivalent, container/image scan, license/SBOM decision, protected deployment approval, migration/rollback test. None has been executed yet.
- No BI semantic-model/dashboard inventory beyond application operational dashboards (Data & Analytics subtype N/A).

## Traceability Instructions
- Stack and engineering decisions trace to SRC-003; data and query contracts trace to SRC-004/SRC-007–009; visuals trace to SRC-006.
- UI scope maps to requirements in 02 and implementation instructions in 09; UI interactions are not inferred from prototype-only JavaScript.
- No unapproved API route, deployment behavior, dependency or data rule may be added.