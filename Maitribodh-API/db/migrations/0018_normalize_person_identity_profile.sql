ALTER TABLE mams.person_identity
    ADD COLUMN first_name varchar(100),
    ADD COLUMN last_name varchar(100),
    ADD COLUMN alternate_mobile varchar(16),
    ADD COLUMN gender varchar(6) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    ADD COLUMN date_of_birth date,
    ADD COLUMN resident_status varchar(12) NOT NULL DEFAULT 'RESIDENT'
        CHECK (resident_status IN ('RESIDENT', 'NON_RESIDENT')),
    ADD COLUMN passport_number_enc text,
    ADD COLUMN passport_last4 varchar(4),
    ADD COLUMN address varchar(500),
    ADD COLUMN email varchar(150),
    ADD COLUMN photo_key varchar(300),
    ADD COLUMN id_proof_type_id integer REFERENCES mams.lookup_value(lookup_id),
    ADD COLUMN id_proof_number_enc text,
    ADD COLUMN id_proof_last4 varchar(4),
    ADD COLUMN emergency_contact_name varchar(100),
    ADD COLUMN emergency_contact_mobile varchar(16),
    ADD COLUMN documents jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN guardian_name varchar(100),
    ADD COLUMN guardian_mobile varchar(16),
    ADD COLUMN guardian_consent_at timestamptz,
    ADD COLUMN guardian_consent_notice_version varchar(50),
    ADD CONSTRAINT ck_person_identity_profile_complete CHECK (
        (first_name IS NULL AND last_name IS NULL) OR
        (first_name IS NOT NULL AND last_name IS NOT NULL)
    ),
    ADD CONSTRAINT ck_person_identity_guardian_consent CHECK (
        (guardian_name IS NULL AND guardian_mobile IS NULL
          AND guardian_consent_at IS NULL AND guardian_consent_notice_version IS NULL) OR
        (guardian_name IS NOT NULL AND guardian_mobile IS NOT NULL
          AND guardian_consent_at IS NOT NULL AND guardian_consent_notice_version IS NOT NULL)
    );

WITH chosen_profile AS (
    SELECT DISTINCT ON (identity_id)
           identity_id, first_name, last_name, alternate_mobile, gender,
           date_of_birth, resident_status, passport_number_enc, passport_last4,
           address, email, photo_key, id_proof_type_id, id_proof_number_enc,
           id_proof_last4, emergency_contact_name, emergency_contact_mobile,
           documents, guardian_name, guardian_mobile, guardian_consent_at,
           guardian_consent_notice_version
      FROM mams.person
     WHERE identity_id IS NOT NULL
     ORDER BY identity_id, (status = 'ACTIVE') DESC, (status <> 'DRAFT') DESC,
              updated_at DESC, created_at DESC, person_id DESC
)
UPDATE mams.person_identity AS identity
   SET first_name = profile.first_name,
       last_name = profile.last_name,
       alternate_mobile = profile.alternate_mobile,
       gender = profile.gender,
       date_of_birth = profile.date_of_birth,
       resident_status = profile.resident_status,
       passport_number_enc = profile.passport_number_enc,
       passport_last4 = profile.passport_last4,
       address = profile.address,
       email = profile.email,
       photo_key = profile.photo_key,
       id_proof_type_id = profile.id_proof_type_id,
       id_proof_number_enc = profile.id_proof_number_enc,
       id_proof_last4 = profile.id_proof_last4,
       emergency_contact_name = profile.emergency_contact_name,
       emergency_contact_mobile = profile.emergency_contact_mobile,
       documents = profile.documents,
       guardian_name = profile.guardian_name,
       guardian_mobile = profile.guardian_mobile,
       guardian_consent_at = profile.guardian_consent_at,
       guardian_consent_notice_version = profile.guardian_consent_notice_version
  FROM chosen_profile AS profile
 WHERE profile.identity_id = identity.identity_id;

CREATE SEQUENCE mams.person_code_seq;
SELECT setval(
    'mams.person_code_seq',
    GREATEST(COALESCE(max(substring(qr_code FROM 4)::bigint), 1), 1),
    max(substring(qr_code FROM 4)::bigint) IS NOT NULL
)
  FROM mams.person_identity
 WHERE qr_code ~ '^MB-[0-9]+$';

ALTER TABLE mams.person
    DROP CONSTRAINT IF EXISTS ck_person_complete,
    DROP CONSTRAINT IF EXISTS ck_person_passport,
    DROP CONSTRAINT IF EXISTS ck_person_guardian_consent,
    DROP CONSTRAINT IF EXISTS ck_person_mobile_e164;

DROP INDEX IF EXISTS mams.ix_person_mobile;
DROP INDEX IF EXISTS mams.ix_person_name;

ALTER TABLE mams.person
    DROP COLUMN person_code,
    DROP COLUMN first_name,
    DROP COLUMN last_name,
    DROP COLUMN mobile,
    DROP COLUMN alternate_mobile,
    DROP COLUMN gender,
    DROP COLUMN date_of_birth,
    DROP COLUMN resident_status,
    DROP COLUMN passport_number_enc,
    DROP COLUMN passport_last4,
    DROP COLUMN address,
    DROP COLUMN email,
    DROP COLUMN photo_key,
    DROP COLUMN id_proof_type_id,
    DROP COLUMN id_proof_number_enc,
    DROP COLUMN id_proof_last4,
    DROP COLUMN emergency_contact_name,
    DROP COLUMN emergency_contact_mobile,
    DROP COLUMN documents,
    DROP COLUMN guardian_name,
    DROP COLUMN guardian_mobile,
    DROP COLUMN guardian_consent_at,
    DROP COLUMN guardian_consent_notice_version,
    DROP COLUMN qr_version;
