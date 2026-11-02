-- Migration: 0014_independent_user_lifecycle.sql
-- Ensure operational records (persons, visits, approvals, blacklist) remain fully functional and active
-- when administrative accounts (Admin, Approver, Super Admin) are deleted.

-- 1. Drop NOT NULL constraints on columns referencing app_user so records can be detached upon user deletion
ALTER TABLE mams.person ALTER COLUMN registered_by DROP NOT NULL;
ALTER TABLE mams.visit ALTER COLUMN checkin_by DROP NOT NULL;
ALTER TABLE mams.approval_history ALTER COLUMN acted_by DROP NOT NULL;
ALTER TABLE mams.blacklist ALTER COLUMN added_by DROP NOT NULL;
ALTER TABLE mams.bulk_upload ALTER COLUMN uploaded_by DROP NOT NULL;

-- 2. Relax consent check constraints on person to allow consent_captured_by to be detached when user is deleted
ALTER TABLE mams.person DROP CONSTRAINT IF EXISTS ck_person_consent_fields;
ALTER TABLE mams.person ADD CONSTRAINT ck_person_consent_fields CHECK (
    (consent_at IS NULL AND consent_notice_version IS NULL AND consent_captured_by IS NULL) OR
    (consent_at IS NOT NULL AND consent_notice_version IS NOT NULL)
);

ALTER TABLE mams.person DROP CONSTRAINT IF EXISTS ck_person_registration_consent;
ALTER TABLE mams.person ADD CONSTRAINT ck_person_registration_consent CHECK (
    status = 'DRAFT' OR source = 'BULK_UPLOAD' OR
    (consent_at IS NOT NULL AND consent_notice_version IS NOT NULL)
);

-- 3. Drop existing foreign keys referencing mams.app_user(user_id)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
           AND tc.table_schema = ccu.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND ccu.table_schema = 'mams'
           AND ccu.table_name = 'app_user'
           AND ccu.column_name = 'user_id'
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', r.table_schema, r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 4. Re-add foreign keys with ON DELETE SET NULL (and ON DELETE CASCADE for notifications)
ALTER TABLE mams.notification
    ADD CONSTRAINT notification_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES mams.app_user(user_id) ON DELETE CASCADE;

ALTER TABLE mams.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.person
    ADD CONSTRAINT person_registered_by_fkey
        FOREIGN KEY (registered_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL,
    ADD CONSTRAINT person_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL,
    ADD CONSTRAINT person_consent_captured_by_fkey
        FOREIGN KEY (consent_captured_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL,
    ADD CONSTRAINT person_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.person_location
    ADD CONSTRAINT person_location_assigned_by_fkey
        FOREIGN KEY (assigned_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.approval_history
    ADD CONSTRAINT approval_history_acted_by_fkey
        FOREIGN KEY (acted_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.visit
    ADD CONSTRAINT visit_checkin_by_fkey
        FOREIGN KEY (checkin_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL,
    ADD CONSTRAINT visit_checkout_by_fkey
        FOREIGN KEY (checkout_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.blacklist
    ADD CONSTRAINT blacklist_added_by_fkey
        FOREIGN KEY (added_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL,
    ADD CONSTRAINT blacklist_lifted_by_fkey
        FOREIGN KEY (lifted_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.bulk_upload
    ADD CONSTRAINT bulk_upload_uploaded_by_fkey
        FOREIGN KEY (uploaded_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;

ALTER TABLE mams.app_user
    ADD CONSTRAINT app_user_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES mams.app_user(user_id) ON DELETE SET NULL;
