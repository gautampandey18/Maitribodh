$ErrorActionPreference = 'Stop'
$dbSecure = $null
$demoSecure = $null
$dbPointer = [IntPtr]::Zero
$demoPointer = [IntPtr]::Zero
$dbPassword = $null
$demoPassword = $null
$seedExitCode = 0

try {
    $dbSecure = Read-Host -Prompt 'PostgreSQL database password for user postgres (masked)' -AsSecureString
    $dbPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPointer)

    do {
        $demoSecure = Read-Host -Prompt 'Shared demo password: 10+ characters with a letter and digit (masked)' -AsSecureString
        $demoPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($demoSecure)
        $demoPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($demoPointer)
        $isStrong = $demoPassword.Length -ge 10 -and
            $demoPassword.Length -le 256 -and
            $demoPassword -match '[A-Za-z]' -and
            $demoPassword -match '\d'

        if (-not $isStrong) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($demoPointer)
            $demoPointer = [IntPtr]::Zero
            $demoSecure.Dispose()
            $demoSecure = $null
            $demoPassword = $null
            Write-Host 'Password does not meet policy; enter another value.'
        }
    } until ($isStrong)

    $env:DATABASE_URL = "postgresql://postgres:$([uri]::EscapeDataString($dbPassword))@127.0.0.1:5432/postgres"
    $env:DEMO_USERS_PASSWORD = $demoPassword
    $env:NODE_ENV = 'development'
    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & node db/seed_demo_users.js
        $seedExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
} catch {
    Write-Error $_.Exception.Message
    $seedExitCode = 1
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:DEMO_USERS_PASSWORD -ErrorAction SilentlyContinue
    if ($dbPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPointer)
    }
    if ($demoPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($demoPointer)
    }
    if ($dbSecure) { $dbSecure.Dispose() }
    if ($demoSecure) { $demoSecure.Dispose() }
    $dbPassword = $null
    $demoPassword = $null
}

exit $seedExitCode
