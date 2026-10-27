# MAMS Implementation Status

**Snapshot:** 2026-10-27. This document describes the checked-in API/UI implementation and migration files; actual migration state, configuration, and availability depend on each deployment.

## Sources and Decisions

Earlier requirements, mockups, and feature lists conflict in several areas. This status inventory describes implemented behavior from the current source, not a promise that every source requirement is delivered. Duplicate person mobiles remain allowed; gates and areas remain distinct; QR codes are signed and versioned. No email, OTP, WhatsApp delivery, or demo role switcher is implemented.

## RBAC Spec Alignment

- AUTHZ-11 now rejects self-approval for Admin, Super Admin and Approver alike. This supersedes the earlier sole-Admin/Super-Admin self-approval exception.
- GATE-11 now treats an unassigned restricted area as a warning rather than a hard block. Security must acknowledge the warning; the visit stores `location_override` and the audit records the warning.
- REG-Photo now requires a JPG/PNG photo during new registration, max 2 MB. Migration `0007_require_person_photo.sql` requires photos for new rows while preserving legacy photo-less records for Gate camera capture.
- The generated Gate camera image is resized to the configured 600-pixel dimension before upload.
- These changes align the corresponding API, UI and focused tests. They do not complete all requirements in the specification; see the remaining gaps below.

## Implemented capabilities

- Shared screen RBAC, guard landing on the gate, Super Admin approval access, Approver report access, no duplicate Reports navigation, responsive shell and breadcrumbs.
- Registration wizard using API-provided category field schemas, master dropdowns and department/job-role cascades. Six configured form types are supported, plus the Generic fallback. Categories with an unconfirmed approval flag cannot submit.
- Server validation for names, international/Indian primary mobile rules, Indian alternate/emergency mobile numbers, gender, dates, passport, ID proofs, required category fields, address/emergency contacts and master references.
- Private multipart photo/document uploads, image decoding/resizing, file limits, encrypted passport/ID-proof values and authenticated downloads. New registration requires a JPG/PNG photo up to 2 MB; legacy profiles without a photo can be repaired at the Gate. Registration transaction includes area assignments, approval history, audit and notifications.
- Per-user drafts, listed for seven days after their last update. Sensitive identity numbers and uploaded files must be supplied again on resume; consent is confirmed again at submission.
- Profile overview, basic contact editing, documents, area IDs/access expiry, recent visits, administrator audit tab and scannable QR download/print. Contact edits advance QR versions on mobile changes.
- Confirmed person deactivation/reactivation with audit. Only active profiles can be deactivated, preventing approval bypass through reactivation.
- Gate camera scanning, exact name/mobile/Person ID lookup, signed QR validation, multiple-match selection, photo-confirmation UI, result states, check-in/out and offline paper-register notice.
- Transactional check-in warning/acknowledged override for unassigned restricted areas, plus denial for expired access, blacklist/status failures and an existing open visit. Checkout remains available for inside blacklisted persons.
- Mockup-aligned dashboard KPI labels, occupancy columns and location/category breakdowns, SVG line/area trend, category donut, recent activity fields, and Admin manual-reconciliation confirmation with an audit-backed API transaction.
- User-scoped notifications and mark-all-read drawer, paginated/filterable administrator audit browser/detail, CSV export of the displayed audit page.
- Lookup master administration with inactive-value retrieval/reactivation. Category field editor supports field type, labels, required flags, master sources, custom options and ordering. Category status controls prevent disabling the last active category. Registration category cards show seeded icons and descriptions; category APIs persist this metadata.
- The repository contains migrations `0001`–`0010`. In addition to registration schemas/drafts and append-only audit enforcement, migration `0008` normalizes primary person mobile numbers to E.164, `0009` removes category overstay cutoffs, and `0010` removes permission-level lookup/assignment fields. The presence of these files does not establish whether a particular database has applied them. Private uploads are ignored by Git.

## Existing Features Retained

Dashboard metrics/charts/occupancy, approval/rejection/resubmission, blacklist add/lift, six report endpoints, portal users with temporary-password provisioning, login/password change and public multi-match QR retrieval.

## Not Complete

- Bulk CSV/photo-package upload, template generation and row error reports.
- Username-first password-free onboarding and unauthenticated old/new-password portal flow from the newer mockup. Existing temporary-password provisioning remains in place; no insecure account-claim endpoint was introduced.
- Custom portal roles and database-driven screen/action permission matrices. Current permissions use the existing built-in roles.
- Full person-list category/status filtering and export, category-specific profile edit parity, and edited-data resubmission through the registration wizard.
- Category document-schema editor, mandatory named-document rules and master deletion rules. Migration `0005_seed_registration_masters.sql` contains six mockup-oriented categories, which differs from the alternative Volunteer / Active Member / Visitor seed set. Participant program/batch masters also need configuration before participant registration.
- Gate torch controls, shift/device configuration, accompanying-name/count edits at check-in and automatic walk-in check-in. Walk-in registration currently returns to the gate for explicit lookup/photo verification/check-in.
- Participant expiry derived from program/batch master dates, automated overstay scheduling/alerts, and full occupancy grouping parity. Category overstay-cutoff configuration was removed by migration `0009`.
- Full audit filtered-result export/print, report-filter parity and real XLSX exports. Audit export is explicitly limited to the displayed page.
- QR KPI/category-filter parity and the older feature list's explicit manual reissue workflow.
- Automatic session-warning/keep-alive parity, global shell person search and full profile menu/display-name parity.
- S3 storage, upload malware scanning, production deployment and production data-retention/key-rotation policies.
- Full RBAC permission-code matrix and the alternative four-role model. The application still contains six built-in roles; converting existing users/data requires a coordinated role migration.
- Username-first password-free onboarding and the alternative password policy. Current temporary-password/first-login flows remain.
- Registration requirements beyond current rules, including a 150-character name maximum, per-category default-location rules, and accompanying-member name/count entry at check-in. Visitor primary mobiles support valid international E.164 numbers; other registration categories require Indian primary numbers. Alternate/emergency mobile fields remain Indian-format.
- The alternative seed category set (`Volunteer`, `Active Member`, `Visitor`) and related master data. Permission-level lookup/assignment fields were removed by migration `0010` and are not current application controls.
- Person profile soft delete with mandatory reason, assigned-gate administration, gate-scoped Security occupancy/audit, visit-history filter parity (gate/person/status), and real XLSX export.

## Verification and Runtime Limits

The checked-in API/UI test suites include coverage for category validation, uploads/encryption/image resizing, authorization, transaction rollback, restricted-area/expiry checks, notification isolation, role navigation, drafts, guard category restrictions, and gate controls. The statements below record previously reported project verification; they are not results of running tests for this documentation update.

Desktop/mobile browser checks use synthetic in-page API fixtures, not live person data. Registration layout was checked at 1440px and 390px; mobile gate navigation/result controls were checked at 390px. Real camera hardware/torch and a full live database registration-to-checkout flow remain unverified.

Apply pending migrations with `npm run migrate:local` and restart the API to load code changes. Migration `0007_require_person_photo.sql` is required for the database-side photo rule; migrations `0008`–`0010` update the primary mobile constraint and remove obsolete category/permission-level fields. Check the target database's `public.schema_migrations` rather than inferring its state from repository files. Do not provide passwords to chat.

Real camera hardware/torch operation and a full live-database registration-through-checkout path remain unverified. Local scripts and synthetic fixtures do not certify production configuration or deployment readiness.