# ============================================================
# rotate-credentials.ps1
# Rotates ONLY the auth credentials in .env
# All other existing .env values are preserved.
#
# Usage (from project root):
#   .\scripts\rotate-credentials.ps1
# ============================================================

$EnvFile = ".env"

function New-SecurePassword {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^&*-_=+"
    $rng   = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 20
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

$demoPass  = New-SecurePassword
$adminPass = New-SecurePassword

if (Test-Path $EnvFile) {
    $lines = Get-Content $EnvFile
} else {
    $lines = @()
}

$keys = @{
    'VITE_DEMO_EMAIL'  = 'demo@pathscribe.ai'
    'VITE_DEMO_PASS'   = $demoPass
    'VITE_ADMIN_EMAIL' = 'admin@pathscribe.ai'
    'VITE_ADMIN_PASS'  = $adminPass
}

foreach ($key in $keys.Keys) {
    $value   = $keys[$key]
    $pattern = "^$key="
    $newLine = "$key=$value"
    if ($lines | Where-Object { $_ -match $pattern }) {
        $lines = $lines | ForEach-Object { if ($_ -match $pattern) { $newLine } else { $_ } }
    } else {
        $lines += $newLine
    }
}

$lines | Set-Content $EnvFile

if (Test-Path ".gitignore") {
    $ignore = Get-Content ".gitignore" -Raw
    if ($ignore -notmatch "(^|\n)\.env(\r?\n|$)") {
        Add-Content ".gitignore" "`n.env"
        Write-Host ".env added to .gitignore" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Credentials rotated. All other .env values preserved." -ForegroundColor Green
Write-Host "Open .env in VS Code to retrieve new passwords." -ForegroundColor Cyan
Write-Host "Never share passwords in chat or email." -ForegroundColor Yellow
Write-Host ""
