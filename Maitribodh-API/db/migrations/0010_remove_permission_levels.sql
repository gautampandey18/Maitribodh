UPDATE mams.person AS person
SET category_details = person.category_details - ARRAY(
  SELECT field->>'key'
  FROM mams.category AS category
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(category.form_schema->'fields') = 'array' THEN category.form_schema->'fields' ELSE '[]'::jsonb END
  ) AS fields(field)
  WHERE category.category_id = person.category_id
    AND fields.field->>'source' = 'PERMISSION_LEVEL'
)
WHERE EXISTS (
  SELECT 1
  FROM mams.category AS category
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(category.form_schema->'fields', '[]'::jsonb)) AS field
  WHERE category.category_id = person.category_id
    AND field->>'source' = 'PERMISSION_LEVEL'
);

UPDATE mams.person AS person
SET draft_data = jsonb_set(
  person.draft_data - 'permissionLevelId',
  '{categoryDetails}',
  COALESCE(person.draft_data->'categoryDetails', '{}'::jsonb) - ARRAY(
    SELECT field->>'key'
    FROM mams.category AS category
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(category.form_schema->'fields') = 'array' THEN category.form_schema->'fields' ELSE '[]'::jsonb END
    ) AS fields(field)
    WHERE category.category_id = person.category_id
      AND fields.field->>'source' = 'PERMISSION_LEVEL'
  ),
  true
)
WHERE person.draft_data IS NOT NULL
  AND (person.draft_data ? 'permissionLevelId' OR EXISTS (
    SELECT 1
    FROM mams.category AS category
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(category.form_schema->'fields') = 'array' THEN category.form_schema->'fields' ELSE '[]'::jsonb END
    ) AS fields(field)
    WHERE category.category_id = person.category_id
      AND fields.field->>'source' = 'PERMISSION_LEVEL'
  ));

UPDATE mams.category AS category
SET form_schema = jsonb_set(
  category.form_schema,
  '{fields}',
  COALESCE((
    SELECT jsonb_agg(item.field ORDER BY item.position)
    FROM jsonb_array_elements(category.form_schema->'fields') WITH ORDINALITY AS item(field, position)
    WHERE item.field->>'source' IS DISTINCT FROM 'PERMISSION_LEVEL'
  ), '[]'::jsonb),
  true
)
WHERE jsonb_typeof(category.form_schema->'fields') = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(category.form_schema->'fields') = 'array' THEN category.form_schema->'fields' ELSE '[]'::jsonb END
    ) AS item(field)
    WHERE item.field->>'source' = 'PERMISSION_LEVEL'
  );

ALTER TABLE mams.category DROP COLUMN IF EXISTS permission_level_id;
ALTER TABLE mams.person DROP COLUMN IF EXISTS permission_level_id;

UPDATE mams.person
SET subcategory_id = NULL
WHERE subcategory_id IN (SELECT lookup_id FROM mams.lookup_value WHERE lookup_type = 'PERMISSION_LEVEL');

UPDATE mams.person
SET id_proof_type_id = NULL
WHERE id_proof_type_id IN (SELECT lookup_id FROM mams.lookup_value WHERE lookup_type = 'PERMISSION_LEVEL');

UPDATE mams.location
SET department_id = NULL
WHERE department_id IN (SELECT lookup_id FROM mams.lookup_value WHERE lookup_type = 'PERMISSION_LEVEL');

UPDATE mams.lookup_value
SET parent_id = NULL
WHERE parent_id IN (SELECT lookup_id FROM mams.lookup_value WHERE lookup_type = 'PERMISSION_LEVEL');

DELETE FROM mams.lookup_value WHERE lookup_type = 'PERMISSION_LEVEL';

ALTER TABLE mams.lookup_value DROP CONSTRAINT IF EXISTS lookup_value_lookup_type_check;
ALTER TABLE mams.lookup_value ADD CONSTRAINT lookup_value_lookup_type_check
  CHECK (lookup_type IN ('DEPARTMENT', 'JOB_ROLE', 'SUBCATEGORY', 'PROGRAM_BATCH', 'ID_PROOF_TYPE', 'BLACKLIST_REASON'));