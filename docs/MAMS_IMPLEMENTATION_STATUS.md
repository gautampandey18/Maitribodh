# MAMS Implementation Status

**Source snapshot reviewed:** 2026-11-18. This inventory describes the checked-in API/UI and migrations `0001`–`0018`; it does not assert that a particular deployment has applied the migrations or has matching configuration/data.

## Current implementation decisions

- One unique E.164 primary mobile identifies a shared person profile and QR identity. An identity may have multiple category registrations, each with its own status, category details, expiry, consent, approval history, and area assignment. A duplicate active, pending, or deactivated registration in the same category is rejected.
- Portal accounts can hold multiple built-in roles. UI navigation and API authorization use the union of those roles; a legacy representative `role` remains in the database.
- Gates and Areas remain distinct. An unassigned restricted Area is an acknowledged warning, while an Area maximum occupancy is enforced during transactional check-in.
- Participant registration can allow post-event access. The Program/Batch master `extra.end_date` determines when an event has ended; allowed post-event check-in still requires guard acknowledgement.
- Audit rows can be permanently deleted by Admin/Super Admin. The append-only database trigger from migration `0004` is dropped by migration `0012`.
- Person deletion is a destructive API operation, not soft-delete: it deletes a category registration and its visits/blacklist rows. The shared profile/files are removed when no category registrations remain. There is no reason-required restore workflow.
- No email/OTP/WhatsApp credential delivery or username-first account-claim flow is implemented.

## Implemented capabilities

- Authentication, first-login temporary-password change, role-aware routes/navigation, session invalidation, and idle logout.
- Six built-in roles, including multiple-role assignment; Administrator account creation, temporary-password provisioning, activation/deactivation, and guarded user deletion.
- Dynamic category schemas, registration drafts, duplicate-mobile/category precheck, shared-profile registration, and Admin/Super Admin category assignment.
- Server-side validation of identity/contact data, category fields, category/master references, consent, and registration state; required photo upload and optional private documents; encrypted passport/ID-proof data.
- Profile/contact editing, QR/photo/document handling, access assignments/expiry, approval/rejection/resubmission, blacklist management, and audited status changes.
- Signed/versioned shared QR identity, public multi-match QR retrieval, Gate QR/mobile/name lookup, identity/photo confirmation, and explicit check-in/check-out.
- Transactional check-in rules for registration status, blacklist, expiry, open visits, restricted-area override, participant event access/acknowledgement, and Area occupancy limits.
- Dashboard, six report endpoints with filtered XLSX export, notifications, paginated/filterable audit browsing, displayed-page audit CSV export, and administrator audit deletion.
- Administration for portal users, categories, schema fields, lookup values, Gate/Area locations, maximum Area occupancy, and blacklist entries. Unreferenced categories and lookup values can be permanently deleted; referenced values are protected.
- Migrations `0001`–`0018` evolve the schema, including shared person identity/profile data, multiple user roles, international phone columns, area capacity, and operational-history retention after user deletion. Migration files do not establish deployment migration state.

## Not complete or not claimed

- Bulk CSV/photo-package registration, templates, and row-level import result reports. The `bulk_upload` table and `can_bulk_upload` flag are not a bulk-upload workflow.
- Username-first/password-free account claims, OTP/email/WhatsApp delivery, custom roles, or a database-driven fine-grained permission matrix.
- Full category-specific profile editing/resubmission, cross-page audit export/print, full report-filter parity, and all requested dashboard/QR metrics and filter combinations.
- Category document-schema editor and named mandatory-document rules; master-value merge/deletion cleanup beyond guarded deletion of unreferenced rows.
- No dedicated Program/Batch event lifecycle beyond generic lookup management; Program/Batch values must include a valid `extra.end_date` for participant event checks.
- Gate/device/shift assignment, torch controls, automatic walk-in check-in, and accompanying-person name editing at check-in. Offline gate events are not queued or replayed; staff use the paper register.
- Automated overstay scheduling/alerts, all requested occupancy groupings, assigned-gate administration, and gate-scoped Security audit/occupancy.
- Recoverable person soft-delete with required reason. Current API deletion is permanent and removes associated visit/blacklist records for the selected registration.
- S3/object storage, malware scanning, production deployment/retention automation, and operational encryption-key rotation.

## Verification boundaries

The repository contains API and UI test suites and ESLint/build scripts. This documentation update did not run them. Automated tests and synthetic browser fixtures do not establish production configuration, migration state, real camera/torch behavior, or a live-database registration-to-checkout workflow.

Before deploying, apply pending migrations through `npm run migrate:local` for the configured local database, or the approved migration process for another target. Verify `public.schema_migrations`; do not infer database state from files in the repository. Migration `0018` moves shared person profile and QR data into `mams.person_identity`, so the API and database must be on compatible versions.
