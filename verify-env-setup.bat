@echo off
echo ========================================
echo Environment Variables Security Check
echo ========================================
echo.

echo [1/4] Checking if .env files exist...
if exist "AUTHApi\.env" (
    echo ✓ Backend .env file exists
) else (
    echo ✗ Backend .env file NOT found
)

if exist "AUTH-Frontend\.env" (
    echo ✓ Frontend .env file exists
) else (
    echo ✗ Frontend .env file NOT found
)

echo.
echo [2/4] Checking if .env.example files exist...
if exist "AUTHApi\.env.example" (
    echo ✓ Backend .env.example file exists
) else (
    echo ✗ Backend .env.example file NOT found
)

if exist "AUTH-Frontend\.env.example" (
    echo ✓ Frontend .env.example file exists
) else (
    echo ✗ Frontend .env.example file NOT found
)

echo.
echo [3/4] Checking if .env files are ignored by Git...
git check-ignore AUTHApi\.env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Backend .env is ignored by Git
) else (
    echo ✗ Backend .env is NOT ignored by Git - CHECK .gitignore!
)

git check-ignore AUTH-Frontend\.env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Frontend .env is ignored by Git
) else (
    echo ✗ Frontend .env is NOT ignored by Git - CHECK .gitignore!
)

echo.
echo [4/4] Showing Git status (should NOT show .env files)...
git status --short
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Review ENVIRONMENT_SETUP.md for detailed instructions
echo 2. IMPORTANT: Rotate your JWT key and Gmail App Password
echo 3. Run 'dotnet build' in AUTHApi to test configuration
echo 4. Commit the changes (but NOT the .env files!)
echo.
pause
