# PowerShell script to test SMTP connection
# Usage: .\test-email-connection.ps1

$uri = "http://localhost:5000/api/test/email-connection"

Write-Host "🔌 Testing SMTP connection..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method GET
    
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ SMTP connection is working!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Connection test failed or email is in mock mode" -ForegroundColor Yellow
        Write-Host "   Set EMAIL_MODE=real in .env to enable real email" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host ""
    Write-Host "💡 Make sure your backend server is running!" -ForegroundColor Yellow
    Write-Host "   Run: npm run dev" -ForegroundColor Yellow
}

