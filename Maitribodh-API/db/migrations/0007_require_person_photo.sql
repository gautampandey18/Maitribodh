ALTER TABLE mams.person
    ADD COLUMN photo_required boolean NOT NULL DEFAULT false;

ALTER TABLE mams.person
    ADD CONSTRAINT ck_person_photo_required
    CHECK (status = 'DRAFT' OR photo_key IS NOT NULL OR photo_required = false);

ALTER TABLE mams.person
    ALTER COLUMN photo_required SET DEFAULT true;