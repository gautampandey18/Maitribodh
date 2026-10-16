ALTER TABLE mams.person
    ALTER COLUMN mobile TYPE varchar(16);

UPDATE mams.person
   SET mobile = '+91' || mobile
 WHERE mobile ~ '^[6-9][0-9]{9}$';

ALTER TABLE mams.person
    ADD CONSTRAINT ck_person_mobile_e164
    CHECK (mobile IS NULL OR mobile ~ '^\+[1-9][0-9]{7,14}$');
