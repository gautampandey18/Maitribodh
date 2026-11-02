ALTER TABLE mams.app_user ADD COLUMN roles varchar(20)[];
UPDATE mams.app_user SET roles = ARRAY[role];

-- Keep the representative role deterministic for legacy scripts and audit records.
-- SUPER_ADMIN always comes first, preserving the existing one-Super-Admin index.
CREATE FUNCTION mams.normalize_user_roles() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    ordered_roles varchar(20)[];
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.roles IS NULL THEN NEW.roles := ARRAY[NEW.role]; END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role AND NEW.roles IS NOT DISTINCT FROM OLD.roles THEN
        NEW.roles := ARRAY[NEW.role];
    END IF;

    IF NEW.roles IS NULL OR cardinality(NEW.roles) = 0
       OR array_position(NEW.roles, NULL) IS NOT NULL
       OR NOT NEW.roles <@ ARRAY['SUPER_ADMIN','ADMIN','APPROVER','REG_OFFICER','SECURITY_GUARD','VIEWER']::varchar[] THEN
        RAISE EXCEPTION 'At least one valid user role is required' USING ERRCODE = '23514';
    END IF;

    SELECT array_agg(value ORDER BY priority)
      INTO ordered_roles
      FROM unnest(ARRAY['SUPER_ADMIN','ADMIN','APPROVER','REG_OFFICER','SECURITY_GUARD','VIEWER']::varchar[])
           WITH ORDINALITY AS allowed(value, priority)
     WHERE value = ANY(NEW.roles);

    NEW.roles := ordered_roles;
    NEW.role := ordered_roles[1];
    RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_user_roles
BEFORE INSERT OR UPDATE OF role, roles ON mams.app_user
FOR EACH ROW EXECUTE FUNCTION mams.normalize_user_roles();

ALTER TABLE mams.app_user ALTER COLUMN roles SET NOT NULL;
ALTER TABLE mams.app_user ADD CONSTRAINT ck_app_user_roles CHECK (
    cardinality(roles) > 0
    AND roles <@ ARRAY['SUPER_ADMIN','ADMIN','APPROVER','REG_OFFICER','SECURITY_GUARD','VIEWER']::varchar[]
    AND array_position(roles, NULL) IS NULL
    AND role = roles[1]
);
