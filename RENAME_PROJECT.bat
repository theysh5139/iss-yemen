@echo off
REM Script to rename project folder from "user-site-about-us-page" to "iss-yemen-webpage"
REM Run this script from the parent directory (C:\Users\Dell\APPDEV) after closing Cursor/VS Code

set OLD_NAME=user-site-about-us-page
set NEW_NAME=iss-yemen-webpage
set PARENT_PATH=C:\Users\Dell\APPDEV

echo.
echo Renaming project folder...
echo Old name: %OLD_NAME%
echo New name: %NEW_NAME%
echo.

if exist "%PARENT_PATH%\%OLD_NAME%" (
    ren "%PARENT_PATH%\%OLD_NAME%" "%NEW_NAME%"
    if exist "%PARENT_PATH%\%NEW_NAME%" (
        echo [SUCCESS] Directory renamed to: %NEW_NAME%
        echo.
        echo Next steps:
        echo 1. Close Cursor/VS Code if it's still open
        echo 2. Reopen the project from: %PARENT_PATH%\%NEW_NAME%
        echo 3. The project should work exactly as before!
    ) else (
        echo [ERROR] Rename failed. The directory might be in use.
        echo.
        echo Please:
        echo 1. Close Cursor/VS Code completely
        echo 2. Close any terminal windows in that directory
        echo 3. Run this script again
    )
) else if exist "%PARENT_PATH%\%NEW_NAME%" (
    echo [INFO] Directory already renamed to: %NEW_NAME%
) else (
    echo [ERROR] Directory not found at: %PARENT_PATH%\%OLD_NAME%
    echo Please check the path and try again.
)

echo.
pause


