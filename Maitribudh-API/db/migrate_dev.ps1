$ErrorActionPreference = 'Stop'
$dbSecure = $null
$dbPointer = [IntPtr]::Zero
$dbPassword = $null
$migrationExitCode = 0

try {
    $dbSecure = Read-Host -Prompt 'PostgreSQL database password for user postgres (masked)' -AsSecureString
    $dbPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPointer)
    $env:DATABASE_URL = "postgresql://postgres:$([uri]::EscapeDataString($dbPassword))@127.0.0.1:5432/postgres"

    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & npm run migrate
        $migrationExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
} catch {
    Write-Error $_.Exception.Message
    $migrationExitCode = 1
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    if ($dbPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPointer)
    }
    if ($dbSecure) { $dbSecure.Dispose() }
    $dbPassword = $null
}

exit $migrationExitCode
