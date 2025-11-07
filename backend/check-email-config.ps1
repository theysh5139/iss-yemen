# PowerShell script to check email configuration
# This will help you verify your .env settings

Write-Host "🔍 Checking Email Configuration..." -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found at: $envPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Create a .env file in the backend directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Read .env file
$envContent = Get-Content $envPath -Raw
$lines = Get-Content $envPath

# Check for email-related variables
$emailMode = $lines | Where-Object { $_ -match "^EMAIL_MODE=" } | ForEach-Object { $_ -replace "EMAIL_MODE=", "" }
$smtpHost = $lines | Where-Object { $_ -match "^SMTP_HOST=" } | ForEach-Object { $_ -replace "SMTP_HOST=", "" }
$smtpPort = $lines | Where-Object { $_ -match "^SMTP_PORT=" } | ForEach-Object { $_ -replace "SMTP_PORT=", "" }
$smtpUser = $lines | Where-Object { $_ -match "^SMTP_USER=" } | ForEach-Object { $_ -replace "SMTP_USER=", "" }
$smtpPass = $lines | Where-Object { $_ -match "^SMTP_PASS=" } | ForEach-Object { $_ -replace "SMTP_PASS=", "" }

Write-Host "📋 Current Configuration:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($emailMode) {
    if ($emailMode -eq "real") {
        Write-Host "EMAIL_MODE: $emailMode ✅" -ForegroundColor Green
    } else {
        Write-Host "EMAIL_MODE: $emailMode ⚠️  (Set to 'real' for real email sending)" -ForegroundColor Yellow
    }
} else {
    Write-Host "EMAIL_MODE: ❌ Not set (defaults to 'mock')" -ForegroundColor Red
}

if ($smtpHost) {
    Write-Host "SMTP_HOST: $smtpHost ✅" -ForegroundColor Green
} else {
    Write-Host "SMTP_HOST: ❌ Not set" -ForegroundColor Red
}

if ($smtpPort) {
    Write-Host "SMTP_PORT: $smtpPort ✅" -ForegroundColor Green
} else {
    Write-Host "SMTP_PORT: ❌ Not set" -ForegroundColor Red
}

if ($smtpUser) {
    if ($smtpUser -match "your-email|example|@") {
        Write-Host "SMTP_USER: $smtpUser ⚠️  (Replace with your actual email)" -ForegroundColor Yellow
    } else {
        Write-Host "SMTP_USER: $smtpUser ✅" -ForegroundColor Green
    }
} else {
    Write-Host "SMTP_USER: ❌ Not set" -ForegroundColor Red
}

if ($smtpPass) {
    if ($smtpPass -match "your-|password|change|here") {
        Write-Host "SMTP_PASS: ⚠️  (Replace with your actual app password)" -ForegroundColor Yellow
    } else {
        Write-Host "SMTP_PASS: ✅ Set (hidden)" -ForegroundColor Green
    }
} else {
    Write-Host "SMTP_PASS: ❌ Not set" -ForegroundColor Red
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Summary
if ($emailMode -eq "real" -and $smtpHost -and $smtpPort -and $smtpUser -and $smtpPass) {
    if ($smtpUser -notmatch "your-email|example" -and $smtpPass -notmatch "your-|password|change|here") {
        Write-Host "✅ Configuration looks good!" -ForegroundColor Green
        Write-Host "   Make sure to restart your backend server after making changes." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Configuration incomplete!" -ForegroundColor Yellow
        Write-Host "   Replace placeholder values with your actual credentials." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Configuration incomplete!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Set EMAIL_MODE=real" -ForegroundColor White
    Write-Host "2. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS" -ForegroundColor White
    Write-Host "3. See SETUP_REAL_EMAIL.md for detailed instructions" -ForegroundColor White
}

Write-Host ""

