# Current State Analysis

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Reverse_Engineering_Only
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Source_Baseline_ID: SRC-BL-006
- Document_Version: 1.2
- Date: 2026-10-27
- Owner: Not confirmed

## Purpose
- Analysis_Objective: Reconstruct the present repository implementation and distinguish it from the previously documented target design.
- Evidence_Rule: Repository code, migrations, tests, package manifests, and updated `docs/` are current-state evidence. The older `SRC-BL-005` forward-engineering artifacts remain historical target-state proposals and are not accepted as current implementation evidence.
- Analysis_Scope: Local repository inspection, API/UI test and lint execution, and UI production build. No live database, deployed environment, production logs, cloud account, or runtime service was inspected.

## Codebase Analysis Depth And Confidence

| Analysis_ID | Analysis_Depth | Included_Evidence | Excluded_Evidence | Confidence | Notes |
|---|---|---|---|---|---|
| CSA-DEPTH-001 | Behavioral_Reconstruction | API/UI source, route modules, services/repositories, migrations, package manifests, tests, updated implementation docs | Live deployment, applied migration state, production telemetry, external services | High for repository structure and documented rules; Medium for behavior not exercised against PostgreSQL | Direct code and docs were inspected; source files do not prove a deployed system has the same state. |

Evidence status: `Observed` means supported directly by repository files or executed tests; `Documented` means stated in the updated implementation docs but not independently verified against a live system; `Inferred` means a reasoned conclusion with confidence noted; `Unverified` means no adequate evidence was available.

## Language Framework And Runtime Detection

| Detection_ID | Area | Detected_Item | Version_or_Indicator | Evidence | Confidence | Impact |
|---|---|---|---|---|---|---|
| DET-LANG-001 | Language | JavaScript / JSX | ES modules; JSX UI | SRC-018, SRC-019; package manifests | High | API and UI are separate Node projects. |
| DET-LANG-002 | API framework | Node.js / Express | Node `>=22`; Express `5.1.0` | SRC-018; `Maitribodh-API/package.json` | High | API starts through `src/server.js`; exact deployment runtime is unverified. |
| DET-LANG-003 | UI framework | React / Vite | React `19.2.0`; Vite `7.1.9` | SRC-019; `Maitribodh-UI/package.json` | High | SPA/PWA build is managed independently from API. |
| DET-LANG-004 | Persistence | PostgreSQL | `pg` `8.16.3`; 10 numbered application migrations | SRC-020; `Maitribodh-API/db/migrations/` | High | Migration files do not establish which migrations a live database has applied. |
| DET-LANG-005 | UI tests | Vitest / Testing Library | Vitest `3.2.4` declared | SRC-019 | High | Repository includes component/screen tests. |
| DET-LANG-006 | API tests | Node test runner / Jest / Supertest | Scripts declare Node `--test`, Jest `30.2.0`, Supertest `7.1.4` | SRC-018 | High | API has core and Jest test suites. |
| DET-LANG-007 | Deployment/CI | No checked-in CI workflow or IaC inventory found at repository root | `.github/workflows` absent; no Terraform/Docker manifest observed in inspected root | SRC-021 | Medium | Local operational scripts exist; cloud deployment described in prior artifacts is not demonstrated by this checkout. |

## Codebase Source Inventory

| Code_Source_ID | File_or_Folder | Source_Type | Status | Used_For | Exclusions_or_Redactions | Notes |
|---|---|---|---|---|---|---|
| CODE-SRC-001 | `Maitribodh-API/src/` | SourceSnapshot | Current repository | API entrypoint, route groups, middleware, services and repositories | No credentials copied | Evidence summarized in SRC-018. |
| CODE-SRC-002 | `Maitribodh-UI/src/` | SourceSnapshot | Current repository | SPA entrypoint, screens, API client, Redux store, components, styles and UI tests | No credentials copied | Evidence summarized in SRC-019. |
| CODE-SRC-003 | `Maitribodh-API/db/migrations/` | Database_Migration | Current repository | PostgreSQL schema history and current migration definitions | No database contents | Ten ordered migrations, 0001–0010. |
| CODE-SRC-004 | `Maitribodh-API/tests/`, `Maitribodh-UI/src/**/*.test.*` | TestReport_Source | Current repository; tests executed 2026-10-27 | Test inventory and latest observed local outcomes | No production data | API: 197 passed, 0 failed. UI: 101 passed, 0 failed with the standard two-worker test command. API/UI lint passed; UI production build passed with warnings. |
| CODE-SRC-005 | `Maitribodh-API/package.json`, `Maitribodh-UI/package.json`, lockfiles | DependencyManifest | Current repository | Runtime, dependencies, commands and test tooling | No environment secrets | Node engine declared `>=22`. |
| CODE-SRC-006 | `Maitribodh-API/db/*.ps1`, `Maitribodh-API/db/*.js`, root and project README files | Runtime_Operations | Current repository | Local startup, migration, seed, backup and reset workflows | No secret values | Local scripts prompt for or generate local credentials; no cloud deployment evidence. |
| CODE-SRC-007 | `docs/MAMS_BRD.md`, `docs/MAMS_FRD.md`, `docs/MAMS_DATABASE_AND_API_REFERENCE.md`, `docs/MAMS_IMPLEMENTATION_GUIDE.md`, `docs/MAMS_IMPLEMENTATION_STATUS.md`, `docs/LOCAL_DEVELOPMENT.md` | Current_Implementation_Documentation | Updated repository docs | Business context, current rules, migration/API reference, known gaps and local workflow | No sensitive values | SRC-012–SRC-017; docs are current-state references, not proof of deployed behavior. |

## Repository Project And Module Inventory

| Current_Component_ID | Path_or_Module | Type | Responsibility | Runtime_or_Build_Role | Owner_or_Unknown | Related_Source_IDs |
|---|---|---|---|---|---|---|
| CUR-CMP-001 | `Maitribodh-API/src/server.js`, `src/app.js` | App_Service_Module | Compose repositories/services/routes, configure middleware, expose health endpoint and start HTTP listener | Runtime | Unknown | SRC-018 |
| CUR-CMP-002 | `Maitribodh-API/src/config/`, `src/middleware/`, `src/errors/` | Config_Module | Database/auth/QR configuration, authentication/authorization, async/error handling | Runtime | Unknown | SRC-018 |
| CUR-CMP-003 | `Maitribodh-API/src/modules/auth`, `users`, `categories`, `lookups`, `locations` | App_Service_Module | Identity, role administration, registration categories, lookup masters and locations | Runtime | Unknown | SRC-018 |
| CUR-CMP-004 | `Maitribodh-API/src/modules/persons`, `approvals`, `qr` | App_Service_Module | Registration/drafts/profile files, review decisions, QR generation and public lookup | Runtime | Unknown | SRC-018 |
| CUR-CMP-005 | `Maitribodh-API/src/modules/gate`, `visits`, `blacklist`, `dashboard`, `reports`, `activity` | App_Service_Module | Gate eligibility, visit transactions, blacklist, occupancy, reporting, notifications and audit endpoints | Runtime | Unknown | SRC-018 |
| CUR-CMP-006 | `Maitribodh-UI/src/App.jsx`, `main.jsx`, `api.js`, `store.js` | App_Service_Module | SPA routing, app bootstrap, API calls and Redux state | Runtime/Build | Unknown | SRC-019 |
| CUR-CMP-007 | `Maitribodh-UI/src/screens/` and `components/` | App_Service_Module | Login, registration, approval, gate, person, user, master, dashboard, report and activity screens | Runtime/Build | Unknown | SRC-019 |
| CUR-CMP-008 | `Maitribodh-API/db/migrations/` | Config_Module | Versioned PostgreSQL schema evolution through migration 0010 | Runtime/Operations | Unknown | SRC-020 |
| CUR-CMP-009 | `Maitribodh-API/tests/`, `Maitribodh-UI/src/**/*.test.*` | Test_Script | API and UI unit/component/route tests | Test | Unknown | SRC-018, SRC-019 |

## Entrypoint Route Controller And Service Inventory

| Entry_ID | Entry_Type | Path_or_Name | Trigger | Handler_or_Service | Downstream_Calls | Data_Access | Auth_or_Guard | Evidence_Status | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| ENTRY-001 | AppEntrypoint | `Maitribodh-API/src/server.js` | Node process start | Constructs configuration, pool, repositories, services, limiters and routers | `createApp`, PostgreSQL pool, feature modules | PostgreSQL via `pg` | Startup configuration validation | Observed | SRC-018 |
| ENTRY-002 | AppEntrypoint | `Maitribodh-API/src/app.js` | HTTP request | Security/CORS/JSON/logging middleware; mounts API routes and health | Feature routers, not-found and error handlers | None directly | Helmet; configured proxy hops; feature-level middleware | Observed | SRC-018 |
| ENTRY-003 | RouteGroup | `/api/v1/auth`, `/users`, `/categories`, `/lookups`, `/locations` | HTTP request | Authentication and administration routers | Corresponding service/repository modules | PostgreSQL | Public login plus route-specific authenticate/authorize guards | Observed | SRC-018 |
| ENTRY-004 | RouteGroup | `/api/v1/persons`, `/approvals`, `/public` | HTTP request | Registration, draft, profile, approval and public QR routers | Registration/person/approval/QR services | PostgreSQL; private upload storage | Auth/role restrictions except public QR lookup; request/file validation | Observed | SRC-018 |
| ENTRY-005 | RouteGroup | `/api/v1/gate`, `/visits`, `/blacklist` | HTTP request | Eligibility, check-in/out and blacklist routers | Gate/visit/blacklist services | PostgreSQL | Authenticated routes with role guards | Observed | SRC-018 |
| ENTRY-006 | RouteGroup | `/api/v1/reports`, `/dashboard`, `/notifications`, `/audit` | HTTP request | Reporting, occupancy, activity and audit routers | Report/dashboard/activity repositories | PostgreSQL | Authenticated routes; audit route restricted to Admin/Super Admin | Observed | SRC-018 |
| ENTRY-007 | HealthCheck | `/health` | HTTP GET | Returns `{status: "ok"}` | None | None | No route-level auth observed | Observed | SRC-018 |
| ENTRY-008 | AppEntrypoint | `Maitribodh-UI/src/main.jsx` | Browser load | Mounts React app and providers | `App.jsx`, Redux store, Vite bundle | Browser state/API | Client route/auth behavior | Observed | SRC-019 |
| ENTRY-009 | Scheduler | Not found in current source | Scheduled trigger | No overstay/retention job entrypoint found | None evidenced | None evidenced | N/A | Observed absence in inspected source | SRC-018, SRC-020; implementation status doc |

## Package Dependency Manifest Inventory

| Manifest_ID | File_Path | Ecosystem | Package_Manager | Lockfile_Present | Build_or_Runtime_Role | Risk | Evidence |
|---|---|---|---|---|---|---|---|
| PKG-001 | `Maitribodh-API/package.json`, `Maitribodh-API/package-lock.json` | Node | npm | Yes | API runtime, tests, lint and migrations | Dependency scan status not evidenced by this analysis | SRC-018 |
| PKG-002 | `Maitribodh-UI/package.json`, `Maitribodh-UI/package-lock.json` | Node | npm | Yes | UI runtime, Vite build, tests and lint | Dependency scan status not evidenced by this analysis | SRC-019 |
| PKG-003 | Root `package-lock.json` | Node | npm | Yes | Root-level lockfile; associated root `package.json` was not present | Purpose unknown; reconcile/retire only after owner review | SRC-021 |

## Data Pipeline And Orchestration Inventory
Not Applicable — Domain=Software; no data pipeline, warehouse/lakehouse, or BI workload was identified. PostgreSQL is transactional application persistence.

## As-Is Capability Map

| AsIs_Capability_ID | Capability | Observed_Behavior | Users_or_Actors | Business_Value | Evidence | Target_Relevance |
|---|---|---|---|---|---|---|
| ASIS-CAP-001 | Authentication and role authorization | API login/session, role guards and user administration are implemented | Admin, Super Admin, Approver, Registration Officer, Security Guard, Viewer | Controls access to operational workflows | SRC-018; SRC-013 | Retain; current docs describe current roles. |
| ASIS-CAP-002 | Person registration and drafts | Schema-driven categories, registration validation, photo/files and per-user drafts exist; draft listing is limited to recently updated drafts | Registration roles; Guard for Visitor | Captures person identity and registration information | SRC-018; SRC-014–SRC-016 | Retain; verify category-specific requirements against code before extending. |
| ASIS-CAP-003 | Approval and QR | Approval history/routes and signed QR/public lookup are implemented | Admin/Approver; registered persons | Tracks review status and person lookup | SRC-018; SRC-013, SRC-014 | Retain; public QR/privacy controls need security verification. |
| ASIS-CAP-004 | Gate and visit operations | Gate eligibility, check-in/out, open-visit constraints and blacklist workflows are implemented | Security Guard, Admin | Records entry/exit activity | SRC-018; SRC-013, SRC-014 | Retain; restricted-area checks have manual/warning behavior documented. |
| ASIS-CAP-005 | Operations and audit | Dashboard, reports, notifications and audit APIs are implemented | Admin, Viewer and applicable roles | Supports operational monitoring and accountability | SRC-018; SRC-014, SRC-016 | Retain; no live operational telemetry or scheduled job evidence. |

## As-Is Workflow Reconstruction

| AsIs_Workflow_ID | Capability_ID | Trigger | Steps | Business_Rules | Data_Behavior | Exceptions | Evidence |
|---|---|---|---|---|---|---|---|
| ASIS-WF-001 | ASIS-CAP-002 | Authenticated registration workflow | Load category/options; save/update owned draft or submit; validate profile/photo/consent/files; persist registration | Registration role and category rules enforced in API | PostgreSQL person/category/location and related records; files under configured private upload root | Draft resume clears consent and requires reconfirmation; uploaded files/sensitive identifiers are not retained with draft resume | SRC-018; SRC-014–SRC-016 |
| ASIS-WF-002 | ASIS-CAP-003 | Approval queue or QR lookup | Authorized reviewer decides; QR service signs and validates per-person identifier; public endpoint returns matching active records | Role restrictions and approval history; public response/rate control behavior is implemented in routes/services | Person and approval history in PostgreSQL | Exact deployment-level rate limits/WAF/alarms not verified | SRC-018; SRC-013–SRC-015 |
| ASIS-WF-003 | ASIS-CAP-004 | Guard scans/searches person | Check eligibility, record check-in; later record checkout | Active/blacklist/open-visit rules; one open visit per person; location handling per docs | Visit, person, gate/location and audit data in PostgreSQL | Visitor walk-in path exists; no physical access hardware evidenced | SRC-018; SRC-013–SRC-016 |

## Current Technology And Dependency Inventory

| Dependency_ID | Layer | Technology_or_Package | Observed_Version | Usage | Risk_Flag | Future_Use_Status | Evidence |
|---|---|---|---|---|---|---|---|
| CUR-DEP-001 | API | Node.js / Express | Node `>=22`; Express `5.1.0` | HTTP API | Unknown security/EOL status; scan not run | Retain current | SRC-018 |
| CUR-DEP-002 | UI | React / Vite / Material UI | React `19.2.0`; Vite `7.1.9`; MUI `7.3.4` | Responsive client | Unknown security/EOL status; scan not run | Retain current | SRC-019 |
| CUR-DEP-003 | Data | PostgreSQL / node-postgres | PostgreSQL 16 target documented; pg `8.16.3` | Transactional application persistence | Applied DB version/state unverified | Retain current | SRC-018, SRC-020; SRC-014 |
| CUR-DEP-004 | Security | bcrypt, jsonwebtoken, Helmet, express-rate-limit | package versions in API manifest | Password hashing, JWT, HTTP headers, rate limit | Security configuration/test evidence incomplete | Retain; assess with security scans | SRC-018 |
| CUR-DEP-005 | UI state/forms | Redux Toolkit, React Router, React Hook Form, Zod | Manifest versions | Client state, routing, form validation | API remains authorization authority | Retain current | SRC-019 |

## Current API Interface Job And Integration Inventory

| Interface_ID | Interface_Type | Name_or_Path | Producer | Consumer | Input | Output | Auth_or_Access | Failure_Mode | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| CUR-INT-001 | API | `/api/v1/*` route groups | Express API | React UI and authorized clients | JSON/multipart HTTP requests | JSON responses, reports and file responses | JWT/role guards per route; public QR endpoint is an exception | Common not-found/error handling; validation and authorization errors | SRC-018 |
| CUR-INT-002 | Internal_DB | PostgreSQL via `pg` pool | API repositories | MAMS API | Parameterized SQL | Rows/transactions | Network/database credentials from environment | Repository/service errors passed to API error handling | SRC-018, SRC-020 |
| CUR-INT-003 | File | Private upload root | Registration/profile upload endpoints | API/UI file access endpoints | Validated photo/document upload | Private stored file or controlled response | Route authorization; local path/config; deployed storage not verified | Upload validation/size/type errors | SRC-018; SRC-014 |
| CUR-INT-004 | External | External cloud/SMS/email integrations | None evidenced in current repository | N/A | N/A | N/A | N/A | N/A | SRC-018, SRC-021 |

## Current Data And Persistence Inventory

| Current_Data_ID | Entity_or_Store | Source_Of_Truth | Access_Pattern | Classification | Retention_or_Lifecycle | Constraints | Evidence |
|---|---|---|---|---|---|---|---|
| CUR-DATA-001 | PostgreSQL `mams` schema: 12 application tables (`app_user`, `lookup_value`, `category`, `location`, `bulk_upload`, `person`, `person_location`, `approval_history`, `blacklist`, `visit`, `notification`, `audit_log`) | Database for active environment not inspected; migration files define intended schema | API repositories / transactional writes | Restricted/PII | Retention policy is documented; actual scheduled execution not evidenced | Foreign keys, unique/index constraints and migration history | SRC-020; SRC-014 |
| CUR-DATA-002 | Person registration and identity fields | `person` table per migration/docs | API registration/profile/gate routes | Restricted/PII | Current deployed lifecycle unknown | Primary mobile E.164; Visitor may be international; other categories require Indian primary mobile per current docs; duplicate mobile/person records are allowed | SRC-018, SRC-020; SRC-012–SRC-016 |
| CUR-DATA-003 | Registration drafts and consent fields | Person/draft records per code/docs | Creator-scoped draft APIs | Restricted/PII | Drafts are visible to creator only when updated within seven days; consent is cleared on resume | Draft remains incomplete; consent must be confirmed again | SRC-018; SRC-012–SRC-016 |
| CUR-DATA-004 | Visit, approval, blacklist and audit records | PostgreSQL application tables | API routes and repositories | Restricted/Operational | Actual retention execution not verified | One open visit; append-only audit enforcement documented; blacklist and approval histories are role-guarded | SRC-018, SRC-020; SRC-014–SRC-016 |
| CUR-DATA-005 | Uploaded photos and documents | Configured private upload directory | Multipart upload and guarded download routes | Restricted/PII | File deletion/retention scheduling not verified | Current docs specify JPG/PNG photo and bounded upload rules; private files are ignored by Git | SRC-018; SRC-014–SRC-016 |

## Current UI And User Flow Inventory

| Current_UI_or_Flow_ID | Area | Observed_Behavior | Screens_or_Controls | Business_Rules | Gaps_or_Ambiguity | Evidence |
|---|---|---|---|---|---|---|
| CUR-UI-001 | Auth/navigation | Login, password setup and role-aware navigation | Login, password, app shell/navigation | Client visibility does not replace API authorization | Runtime identity-provider integration not evidenced | SRC-019 |
| CUR-UI-002 | Registration/person | Register, list, search, details, files and QR | Register, persons, person detail, QR/public QR | Client form schemas and API validation; Visitor primary phone supports international dialing | Full device/browser compatibility not tested in this analysis | SRC-019; SRC-013–SRC-016 |
| CUR-UI-003 | Operations | Gate, approvals, blacklist, dashboard, reports, locations, categories, users, activity | Corresponding screen modules | Screen permissions are paired with API guards | Current production usage and accessibility evidence unavailable | SRC-019 |

## Runtime Operations And Deployment Inventory

| Runtime_ID | Runtime_Item | Trigger_or_Mode | Environment | Observed_Behavior | Config_or_Secret_Handling | Failure_or_Log_Evidence | Owner |
|---|---|---|---|---|---|---|---|
| CUR-RUN-001 | API server | `npm start` / `npm run dev`; HTTP listener defaults to port 6200 | Local scripts/documentation | `GET /health` responds with status JSON; live server was not started for this analysis | Environment variables; local PowerShell startup script generates temporary local secrets | Pino HTTP logging and central error middleware; production config requires `TRUST_PROXY_HOPS` | Unknown |
| CUR-RUN-002 | UI dev server/build | Vite `npm run dev` / `npm run build` | Local development | Vite proxy documented to API at `127.0.0.1:6200` | Vite/project config | Build/test command exists; production hosting unverified | Unknown |
| CUR-RUN-003 | Migration runner | `npm run migrate` / `npm run migrate:local` | Local or configured PostgreSQL | Takes PostgreSQL advisory lock, checksum-verifies applied migrations and applies pending files transactionally | Database URL or masked local PowerShell prompt | Fails on changed applied migration; no target database queried | Unknown |
| CUR-RUN-004 | Local seed/backup/reset helpers | Manual PowerShell/npm tasks | Local-only documented workflows | Setup, dev fixture seed, backup and guarded reset scripts exist | Prompts for credentials; reset guards target local DB | No production execution observed | Unknown |
| CUR-RUN-005 | Cloud deployment | Not evidenced | AWS configuration in previous target artifacts only | No Terraform, container deployment or CI workflow found in inspected root | Not verified | No deployment/runtime logs available | Unknown |

## Deployment Runtime And Test Evidence Matrix

| Evidence_ID | Evidence_Type | Location | Coverage_or_Operational_Area | Status | Finding | Related_Current_IDs |
|---|---|---|---|---|---|---|
| CSA-EV-001 | BuildConfig | API/UI package manifests and lockfiles | Runtime and build commands | Present | Separate npm projects; Node engine `>=22` | CUR-CMP-001, CUR-CMP-006 |
| CSA-EV-002 | TestReport | API `npm test` run, 2026-10-27 | API automated tests | Failed | 193 passed, 2 failed: invalid lookup references validation response; category create route normalization | CUR-CMP-009 |
| CSA-EV-003 | TestReport | UI `npm test` run, 2026-10-27 | UI component/screen tests | Failed | 98 passed, 3 failed by 30-second test timeout across Blacklist, Register, and Users screens | CUR-CMP-009 |
| CSA-EV-007 | TestReport | API `npm test` before scoped category fixes, 2026-10-27 | API automated tests | Failed; superseded by CSA-EV-010 | 193 passed, 2 failed: invalid lookup references validation response; category create route normalization | CUR-CMP-009 |
| CSA-EV-008 | TestReport | UI `npm test` with unrestricted workers, 2026-10-27 | UI component/screen tests | Failed; superseded by CSA-EV-012 | 93 passed, 8 timed out across Blacklist, Gate, Register, and Users screens (5- and 30-second test limits); subsequent two-worker run passed all 101 | CUR-CMP-009 |
| CSA-EV-009 | BuildReport | UI `npm run build`, 2026-10-27 | UI production bundle | Passed with warnings | Production bundle generated; Rollup emitted dependency annotation and large-chunk warnings | CUR-CMP-006 |
| CSA-EV-010 | TestReport | API `npm test` after scoped category API fixes, 2026-10-27 | API automated tests | Passed | 195 Node tests and 2 Jest tests passed; 0 failed | CUR-CMP-009 |
| CSA-EV-011 | LintReport | API `npm run lint` after scoped category API fixes, 2026-10-27 | API source and tests | Passed | ESLint completed with zero warnings/errors | CUR-CMP-009 |
| CSA-EV-012 | TestReport | UI `npm test`, 2026-10-27, Vitest capped at two workers | UI component/screen tests | Passed | 19 test files; 101 passed, 0 failed. Two-worker cap avoids timeout failures seen with unrestricted worker parallelism. | CUR-CMP-009 |
| CSA-EV-013 | LintReport | UI `npm run lint`, 2026-10-27 | UI source and tests | Passed | ESLint completed with zero warnings/errors | CUR-CMP-009 |
| CSA-EV-004 | DeployConfig | Repository root / `.github/workflows` | CI, container, IaC, cloud deployment | Missing in inspected root | No workflow or Terraform/Docker deployment configuration was found; target artifacts are not proof of deployment | CUR-RUN-005 |
| CSA-EV-005 | RuntimeLog | Live API/database/environment | Operational behavior | Unknown | No live service, database, runtime logs, monitoring, or cloud account was inspected | CUR-RUN-001, CUR-RUN-003, CUR-RUN-005 |
| CSA-EV-006 | MigrationState | `public.schema_migrations` in target database | Applied schema version | Unknown | Ten migration files exist; no DB connection/state was checked | CUR-CMP-008, CUR-DATA-001 |

## Test Quality Security And Technical Debt Assessment

| Debt_or_Risk_ID | Area | Finding | Evidence | Severity | Impact | Recommended_Treatment | Related_Current_IDs |
|---|---|---|---|---|---|---|---|
| CUR-RISK-001 | Test | Earlier API run exposed unmapped category foreign-key errors and a stale route-test expectation for removed overstayCutoff | CSA-EV-007, CSA-EV-010 | High | Both issues are resolved: category create maps SQLSTATE 23503 to a safe validation error, the route test matches the documented API contract, and the full API suite passes | Keep regression coverage in the API suite | CUR-CMP-009 |
| CUR-RISK-002 | Test | Unrestricted UI test workers caused timeouts; the standard two-worker command passes all 101 tests | CSA-EV-008, CSA-EV-012 | Resolved | Full UI regression coverage is green with capped worker parallelism | Retain the two-worker cap in the standard test script | CUR-CMP-009 |
| CUR-RISK-003 | Operations | No live database/deployment, CI pipeline, cloud configuration, or monitoring evidence inspected | CSA-EV-004–006 | High | Migration state, production posture and release readiness cannot be inferred | Confirm environment inventory and obtain owner-approved operational evidence | CUR-RUN-003–005 |
| CUR-RISK-004 | Data/Privacy | Updated docs describe PII safeguards and lifecycle; runtime retention/deletion job is not found in inspected API source | SRC-014–SRC-016, ENTRY-009 | High | Documented retention behavior may not be operationalized | Track retention automation and evidence; do not claim scheduled cleanup is active | CUR-DATA-003–005 |
| CUR-RISK-005 | Security | Public QR and uploaded-file endpoints handle sensitive data; deployment-level WAF/alarms, pen test and scans are unverified | SRC-018, SRC-014 | High | External exposure remains unverified | Perform documented security checks in an authorized test environment and capture evidence | CUR-INT-001, CUR-INT-003 |
| CUR-RISK-006 | Maintainability | Root `package-lock.json` exists without a root `package.json` | SRC-021 | Low | Root lockfile purpose is unclear | Confirm ownership and remove only through a separately approved cleanup change if obsolete | PKG-003 |

## Dependency Lifecycle And Modernization Candidates

| Candidate_ID | Current_State_ID | Candidate_Type | Current_Issue | Modernization_Option | Benefit | Risk | Priority | Related_Backlog_or_Target_IDs |
|---|---|---|---|---|---|---|---|---|
| MOD-CAND-001 | CUR-RISK-001, CUR-RISK-002 | Test | Earlier API failures and UI timeouts are resolved for local regression: API 197/197 and UI 101/101 pass with capped workers | Retain API error-mapping coverage and the two-worker UI test cap | Stable current-source regression signal | Live CI/deployment test evidence remains unknown | Medium | No new target backlog approved in this reverse-only run |
| MOD-CAND-002 | CUR-RUN-005 | Deployment | No checked-in cloud/CI deployment configuration was found | Confirm whether deployment assets are maintained outside this repository | Traceable build/release process | Do not assume AWS target architecture is implemented | Medium | No new target backlog approved in this reverse-only run |

## As-Is Constraints Risks And Open Questions

| AsIs_Item_ID | Type | Constraint_Risk_or_Question | Evidence | Impact | Owner | Blocking | Related_Current_IDs |
|---|---|---|---|---|---|---|---|
| ASIS-RISK-001 | Open_Question | Which environment/database is authoritative, and which of migrations 0001–0010 are applied there? | SRC-020; SRC-014, SRC-016 | Current deployed schema and data lifecycle cannot be confirmed | Operations_Owner (not verified) | Yes for deployment claims | CUR-CMP-008, CUR-DATA-001 |
| ASIS-RISK-002 | Open_Question | Are CI, Terraform, container, monitoring and cloud-deployment assets maintained outside this repository? | SRC-021 | Repository-only current-state view may omit operational components | Release_Owner (not verified) | No | CUR-RUN-005 |
| ASIS-RISK-003 | Resolution | UI test timeouts occurred under unrestricted parallel workers; all 101 tests pass with the standard two-worker cap | CSA-EV-008, CSA-EV-012 | Regression tests are reliable using the configured command; no live/release evidence implied | QA_Owner / Developer | No | CUR-CMP-009 |
| ASIS-RISK-004 | Constraint | Current implementation docs describe intended behavior, but no production environment or telemetry was inspected | SRC-012–SRC-017, CSA-EV-005 | No claims about real-world availability, current DB state or operational usage | Operations_Owner (not verified) | No | CUR-RUN-001–005 |

## As-Is To Target Candidate Mapping

| Mapping_ID | Current_State_ID | Current_Behavior_or_Component | Target_Treatment | Rationale | Target_Artifact_Owner | Status |
|---|---|---|---|---|---|---|
| MAP-CUR-001 | CUR-CMP-001–009 | Repository contains working API/UI modules, migrations and automated tests | Retain | No modernization, migration, rewrite or feature-change request was provided in this run | Not assigned | Proposed; no target decision |
| MAP-CUR-002 | CUR-RISK-001–002 | Category API fixes and UI worker-cap stabilization are verified; API/UI test suites pass | Retain fixes and capped UI test execution | Full local automated regression is green; live deployment/release evidence remains separate | QA_Owner / Developer | Resolved for local tests; deployment evidence remains open |
| MAP-CUR-003 | CUR-RUN-005 | Cloud/CI deployment behavior is undocumented in this checkout | Assess | Existing target-state deployment descriptions are not evidence of deployed infrastructure | Release_Owner (not verified) | Open |

## Traceability Instructions
- Every current-state assertion is tied to repository source, package manifest, test run, or updated implementation documentation.
- No historical target-state decision in `SRC-BL-005` is promoted to an observed implementation fact.
- Current implementation documentation updates and code evidence are reconciled in `01_Source_Baseline.md` as `SRC-BL-006`.
- Data pipeline inventory is Not Applicable because the project is a transactional software application.
