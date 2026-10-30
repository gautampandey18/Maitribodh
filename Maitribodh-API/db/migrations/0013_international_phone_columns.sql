ALTER TABLE mams.app_user
    ALTER COLUMN mobile TYPE varchar(16);

ALTER TABLE mams.person
    ALTER COLUMN alternate_mobile TYPE varchar(16);

ALTER TABLE mams.person
    ALTER COLUMN emergency_contact_mobile TYPE varchar(16);

ALTER TABLE mams.person
    ALTER COLUMN guardian_mobile TYPE varchar(16);

