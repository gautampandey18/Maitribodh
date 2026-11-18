# MAMS Database, Schema, Tables, and API Reference

Repository source snapshot reviewed: 2026-11-18.

## 1. Scope and source of truth

This document describes the database objects and API endpoints implemented in this repository. The table definitions below represent the final schema after migrations `0001` through `0018`, not just the initial migration. Migration files describe repository intent; confirm `public.schema_migrations` for any particular database.

**Verification boundary:** this document was generated from source code and SQL migrations. It does not confirm that an AWS RDS instance exists, that migrations have run against a particular database, or that a deployed API is reachable. No database or AWS resources were created while preparing this reference.

Primary implementation sources:

- [Database connection configuration](../Maitribodh-API/src/config/database.js)
- [Migration runner](../Maitribodh-API/db/migrate.js)
- [SQL migrations](../Maitribodh-API/db/migrations)
- [API route mounting](../Maitribodh-API/src/app.js)
- [API server and dependency wiring](../Maitribodh-API/src/server.js)
- [API modules](../Maitribodh-API/src/modules)

Contents:

1. [Database setup and AWS RDS process](#2-database-setup-and-aws-rds-process)
2. [Schema and migration history](#3-schema-and-migration-history)
3. [Table inventory and relationships](#4-table-inventory-and-relationships)
4. [Detailed table dictionary](#5-detailed-table-dictionary)
5. [Seeded master data](#6-seeded-master-data)
6. [API conventions and permissions](#7-api-conventions-and-permissions)
7. [API endpoint reference](#8-api-endpoint-reference)
8. [Request and response examples](#9-request-and-response-examples)
9. [Database verification and deployment checklist](#10-database-verification-and-deployment-checklist)

## 2. Database setup and AWS RDS process

### 2.1 Current architecture

```text
Frontend -> Node.js / Express API -> PostgreSQL
                                  -> Private upload directory
```

| Item | Current implementation |
|---|---|
| API runtime | Node.js 22+ with Express 5 |
| Database engine | PostgreSQL; local setup documents PostgreSQL 16 |
| Database client | `pg` 8.16.3 |
| Local database name | `postgres` |
| Application schema | `mams` |
| Migration tracking schema | `public` |
| RDS target | RDS for PostgreSQL; database name is a deployment choice, for example `mams` |
| Pool maximum | 10 connections per API process |
| Connection timeout | 5,000 milliseconds |
| Idle timeout | 30,000 milliseconds |
| SSL | Enabled when `NODE_ENV=production` or `DATABASE_SSL=true` |
| Certificate verification | `rejectUnauthorized: true` when SSL is enabled |

The application does not create the database itself. Provision a database first, then run migrations to create its schemas and tables. A database named `mams` and a schema named `mams` are separate PostgreSQL objects.

### 2.2 Create an RDS PostgreSQL database

Recommended production process:

1. In AWS RDS, create a **PostgreSQL** instance using a version compatible with the application; PostgreSQL 16 matches the documented local baseline.
2. Choose a database name, such as `mams`, and an appropriate instance size.
3. Enable storage encryption, automated backups, and production deletion protection. Consider Multi-AZ according to availability requirements.
4. Place RDS in private subnets. Allow TCP port `5432` from the API security group, not from the entire internet.
5. Establish VPN or approved tunnel access if administrators or the API connect from outside the VPC.
6. Use a migration role for schema changes and a separate least-privilege runtime role. Do not run the API using the RDS master account.
7. Download the official RDS CA bundle and make it available on the API host.
8. Store credentials in AWS Secrets Manager or an equivalent deployment secret store and inject them into the API process.
9. Run migrations against the target database, grant runtime permissions, bootstrap the first production administrator through an approved process, and validate application workflows.

RDS does not require a replacement database driver or rewritten PostgreSQL queries. Network reachability and verified TLS must be established before switching the application connection.

Official references:

- [AWS: PostgreSQL SSL connections](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html)
- [AWS: RDS certificates and TLS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)

### 2.3 Connection configuration

Illustrative configuration only:

```text
DATABASE_URL=postgresql://mams_app:<URL_ENCODED_PASSWORD>@<RDS_ENDPOINT>:5432/mams
DATABASE_SSL=true
NODE_ENV=production
NODE_EXTRA_CA_CERTS=C:\certificates\rds-global-bundle.pem
```

- Replace placeholders through the deployment secret mechanism.
- URL-encode special characters in connection-string credentials.
- Use the RDS DNS endpoint rather than a hardcoded IP address.
- Set `NODE_EXTRA_CA_CERTS` before starting Node.js; the file must exist on the API host. Use a host-appropriate absolute path.
- Avoid SSL query parameters in `DATABASE_URL` when relying on the existing explicit `pg` SSL configuration; connection-string SSL parameters can override its settings.
- Never disable certificate verification to work around a trust error.
- Secrets Manager retrieval is not implemented in the current API code; secret injection must be provided by deployment tooling or a future integration.
- No `DATABASE_POOL_MAX` or certificate-path-specific application setting is currently implemented. Pool limits are hardcoded in the shared configuration.

### 2.4 Other API environment settings

| Variable | Purpose / requirement |
|---|---|
| `DATABASE_URL` | Required PostgreSQL connection URL; used by the API and migration runner |
| `DATABASE_SSL` | Literal `true` enables TLS outside production; production enables TLS regardless |
| `NODE_ENV` | Runtime environment; controls TLS and production checks |
| `NODE_EXTRA_CA_CERTS` | Node.js trust-store extension, usable for the RDS CA bundle |
| `JWT_SECRET` | Required authentication signing secret, at least 32 bytes |
| `QR_HMAC_SECRET` | Separate QR signing secret; API setup requires at least 32 bytes |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | Required positive integer; login rate-limit window |
| `LOGIN_RATE_LIMIT_MAX` | Required positive integer; allowed login requests per window |
| `UI_ORIGIN` | Exact allowed frontend origin; default is `http://localhost:5173` |
| `TRUST_PROXY_HOPS` | Required non-negative integer in production; configure for the actual proxy topology |
| `PORT` | API listening port; default is `6200` |
| `UPLOAD_DIRECTORY` | Private filesystem directory; defaults to `private-uploads` under the API working directory |
| `DATA_ENCRYPTION_SECRET` | Stable secret for passport/ID encryption; falls back to the QR HMAC secret as key-derivation input |

The API does not automatically load an environment file in its server entry point. Supply variables through the process environment or approved runtime tooling. Never place database credentials in frontend configuration.

## 3. Schema and migration history

### 3.1 Schemas

| Schema | Purpose |
|---|---|
| `mams` | Application tables, identity sequences, and migration-created functions/triggers; audit deletion is permitted in the current release |
| `public` | `schema_migrations`, created by the migration runner |

Repositories generally reference application tables explicitly as `mams.<table>`. SQL migration files may set `search_path = mams`.

### 3.2 Apply migrations

From the repository root, with the intended database environment configured:

```powershell
Set-Location .\Maitribodh-API
npm run migrate
```

The runner:

- Acquires a PostgreSQL advisory lock with ID `1296126531`.
- Creates `public.schema_migrations` if needed.
- Reads numbered SQL migrations in filename order.
- Computes a SHA-256 checksum for each migration.
- Skips an already-applied migration only if its stored checksum matches.
- Rejects modified, already-applied migrations.
- Applies each new migration and its tracking entry in one transaction.

Do not manually edit an applied migration. Add a new numbered migration for future schema changes.

### 3.3 Migration inventory

| Migration | Effect |
|---|---|
| [0001_initial_schema.sql](../Maitribodh-API/db/migrations/0001_initial_schema.sql) | Creates `mams`, 12 application tables, relationships, constraints, and indexes |
| [0002_login_failure_window.sql](../Maitribodh-API/db/migrations/0002_login_failure_window.sql) | Adds the user failed-login window timestamp |
| [0003_first_login_temporary_password.sql](../Maitribodh-API/db/migrations/0003_first_login_temporary_password.sql) | Adds temporary-password state, consistency constraint, and expiry index |
| [0004_registration_workflows.sql](../Maitribodh-API/db/migrations/0004_registration_workflows.sql) | Adds category form schema, nullable approval rule, person expiry/draft data, and append-only audit enforcement |
| [0005_seed_registration_masters.sql](../Maitribodh-API/db/migrations/0005_seed_registration_masters.sql) | Adds category icon/description and inserts baseline master data |
| [0006_optional_person_photo.sql](../Maitribodh-API/db/migrations/0006_optional_person_photo.sql) | Removes photo from the general completed-person constraint |
| [0007_require_person_photo.sql](../Maitribodh-API/db/migrations/0007_require_person_photo.sql) | Adds `photo_required`; preserves existing records with `false`, then defaults new rows to `true` |
| [0008_international_person_mobile.sql](../Maitribodh-API/db/migrations/0008_international_person_mobile.sql) | Expands person primary mobile to 16 characters, normalizes existing Indian values to `+91` E.164 form, and enforces an E.164 database check |
| [0009_drop_overstay_cutoff.sql](../Maitribodh-API/db/migrations/0009_drop_overstay_cutoff.sql) | Removes the category `overstay_cutoff` column |
| [0010_remove_permission_levels.sql](../Maitribodh-API/db/migrations/0010_remove_permission_levels.sql) | Removes permission-level lookup values and category/person columns and removes configured permission-level fields from saved schemas and drafts |
| [0011_distinct_mobile_per_category.sql](../Maitribodh-API/db/migrations/0011_distinct_mobile_per_category.sql) | Adds a temporary uniqueness rule for mobile/category registrations; superseded by the shared-identity model in `0016` |
| [0012_allow_audit_log_deletion.sql](../Maitribodh-API/db/migrations/0012_allow_audit_log_deletion.sql) | Removes the audit append-only trigger so administrators can delete audit rows |
| [0013_international_phone_columns.sql](../Maitribodh-API/db/migrations/0013_international_phone_columns.sql) | Expands user and secondary/guardian phone columns for international numbers |
| [0014_independent_user_lifecycle.sql](../Maitribodh-API/db/migrations/0014_independent_user_lifecycle.sql) | Detaches operational history from deleted users (`SET NULL`) and removes their notifications |
| [0015_multiple_user_roles.sql](../Maitribodh-API/db/migrations/0015_multiple_user_roles.sql) | Adds and validates an assigned-role array; backfills existing users and maintains a representative legacy `role` |
| [0016_person_identity_and_area_capacity.sql](../Maitribodh-API/db/migrations/0016_person_identity_and_area_capacity.sql) | Creates shared `person_identity` records keyed by unique mobile, links category registrations to identities, and adds Area `max_occupancy` |
| [0017_remove_security_head.sql](../Maitribodh-API/db/migrations/0017_remove_security_head.sql) | Removes the obsolete `app_user.is_security_head` column |
| [0018_normalize_person_identity_profile.sql](../Maitribodh-API/db/migrations/0018_normalize_person_identity_profile.sql) | Moves common profile, encrypted identity values, media metadata, and QR state from `person` to `person_identity`; creates the person-code sequence |

**Final photo behavior:** existing records are not retroactively forced to have a photograph. `person.photo_required` remains as registration metadata, but migration `0018` removes the old profile-completeness database constraint; the current registration API requires and validates a photo for a new registration.

**Final identity model:** `person_identity` holds one shared profile, globally unique E.164 mobile and QR code. `person` now represents an individual category registration linked through `identity_id`; the person code and QR version belong to the shared identity, while category details, approval/status, expiry, consent, and area assignment belong to the registration. One identity can have multiple categories, but cannot have more than one `ACTIVE`, `PENDING`, or `DEACTIVATED` registration for a category. A mobile already linked to an identity is not available for a second identity.

**Final audit behavior:** `audit_log` is no longer append-only. Administrators can delete audit records through the API; migration `0012` drops the database trigger that previously rejected row deletion.

Migration files shown here are the repository's migration history, not proof that any particular database has applied them. Verify the target database's `public.schema_migrations` before relying on its schema.

## 4. Table inventory and relationships

### 4.1 Inventory

| Table | Purpose | Primary key |
|---|---|---|
| `mams.app_user` | Operators, roles, credentials, and session state | `user_id` |
| `mams.lookup_value` | Shared master data and hierarchical lookup values | `lookup_id` |
| `mams.category` | Person categories and configurable registration rules | `category_id` |
| `mams.location` | Gates and areas | `location_id` |
| `mams.bulk_upload` | Batch-import metadata and row processing results | `bulk_upload_id` |
| `mams.person` | Category registrations, drafts, approval/status, access, and consent | `person_id` |
| `mams.person_identity` | Shared profile/contact/media data and identity-level QR | `identity_id` |
| `mams.person_location` | Person-to-location assignments | `(person_id, location_id)` |
| `mams.approval_history` | Registration submission and approval decisions | `approval_id` |
| `mams.blacklist` | Blacklist periods, reasons, and lifting details | `blacklist_id` |
| `mams.visit` | Check-in/check-out records | `visit_id` |
| `mams.notification` | Per-user notifications and read state | `notification_id` |
| `mams.audit_log` | Application activity history; administrator deletion is supported | `audit_id` |
| `public.schema_migrations` | Applied migration filenames, checksums, and timestamps | `migration_name` |

The final application schema has 13 `mams` tables; the initial migration created 12, and migration `0016` added `person_identity`.

### 4.2 Relationship overview

```text
app_user -------< person (registered_by / approved_by / updated_by / consent_captured_by)
app_user -------< visit / approval_history / blacklist / notification / audit_log
app_user -------< bulk_upload
category -------< person
person_identity -< person
category -------< lookup_value
lookup_value ---< lookup_value (parent_id)
lookup_value ---< category / location / person / blacklist
bulk_upload ----< person
person ---------< person_location >--------- location
person ---------< approval_history
person ---------< blacklist
person ---------< visit >------------------ location
```

`notification.entity_type/entity_id` and `audit_log.entity_type/entity_id` are generic references without database foreign keys. Semantic rules, such as a lookup being a department or a location being a gate, also require application validation; their foreign keys alone do not enforce those classifications.

## 5. Detailed table dictionary

Notation:

- `PK`: primary key; `FK`: foreign key.
- `Yes` under nullable means SQL `NULL` is allowed.
- `identity`: `GENERATED ALWAYS AS IDENTITY`.
- A missing default means none is declared by the migrations.
- `timestamptz` stores timezone-aware timestamps; `jsonb` stores structured JSON.
- Default timestamps do not imply automatic update triggers. Application code must update `updated_at`.

### 5.1 `mams.app_user`

Purpose: administrative and operational accounts, role permissions, password state, and session revocation.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `user_id` | bigint | No | PK, identity |
| `first_name` | varchar(100) | No | First name |
| `last_name` | varchar(100) | No | Last name |
| `mobile` | varchar(16) | No | Unique operator mobile; valid international values are supported |
| `email` | varchar(150) | Yes | Optional email |
| `username` | varchar(50) | No | Case-insensitively unique username |
| `role` | varchar(20) | No | Highest-precedence assigned role; maintained for audit and legacy compatibility |
| `roles` | varchar(20)[] | No | Non-empty built-in role list, backfilled for existing users; API permissions combine all roles |
| `can_bulk_upload` | boolean | No | `false`; bulk-upload permission flag |
| `status` | varchar(10) | No | `ACTIVE`; `ACTIVE` / `INACTIVE` |
| `password_hash` | varchar(100) | Yes | Password hash, never plaintext |
| `failed_login_count` | smallint | No | `0`; unsuccessful attempts |
| `failed_login_window_started_at` | timestamptz | Yes | Start of tracked failure window |
| `locked_until` | timestamptz | Yes | Account lock expiry |
| `token_version` | integer | No | `0`; used to invalidate JWT sessions |
| `last_login_at` | timestamptz | Yes | Most recent login |
| `created_by` | bigint | Yes | FK -> `app_user.user_id` |
| `created_at` | timestamptz | No | `now()` |
| `updated_at` | timestamptz | No | `now()` |
| `must_change_password` | boolean | No | `false`; temporary-password flow |
| `temporary_password_expires_at` | timestamptz | Yes | Temporary password expiry |
| `temporary_password_used_at` | timestamptz | Yes | Temporary password consumption timestamp |

Constraints and indexes:

- Roles: `SUPER_ADMIN`, `ADMIN`, `APPROVER`, `REG_OFFICER`, `SECURITY_GUARD`, `VIEWER`; `roles` contains one or more assignments and `role` is the first role in precedence order.
- Unique mobile; unique `lower(username)`; unique `lower(email)` where email is not null.
- Partial unique index allows at most one `SUPER_ADMIN`.
- Temporary-password state requires either a normal account with both temporary timestamps null, or a forced-change account with a password hash and expiry.
- Partial index on `temporary_password_expires_at` where `must_change_password=true`.

Related APIs: authentication, user administration, and activity.

### 5.2 `mams.lookup_value`

Purpose: shared master-data values, including parent/child classifications.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `lookup_id` | integer | No | PK, identity |
| `lookup_type` | varchar(30) | No | Lookup enum below |
| `name` | varchar(100) | No | Display name |
| `parent_id` | integer | Yes | FK -> `lookup_value.lookup_id` |
| `category_id` | smallint | Yes | FK -> `category.category_id` |
| `extra` | jsonb | No | `{}`; additional metadata |
| `status` | varchar(10) | No | `ACTIVE`; `ACTIVE` / `INACTIVE` |
| `created_at` | timestamptz | No | `now()` |
| `updated_at` | timestamptz | No | `now()` |

Allowed types: `DEPARTMENT`, `JOB_ROLE`, `SUBCATEGORY`, `PROGRAM_BATCH`, `ID_PROOF_TYPE`, `BLACKLIST_REASON`. `PERMISSION_LEVEL` was removed in migration `0010`.

Uniqueness: `(lookup_type, COALESCE(parent_id, 0), COALESCE(category_id, 0), lower(name))`.

Related APIs: lookup maintenance and registration options.

### 5.3 `mams.category`

Purpose: person classification, approval rules, and dynamic registration form configuration.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `category_id` | smallint | No | PK, identity |
| `name` | varchar(50) | No | Case-insensitively unique name |
| `form_type` | varchar(20) | No | `GENERIC`; form enum below |
| `approval_required` | boolean | Yes | `false`; null means rule unconfirmed |
| `is_broad` | boolean | No | `false`; broad-category flag |
| `broad_category_id` | smallint | Yes | FK -> `category.category_id` |
| `status` | varchar(10) | No | `ACTIVE`; `ACTIVE` / `INACTIVE` |
| `created_at` | timestamptz | No | `now()` |
| `updated_at` | timestamptz | No | `now()` |
| `form_schema` | jsonb | No | `{}`; configurable field schema |
| `icon` | varchar(50) | No | `fa-user` |
| `description` | varchar(300) | No | Empty string |

Form types: `STAFF`, `PARIVAR`, `VISITOR`, `VENDOR`, `CONTRACTOR`, `PARTICIPANT`, `GENERIC`.

The registration API blocks submission when `approval_required` is null. A non-empty custom `form_schema` takes precedence over the built-in form-type schema. The `overstay_cutoff` column was removed in migration `0009`; permission-level assignment was removed in migration `0010`. The current category API does not expose broad-category fields even though legacy broad-category columns remain in the database.

Custom form schema supports up to 50 uniquely keyed fields. Field types are `text`, `date`, `number`, and `select`; fields can specify required state, allowed options, or a master-data source. Schema-level flags control address and emergency-contact requirements.

Related APIs: categories, registration options, registration.

### 5.4 `mams.location`

Purpose: gates and areas used for access assignment and visits.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `location_id` | smallint | No | PK, identity |
| `name` | varchar(100) | No | Case-insensitively unique name |
| `location_type` | varchar(10) | No | `GATE` / `AREA` |
| `is_restricted` | boolean | No | `false` |
| `department_id` | integer | Yes | FK -> `lookup_value.lookup_id` |
| `max_occupancy` | integer | Yes | Positive cap for an Area; null means uncapped; added by migration `0016` |
| `status` | varchar(10) | No | `ACTIVE`; `ACTIVE` / `INACTIVE` |
| `created_at` | timestamptz | No | `now()` |
| `updated_at` | timestamptz | No | `now()` |

Constraint: only `AREA` locations may be restricted; gates must have `is_restricted=false`.

Related APIs: locations, registration options/access assignment, gate lookup, visits, reports.

### 5.5 `mams.bulk_upload`

Purpose: storage for batch-upload processing metadata. The table exists, but no bulk-upload HTTP endpoint is mounted in the current API.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `bulk_upload_id` | bigint | No | PK, identity |
| `file_name` | varchar(255) | No | Original file name |
| `file_key` | varchar(300) | No | Stored file reference |
| `status` | varchar(15) | No | `PROCESSING`; `PROCESSING` / `COMPLETED` / `FAILED` |
| `total_rows` | integer | No | `0` |
| `success_rows` | integer | No | `0` |
| `error_rows` | integer | No | `0` |
| `errors` | jsonb | No | `[]`; processing errors |
| `uploaded_by` | bigint | Yes | FK -> `app_user.user_id`; detached on user deletion |
| `uploaded_at` | timestamptz | No | `now()` |
| `completed_at` | timestamptz | Yes | Completion timestamp |

### 5.6 `mams.person`

Purpose: one person's category registration and its workflow, consent, access assignment, and draft data. Common identity/profile fields and QR state are in `mams.person_identity`.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `person_id` | bigint | No | PK, identity; registration identifier |
| `identity_id` | bigint | Yes | FK -> `person_identity.identity_id`; shared profile/QR owner |
| `category_id` | smallint | No | FK -> `category.category_id` |
| `subcategory_id` | integer | Yes | Legacy FK -> `lookup_value.lookup_id` |
| `category_details` | jsonb | No | `{}`; fields/settings for this category registration |
| `accompanying` | jsonb | No | `[]`; accompanying-person metadata |
| `accompanying_count` | smallint | No | `0`; used in gate occupancy |
| `remarks` | varchar(500) | Yes | Registration notes |
| `status` | varchar(12) | No | `DRAFT`; `DRAFT` / `PENDING` / `ACTIVE` / `REJECTED` / `DEACTIVATED` |
| `source` | varchar(12) | No | `MANUAL`; `MANUAL` / `BULK_UPLOAD` / `WALK_IN` |
| `bulk_upload_id` | bigint | Yes | FK -> `bulk_upload.bulk_upload_id` |
| `deactivated_reason` | varchar(300) | Yes | Deactivation explanation |
| `consent_at` | timestamptz | Yes | Registration consent timestamp |
| `consent_notice_version` | varchar(50) | Yes | Notice version |
| `consent_captured_by` | bigint | Yes | FK -> `app_user.user_id`, detached on user deletion |
| `registered_by` | bigint | Yes | FK -> `app_user.user_id`, nullable after migration `0014` |
| `approved_by` | bigint | Yes | FK -> `app_user.user_id`, detached on user deletion |
| `approved_at` | timestamptz | Yes | Approval timestamp |
| `created_at` | timestamptz | No | `now()` |
| `updated_by` | bigint | Yes | FK -> `app_user.user_id`, detached on user deletion |
| `updated_at` | timestamptz | No | `now()` |
| `expires_on` | date | Yes | Registration access expiry |
| `draft_data` | jsonb | Yes | Incomplete registration payload |
| `photo_required` | boolean | No | `true` for new rows; existing rows were preserved with `false` |

Statuses: `DRAFT`, `PENDING`, `ACTIVE`, `REJECTED`, `DEACTIVATED`. Active, pending, and deactivated registrations are unique per shared identity/category; drafts are outside the partial unique index. `person_code`, profile/contact data, encrypted passport/ID-proof data, documents/photo references, and `qr_version` are not columns of the final `person` table; they belong to `person_identity`. Each registration owns its own area assignment, approval history, visit, and blacklist associations. Deleting a registration removes its approval history/area assignments by FK cascade; the application also deletes its visits and blacklist rows. If no registrations remain, the shared identity and files are removed.

Related APIs: persons, registration, approvals, QR, gate, visits, blacklist, reports, dashboard.

### 5.7 `mams.person_identity`

Purpose: shared person profile, globally unique mobile/QR identity, and common private-media/identity data used by one or more category registrations.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `identity_id` | bigint | No | PK, identity |
| `mobile` | varchar(16) | No | Unique normalized E.164 primary mobile; identity lookup key |
| `qr_code` | varchar(12) | Yes | Unique `MB-...` identity code |
| `qr_version` | integer | No | `1`; version used to invalidate old signed QR values |
| `first_name`, `last_name` | varchar(100) | Yes | Shared names; both null or both present |
| `alternate_mobile` | varchar(16) | Yes | Shared alternate number |
| `gender` | varchar(6) | Yes | `MALE` / `FEMALE` / `OTHER` |
| `date_of_birth` | date | Yes | Shared date of birth |
| `resident_status` | varchar(12) | No | `RESIDENT`; `RESIDENT` / `NON_RESIDENT` |
| `passport_number_enc`, `id_proof_number_enc` | text | Yes | AES-256-GCM encrypted values |
| `passport_last4`, `id_proof_last4` | varchar(4) | Yes | Display masking suffixes |
| `address` | varchar(500) | Yes | Shared address |
| `email` | varchar(150) | Yes | Shared email; nullable in database, required by current registration API |
| `photo_key` | varchar(300) | Yes | Private shared photo file reference |
| `id_proof_type_id` | integer | Yes | FK -> `lookup_value.lookup_id` |
| `emergency_contact_name` | varchar(100) | Yes | Shared emergency contact |
| `emergency_contact_mobile` | varchar(16) | Yes | Shared emergency phone |
| `documents` | jsonb | No | `[]`; shared private-file metadata |
| `guardian_name`, `guardian_mobile` | varchar(100), varchar(16) | Yes | Guardian profile fields; database support exists, but current registration UI/API does not collect them |
| `guardian_consent_at` | timestamptz | Yes | Guardian-consent timestamp; constrained with the guardian fields |
| `guardian_consent_notice_version` | varchar(50) | Yes | Guardian-consent notice version |
| `created_at` | timestamptz | No | `now()` |

`person_code_seq` generates new identity QR codes. Primary mobile is globally unique across person identities; a new registration for the same mobile reuses the identity for a different category, while duplicate registrations within that identity/category are rejected. Profile edits and files are shared by all linked registrations.

### 5.8 `mams.person_location`

Purpose: many-to-many person access assignments.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `person_id` | bigint | No | Composite PK; FK -> `person.person_id`, `ON DELETE CASCADE` |
| `location_id` | smallint | No | Composite PK; FK -> `location.location_id` |
| `assigned_by` | bigint | Yes | FK -> `app_user.user_id` |
| `assigned_at` | timestamptz | No | `now()` |

A person cannot have the same location assigned twice. Related APIs: registration and person access updates.

### 5.9 `mams.approval_history`

Purpose: chronological submission and decision history.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `approval_id` | bigint | No | PK, identity |
| `person_id` | bigint | No | FK -> `person.person_id`, `ON DELETE CASCADE` |
| `action` | varchar(12) | No | `SUBMITTED` / `APPROVED` / `REJECTED` / `RESUBMITTED` |
| `reason` | varchar(500) | Yes | Required for rejection by constraint |
| `acted_by` | bigint | Yes | FK -> `app_user.user_id`; detached on user deletion |
| `acted_at` | timestamptz | No | `now()` |

Constraint: rejected entries need a reason of at least 10 characters. Index: `person_id`.

Related APIs: approvals, resubmissions, person activity, approval reports.

### 5.10 `mams.blacklist`

Purpose: blacklist periods and lifting history.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `blacklist_id` | bigint | No | PK, identity |
| `person_id` | bigint | No | FK -> `person.person_id` |
| `reason_id` | integer | No | FK -> `lookup_value.lookup_id` |
| `remarks` | varchar(500) | No | Reason details |
| `start_date` | date | No | `CURRENT_DATE` |
| `end_date` | date | Yes | Optional end date |
| `added_by` | bigint | Yes | FK -> `app_user.user_id`; detached on user deletion |
| `added_at` | timestamptz | No | `now()` |
| `lifted_by` | bigint | Yes | FK -> `app_user.user_id` |
| `lifted_at` | timestamptz | Yes | Null while unlifted |
| `lift_note` | varchar(500) | Yes | Lifting explanation |

Constraints: end date cannot precede start date. Partial unique index on `person_id` where `lifted_at IS NULL`; this is based on lifting state, not whether the date period has expired.

Related APIs: blacklist administration, blacklist reports, gate/visit eligibility.

### 5.11 `mams.visit`

Purpose: person entry, exit, and administrative reconciliation.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `visit_id` | bigint | No | PK, identity |
| `person_id` | bigint | No | FK -> `person.person_id` |
| `status` | varchar(16) | No | `OPEN`; `OPEN` / `CLOSED` / `CLOSED_BY_ADMIN` |
| `checkin_at` | timestamptz | No | `now()` |
| `checkin_gate_id` | smallint | No | FK -> `location.location_id` |
| `checkin_location_id` | smallint | No | FK -> `location.location_id` |
| `checkin_by` | bigint | Yes | FK -> `app_user.user_id`; detached on user deletion |
| `checkin_device` | varchar(100) | Yes | Entry device metadata |
| `accompanying_count` | smallint | No | `0` |
| `accompanying_names` | jsonb | No | `[]` |
| `location_override` | boolean | No | `false` |
| `checkout_at` | timestamptz | Yes | Exit timestamp |
| `checkout_gate_id` | smallint | Yes | FK -> `location.location_id` |
| `checkout_location_id` | smallint | Yes | FK -> `location.location_id` |
| `checkout_by` | bigint | Yes | FK -> `app_user.user_id` |
| `checkout_device` | varchar(100) | Yes | Exit device metadata |
| `admin_note` | varchar(500) | Yes | Administrative reconciliation note |
| `overstay_alerted_at` | timestamptz | Yes | Overstay notification timestamp |

Constraints:

- At most one `OPEN` visit per person, enforced by a partial unique index.
- Closed visits require a checkout timestamp.
- `CLOSED_BY_ADMIN` requires an admin note.
- Checkout cannot precede check-in.

Other indexes: `checkin_at`, `checkout_at`.

Related APIs: visits, gate lookup, visit reports, occupancy, dashboard.

### 5.12 `mams.notification`

Purpose: notifications associated with an operator account.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `notification_id` | bigint | No | PK, identity |
| `user_id` | bigint | No | FK -> `app_user.user_id` |
| `type` | varchar(40) | No | Application-defined notification type |
| `title` | varchar(150) | No | Summary |
| `body` | varchar(500) | Yes | Message |
| `entity_type` | varchar(30) | Yes | Generic entity classification |
| `entity_id` | bigint | Yes | Generic reference, not FK |
| `is_read` | boolean | No | `false` |
| `created_at` | timestamptz | No | `now()` |

Index: `(user_id, is_read, created_at)`. APIs limit notification access and read updates to the authenticated user.

### 5.13 `mams.audit_log`

Purpose: application activity history. Authorized administrators may delete records.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `audit_id` | bigint | No | PK, identity |
| `occurred_at` | timestamptz | No | `now()` |
| `user_id` | bigint | Yes | FK -> `app_user.user_id` |
| `user_role` | varchar(20) | Yes | Actor role snapshot |
| `module` | varchar(30) | No | Application module |
| `activity` | varchar(60) | No | Action identifier |
| `entity_type` | varchar(30) | Yes | Generic entity classification |
| `entity_id` | bigint | Yes | Generic reference, not FK |
| `old_value` | jsonb | Yes | Previous-value snapshot |
| `new_value` | jsonb | Yes | New-value snapshot |
| `ip_address` | varchar(45) | Yes | Actor IP |
| `device` | varchar(100) | Yes | Device/user-agent metadata |

Indexes: `occurred_at`; `(entity_type, entity_id)`; `(user_id, occurred_at)`.

Migration `0004` originally created an append-only trigger; migration `0012` drops it. The API exposes administrator-only deletion for selected audit IDs or all rows matching submitted filters. Audit record deletion is permanent.

### 5.14 `public.schema_migrations`

Purpose: migration execution tracking; created by the JavaScript runner rather than an SQL migration file.

| Column | Type | Nullable | Default / meaning |
|---|---|---|---|
| `migration_name` | text | No | PK; migration filename |
| `checksum` | text | No | SHA-256 checksum |
| `applied_at` | timestamptz | No | `now()` |

No HTTP API exposes this table.

## 6. Seeded master data

Migration `0005` inserts baseline data with `ON CONFLICT DO NOTHING`. Identity IDs are environment-dependent; do not hardcode IDs from a development database.

### 6.1 Categories

| Name | Form type | Approval required |
|---|---|---:|
| Staff | `STAFF` | Yes |
| Visitor | `VISITOR` | No |
| Vendor | `VENDOR` | No |
| Contractor | `CONTRACTOR` | No |
| Participant | `PARTICIPANT` | No |
| Parivar Member | `PARIVAR` | Yes |

These are insertion defaults; existing conflicting category rows are not comprehensively overwritten. Migration `0010` removes the former `PERMISSION_LEVEL` lookup and category/person permission-level fields. Migration `0009` removes category overstay cutoffs.

### 6.2 Lookup values and locations

- Departments: Gurukul, Goushala, Accounts, Housekeeping, Security.
- ID proof types: Aadhaar Card, PAN Card, Driving Licence, Voter ID, Passport.
- Blacklist reason: Repeated policy violation.
- Job roles: Gurukul (Teacher, Admin, Helper, Guard, Driver), Goushala (Supervisor, Worker), Housekeeping (Housekeeper, Gardener), Security (Guard, Head of Security).
- Parivar subcategories: Sevak, Matri.
- Gates: Main Gate, Goushala Gate.
- Unrestricted areas: Goushala, Hostel.
- Restricted areas: Kitchen, Admin Office, Gurukul.
- Program/batch values must be configured separately; this migration does not insert them.

### 6.3 Built-in category-specific registration fields

| Form type | Required category details | Other rules / optional details |
|---|---|---|
| `STAFF` | `department_id`, `job_role_id`, `joining_date` | Address and emergency contact required; optional employee code, employment type, shift |
| `VISITOR` | `purpose`, `visit_date` | Optional city, person to meet, duration hours, vehicle number |
| `VENDOR` | `firm_name`, `services`, `department_id` | Optional GSTIN, delivery frequency, vehicle number, business address |
| `CONTRACTOR` | `agency_name`, `nature_of_work`, `department_id`, `start_date`, `end_date` | Optional work order and work location |
| `PARTICIPANT` | `program_batch_id` | Emergency contact required; optional city, accommodation, medical notes |
| `PARIVAR` | `subcategory_id` | Address and emergency contact required; optional membership date, seva area, referral |
| `GENERIC` | None in default schema | Optional `details` |

Custom category schemas may change these requirements. Always fetch registration options before constructing a form. The Visitor UI also collects optional `driver_available` (`YES`/`NO`) and, only when `YES`, optional `driver_name` and `driver_mobile`. Driver mobile accepts a valid Indian or international phone number; these conditional fields are not part of the default schema list.

## 7. API conventions and permissions

### 7.1 Base URL and formats

- Default local API origin: `http://localhost:6200`.
- API prefix: `/api/v1`.
- Health endpoint: `/health`, outside the versioned prefix.
- JSON requests use `Content-Type: application/json`.
- Registration and file uploads use `multipart/form-data`.
- Protected requests use `Authorization: Bearer <accessToken>`.
- Route parameters such as `:personId` are placeholders for positive integer IDs.
- Dates are generally `YYYY-MM-DD`; timestamps are timezone-aware.
- Request fields commonly use camelCase, while database-backed response fields commonly use snake_case. There is no universal response field-name conversion.
- PostgreSQL `bigint` values may be serialized as strings by `pg`; clients should not assume every ID is a JSON number.

### 7.2 Role groups used below

| Group | Allowed role values |
|---|---|
| ADMIN | `SUPER_ADMIN`, `ADMIN` |
| MANAGEMENT | `SUPER_ADMIN`, `ADMIN`, `APPROVER`, `REG_OFFICER` |
| REGISTRATION | MANAGEMENT plus `SECURITY_GUARD` |
| APPROVAL | `SUPER_ADMIN`, `ADMIN`, `APPROVER` |
| VISIT | `SUPER_ADMIN`, `ADMIN`, `SECURITY_GUARD` |
| REPORT | MANAGEMENT plus `VIEWER` |
| AUTHENTICATED | Any valid active user role |
| PUBLIC | No bearer token required |

These are documentation aliases, not new application role values. The JavaScript constant named `REGISTRATION_OFFICER` has the actual role value `REG_OFFICER`.

Route-level permission does not guarantee an operation will succeed: services and repositories additionally enforce state, ownership, and category restrictions.

Notable restrictions:

- Security guards can register only Visitor-form categories; registration forces `source=WALK_IN` and clears area assignments. Permission-level assignment is not part of the current schema/API.
- Staff profile editing has additional administrator-only restrictions.
- Security guards may fetch profile photos but not person documents. Guard photo capture is limited to active non-Staff people without an existing photo, including references whose stored file is confirmed missing by the server. The missing reference is rechecked under the person row lock before updating; an existing or concurrently replaced photo cannot be overwritten by a guard.
- An account with `must_change_password=true` can call only password change and logout until the password is changed.
- Token validation checks the current database account status and token version, not just the JWT signature.

### 7.3 Pagination

Where listed, pagination accepts:

| Parameter | Default | Valid values |
|---|---|---|
| `page` | `1` | Positive integer |
| `pageSize` | `5` | Integer from `1` to `100` |

Common paginated response:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 5
}
```

Lookup lists paginate only when `page` or `pageSize` is supplied; otherwise they return `{ "items": [...] }`. Notifications return at most 100 recent rows, not the generic pagination envelope.

### 7.4 Errors and status codes

Standard application error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Provide valid registration details"
  }
}
```

| HTTP status | Typical meaning |
|---|---|
| `200` | Successful read or update |
| `201` | Resource/credential created |
| `204` | Successful operation with no response body |
| `400` | Invalid body, filter, file, or date |
| `401` | Missing/invalid session or invalid credentials |
| `403` | Role restriction or required password change |
| `404` | Missing resource or unavailable route |
| `409` | State conflict, changed category, or incompatible operation |
| `429` | Rate limit exceeded |
| `500` | Unexpected internal error |

Login rate limiting is handled by `express-rate-limit`; its response is not guaranteed to use the standard application error envelope. Public QR limiting explicitly returns the JSON envelope and a `Retry-After` header.

## 8. API endpoint reference

Paths below include the full versioned prefix. Query filters are optional unless explicitly stated. Successful responses are JSON unless noted.

### 8.1 Health

| Method | Path | Access | Input | Success |
|---|---|---|---|---|
| GET | `/health` | PUBLIC | None | `200`, `{ "status": "ok" }` |

This is an HTTP liveness check only. It does not execute a database query or prove RDS connectivity.

### 8.2 Authentication

Source: [auth routes](../Maitribodh-API/src/modules/auth/auth.routes.js).

| Method | Path | Access | Input | Success |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | PUBLIC, rate-limited | `username`, `password` | `200`, session/token object |
| POST | `/api/v1/auth/logout` | AUTHENTICATED | No required body | `204`; revokes sessions through token version |
| PUT | `/api/v1/auth/password` | AUTHENTICATED | `currentPassword`, `newPassword` | `204`; password change |

New passwords require 10-256 characters, at least one letter, and at least one digit. JWTs have no absolute expiry. The UI signs out after 30 minutes without user interaction; background API requests do not count as activity. The current tab's session survives refresh using `sessionStorage`, preserving the inactivity deadline. Logout, password changes, and account changes revoke existing sessions through token-version checks. Temporary passwords expire after 24 hours and require password change at first login.

### 8.3 Users

Source: [user routes](../Maitribodh-API/src/modules/users/users.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/users` | ADMIN | `query`, `role`, `status`, pagination | `200`, user list |
| POST | `/api/v1/users` | ADMIN | Required: `firstName`, `lastName`, `mobile`, `username`, and exactly one of `role` or `roles`; optional: `email`, `canBulkUpload` | `201`, created user |
| GET | `/api/v1/users/:userId` | ADMIN | User ID | `200`, user detail |
| PATCH | `/api/v1/users/:userId` | ADMIN | Profile fields, `role` or `roles`, `canBulkUpload`, `activate: true` or `deactivate: true` | `200`, updated user |
| POST | `/api/v1/users/:userId/password-reset` | ADMIN | User ID; no required body | `201`, `temporaryPassword`, `expiresAt`; no-store headers |
| DELETE | `/api/v1/users/:userId` | ADMIN | User ID; self-delete prohibited; only Super Admin may delete Admin/Super Admin accounts | `204`; user removed and actor references detached from operational history |

Create and PATCH accept either the legacy `role` string or the `roles` array, never both. Arrays must contain one or more distinct built-in roles; for example, `{"roles":["APPROVER","SECURITY_GUARD"]}` grants approvals and Security Gate access. The role filter matches any assignment, not just the representative role. User responses include both `role` and `roles`. Only a Super Admin may assign `SUPER_ADMIN`, change the roles of an existing Super Admin, or delete an Admin/Super Admin account; the single-Super-Admin limit is retained. Changing assignments increments the token version and requires the affected user to sign in again. Newly created accounts still require credential issuance before login. Deleting a user removes their notifications, retains operational/audit records with nullable actor references, and records the deletion audit event.

### 8.4 Categories

Source: [category routes](../Maitribodh-API/src/modules/categories/categories.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/categories` | ADMIN | `query`, `formType`, `status`, pagination | `200`, category list |
| POST | `/api/v1/categories` | ADMIN | Required: `name`; optional configuration fields below | `201`, category |
| GET | `/api/v1/categories/:categoryId` | ADMIN | Category ID | `200`, category |
| PATCH | `/api/v1/categories/:categoryId` | ADMIN | At least one supported field | `200`, updated category |
| DELETE | `/api/v1/categories/:categoryId` | ADMIN | Category ID | `204`; only unreferenced categories can be deleted |

Create fields: `name`, `icon`, `description`, `formType`, and `approvalRequired`.

PATCH additionally supports `status` and `formSchema`. `approvalRequired` accepts null. The API does not expose `overstayCutoff`, `isBroad`, or `broadCategoryId`; the legacy broad-category database columns are not currently manageable through these routes.

### 8.5 Lookup values

Source: [lookup routes](../Maitribodh-API/src/modules/lookups/lookups.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/lookups/:lookupType` | AUTHENTICATED | `parentId`, `query`, `includeInactive`, optional pagination | `200`, items or paginated result |
| POST | `/api/v1/lookups/:lookupType` | ADMIN | Required: `name`; optional: `parentId`, `categoryId`, `extra` | `201`, lookup value |
| PATCH | `/api/v1/lookups/:lookupType/:lookupId` | ADMIN | At least one of `name`, `extra`, `status` | `200`, updated lookup |
| DELETE | `/api/v1/lookups/:lookupType/:lookupId` | ADMIN | Lookup type and ID | `204`; deletion is rejected while referenced |

Lookup types are normalized to uppercase. `includeInactive=true` is administrator-only. The list route does not implement a `categoryId` filter; category-scoped lookup metadata is available through registration options.

### 8.6 Locations

Source: [location routes](../Maitribodh-API/src/modules/locations/locations.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/locations` | ADMIN | `query`, `locationType`, pagination | `200`, active location list |
| POST | `/api/v1/locations` | ADMIN | Required: `name`, `locationType`; optional: `isRestricted`, `departmentId`, positive `maxOccupancy` for Areas | `201`, location |
| GET | `/api/v1/locations/:locationId` | ADMIN | Location ID | `200`, location |
| PATCH | `/api/v1/locations/:locationId` | ADMIN | At least one of `name`, `locationType`, `isRestricted`, `departmentId`, `maxOccupancy`, `status` | `200`, updated location |

The list endpoint returns active locations; it does not expose a status filter for inactive locations.

### 8.7 Persons and registration

Sources: [person routes](../Maitribodh-API/src/modules/persons/persons.routes.js), [registration routes](../Maitribodh-API/src/modules/persons/registration.routes.js), [input validation](../Maitribodh-API/src/modules/persons/registration.validation.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/persons` | MANAGEMENT | `q`, `categoryId`, `status`, pagination | `200`, search results |
| GET | `/api/v1/persons/registration/options` | REGISTRATION | None | `200`, `categories`, `lookups`, `locations`; effective form schema per category |
| GET | `/api/v1/persons/registration/check-mobile` | REGISTRATION | `mobile`, `categoryId`, optional `personId` | `200`, category-specific duplicate check |
| GET | `/api/v1/persons/drafts` | REGISTRATION | None | `200`, `{ "items": [...] }` for current user |
| POST | `/api/v1/persons/drafts` | REGISTRATION | `categoryId`, optional `draftId`, incomplete registration fields | `201`, saved draft |
| POST | `/api/v1/persons` | REGISTRATION | Multipart `metadata`, required `photo`, optional `documents` | `201`, `person_id`, `person_code`, `status`, `qr_version` |
| GET | `/api/v1/persons/:personId/category-assignments` | ADMIN | Person registration ID | `200`, shared profile and linked categories |
| POST | `/api/v1/persons/:personId/category-assignments` | ADMIN | `registrations` array (1–50); category details, areas, accompanying count, and consent per registration | `201`, created category registrations |
| GET | `/api/v1/persons/:personId` | MANAGEMENT | Person ID | `200`, person detail with category and location IDs |
| GET | `/api/v1/persons/:personId/activity` | MANAGEMENT | Person ID | `200`, `{ "items": [...] }` |
| PATCH | `/api/v1/persons/:personId` | MANAGEMENT | Profile fields described below | `200`, updated profile result |
| PATCH | `/api/v1/persons/:personId/access` | MANAGEMENT | Required: `locationIds`, `expiresOn` (date or empty string) | `200`, updated access result |
| POST | `/api/v1/persons/:personId/status` | ADMIN | `status`: `ACTIVE` / `DEACTIVATED`; required `reason` (1-300 chars) | `200`, updated status |
| POST | `/api/v1/persons/:personId/photo` | REGISTRATION | Multipart `photo` | `200`, `{ "photo_key": "..." }` |
| GET | `/api/v1/persons/:personId/files/:key` | REGISTRATION | Person ID and associated file key | `200`, private file download |
| POST | `/api/v1/persons/:personId/files` | MANAGEMENT | Multipart `documents` | `200`, updated document result |
| GET | `/api/v1/persons/:personId/qr` | REGISTRATION | Person ID | `200`, PNG; `X-Person-Code`, `X-QR-Version`, no-store headers |
| POST | `/api/v1/persons/:personId/resubmissions` | MANAGEMENT | Person ID; no required body | `200`, resubmitted person |
| DELETE | `/api/v1/persons/:personId` | MANAGEMENT | Person registration ID; no reason required | `204`; permanently deletes that registration, visits, and blacklist rows |

Category assignments use one shared identity/profile and QR. Each added category receives its own category fields, status/approval history, consent, expiry, and area assignment. If deleting a registration leaves no linked registrations, its shared profile and files are deleted as well.

Search status values: `PENDING`, `ACTIVE`, `REJECTED`, `DEACTIVATED`, `BLACKLISTED`; `BLACKLISTED` reflects a current, unlifted blacklist entry within its date range and takes precedence over the registration status. Drafts are accessed separately.

Registration `metadata` is a JSON string containing:

| Field | Requirement / validation |
|---|---|
| `categoryId` | Required positive integer |
| `firstName`, `lastName` | Required, 1-100 characters; Unicode letters/marks, spaces, and hyphens |
| `mobile` | Required valid phone number. Visitor registrations may use a valid international number; other form types require a valid Indian number. Persisted primary values use E.164 form and identify the shared profile. |
| `gender` | Required: `MALE`, `FEMALE`, `OTHER` |
| `consent` | Required literal `true` |
| `residentStatus` | `RESIDENT` (default) or `NON_RESIDENT` |
| `passportNumber` | Non-residents require 6-9 alphanumeric characters |
| `alternateMobile`, `emergencyMobile` | Valid Indian or international phone number, normalized to E.164, or empty string |
| `dateOfBirth` | ISO date or empty string; future dates rejected |
| `email` | Required valid email up to 150 characters |
| `address`, `remarks` | Up to 500 characters |
| `emergencyName` | Up to 100 characters |
| `idProofTypeId` | Positive integer or null |
| `idProofNumber` | Up to 50 characters; selected proof-type pattern checked when available |
| `locationIds` | Array of positive integers, at most 100 |
| `accompanyingCount` | Integer from 0 to 32767, default 0 |
| `categoryDetails` | JSON object with category-defined fields |
| `source` | `MANUAL` (default) or `WALK_IN`; not `BULK_UPLOAD` |

Further registration behavior:

- Approval-required categories produce `PENDING`; others produce `ACTIVE`.
- The primary mobile identifies/reuses a shared person identity. One identity can register in additional categories, but cannot repeat a current registration in the same category.
- Category rules, lookup type/status, job-role department membership, and location eligibility are validated.
- Participant registration optionally stores `categoryDetails.future_checkin_access` as `YES` or `NO`. The checkbox is unchecked by default and is not required; missing values, including older registrations, do not grant future access. The registration review shows the chosen permission.
- Photo: JPG/PNG, at most 2 MiB; processed to JPEG with maximum dimensions 600 x 600 without enlargement.
- Documents: PDF/JPG/PNG, at most 5 MiB each; at most 12 documents. Document images are converted to JPEG.
- Common profile, encrypted identity values, photo, and document metadata are stored against the shared `person_identity`; the category record refers to that identity. Files are stored under `UPLOAD_DIRECTORY`, not S3.
- Person detail removes encrypted passport/ID values and draft payload from its response.
- Draft payloads blank passport/ID numbers; photo/document bytes are not saved in drafts. Draft listing returns only the current user's drafts updated during the preceding seven days. The UI clears consent on resume and requires fresh consent at submission.
- Profile PATCH requires `firstName`, `lastName`, and `mobile`; it is not a fully optional partial patch. Optional supported fields are `alternateMobile`, `email`, `address`, `emergencyName`, `emergencyMobile`; omitted optional fields receive validation defaults.
- For an existing `PARTICIPANT`, Admin or Super Admin can enable or revoke future entry in Person Details > Edit details > Access details using "Allow future check-ins after this event ends (optional)". Profile PATCH accepts optional boolean `futureCheckinAccess`; omission preserves the existing permission. Only administrators may change it, and other categories cannot use it. The update changes only `category_details.future_checkin_access` (`YES`/`NO`), preserves the selected event and other details, and audits the previous and new permission. No re-registration is required. A fresh gate lookup uses the updated permission; permitted post-event check-ins still require the guard's completed-event acknowledgement.
- File downloads must refer to that person's photo or a listed document key. Security guards can download photos only.

### 8.8 Approvals

Source: [approval routes](../Maitribodh-API/src/modules/approvals/approvals.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/approvals` | APPROVAL | `status`: `PENDING` (default), `ACTIVE`, `REJECTED`; pagination | `200`, approval queue/list |
| POST | `/api/v1/approvals/:personId/decisions` | APPROVAL | `decision`: `APPROVE` / `REJECT`; optional `reason`, required for rejection | `200`, decision result |

Rejection reason must contain at least 10 characters after trimming and no more than 500 characters. Resubmission uses the person endpoint above.

### 8.9 Public QR lookup

Source: [public QR routes](../Maitribodh-API/src/modules/qr/public-qr.routes.js).

| Method | Path | Access | Input | Success |
|---|---|---|---|---|
| POST | `/api/v1/public/qr-lookups` | PUBLIC, rate-limited | Valid international E.164 mobile or 10-digit Indian mobile | `200`, `{ "items": [...] }` |

Ten-digit values are normalized as Indian `+91` numbers; international values must be valid phone numbers. Service-level limiting can return `429` with `Retry-After`. Public lookup is distinct from the authenticated PNG generation endpoint.

### 8.10 Gate lookup

Source: [gate routes](../Maitribodh-API/src/modules/gate/gate.routes.js).

| Method | Path | Access | Input | Success |
|---|---|---|---|---|
| POST | `/api/v1/gate/lookups` | REGISTRATION | Required active `locationId`; exactly one of `qrPayload`, `mobile`, `query` | `200`, lookup/eligibility result |

`qrPayload` is at most 256 characters; `mobile` is an Indian 10-digit or international E.164 number; `query` is 1-100 trimmed characters. Lookup does not itself create a visit; check-in uses the visits API. The UI Gate screen is provided to Admin, Super Admin, and Security Guard, while this API lookup route also permits Approver and Registration Officer roles.

For `PARTICIPANT` profiles, the selected `PROGRAM_BATCH` lookup's `extra.end_date` is the event end date. Configure this date in master data to enforce completed-event access. The event is completed only when that date is before today's date in `Asia/Kolkata`, so entry on the event's final day is unaffected. After completion, missing or `NO` future access returns `EVENT_ACCESS_EXPIRED` and the gate displays "Access is not valid for this user. The event has ended." With `YES`, lookup returns `eventWarning: true` and the gate warns that the event has ended and future access was granted during registration. Existing blacklist, profile status, explicit access expiry, open-visit, photo-verification, and restricted-area rules remain in effect. Checkout remains available for an open visit even when event access has ended.

### 8.11 Visits

Source: [visit routes](../Maitribodh-API/src/modules/visits/visits.routes.js).

| Method | Path | Access | Input | Success |
|---|---|---|---|---|
| POST | `/api/v1/visits` | VISIT | `personId`, `checkinGateId`, `checkinLocationId`; optional `categoryId`, `accompanyingCount`, `eventAcknowledged`, `device` | `201`, visit |
| POST | `/api/v1/visits/:visitId/check-outs` | VISIT | `checkoutGateId`, `checkoutLocationId`; optional `device` | `200`, closed visit |
| POST | `/api/v1/visits/:visitId/reconciliation` | ADMIN | Required `note` (1-500 chars) | `200`, administratively reconciled visit |

IDs in visit JSON bodies must be positive integer numbers. Visit workflows enforce person eligibility and open/closed state. There is no standalone GET visits endpoint; use reports and dashboard views.

Check-in enforces an Area `max_occupancy` cap against its locked current open occupancy plus the incoming person and accompanying count; over-cap requests return `409 AREA_CAPACITY_REACHED`.

Check-in independently enforces the participant event rule inside its transaction; it returns HTTP `409` with `EVENT_ACCESS_EXPIRED` when future access was not granted. For permitted post-event entry, the gate displays "EVENT COMPLETED - CONFIRM CHECK-IN" and requires the guard to check "I acknowledge that the event has ended and confirm this participant may check in" in addition to photo verification and any restricted-area acknowledgement. This checkbox resets on every person selection. The request must include boolean `eventAcknowledged: true`; missing or false acknowledgement returns HTTP `409` with `EVENT_ACKNOWLEDGEMENT_REQUIRED`. Acknowledgement cannot override denied future access. Permitted post-event entries return `eventWarning: true` and record `event_warning: true` and `event_acknowledged: true` in the check-in audit payload. No re-registration or QR regeneration is needed for permitted future entry.

### 8.12 Blacklist

Source: [blacklist routes](../Maitribodh-API/src/modules/blacklist/blacklist.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/blacklist` | ADMIN | Pagination | `200`, blacklist list |
| POST | `/api/v1/blacklist` | ADMIN | `personId`, `reasonId`, `remarks`; optional `startDate`, `endDate` | `201`, entry |
| POST | `/api/v1/blacklist/:blacklistId/lifts` | ADMIN | Required `liftNote` (1-500 chars) | `200`, lifted entry |

Dates must be valid ISO dates and end date cannot precede start date. Lifting retains history rather than deleting the row.

### 8.13 Reports

Source: [report routes](../Maitribodh-API/src/modules/reports/reports.routes.js).

| Method | Path | Access | Query filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/reports/visit-history` | REPORT | `fromDate`, `toDate`, `categoryId`, `locationId`, `search`, pagination | `200`, visit history |
| GET | `/api/v1/reports/registrations` | REPORT | `fromDate`, `toDate` (registration date), `categoryId`, `status`, `search`, pagination | `200`, registration report |
| GET | `/api/v1/reports/occupancy` | REPORT | `fromDate`, `toDate`, `search`, pagination | `200`, occupancy report |
| GET | `/api/v1/reports/staff` | REPORT | `name`, `jobRole`, `search`, pagination | `200`, staff report |
| GET | `/api/v1/reports/approvals` | REPORT | `fromDate`, `toDate`, `user`, `search`, pagination | `200`, approval report |
| GET | `/api/v1/reports/blacklist` | REPORT | `name`, `category`, `search`, pagination | `200`, blacklist report |
| GET | `/api/v1/reports/{report}/export` | REPORT | Same filters as the report, no pagination | `200`, XLSX attachment; Visit History export activity recorded |
| GET | `/api/v1/reports/analytics` | REPORT | `tab` plus the same filters as that tab's report | `200`, KPI cards and chart data |
| GET | `/api/v1/reports/options` | REPORT | None | `200`, categories and locations for report filters |

Registration report statuses: `PENDING`, `ACTIVE`, `REJECTED`, `DEACTIVATED`. Date ranges reject `fromDate > toDate`. Exports do not use pagination.

`search` matches one person by exact person code, exact mobile number, or part of the name. Analytics apply the same filters as the table, so KPIs and charts describe only the matching people. Analytics default to the last 14 IST days. Staff and Blacklist tables are rosters; their date range applies only to the charts. Occupancy charts show the selected end date and are live when that date is today. Gate lookups record matched and blocked person IDs, so per-person blocked-attempt and screening counts start from lookups made after this change.

### 8.14 Dashboard

Source: [dashboard routes](../Maitribodh-API/src/modules/dashboard/dashboard.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/dashboard` | AUTHENTICATED | None | `200`, counts, check-in trend, category mix, recent activity, security alerts |
| GET | `/api/v1/dashboard/inside` | AUTHENTICATED | Pagination | `200`, current inside-person view |

### 8.15 Notifications and audit

Source: [activity routes](../Maitribodh-API/src/modules/activity/activity.routes.js).

| Method | Path | Access | Input / filters | Success |
|---|---|---|---|---|
| GET | `/api/v1/notifications` | AUTHENTICATED | None | `200`, `{ "items": [...], "unreadCount": n }`; latest 100 notifications |
| POST | `/api/v1/notifications/read` | AUTHENTICATED | No required body | `200`, `{ "unreadCount": 0 }`; marks all current-user unread notifications read |
| GET | `/api/v1/audit` | ADMIN | `query`, `userId`, `action`, `personId`, pagination | `200`, paginated activity plus `actions` and `users` filter options |
| DELETE | `/api/v1/audit` | ADMIN | `auditIds` for selected records, or `allMatching` with audit filters | `200`, deleted count |
| DELETE | `/api/v1/audit/:auditId` | ADMIN | Audit ID | `200`, deleted count |

Notification operations do not accept another user's ID. Audit search includes module/action/entity identifiers, actor username, and related person name/mobile.

## 9. Request and response examples

All values below are synthetic placeholders. Obtain actual IDs from the target environment.

### 9.1 Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "username": "example.operator",
  "password": "<PASSWORD>"
}
```

Illustrative response:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "user": {
    "id": "123",
    "role": "REG_OFFICER"
  },
  "mustChangePassword": false
}
```

### 9.2 Register a visitor

```http
POST /api/v1/persons
Authorization: Bearer <JWT>
Content-Type: multipart/form-data; boundary=<CLIENT_GENERATED_BOUNDARY>
```

Multipart fields:

- `metadata`: the JSON below encoded as a text field.
- `photo`: a valid JPG or PNG file, at most 2 MiB.
- `documents`: optional repeated document file fields.

```json
{
  "categoryId": 2,
  "firstName": "Example",
  "lastName": "Visitor",
  "mobile": "9876543210",
  "gender": "OTHER",
  "residentStatus": "RESIDENT",
  "categoryDetails": {
    "purpose": "Scheduled visit",
    "visit_date": "2026-10-13"
  },
  "consent": true,
  "source": "MANUAL",
  "locationIds": [],
  "accompanyingCount": 0
}
```

`categoryId=2` is illustrative, not a guaranteed Visitor ID. Let the HTTP client generate the multipart boundary.

Illustrative response:

```json
{
  "person_id": "123",
  "person_code": "MB-000123",
  "status": "ACTIVE",
  "qr_version": 1
}
```

### 9.3 Approval decision

```http
POST /api/v1/approvals/123/decisions
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "decision": "REJECT",
  "reason": "Required details need correction."
}
```

### 9.4 Check-in and checkout

```http
POST /api/v1/visits
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "personId": 123,
  "checkinGateId": 1,
  "checkinLocationId": 4,
  "device": "gate-terminal"
}
```

Use the returned visit ID for checkout:

```http
POST /api/v1/visits/456/check-outs
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "checkoutGateId": 1,
  "checkoutLocationId": 4,
  "device": "gate-terminal"
}
```

### 9.5 Search and report requests

```http
GET /api/v1/persons?q=Example&status=ACTIVE&page=1&pageSize=20
Authorization: Bearer <JWT>
```

```http
GET /api/v1/reports/visit-history?fromDate=2026-10-01&toDate=2026-10-13&page=1&pageSize=20
Authorization: Bearer <JWT>
```

## 10. Database verification and deployment checklist

### 10.1 Confirm the actual target

Run these read-only SQL checks through an approved PostgreSQL connection:

```sql
SELECT current_database(), current_user, version();

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('mams', 'public')
ORDER BY schema_name;

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND (
    table_schema = 'mams'
    OR (table_schema = 'public' AND table_name = 'schema_migrations')
  )
ORDER BY table_schema, table_name;

SELECT migration_name, checksum, applied_at
FROM public.schema_migrations
ORDER BY migration_name;
```

On a fresh database with exactly these migrations, expect 12 `mams` tables and the migration-tracking table. Other deployment-owned tables may also exist.

Inspect detailed columns and indexes:

```sql
SELECT table_name, column_name, data_type, is_nullable,
       column_default, is_identity, is_generated, generation_expression
FROM information_schema.columns
WHERE table_schema = 'mams'
ORDER BY table_name, ordinal_position;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'mams'
ORDER BY tablename, indexname;

SELECT ssl, version, cipher
FROM pg_stat_ssl
WHERE pid = pg_backend_pid();
```

The final query checks TLS for that SQL session. Also verify the actual API connection, rather than assuming an administrative connection proves the API configuration.

### 10.2 Production checklist

- [ ] RDS PostgreSQL instance and intended database exist.
- [ ] API host can reach the private endpoint on port 5432.
- [ ] TLS certificate chain and hostname validation succeed.
- [ ] Migration and runtime database roles have appropriate, separate privileges.
- [ ] All seven migration entries are present with matching checksums.
- [ ] Production secrets are securely injected; no credentials are in source control.
- [ ] Initial Super Admin is created through an approved production bootstrap procedure.
- [ ] Required operational master data is reviewed, including departments, ID proof types, blacklist reasons, and program batches.
- [ ] Registration, approval, QR, check-in, checkout, and reporting are smoke-tested.
- [ ] Private photo/document storage is backed up and accessible to the API.
- [ ] Existing-data migration preserves application data and migration history.
- [ ] Backup restore and cutover/rollback procedures are tested.
- [ ] A database-aware readiness check is provided; `/health` alone is insufficient.
- [ ] Connection capacity considers 10 pooled connections per API process plus migrations and administration.

### 10.3 Current implementation boundaries

- Local seed, reset, and Super Admin bootstrap tools are development-only and intentionally reject production/non-local targets. Do not remove their guards to deploy.
- A fresh RDS database needs an approved production administrator bootstrap; the existing local helper is not that process.
- The `bulk_upload` table and permission flags exist, but there is no mounted bulk-upload API.
- File storage is private local disk, not S3; moving PostgreSQL to RDS does not move uploaded files.
- Secrets Manager fetching, IAM database authentication, and RDS Proxy integration are not implemented by this document or the current shared database configuration.
- Table existence does not imply every column has a corresponding API input. Guardian fields, accompanying-person arrays, and bulk-upload records have schema support beyond the documented registration request.
- This reference is not an OpenAPI specification. Route code, validators, services, and migrations remain authoritative when behavior changes.
