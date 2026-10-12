# MAMS Implementation Status

## Sources and Decisions

The attached `MAMS Requirements Spec_RBAC.md` is the source of truth for this alignment pass. Earlier mockups and feature lists are retained only where they do not conflict with the requirements or a later explicit client decision.

The source documents contain conflicts. Duplicate registrations remain allowed as specified by REG-02, gates and areas remain separate, and QR codes remain signed/versioned to invalidate old codes. No email, OTP, WhatsApp delivery or demo role switcher is added.

## RBAC Spec Alignment

- AUTHZ-11 now rejects self-approval for Admin, Super Admin and Approver alike. This supersedes the earlier sole-Admin/Super-Admin self-approval exception.
- GATE-11 now treats an unassigned restricted area as a warning rather than a hard block. Security must acknowledge the warning; the visit stores `location_override` and the audit records the warning.
- REG-Photo now requires a JPG/PNG photo during new registration, max 2 MB. Migration `0007_require_person_photo.sql` requires photos for new rows while preserving legacy photo-less records for Gate camera capture.
- The generated Gate camera image is resized to the configured 600-pixel dimension before upload.
- These changes align the corresponding API, UI and focused tests. They do not complete all requirements in the specification; see the remaining gaps below.

## Implemented in This Change

- Shared screen RBAC, guard landing on the gate, Super Admin approval access, Approver report access, no duplicate Reports navigation, responsive shell and breadcrumbs.
- Registration wizard using API-provided category field schemas, master dropdowns and department/job-role cascades. Six existing form types supported. Categories with an unconfirmed approval flag cannot submit.
- Server validation for names, mobile, gender, dates, passport, ID proofs, required category fields, address/emergency contacts and master references.
- Private multipart photo/document uploads, image decoding/resizing, file limits, encrypted passport/ID-proof values and authenticated downloads. New registration requires a JPG/PNG photo up to 2 MB; legacy profiles without a photo can be repaired at the Gate. Registration transaction includes area assignments, approval history, audit and notifications.
- Per-user resumable drafts. Sensitive identity numbers and uploaded files must be supplied again on resume.
- Profile overview, basic contact editing, documents, area IDs/access expiry, recent visits, administrator audit tab and scannable QR download/print. Contact edits advance QR versions on mobile changes.
- Confirmed person deactivation/reactivation with audit. Only active profiles can be deactivated, preventing approval bypass through reactivation.
- Gate camera scanning, exact name/mobile/Person ID lookup, signed QR validation, multiple-match selection, photo-confirmation UI, result states, check-in/out and offline paper-register notice.
- Transactional check-in warning/acknowledged override for unassigned restricted areas, plus denial for expired access, blacklist/status failures and an existing open visit. Checkout remains available for inside blacklisted persons.
- Mockup-aligned dashboard KPI labels, occupancy columns and location/category breakdowns, SVG line/area trend, category donut, recent activity fields, and Admin manual-reconciliation confirmation with an audit-backed API transaction.
- User-scoped notifications and mark-all-read drawer, paginated/filterable administrator audit browser/detail, CSV export of the displayed audit page.
- Lookup master administration with inactive-value retrieval/reactivation. Category field editor supports field type, labels, required flags, master sources, custom options and ordering. Category status controls prevent disabling the last active category. Registration category cards show seeded icons and descriptions; category APIs persist this metadata.
- Migration adds category schemas, expiry/draft storage and an append-only audit trigger. Migration `0004` was applied successfully to the local PostgreSQL database on 2026-10-10. Private uploads are ignored by Git.

## Existing Features Retained

Dashboard metrics/charts/occupancy, approval/rejection/resubmission, blacklist add/lift, six report endpoints, portal users with temporary-password provisioning, login/password change and public multi-match QR retrieval.

## Not Complete

- Bulk CSV/photo-package upload, template generation and row error reports.
- Username-first password-free onboarding and unauthenticated old/new-password portal flow from the newer mockup. Existing temporary-password provisioning remains in place; no insecure account-claim endpoint was introduced.
- Custom portal roles and database-driven screen/action permission matrices. Current permissions use the existing built-in roles.
- Full person-list category/status filtering and export, category-specific profile edit parity, and edited-data resubmission through the registration wizard.
- Category document-schema editor, mandatory named-document rules and master deletion rules. Migration `0005_seed_registration_masters.sql` contains six mockup-oriented categories, which differs from the spec's Volunteer / Active Member / Visitor seed set. Participant program/batch masters also need configuration before participant registration.
- Gate torch controls, shift/device configuration, accompanying-name/count edits at check-in and automatic walk-in check-in. Walk-in registration currently returns to the gate for explicit lookup/photo verification/check-in.
- Participant expiry derived from program/batch master dates, automated overstay scheduling and alert parity, occupancy grouping parity.
- Full audit filtered-result export/print, report-filter parity and real XLSX exports. Audit export is explicitly limited to the displayed page.
- QR KPI/category-filter parity and the older feature list's explicit manual reissue workflow.
- Automatic session-warning/keep-alive parity, global shell person search and full profile menu/display-name parity.
- S3 storage, upload malware scanning, production deployment and production data-retention/key-rotation policies.
- Full RBAC permission-code matrix and the four-role model in the spec. The application still contains legacy built-in roles; converting existing users/data requires a coordinated role migration.
- The spec's username-first password-free onboarding and exact password policy. Current temporary-password/first-login flows remain.
- Registration field parity beyond photo requirement, including international E.164 mobile validation, 150-character names, per-category default-location rules and accompanying-member name/count entry at check-in.
- The spec's exact seed category set (`Volunteer`, `Active Member`, `Visitor`) and all named permission-level/location/gate assignment masters. Existing mockup-oriented category seeds remain until a data migration and category/approval policy decision are approved.
- Person profile soft delete with mandatory reason, assigned-gate administration, gate-scoped Security occupancy/audit, visit-history filter parity (gate/person/status), and real XLSX export.

## Verification and Runtime Limits

Focused API tests cover category validation, uploads/encryption/image resizing, authorization, transaction rollback, restricted-area/expiry checks and notification isolation. UI tests cover the role matrix, partial drafts, guard category restrictions and gate result controls, alongside the existing screen tests. Lint and production build checks are run locally.

Desktop/mobile browser checks use synthetic in-page API fixtures, not live person data. Registration layout was checked at 1440px and 390px; mobile gate navigation/result controls were checked at 390px. Real camera hardware/torch and a full live database registration-to-checkout flow remain unverified.

Apply any pending migrations with `npm run migrate:local` and restart the API to load code changes. Migration `0007_require_person_photo.sql` is required for the database-side photo rule. Do not provide passwords to chat.

The separate UI preview runs at `http://localhost:5174/`; the existing port 5173 and API processes were not stopped. Dependency installation reported 34 audit vulnerabilities; dependency remediation has not been performed or certified in this change.