ALTER TABLE mams.person DROP CONSTRAINT ck_person_complete;
ALTER TABLE mams.person ADD CONSTRAINT ck_person_complete CHECK (status = 'DRAFT' OR
    (first_name IS NOT NULL AND last_name IS NOT NULL AND mobile IS NOT NULL AND gender IS NOT NULL));