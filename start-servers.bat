@echo off
REM ISS Yemen Webpage - Server Startup Script
REM This script starts both backend and frontend servers

echo ========================================
echo   ISS Yemen Webpage - Server Startup
echo ========================================
echo.

REM Add Node.js to PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Verify Node.js is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
npm --version
echo.

REM Set project paths
set "PROJECT_ROOT=C:\Users\U S E R\Desktop\Backup\Dell\APPDEV\iss-yemen-webpage"
set "BACKEND_PATH=%PROJECT_ROOT%\backend"
set "FRONTEND_PATH=%PROJECT_ROOT%\frontend"

REM Check if paths exist
if not exist "%BACKEND_PATH%" (
    echo [ERROR] Backend path not found: %BACKEND_PATH%
    pause
    exit /b 1
)

if not exist "%FRONTEND_PATH%" (
    echo [ERROR] Frontend path not found: %FRONTEND_PATH%
    pause
    exit /b 1
)

echo Starting Backend Server (Port 5000)...
start "Backend Server - Port 5000" cmd /k "cd /d "%BACKEND_PATH%" && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend Server (Port 5173)...
start "Frontend Server - Port 5173" cmd /k "cd /d "%FRONTEND_PATH%" && npm run dev"

echo.
echo ========================================
echo   Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Two command windows have opened.
echo Check those windows for any errors.
echo.
pause


