$ErrorActionPreference = 'Stop'
$dbSecure = $null
$passwordSecure = $null
$confirmSecure = $null
$dbPointer = [IntPtr]::Zero
$passwordPointer = [IntPtr]::Zero
$confirmPointer = [IntPtr]::Zero
$dbPassword = $null
$temporaryPassword = $null
$confirmedPassword = $null
$scriptExitCode = 0

try {
    $username = (Read-Host -Prompt 'Username of the existing Admin or Superadmin account to reset').Trim()
    if ([string]::IsNullOrWhiteSpace($username)) {
        throw 'Username is required'
    }

    $dbSecure = Read-Host -Prompt 'PostgreSQL database password for user postgres (masked)' -AsSecureString
    $dbPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPointer)

    do {
        $passwordSecure = Read-Host -Prompt 'Temporary password: 10+ characters with a letter and digit (masked)' -AsSecureString
        $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordSecure)
        $temporaryPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
        $isStrong = $temporaryPassword.Length -ge 10 -and
            $temporaryPassword.Length -le 256 -and
            $temporaryPassword -match '[A-Za-z]' -and
            $temporaryPassword -match '\d'

        if (-not $isStrong) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
            $passwordPointer = [IntPtr]::Zero
            $passwordSecure.Dispose()
            $passwordSecure = $null
            $temporaryPassword = $null
            Write-Host 'Password does not meet the policy; enter another value.'
        }
    } until ($isStrong)

    $confirmSecure = Read-Host -Prompt 'Confirm temporary password (masked)' -AsSecureString
    $confirmPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmSecure)
    $confirmedPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPointer)
    if ($temporaryPassword -cne $confirmedPassword) {
        throw 'The temporary passwords do not match'
    }

    $env:DATABASE_URL = "postgresql://postgres:$([uri]::EscapeDataString($dbPassword))@127.0.0.1:5432/postgres"
    $env:RESET_TARGET_USERNAME = $username
    $env:RESET_TEMPORARY_PASSWORD = $temporaryPassword
    $env:NODE_ENV = 'development'
    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & node db/reset_user_password.js
        $scriptExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
} catch {
    Write-Error $_.Exception.Message
    $scriptExitCode = 1
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:RESET_TARGET_USERNAME -ErrorAction SilentlyContinue
    Remove-Item Env:RESET_TEMPORARY_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    if ($dbPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPointer)
    }
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    if ($confirmPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPointer)
    }
    if ($dbSecure) { $dbSecure.Dispose() }
    if ($passwordSecure) { $passwordSecure.Dispose() }
    if ($confirmSecure) { $confirmSecure.Dispose() }
    $dbPassword = $null
    $temporaryPassword = $null
    $confirmedPassword = $null
}

exit $scriptExitCode
