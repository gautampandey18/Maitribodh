$ErrorActionPreference = 'Stop'

Write-Warning 'This permanently deletes every table and row in the local MAMS schema.'
Write-Host 'Target is fixed to PostgreSQL at 127.0.0.1:5432, database postgres.'
$confirmation = Read-Host 'Type RESET LOCAL MAMS DATA to continue'
if ($confirmation -cne 'RESET LOCAL MAMS DATA') {
    Write-Host 'Reset cancelled; no database changes were made.'
    exit 1
}

$sql = @'
BEGIN;
DROP SCHEMA IF EXISTS mams CASCADE;
DROP TABLE IF EXISTS public.schema_migrations;
COMMIT;
'@

$sql | & psql -X -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1
$resetExitCode = $LASTEXITCODE
if ($resetExitCode -ne 0) {
    Write-Error 'Database reset failed. Check the PostgreSQL output; do not assume the database is ready.'
}
exit $resetExitCode
