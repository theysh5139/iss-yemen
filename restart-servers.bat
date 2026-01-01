@echo off
REM ISS Yemen Webpage - Restart All Servers Script
REM This script stops all running servers and restarts them

echo ========================================
echo   Restarting All Servers
echo ========================================
echo.

REM Add Node.js to PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Stop all Node.js processes
echo [1/4] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Stopped Node.js processes
echo.

REM Check and kill processes on ports 5000 and 5173
echo [2/4] Freeing up ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Killed process on port 5000
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Killed process on port 5173
)
timeout /t 2 /nobreak >nul
echo.

REM Set project paths
set "PROJECT_ROOT=C:\Users\U S E R\Desktop\Backup\Dell\APPDEV\iss-yemen-webpage"
set "BACKEND_PATH=%PROJECT_ROOT%\backend"
set "FRONTEND_PATH=%PROJECT_ROOT%\frontend"

REM Start Backend Server
echo [3/4] Starting Backend Server (Port 5000)...
start "Backend Server - Port 5000" cmd /k "cd /d "%BACKEND_PATH%" && echo Backend Server Starting... && npm run dev"
timeout /t 3 /nobreak >nul
echo [OK] Backend server window opened
echo.

REM Start Frontend Server
echo [4/4] Starting Frontend Server (Port 5173)...
start "Frontend Server - Port 5173" cmd /k "cd /d "%FRONTEND_PATH%" && echo Frontend Server Starting... && npm run dev"
echo [OK] Frontend server window opened
echo.

echo ========================================
echo   Servers Restarted!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Two command windows have opened.
echo Please wait 10-15 seconds for servers to start.
echo Then open: http://localhost:5173
echo.
pause


