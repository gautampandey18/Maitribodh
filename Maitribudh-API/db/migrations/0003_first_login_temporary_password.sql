ALTER TABLE mams.app_user
    ADD COLUMN must_change_password boolean NOT NULL DEFAULT false,
    ADD COLUMN temporary_password_expires_at timestamptz,
    ADD COLUMN temporary_password_used_at timestamptz,
    ADD CONSTRAINT ck_app_user_temporary_password_state CHECK (
        (must_change_password = false
         AND temporary_password_expires_at IS NULL
         AND temporary_password_used_at IS NULL)
        OR
        (must_change_password = true
         AND password_hash IS NOT NULL
         AND temporary_password_expires_at IS NOT NULL)
    );

CREATE INDEX ix_app_user_temporary_password_expiry
    ON mams.app_user (temporary_password_expires_at)
    WHERE must_change_password = true;