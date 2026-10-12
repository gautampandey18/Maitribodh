CREATE SCHEMA IF NOT EXISTS mams;
SET search_path = mams;

CREATE TABLE app_user (
    user_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    mobile varchar(10) NOT NULL UNIQUE,
    email varchar(150),
    username varchar(50) NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'APPROVER', 'REG_OFFICER', 'SECURITY_GUARD', 'VIEWER')),
    is_security_head boolean NOT NULL DEFAULT false,
    can_bulk_upload boolean NOT NULL DEFAULT false,
    status varchar(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    password_hash varchar(100),
    failed_login_count smallint NOT NULL DEFAULT 0,
    locked_until timestamptz,
    token_version integer NOT NULL DEFAULT 0,
    last_login_at timestamptz,
    created_by bigint REFERENCES app_user(user_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_app_user_username ON app_user (lower(username));
CREATE UNIQUE INDEX ux_app_user_email ON app_user (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX ux_app_user_one_super_admin ON app_user (role) WHERE role = 'SUPER_ADMIN';

CREATE TABLE lookup_value (
    lookup_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lookup_type varchar(30) NOT NULL CHECK (lookup_type IN ('DEPARTMENT', 'JOB_ROLE', 'SUBCATEGORY', 'PROGRAM_BATCH', 'ID_PROOF_TYPE', 'BLACKLIST_REASON', 'PERMISSION_LEVEL')),
    name varchar(100) NOT NULL,
    parent_id integer REFERENCES lookup_value(lookup_id),
    category_id smallint,
    extra jsonb NOT NULL DEFAULT '{}',
    status varchar(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_lookup_name ON lookup_value
    (lookup_type, COALESCE(parent_id, 0), COALESCE(category_id, 0), lower(name));

CREATE TABLE category (
    category_id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(50) NOT NULL,
    form_type varchar(20) NOT NULL DEFAULT 'GENERIC' CHECK (form_type IN ('STAFF', 'PARIVAR', 'VISITOR', 'VENDOR', 'CONTRACTOR', 'PARTICIPANT', 'GENERIC')),
    approval_required boolean NOT NULL DEFAULT false,
    overstay_cutoff time,
    permission_level_id integer REFERENCES lookup_value(lookup_id),
    is_broad boolean NOT NULL DEFAULT false,
    broad_category_id smallint REFERENCES category(category_id),
    status varchar(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_category_name ON category (lower(name));
ALTER TABLE lookup_value ADD CONSTRAINT fk_lookup_category FOREIGN KEY (category_id) REFERENCES category(category_id);

CREATE TABLE location (
    location_id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(100) NOT NULL,
    location_type varchar(10) NOT NULL CHECK (location_type IN ('GATE', 'AREA')),
    is_restricted boolean NOT NULL DEFAULT false,
    department_id integer REFERENCES lookup_value(lookup_id),
    status varchar(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (location_type = 'AREA' OR is_restricted = false)
);
CREATE UNIQUE INDEX ux_location_name ON location (lower(name));

CREATE TABLE bulk_upload (
    bulk_upload_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_name varchar(255) NOT NULL,
    file_key varchar(300) NOT NULL,
    status varchar(15) NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    total_rows integer NOT NULL DEFAULT 0,
    success_rows integer NOT NULL DEFAULT 0,
    error_rows integer NOT NULL DEFAULT 0,
    errors jsonb NOT NULL DEFAULT '[]',
    uploaded_by bigint NOT NULL REFERENCES app_user(user_id),
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE TABLE person (
    person_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_code varchar(12) GENERATED ALWAYS AS ('MB-' || lpad(person_id::text, 6, '0')) STORED UNIQUE,
    category_id smallint NOT NULL REFERENCES category(category_id),
    subcategory_id integer REFERENCES lookup_value(lookup_id),
    first_name varchar(100),
    last_name varchar(100),
    mobile varchar(10),
    alternate_mobile varchar(10),
    gender varchar(6) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    date_of_birth date,
    resident_status varchar(12) NOT NULL DEFAULT 'RESIDENT' CHECK (resident_status IN ('RESIDENT', 'NON_RESIDENT')),
    passport_number_enc text,
    passport_last4 varchar(4),
    address varchar(500),
    email varchar(150),
    photo_key varchar(300),
    id_proof_type_id integer REFERENCES lookup_value(lookup_id),
    id_proof_number_enc text,
    id_proof_last4 varchar(4),
    emergency_contact_name varchar(100),
    emergency_contact_mobile varchar(10),
    permission_level_id integer REFERENCES lookup_value(lookup_id),
    category_details jsonb NOT NULL DEFAULT '{}',
    accompanying jsonb NOT NULL DEFAULT '[]',
    accompanying_count smallint NOT NULL DEFAULT 0,
    documents jsonb NOT NULL DEFAULT '[]',
    remarks varchar(500),
    status varchar(12) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED')),
    source varchar(12) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'BULK_UPLOAD', 'WALK_IN')),
    bulk_upload_id bigint REFERENCES bulk_upload(bulk_upload_id),
    qr_version integer NOT NULL DEFAULT 0,
    deactivated_reason varchar(300),
    consent_at timestamptz,
    consent_notice_version varchar(50),
    consent_captured_by bigint REFERENCES app_user(user_id),
    guardian_name varchar(100),
    guardian_mobile varchar(10),
    guardian_consent_at timestamptz,
    guardian_consent_notice_version varchar(50),
    registered_by bigint NOT NULL REFERENCES app_user(user_id),
    approved_by bigint REFERENCES app_user(user_id),
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_by bigint REFERENCES app_user(user_id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_person_complete CHECK (status = 'DRAFT' OR
        (first_name IS NOT NULL AND last_name IS NOT NULL AND mobile IS NOT NULL
         AND gender IS NOT NULL AND photo_key IS NOT NULL)),
    CONSTRAINT ck_person_passport CHECK (
        (resident_status = 'RESIDENT' AND passport_number_enc IS NULL) OR
        (resident_status = 'NON_RESIDENT' AND (status = 'DRAFT' OR passport_number_enc IS NOT NULL))),
    CONSTRAINT ck_person_consent_fields CHECK (
        (consent_at IS NULL AND consent_notice_version IS NULL AND consent_captured_by IS NULL) OR
        (consent_at IS NOT NULL AND consent_notice_version IS NOT NULL AND consent_captured_by IS NOT NULL)),
    CONSTRAINT ck_person_registration_consent CHECK (
        status = 'DRAFT' OR source = 'BULK_UPLOAD' OR
        (consent_at IS NOT NULL AND consent_notice_version IS NOT NULL AND consent_captured_by IS NOT NULL)),
    CONSTRAINT ck_person_guardian_consent CHECK (
        (guardian_name IS NULL AND guardian_mobile IS NULL AND guardian_consent_at IS NULL AND guardian_consent_notice_version IS NULL) OR
        (guardian_name IS NOT NULL AND guardian_mobile IS NOT NULL AND guardian_consent_at IS NOT NULL AND guardian_consent_notice_version IS NOT NULL))
);
CREATE INDEX ix_person_mobile ON person (mobile);
CREATE INDEX ix_person_status ON person (status, category_id);
CREATE INDEX ix_person_name ON person (lower(first_name || ' ' || last_name));
CREATE INDEX ix_person_created ON person (created_at);

CREATE TABLE person_location (
    person_id bigint NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    location_id smallint NOT NULL REFERENCES location(location_id),
    assigned_by bigint REFERENCES app_user(user_id),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (person_id, location_id)
);

CREATE TABLE approval_history (
    approval_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id bigint NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    action varchar(12) NOT NULL CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMITTED')),
    reason varchar(500),
    acted_by bigint NOT NULL REFERENCES app_user(user_id),
    acted_at timestamptz NOT NULL DEFAULT now(),
    CHECK (action <> 'REJECTED' OR length(COALESCE(reason, '')) >= 10)
);
CREATE INDEX ix_approval_person ON approval_history (person_id);

CREATE TABLE blacklist (
    blacklist_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id bigint NOT NULL REFERENCES person(person_id),
    reason_id integer NOT NULL REFERENCES lookup_value(lookup_id),
    remarks varchar(500) NOT NULL,
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    end_date date,
    added_by bigint NOT NULL REFERENCES app_user(user_id),
    added_at timestamptz NOT NULL DEFAULT now(),
    lifted_by bigint REFERENCES app_user(user_id),
    lifted_at timestamptz,
    lift_note varchar(500),
    CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE UNIQUE INDEX ux_blacklist_one_open ON blacklist (person_id) WHERE lifted_at IS NULL;

CREATE TABLE visit (
    visit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id bigint NOT NULL REFERENCES person(person_id),
    status varchar(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CLOSED_BY_ADMIN')),
    checkin_at timestamptz NOT NULL DEFAULT now(),
    checkin_gate_id smallint NOT NULL REFERENCES location(location_id),
    checkin_location_id smallint NOT NULL REFERENCES location(location_id),
    checkin_by bigint NOT NULL REFERENCES app_user(user_id),
    checkin_device varchar(100),
    accompanying_count smallint NOT NULL DEFAULT 0,
    accompanying_names jsonb NOT NULL DEFAULT '[]',
    location_override boolean NOT NULL DEFAULT false,
    checkout_at timestamptz,
    checkout_gate_id smallint REFERENCES location(location_id),
    checkout_location_id smallint REFERENCES location(location_id),
    checkout_by bigint REFERENCES app_user(user_id),
    checkout_device varchar(100),
    admin_note varchar(500),
    overstay_alerted_at timestamptz,
    CHECK (status = 'OPEN' OR checkout_at IS NOT NULL),
    CHECK (status <> 'CLOSED_BY_ADMIN' OR admin_note IS NOT NULL),
    CHECK (checkout_at IS NULL OR checkout_at >= checkin_at)
);
CREATE UNIQUE INDEX ux_visit_one_open ON visit (person_id) WHERE status = 'OPEN';
CREATE INDEX ix_visit_checkin ON visit (checkin_at);
CREATE INDEX ix_visit_checkout ON visit (checkout_at);

CREATE TABLE notification (
    notification_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES app_user(user_id),
    type varchar(40) NOT NULL,
    title varchar(150) NOT NULL,
    body varchar(500),
    entity_type varchar(30),
    entity_id bigint,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_notification_user ON notification (user_id, is_read, created_at);

CREATE TABLE audit_log (
    audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    user_id bigint REFERENCES app_user(user_id),
    user_role varchar(20),
    module varchar(30) NOT NULL,
    activity varchar(60) NOT NULL,
    entity_type varchar(30),
    entity_id bigint,
    old_value jsonb,
    new_value jsonb,
    ip_address varchar(45),
    device varchar(100)
);
CREATE INDEX ix_audit_time ON audit_log (occurred_at);
CREATE INDEX ix_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX ix_audit_user ON audit_log (user_id, occurred_at);