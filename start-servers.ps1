# ISS Yemen Webpage - Server Startup Script
# This script starts both backend and frontend servers

$ErrorActionPreference = "Stop"

# Project paths (with proper quoting for spaces)
$projectRoot = "C:\Users\U S E R\Desktop\Backup\Dell\APPDEV\iss-yemen-webpage"
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ISS Yemen Webpage - Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
$nodePath = $null
$commonPaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $nodePath = $path
        $nodeDir = Split-Path $path -Parent
        Write-Host "✓ Found Node.js at: $nodeDir" -ForegroundColor Green
        # Add to PATH for this session
        $env:Path = "$nodeDir;$env:Path"
        break
    }
}

if (-not $nodePath) {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Or add Node.js to your system PATH" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Verify npm is available
try {
    $npmVersion = npm --version
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Check if paths exist
if (-not (Test-Path $backendPath)) {
    Write-Host "✗ Backend path not found: $backendPath" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "✗ Frontend path not found: $frontendPath" -ForegroundColor Red
    pause
    exit 1
}

# Start Backend Server
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host 'Backend Server - Port 5000' -ForegroundColor Green; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev"
) -WindowStyle Normal

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host 'Frontend Server - Port 5173' -ForegroundColor Green; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers are starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Two PowerShell windows have opened." -ForegroundColor Yellow
Write-Host "Check those windows for any errors." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


