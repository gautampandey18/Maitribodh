-- =============================================================================
-- MAMS - Seed data (values marked SAMPLE to be replaced with the Ashram's lists)
-- =============================================================================
SET search_path = mams;

-- Permission levels (SAMPLE, final list open: OI-18)
INSERT INTO lookup_value (lookup_type, name, extra) VALUES
 ('PERMISSION_LEVEL', 'General',          '{"note": "open areas only"}'),
 ('PERMISSION_LEVEL', 'Department areas', '{"note": "open areas + areas of own department"}'),
 ('PERMISSION_LEVEL', 'All areas',        '{"note": "open and restricted areas"}');

-- Departments and job roles
INSERT INTO lookup_value (lookup_type, name) VALUES
 ('DEPARTMENT', 'Gurukul'), ('DEPARTMENT', 'Goushala'), ('DEPARTMENT', 'Accounts'),
 ('DEPARTMENT', 'Security'), ('DEPARTMENT', 'Housekeeping');
INSERT INTO lookup_value (lookup_type, name, parent_id)
SELECT 'JOB_ROLE', j.role, d.lookup_id
  FROM (VALUES ('Gurukul','Teacher'), ('Gurukul','Supervisor'), ('Goushala','Supervisor'), ('Accounts','Accountant'),
               ('Security','Guard'), ('Security','Driver'), ('Housekeeping','Housekeeper'), ('Housekeeping','Gardener')) j(dep, role)
  JOIN lookup_value d ON d.lookup_type = 'DEPARTMENT' AND d.name = j.dep;

-- ID proof types and blacklist reasons
INSERT INTO lookup_value (lookup_type, name, extra) VALUES
 ('ID_PROOF_TYPE', 'Aadhaar',         '{"pattern": "^[0-9]{12}$"}'),
 ('ID_PROOF_TYPE', 'PAN',             '{"pattern": "^[A-Z]{5}[0-9]{4}[A-Z]$"}'),
 ('ID_PROOF_TYPE', 'Driving Licence', '{}'),
 ('ID_PROOF_TYPE', 'Voter ID',        '{"pattern": "^[A-Z]{3}[0-9]{7}$"}'),
 ('ID_PROOF_TYPE', 'Passport',        '{"pattern": "^[A-Z][0-9]{7}$"}'),
 ('BLACKLIST_REASON', 'Misconduct', '{}'), ('BLACKLIST_REASON', 'Security concern', '{}');   -- SAMPLE

-- Categories (seed + broad categories)
INSERT INTO category (name, form_type, approval_required, overstay_cutoff, is_broad, permission_level_id)
SELECT c.name, c.form, c.appr, c.cutoff::time, c.broad, p.lookup_id
  FROM (VALUES ('Staff',          'STAFF',       true,  NULL,    false, 'Department areas'),
               ('Parivar Member', 'PARIVAR',     true,  NULL,    false, 'General'),
               ('Visitor',        'VISITOR',     false, '22:00', true,  'General'),
               ('Vendor',         'VENDOR',      false, NULL,    false, 'General'),
               ('Contractor',     'CONTRACTOR',  false, '22:00', false, 'General'),
               ('Participant',    'PARTICIPANT', false, NULL,    false, 'General'),
               ('Volunteer',      'GENERIC',     false, NULL,    true,  'General'),
               ('Active Member',  'GENERIC',     false, NULL,    true,  'General')) c(name, form, appr, cutoff, broad, lvl)
  JOIN lookup_value p ON p.lookup_type = 'PERMISSION_LEVEL' AND p.name = c.lvl;

INSERT INTO lookup_value (lookup_type, name, category_id)
SELECT 'SUBCATEGORY', s, category_id FROM category, (VALUES ('Sevak'), ('Matri')) v(s) WHERE name = 'Parivar Member';

-- Gates and areas (SAMPLE except the names from the FRD)
INSERT INTO location (name, location_type, is_restricted, department_id) VALUES
 ('Main Gate',         'GATE', false, NULL),
 ('Gate 2',            'GATE', false, NULL),
 ('Main Campus',       'AREA', false, NULL),
 ('Goushala',          'AREA', false, NULL),
 ('Kitchen',           'AREA', true,  NULL),
 ('Offices',           'AREA', true,  NULL),
 ('Residential Areas', 'AREA', true,  NULL),
 ('School / Gurukul',  'AREA', true,  (SELECT lookup_id FROM lookup_value WHERE lookup_type = 'DEPARTMENT' AND name = 'Gurukul'));

-- First Super Admin: inserted by the IT team (no password; created at first login)
-- INSERT INTO app_user (first_name, last_name, mobile, username, role)
-- VALUES ('First', 'Last', '9XXXXXXXXX', 'superadmin', 'SUPER_ADMIN');
