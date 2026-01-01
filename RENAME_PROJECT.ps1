# Script to rename project folder from "user-site-about-us-page" to "iss-yemen-webpage"
# Run this script from the parent directory (C:\Users\Dell\APPDEV) after closing Cursor/VS Code

$oldName = "user-site-about-us-page"
$newName = "iss-yemen-webpage"
$parentPath = "C:\Users\Dell\APPDEV"

Write-Host "Renaming project folder..." -ForegroundColor Yellow
Write-Host "Old name: $oldName" -ForegroundColor Gray
Write-Host "New name: $newName" -ForegroundColor Gray

# Check if old directory exists
if (Test-Path "$parentPath\$oldName") {
    try {
        # Rename the directory
        Rename-Item -Path "$parentPath\$oldName" -NewName $newName -ErrorAction Stop
        Write-Host "✓ Successfully renamed to: $newName" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Close Cursor/VS Code if it's still open" -ForegroundColor White
        Write-Host "2. Reopen the project from: $parentPath\$newName" -ForegroundColor White
        Write-Host "3. The project should work exactly as before!" -ForegroundColor White
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "The directory might be in use. Please:" -ForegroundColor Yellow
        Write-Host "1. Close Cursor/VS Code completely" -ForegroundColor White
        Write-Host "2. Close any terminal windows in that directory" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
    }
} elseif (Test-Path "$parentPath\$newName") {
    Write-Host "✓ Directory already renamed to: $newName" -ForegroundColor Green
} else {
    Write-Host "✗ Directory not found at: $parentPath\$oldName" -ForegroundColor Red
    Write-Host "Please check the path and try again." -ForegroundColor Yellow
}


