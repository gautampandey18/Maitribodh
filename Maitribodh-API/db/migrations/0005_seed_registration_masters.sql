SET search_path = mams;

ALTER TABLE category ADD COLUMN IF NOT EXISTS icon varchar(50) NOT NULL DEFAULT 'fa-user';
ALTER TABLE category ADD COLUMN IF NOT EXISTS description varchar(300) NOT NULL DEFAULT '';

INSERT INTO lookup_value (lookup_type, name) VALUES
  ('PERMISSION_LEVEL', 'Access level to confirm'),
  ('DEPARTMENT', 'Gurukul'),
  ('DEPARTMENT', 'Goushala'),
  ('DEPARTMENT', 'Accounts'),
  ('DEPARTMENT', 'Housekeeping'),
  ('DEPARTMENT', 'Security'),
  ('ID_PROOF_TYPE', 'Aadhaar Card'),
  ('ID_PROOF_TYPE', 'PAN Card'),
  ('ID_PROOF_TYPE', 'Driving Licence'),
  ('ID_PROOF_TYPE', 'Voter ID'),
  ('ID_PROOF_TYPE', 'Passport'),
  ('BLACKLIST_REASON', 'Repeated policy violation')
ON CONFLICT DO NOTHING;

UPDATE category AS current
   SET icon = seed.icon,
       description = seed.description,
       permission_level_id = COALESCE(current.permission_level_id, levels.lookup_id)
  FROM (VALUES
    ('Staff', 'fa-user-tie', 'Ashram employees & functional staff'),
    ('Visitor', 'fa-user', 'General visitors, walk-ins, family visitors and devotees'),
    ('Vendor', 'fa-box', 'External supplier of goods/services'),
    ('Contractor', 'fa-screwdriver-wrench', 'External party doing contract work'),
    ('Participant', 'fa-graduation-cap', 'Joining an ashram program or course'),
    ('Parivar Member', 'fa-hands-praying', 'Registered ashram member')
  ) AS seed(name, icon, description)
  JOIN lookup_value AS levels ON levels.lookup_type = 'PERMISSION_LEVEL' AND levels.name = 'Access level to confirm'
 WHERE lower(current.name) = lower(seed.name)
   AND current.description = '' AND current.icon = 'fa-user';

INSERT INTO lookup_value (lookup_type, name, parent_id)
SELECT 'JOB_ROLE', roles.name, departments.lookup_id
FROM (VALUES
  ('Gurukul', 'Teacher'), ('Gurukul', 'Admin'), ('Gurukul', 'Helper'),
  ('Gurukul', 'Guard'), ('Gurukul', 'Driver'),
  ('Goushala', 'Supervisor'), ('Goushala', 'Worker'),
  ('Housekeeping', 'Housekeeper'), ('Housekeeping', 'Gardener'),
  ('Security', 'Guard'), ('Security', 'Head of Security')
) AS roles(department_name, name)
JOIN lookup_value AS departments
  ON departments.lookup_type = 'DEPARTMENT' AND departments.name = roles.department_name
ON CONFLICT DO NOTHING;

INSERT INTO category (name, form_type, approval_required, overstay_cutoff, permission_level_id, icon, description)
SELECT seed.name, seed.form_type, seed.approval_required, seed.overstay_cutoff, levels.lookup_id, seed.icon, seed.description
FROM (VALUES
  ('Staff', 'STAFF', true, null::time, 'fa-user-tie', 'Ashram employees & functional staff'),
  ('Visitor', 'VISITOR', false, '22:00'::time, 'fa-user', 'General visitors, walk-ins, family visitors and devotees'),
  ('Vendor', 'VENDOR', false, null::time, 'fa-box', 'External supplier of goods/services'),
  ('Contractor', 'CONTRACTOR', false, '22:00'::time, 'fa-screwdriver-wrench', 'External party doing contract work'),
  ('Participant', 'PARTICIPANT', false, null::time, 'fa-graduation-cap', 'Joining an ashram program or course'),
  ('Parivar Member', 'PARIVAR', true, null::time, 'fa-hands-praying', 'Registered ashram member')
) AS seed(name, form_type, approval_required, overstay_cutoff, icon, description)
JOIN lookup_value AS levels
  ON levels.lookup_type = 'PERMISSION_LEVEL' AND levels.name = 'Access level to confirm'
ON CONFLICT DO NOTHING;

INSERT INTO lookup_value (lookup_type, name, category_id)
SELECT 'SUBCATEGORY', subcategory.name, categories.category_id
FROM (VALUES ('Sevak'), ('Matri')) AS subcategory(name)
JOIN category AS categories ON categories.name = 'Parivar Member'
ON CONFLICT DO NOTHING;

INSERT INTO location (name, location_type, is_restricted, department_id)
SELECT seed.name, seed.location_type, seed.is_restricted, departments.lookup_id
FROM (VALUES
  ('Main Gate', 'GATE', false, null::text),
  ('Goushala Gate', 'GATE', false, null::text),
  ('Kitchen', 'AREA', true, null::text),
  ('Goushala', 'AREA', false, null::text),
  ('Hostel', 'AREA', false, null::text),
  ('Admin Office', 'AREA', true, null::text),
  ('Gurukul', 'AREA', true, 'Gurukul')
) AS seed(name, location_type, is_restricted, department_name)
LEFT JOIN lookup_value AS departments
  ON departments.lookup_type = 'DEPARTMENT' AND departments.name = seed.department_name
ON CONFLICT DO NOTHING;
