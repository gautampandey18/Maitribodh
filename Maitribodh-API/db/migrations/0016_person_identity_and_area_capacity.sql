CREATE TABLE mams.person_identity (
    identity_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mobile varchar(16) NOT NULL UNIQUE,
    qr_code varchar(12) UNIQUE,
    qr_version integer NOT NULL DEFAULT 1 CHECK (qr_version > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO mams.person_identity (mobile, qr_code, qr_version)
SELECT DISTINCT ON (mobile) mobile, person_code, GREATEST(qr_version, 1)
  FROM mams.person
 WHERE mobile IS NOT NULL
 ORDER BY mobile, (status = 'ACTIVE' AND qr_version > 0) DESC, created_at, person_id;

ALTER TABLE mams.person
    ADD COLUMN identity_id bigint REFERENCES mams.person_identity(identity_id);

UPDATE mams.person AS person
   SET identity_id = identity.identity_id
  FROM mams.person_identity AS identity
 WHERE identity.mobile = person.mobile;

DROP INDEX IF EXISTS mams.ux_person_mobile_category;
CREATE UNIQUE INDEX ux_person_identity_category
    ON mams.person (identity_id, category_id)
 WHERE identity_id IS NOT NULL AND status IN ('ACTIVE', 'PENDING', 'DEACTIVATED');

ALTER TABLE mams.location
    ADD COLUMN max_occupancy integer CHECK (max_occupancy IS NULL OR max_occupancy > 0);
