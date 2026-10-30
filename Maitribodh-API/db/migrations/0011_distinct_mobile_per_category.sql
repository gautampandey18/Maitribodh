CREATE UNIQUE INDEX IF NOT EXISTS ux_person_mobile_category
ON mams.person (mobile, category_id)
WHERE mobile IS NOT NULL AND status IN ('ACTIVE', 'PENDING', 'DEACTIVATED');
