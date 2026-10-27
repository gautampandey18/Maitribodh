# Quality Test And Validation

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Reverse_Engineering_Only
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Source_Baseline_ID: SRC-BL-006
- Document_Version: 3.6
- Date: 2026-10-27
- Owner: Aditya Sharma, QA_Owner (RACI-001, SRC-011)

## Purpose
Record repository test structure and observed local test outcomes separately from historical target-release evidence. API and UI source/tests are present. This run executed the API and UI test suites; no live database, production environment, security scan, performance test, or deployment evidence was inspected.

## Quality Gate Thresholds By Tier

| Gate_Area | Lite | Standard | Enterprise | Project_Threshold_or_Status |
|---|---|---|---|---|
| Functional | Critical path manual checks | FR acceptance tests | All FRs traceable/tested | 100% FR-001–FR-022 mapped; execution pending |
| Security | Basic auth review | Role/input checks | Threat model, authz, secrets/dependency/SAST tests | DEC-001 controls approved for build; pen test remains before G3 |
| Privacy/data | Basic handling | Access/retention defined | Classification, DPDP, retention and audit evidence | POL-001 approved for build/UAT; counsel review before G3 |
| Test coverage | Team-set | Team-set | TEP-001 >=80% line coverage on services/reducers/utils | CI gates required from first merge; evidence pending under WVR-006 to G2/G3 |
| Performance | Not applicable | Agreed targets | DEC-003 CAP-01–06/SLO-01–06 | Targets approved; load test pending before G2 |
| Operations | Basic support | Runbook | Monitoring, alerting, backups/restore, incident/on-call | RB-001–006 approved; drills and restore evidence due before G3 |
| Release approval | Owner | Product/release approval | Named production and exception approvers | RACI-001/G0 signed; G1 approved 2026-10-09; G2/G3 pending evidence |

## Minimum Required Tests By Mode

| Execution_Mode | Required_Test_Types | Required_Evidence | Missing_Test_Impact |
|---|---|---|---|
| Reverse_Engineering_Only | Source inventory, existing automated suite execution, and evidence/gap assessment; target/release tests are not authorized by this run | Local test command/results, source inventory and explicit unknowns | Failed tests are recorded as current-state risks; no build authorization is issued |

## Implementation Unit And Test Strategy
- UI: Vitest/React Testing Library for form schemas, role-aware routes, state transitions, loading/error/empty states and responsive gate interactions.
- API: Jest/Supertest for each endpoint, authorization, validation, error response, lockout, audit and service behavior.
- Database: PostgreSQL integration tests against versioned migrations; verify constraints, transactions, indexes, time-zone boundaries and seed data separately from unit mocks.
- E2E: registration to approval/QR to gate check-in/out; blacklist denial; public lookup with shared mobile; bulk upload errors; report/export; manual outage/reconciliation.
- Security: role matrix, public QR abuse/privacy assessment, JWT/session lifecycle, SQL parameterization, upload magic-byte/size checks, S3 signed URL/IAM/KMS review.
- TEP-001 threshold: >=80% line coverage on services, reducers and utils; lint/format, tests, SAST, dependency, SBOM/license, container and secrets gates run on every PR/build.

## Current Repository Test Execution

| Test_Run_ID | Project | Command | Result | Observed_Details | Limitation |
|---|---|---|---|---|---|
| RUN-TEST-API-001 | API | `npm test` from `Maitribodh-API` | Fail | 193 passed, 2 failed: `invalid lookup references become a validation response`; `category create route validates and forwards normalized fields` | Local automated suite only; no PostgreSQL-backed deployment or production test. |
| RUN-TEST-UI-001 | UI | `npm test` from `Maitribodh-UI` | Fail | 98 passed, 3 timed out at the configured 30-second limit in Blacklist, Register, and Users screen tests | Test command exited non-zero; investigate timeouts before relying on suite as a release gate. |
| RUN-TEST-API-002 | API | `npm test` from `Maitribodh-API` | Fail | 193 passed, 2 failed: `invalid lookup references become a validation response`; `category create route validates and forwards normalized fields` | Latest local verification; no PostgreSQL-backed deployment or production test. |
| RUN-TEST-UI-002 | UI | `npm test` from `Maitribodh-UI` (isolated rerun) | Fail | 93 passed, 8 timed out across Blacklist, Gate, Register, and Users screens; time limits were 5 and 30 seconds | Latest isolated local verification; investigate test/runtime slowness before using as release evidence. |
| RUN-BUILD-UI-001 | UI | `npm run build` from `Maitribodh-UI` | Pass with warnings | Vite production build and PWA service worker generated successfully; dependency annotation and large-chunk warnings were emitted | UI build only; API has no `build` script. This does not authorize implementation or deployment. |

- The verification-only request and runs were completed on 2026-10-27; they did not authorize implementation changes.
- These results are current-state evidence from 2026-10-27, not approval of any test failure or waiver.
- The prior TEP-001, G2/G3, and test requirements below remain historical target-release evidence from SRC-BL-005; they are not evidence that the present repository passes those gates.

## TEP-001 CI/CD Quality Gates

| Gate_ID | Check | Tool | Pass_Criteria | Evidence_ID | Execution_Status |
|---|---|---|---|---|---|
| QG-01 | Lint and format | ESLint, Prettier | Zero errors | EVD-CODE-01 | Planned; required each PR/build |
| QG-02 | Unit tests/coverage | Vitest UI; Jest/Vitest API | All pass; >=80% line coverage on services/reducers/utils | EVD-CODE-02 | Planned; required each PR/build |
| QG-03 | API integration | Supertest + PostgreSQL 16 test DB | All pass, including eligibility order, single-open-visit and self-approval | EVD-CODE-03 | Planned; required each PR/build |
| QG-04 | Static security analysis | CodeQL or Semgrep | No Critical/High findings | EVD-SEC-01 | Planned; required each PR/build |
| QG-05 | Dependency vulnerabilities | npm audit/Dependabot | No Critical/High without approved exception | EVD-SEC-02 | Planned; required each PR/build |
| QG-06 | SBOM/license | CycloneDX; MIT/Apache-2.0/BSD/ISC allow-list | SBOM generated; no disallowed license | EVD-SEC-03 | Planned; required each PR/build |
| QG-07 | Container image scan | Trivy/ECR | No Critical/High OS/library findings | EVD-SEC-05 | Planned; required each build |
| QG-08 | Secrets scan | Gitleaks | No secrets in repository | EVD-SEC-06 | Planned; required each PR/build |

## TEP-001 Pre-Release Tests And Evidence

| Test_ID | Area | Method | Pass_Criteria | Evidence_ID | Gate_Status |
|---|---|---|---|---|---|
| TST-01 | E2E business flows by role | Playwright | FR-001–FR-022 scenarios pass | EVD-TEST-01 | Planned before G2 |
| TST-02 | Authorization matrix | Automated API suite | No API access beyond FRD role matrix | EVD-DATA-04 | Planned before G2 |
| TST-03 | Dynamic security scan | OWASP ZAP baseline on UAT | No High alerts | EVD-SEC-07 | Planned before G2 |
| TST-04 | Independent penetration test | OWASP ASVS Level 2 / Top 10 | No open Critical/High; Medium findings owned/fixed | EVD-SEC-04 | WVR-001 defers to G3; not waived for release |
| TST-05 | Load/performance | k6 CAP-01–06 profile | SLO-02–04 met; DB CPU <70% sustained | EVD-PERF-01 | Planned before G2 |
| TST-06 | Accessibility | axe-core Playwright + manual keyboard/screen reader | WCAG 2.1 AA; no Critical/Serious violations | EVD-A11Y-01 | Planned before G2 |
| TST-07 | Data integrity/concurrency | Parallel same-person check-in and double-tap | Exactly one open visit; duplicate request handled per rule | EVD-DATA-07 | Planned before G2 |
| TST-08 | Privacy controls | Masking, retention, consent capture, erase action | POL-001 controls verified | EVD-DATA-03, EVD-DATA-06 | Planned before G2/G3; counsel review before G3 |
| TST-09 | Recovery/outage drills | DRL-01–06 | RB-001–006 criteria met | EVD-OPS-01–06 | WVR-005 defers drills to G3; not waived for release |
| TST-10 | UAT acceptance | Business users run scripts | Product_Owner signoff | EVD-UAT-01 | Required before G2 |

| Evidence_ID | Evidence | Producer | Location | Status |
|---|---|---|---|---|
| EVD-CODE-01–03 | Lint/unit/integration reports | CI pipeline | GitHub Actions artifacts | Planned |
| EVD-SEC-01–07 | SAST, dependency, SBOM, pen test, container, secrets, DAST | CI/Security_Owner | `/evidence/security` | Planned; pen test before G3 |
| EVD-PERF-01 | k6 load report | QA_Owner | `/evidence/performance` | Planned |
| EVD-A11Y-01 | Accessibility report | QA_Owner | `/evidence/accessibility` | Planned |
| EVD-DATA-01–07 | Privacy/integrity evidence | QA_Owner/Compliance_Owner | `/evidence/data` | Planned |
| EVD-OPS-01–06 | Drill reports | Operations_Owner | `/evidence/operations` | Planned; drills before G3 |
| EVD-TEST-01, EVD-UAT-01 | E2E/UAT reports | QA_Owner/Product_Owner | `/evidence/test` | Planned |
| EVD-ARCH-01 | AWS cost estimate | Gaurav Sharma | `/evidence/architecture` | Planned; due 2026-10-10 |

## Approved Evidence Waivers

| Waiver_ID | Blocker | Scope | Owner/Approver | Mitigation | Expires | Status |
|---|---|---|---|---|---|---|
| WVR-001 | BLOCK-001 | Independent penetration-test evidence only | Vineet Agrawal; co-signed Sujal Ray | DEC-001 signed; DAST each UAT deployment; independent test before G3 | G3; review 2026-11-09 | Approved; pre-release test remains mandatory |
| WVR-005 | BLOCK-005 | Operational drill/rehearsal evidence only | Vineet Agrawal; co-signed Sujal Ray | RB-001–006 approved; execute DRL-01–06 before G3 | G3; review 2026-11-09 | Approved; drills remain mandatory before release |
| WVR-006 | BLOCK-006 | Generated implementation/test evidence before code exists | Vineet Agrawal; co-signed Sujal Ray; co-owner Aditya Sharma | Enforce QG-01–08 from first merge; complete TST-01–10 and evidence before G2/G3 | G3; review 2026-11-09 | Approved for build; no evidence gate waived for release |

## Requirement Traceability And Coverage

| Requirement_ID | Backlog_ID | Test_IDs | Validation_Scope | Coverage_Status | Evidence_Status |
|---|---|---|---|---|---|
| FR-001 | BL-001, BL-002 | TC-001, TC-002 | Login, role/API authorization, Super Admin boundary | Planned | Not executed |
| FR-002 | BL-004 | TC-003, TC-004 | Required fields, residency/passport, photo and location | Planned | Not executed |
| FR-003 | BL-003 | TC-005 | Dynamic categories and approved mappings | Planned | Not executed |
| FR-004 | BL-005 | TC-006, TC-007 | Pending/approve/reject/resubmit/history; verify CR-006 sole-Admin exception and Approver self-decision denial | Planned | CR-006 approved; tests not executed |
| FR-005 | BL-006 | TC-008 | Permission, row validation, errors and QR creation | Planned | Not executed |
| FR-006 | BL-004, BL-008 | TC-009 | Duplicate mobile/profile matches allowed | Planned | Not executed |
| FR-007 | BL-007 | TC-010 | Unique QR per record, signing/version invalidation | Planned | Not executed |
| FR-008 | BL-008, BL-SEC-01, BL-SEC-02 | TC-011, TC-012, TST-03, TST-04 | Per-IP rate limits, minimized response, uniform inactive response, WAF/alarm and audit | Planned | DEC-001 approved; DAST each UAT deploy; pen test due before G3 under WVR-001 |
| FR-009 | BL-009 | TC-013, TC-014 | Gate eligibility, blacklist/nonactive/already-open denial, walk-in Visitor, warning-only unassigned restricted area with audited outcome | Planned | CR-007 approved; tests not executed |
| FR-010 | BL-010 | TC-015, TC-016 | Single open visit, check-out and Admin correction | Planned | Not executed |
| FR-011 | BL-011 | TC-017 | Admin-only blacklist, no override and audit | Planned | Not executed |
| FR-012 | BL-012 | TC-018 | Occupancy, inside list, manual correction and overstay | Planned | Not executed |
| FR-013 | BL-013 | TC-019 | In-app notification and cleanup | Planned | Not executed |
| FR-014 | BL-014 | TC-020 | Report filters and Visit History CSV/XLSX | Planned | Not executed |
| FR-015 | BL-015 | TC-021 | Audit coverage, actor, old/new values, Admin view | Planned | Not executed |
| FR-016 | BL-003, BL-002 | TC-022 | User/master permissions and immediate effective config | Planned | Not executed |
| FR-017 | BL-016 | TC-023, TC-024 | File validation, private S3, signed URL, lifecycle | Planned | Not executed |
| FR-018 | BL-017, BL-018 | TC-025 | Responsive PWA, camera and supported devices | Planned | Not executed |
| FR-019 | BL-002 | TC-026, TC-027 | Lockout, password policy, role-specific absolute JWT expiry, token_version revocation, one-time temporary-password expiry/consumption and forced rotation | Planned | CR-004/CR-005 approved; tests not executed |
| FR-020 | BL-019, BL-OPS-01, BL-OPS-02 | TC-028, TC-029, TST-09 | Single site/English/no migration, paper fallback, 24-hour reconciliation and audited outage closure | Planned | RB-001–006 approved; DRL-01–06 due before G3 under WVR-005 |
| FR-021 | BL-PRIV-01 | TC-030, TST-08 | Notice, mandatory consent metadata, guardian consent for minors, Admin erasure/audit | Planned | CR-002/POL-001 approved for build/UAT; evidence pending |
| FR-022 | BL-PRIV-02 | TC-031, TST-08 | RET-01–12, nightly audited retention job, data-principal request handling | Planned | POL-001 approved interim; counsel review before G3 |

## Measurable NFR Acceptance Matrix

| NFR_ID | Metric | Target | Validation_Method | Evidence | Owner | Acceptance_Status |
|---|---|---|---|---|---|---|
| NFR-001 | Gate scan-to-decision | p95 API <800 ms; user-visible <2 seconds | k6 and device E2E at CAP-04 load | EVD-PERF-01 | Aditya Sharma, QA_Owner | Planned; due before G2 |
| NFR-002 | Other API calls at peak | p95 <500 ms at 500 concurrent sessions | k6 API load test | EVD-PERF-01 | Aditya Sharma, QA_Owner | Planned; due before G2 |
| NFR-003 | Dashboard load/refresh | <=5 seconds; refresh every 30 seconds | Browser/API performance test at CAP-04 | EVD-PERF-01 | Aditya Sharma, QA_Owner | Planned; due before G2 |
| NFR-004 | Production availability | 99.5% monthly | CloudWatch SLI after production deployment | EVD-ARCH-01 and monitoring reports | Vineet Agrawal, Operations_Owner | Target approved; production measurement pending |
| NFR-005 | Capacity | CAP-01–06: 1,000–5,000 launch; 100,000 headroom; 3,000 normal/10,000 festival daily; 500 concurrent; 60/min sustained, 200/min burst; 1.5M visits/year | k6 ramp 500 VUs/10 min, hold 30 min; gate 200/min for 15 min; DB CPU <70% sustained | EVD-PERF-01 | Sujal Ray, Architecture_Owner | DEC-003 approved; load test due before G2 |
| NFR-006 | Auth/security controls | bcrypt cost 12; lock after 5 failures/15 min; route authorization | Auth and role-matrix tests | EVD-DATA-04, EVD-TEST-01 | Vineet Agrawal, Security_Owner | Planned; TEP-001 gate |
| NFR-007 | Public QR exposure | 10/min and 50/day per IP; minimized name/category/QR; uniform non-active response; WAF/alarm; accepted Medium confirmation risk | DAST each UAT deployment; independent pen test with no Critical/High open before G3 | EVD-SEC-04, EVD-SEC-07 | Vineet Agrawal, Security_Owner | DEC-001 approved; WVR-001 defers pen test to G3 |
| NFR-008 | DPDP/privacy | POL-001 consent, access, RET-01–12, data-principal rights and breach response | Consent/masking/retention/erase tests; counsel review before G3 | EVD-DATA-01–07, EVD-OPS-06 | Vineet Agrawal, Compliance_Owner | Interim policy approved for build/UAT; G3 legal review open |
| NFR-009 | Visit/data integrity | At most one open visit; duplicate records/mobile remain allowed | Parallel same-person check-in and duplicate/shared-mobile tests | EVD-DATA-07 | Vineet Agrawal, Data_Owner | Planned; TST-07 before G2 |
| NFR-010 | Data protection | TLS 1.2+, RDS/S3 KMS, private objects, encrypted ID, short-lived URLs, masking | IaC/config review and automated access/masking tests | EVD-DATA-01–05 | Vineet Agrawal, Security_Owner | Planned; due before G2/G3 |
| NFR-011 | Automated tests | >=80% line coverage on services, reducers and utils; QG-01–08 pass | CI coverage and security gates on every PR/build | EVD-CODE-01–03, EVD-SEC-01–06 | Aditya Sharma, QA_Owner | TEP-001 approved; WVR-006 defers evidence to G2/G3 |
| NFR-012 | Accessibility | WCAG 2.1 AA; no Critical/Serious violations on gate/registration | axe-core Playwright plus manual keyboard/screen-reader check | EVD-A11Y-01 | Aditya Sharma, QA_Owner | Planned; due before G2 |

## Evidence And Scan Validation Matrix

| Evidence_ID | Evidence | Tool_or_Method | Required_Gate | Status | Owner |
|---|---|---|---|---|---|
| EVD-001 | Dependency/license/SBOM scan | npm audit, CycloneDX; MIT/Apache-2.0/BSD/ISC allow-list | Enterprise | QG-05/06 approved; evidence planned from first build | Vineet Agrawal, Security_Owner |
| EVD-002 | Secret scan | Gitleaks | Enterprise | QG-08 approved; evidence planned from first build | Vineet Agrawal, Security_Owner |
| EVD-003 | SAST/code review | CodeQL or Semgrep | Enterprise | QG-04 approved; evidence planned from first build | Vineet Agrawal, Security_Owner |
| EVD-004 | Container/image scan | Trivy/ECR | Enterprise | QG-07 approved; evidence planned from first image | Vineet Agrawal, Security_Owner |
| EVD-005 | Public QR independent penetration test | OWASP ASVS Level 2/Top 10, independent tester | Enterprise | DEC-001 approved; WVR-001 defers test to G3; no Critical/High open at release | Vineet Agrawal, Security_Owner |
| EVD-006 | Privacy/DPDP controls | POL-001 tests, retention evidence and counsel review | Enterprise | Interim policy approved; evidence and legal review before G3 | Vineet Agrawal, Compliance_Owner |
| EVD-007 | Performance/capacity | k6 CAP-01–06/SLO-01–06 profile | Enterprise | DEC-003 approved; EVD-PERF-01 due before G2 | Sujal Ray, Architecture_Owner |
| EVD-008 | Backup/restore and rollback | RB-002/003 PITR/rollback rehearsal | Enterprise | RPO/RTO approved; rehearsal evidence deferred under WVR-005 to G3 | Vineet Agrawal, Operations_Owner |
| EVD-009 | Operational outage and reconciliation | RB-001, DRL-01–06 tabletop/gate drill | Enterprise | Runbook approved; drills deferred under WVR-005 to G3 | Vineet Agrawal, Operations_Owner |
| EVD-010 | UI accessibility/device matrix | WCAG 2.1 AA, axe-core and manual keyboard/screen-reader/device checks | Enterprise | TST-06 approved; evidence due before G2 | Aditya Sharma, QA_Owner |

## Regression Test Suite

| Suite_ID | Area | Regression_Coverage | Critical_Risk |
|---|---|---|---|
| REG-001 | Identity/authorization | Each role on each allowed/denied route and operation | Privilege escalation |
| REG-002 | Registration/approval | Field validation, duplicates, status lifecycle, resubmission | Unauthorized/invalid records |
| REG-003 | QR | Multi-match lookup, per-record identity, signature/version changes | PII exposure/forgery |
| REG-004 | Gate/visit | Active/blacklist/open-visit branches, gate/location fields, correction | Incorrect admission/occupancy |
| REG-005 | Masters/bulk | Permission, category change, row failure, audit | Data corruption |
| REG-006 | Files/audit | Upload validation, S3 access, lifecycle, audit before/after | PII exposure/evidence loss |
| REG-007 | Reports/jobs | Visit export, cutoffs, timezone, notification/job idempotence | Operational inaccuracy |
| REG-008 | Release/resilience | Migration, restore, rollback, paper-register reconciliation | Service/data loss |

## Build Prompt Validation
- Build prompt 09 references SRC-BL-005 and is stale against current baseline SRC-BL-006; it must not be used as an implementation handoff.
- No build prompt is generated or approved in this Reverse_Engineering_Only run.
- Prior FR/NFR traceability and DEC/WVR/G1 statements belong to the historical target baseline, not to current test or deployment evidence.
- Data & Analytics requirements are Not Applicable because Domain=Software.

## Enterprise Readiness Score

| Readiness_Area | Required_For_Tier | Evidence_Found | Status | Gap_or_Action | Owner |
|---|---|---|---|---|---|
| Security | Yes | Security-related code/config and prior target controls are documented; no current scans or live deployment evidence | Unknown | Verify deployed controls, scan results, public QR exposure and uploaded-file handling; do not infer from prior decisions | Security_Owner (not verified) |
| Data_Governance | Yes | Updated docs describe consent, draft and retention behavior | Documented; runtime unverified | Verify actual database/file lifecycle and retention execution | Data_Owner (not verified) |
| Compliance | Yes | PII/DPDP obligations documented; no current compliance evidence inspected | Unknown | Obtain current legal/control evidence for any production assessment | Compliance_Owner (not verified) |
| DevSecOps | Yes | npm scripts/manifests and locks present; no CI workflow or scan results found | Gap | Establish/locate pipeline and capture dependency, secrets, SAST/SBOM/image evidence | Security_Owner (not verified) |
| Operations | Yes | Local development/migration/backup/reset scripts documented; no cloud runtime proof | Gap | Confirm real environment, owner, monitoring, restore and release evidence | Operations_Owner (not verified) |
| Governance_Approvals | Yes | Historical SRC-011 decisions and G1 approval belong to SRC-BL-005 | Not_Current_Baseline | Approve a new target baseline before any future build; do not carry prior G1 forward | Business_Sponsor |
| Data_Quality | Software core integrity | Latest API/UI verification has 2 API failures and 8 UI timeouts | Fail | Investigate ten failing tests; no release readiness claim | QA_Owner (not verified) |
| MDM_Stewardship | Data & Analytics subtype only | Not_Applicable | NA | Domain=Software; no MDM scope | Not_Applicable |

## Quality Gate Decision
- Quality_Gate_Result: Current_State_Assessment_Only; test evidence is not green
- Blocking_Gaps: API tests (2) and UI tests (3) failed in the local run; live database, production, CI, security, performance and recovery evidence are unavailable. These gaps block a release-readiness conclusion.
- Build_Authorization: None. This reverse-engineering run is not a build handoff. Historical G1/waivers from SRC-BL-005 do not authorize a future build from SRC-BL-006.
- Data Quality Validation Matrix: Not Applicable — Domain=Software; data-integrity cases are covered in the NFR and regression matrices above.