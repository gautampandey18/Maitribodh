$ErrorActionPreference = 'Stop'
$dbSecure = $null
$adminSecure = $null
$dbPointer = [IntPtr]::Zero
$adminPointer = [IntPtr]::Zero
$dbPassword = $null
$adminPassword = $null
$seedExitCode = 0

try {
    $dbSecure = Read-Host -Prompt 'PostgreSQL database password for user postgres (masked)' -AsSecureString
    $dbPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPointer)

    do {
        $adminSecure = Read-Host -Prompt 'Super Admin bootstrap password: 10+ characters with a letter and digit (masked)' -AsSecureString
        $adminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecure)
        $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($adminPointer)
        $isStrong = $adminPassword.Length -ge 10 -and
            $adminPassword.Length -le 256 -and
            $adminPassword -match '[A-Za-z]' -and
            $adminPassword -match '\d'

        if (-not $isStrong) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($adminPointer)
            $adminPointer = [IntPtr]::Zero
            $adminSecure.Dispose()
            $adminSecure = $null
            $adminPassword = $null
            Write-Host 'Password does not meet the policy; enter another value.'
        }
    } until ($isStrong)

    $env:DATABASE_URL = "postgresql://postgres:$([uri]::EscapeDataString($dbPassword))@127.0.0.1:5432/postgres"
    $env:BOOTSTRAP_SUPER_ADMIN_PASSWORD = $adminPassword
    $env:NODE_ENV = 'development'
    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & node db/seed_dev.js
        $seedExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
} catch {
    Write-Error $_.Exception.Message
    $seedExitCode = 1
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:BOOTSTRAP_SUPER_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    if ($dbPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPointer)
    }
    if ($adminPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($adminPointer)
    }
    if ($dbSecure) { $dbSecure.Dispose() }
    if ($adminSecure) { $adminSecure.Dispose() }
    $dbPassword = $null
    $adminPassword = $null
}

exit $seedExitCode
