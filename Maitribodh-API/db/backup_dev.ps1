$ErrorActionPreference = 'Stop'
$backupPath = Join-Path $env:TEMP "mams-postgres-before-reset-$(Get-Date -Format yyyyMMdd-HHmmss).dump"

& pg_dump -h 127.0.0.1 -p 5432 -U postgres -d postgres -Fc -f $backupPath
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Backup saved to $backupPath"
