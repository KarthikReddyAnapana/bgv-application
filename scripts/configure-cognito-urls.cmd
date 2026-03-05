@echo off
REM Configure Cognito URLs and settings (stub - optional for future authentication)
REM This is a placeholder for future Cognito setup if authentication is needed
REM Usage: configure-cognito-urls.cmd <dev|prod> <AWS_PROFILE>

setlocal enabledelayedexpansion

if [%1]==[] (
    echo ERROR: Stage required
    echo Usage: configure-cognito-urls.cmd ^<dev^|prod^> ^<AWS_PROFILE^>
    exit /b 1
)

if [%2]==[] (
    echo ERROR: AWS_PROFILE required
    exit /b 1
)

set STAGE=%1
set AWS_PROFILE=%2

echo.
echo ========================================
echo Cognito Configuration
echo Stage: !STAGE!
echo ========================================
echo.

echo [INFO] Cognito is not currently configured in this project
echo        Authentication is role-based via API Gateway if needed
echo.
echo        If you plan to add Cognito authentication:
echo        1. Deploy Cognito User Pool via CDK
echo        2. Configure Cognito URLs here
echo        3. Update frontend to use Cognito login
echo        4. Restrict API Gateway routes via authorizers
echo.
echo [SKIP] No Cognito configuration at this time
echo.

echo ========================================
echo Cognito configuration skipped
echo ========================================
echo.

exit /b 0
