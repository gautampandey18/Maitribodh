ALTER TABLE mams.category ADD COLUMN form_schema jsonb NOT NULL DEFAULT '{}';
ALTER TABLE mams.category ALTER COLUMN approval_required DROP NOT NULL;
ALTER TABLE mams.person ADD COLUMN expires_on date;
ALTER TABLE mams.person ADD COLUMN draft_data jsonb;

CREATE OR REPLACE FUNCTION mams.prevent_audit_changes() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are append-only';
END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON mams.audit_log
FOR EACH ROW EXECUTE FUNCTION mams.prevent_audit_changes();