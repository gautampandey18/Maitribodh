-- Allow audit log entries to be deleted by authorized administrators
DROP TRIGGER IF EXISTS audit_append_only ON mams.audit_log;

