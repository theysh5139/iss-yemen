# PowerShell script to test email sending
# Usage: .\test-email.ps1 your-email@example.com

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$uri = "http://localhost:5000/api/test/email"
$body = @{
    to = $Email
} | ConvertTo-Json

Write-Host "🧪 Testing email sending..." -ForegroundColor Cyan
Write-Host "Sending test email to: $Email" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
    
    if ($response.success) {
        Write-Host ""
        Write-Host "📧 Check your inbox (or Mailtrap inbox) for the test email!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure your backend server is running (npm run dev)" -ForegroundColor Yellow
    Write-Host "2. Check your .env file has EMAIL_MODE=real" -ForegroundColor Yellow
    Write-Host "3. Verify SMTP credentials are correct" -ForegroundColor Yellow
    Write-Host "4. Restart backend after changing .env" -ForegroundColor Yellow
}

