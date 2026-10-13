param(
    [int]$Port = 6200,
    [string]$UiOrigin = 'http://localhost:5173'
)

$ErrorActionPreference = 'Stop'
$dbSecure = $null
$dbPointer = [IntPtr]::Zero
$dbPassword = $null

try {
    $dbSecure = Read-Host -Prompt 'PostgreSQL database password for user postgres (masked)' -AsSecureString
    $dbPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPointer)

    $node = (Get-Command node -ErrorAction Stop).Source
    $env:DATABASE_URL = "postgresql://postgres:$([uri]::EscapeDataString($dbPassword))@127.0.0.1:5432/postgres"
    $env:NODE_ENV = 'development'
    $env:MAMS_DEBUG_API_ERRORS = 'true'
    $env:DATABASE_SSL = 'false'
    $env:PORT = [string]$Port
    $env:JWT_SECRET = & $node -e "process.stdout.write(require('crypto').randomBytes(48).toString('hex'))"
    $env:QR_HMAC_SECRET = & $node -e "process.stdout.write(require('crypto').randomBytes(48).toString('hex'))"
    $env:LOGIN_RATE_LIMIT_WINDOW_MS = '60000'
    $env:LOGIN_RATE_LIMIT_MAX = '20'
    $env:UI_ORIGIN = $UiOrigin

    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & $node src/server.js
    } finally {
        Pop-Location
    }
} finally {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:DATABASE_SSL -ErrorAction SilentlyContinue
    Remove-Item Env:MAMS_DEBUG_API_ERRORS -ErrorAction SilentlyContinue
    Remove-Item Env:PORT -ErrorAction SilentlyContinue
    Remove-Item Env:JWT_SECRET -ErrorAction SilentlyContinue
    Remove-Item Env:QR_HMAC_SECRET -ErrorAction SilentlyContinue
    Remove-Item Env:LOGIN_RATE_LIMIT_WINDOW_MS -ErrorAction SilentlyContinue
    Remove-Item Env:LOGIN_RATE_LIMIT_MAX -ErrorAction SilentlyContinue
    Remove-Item Env:UI_ORIGIN -ErrorAction SilentlyContinue
    if ($dbPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPointer)
    }
    if ($dbSecure) { $dbSecure.Dispose() }
    $dbPassword = $null
}
