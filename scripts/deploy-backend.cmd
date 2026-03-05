@echo off
REM Deploy backend infrastructure using CDK
REM Usage: deploy-backend.cmd <dev|prod> <AWS_PROFILE> [--skip-build]

setlocal enabledelayedexpansion

if [%1]==[] (
    echo ERROR: Stage required
    echo Usage: deploy-backend.cmd ^<dev^|prod^> ^<AWS_PROFILE^> [--skip-build]
    exit /b 1
)

if [%2]==[] (
    echo ERROR: AWS_PROFILE required
    echo Usage: deploy-backend.cmd ^<dev^|prod^> ^<AWS_PROFILE^> [--skip-build]
    exit /b 1
)

set STAGE=%1
set AWS_PROFILE=%2
set SKIP_BUILD=%3

REM Validate stage
if /i not "!STAGE!"=="dev" if /i not "!STAGE!"=="prod" (
    echo ERROR: Invalid stage. Must be 'dev' or 'prod'
    exit /b 1
)

echo.
echo ========================================
echo Deploying Backend - Stage: !STAGE!
echo AWS Profile: !AWS_PROFILE!
echo ========================================
echo.

REM Build Java Lambda JAR first
if not "!SKIP_BUILD!"=="--skip-build" (
    echo [1] Building Java Lambda JAR with Maven...
    cd Paramount_Project\backend
    call mvn clean package -DskipTests
    if errorlevel 1 (
        cd ..\..
        echo ERROR: Maven build failed
        exit /b 1
    )
    
    REM Verify JAR was created
    if not exist "target\bgv-lambda.jar" (
        cd ..\..
        echo ERROR: JAR file not found at target\bgv-lambda.jar
        exit /b 1
    )
    echo   ✓ JAR created: target\bgv-lambda.jar
    cd ..\..
    echo.
)

cd Paramount_Project\infrastructure\cdk

REM Build TypeScript
if not "!SKIP_BUILD!"=="--skip-build" (
    echo [2] Building TypeScript...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Build failed
        exit /b 1
    )
    echo.
)

REM Set approved deployment flag and deploy
echo [3] Deploying CDK stack: BgvServerless!STAGE:~0,1!!STAGE:~1!Stack...
set APPROVED_DEPLOYMENT=true

if /i "!STAGE!"=="dev" (
    call npx cdk deploy BgvServerlessDevStack --profile !AWS_PROFILE! --require-approval never
) else (
    call npx cdk deploy BgvServerlessProdStack --profile !AWS_PROFILE! --require-approval never
)

if errorlevel 1 (
    echo ERROR: CDK deployment failed
    exit /b 1
)

echo.
echo ========================================
echo Backend deployment completed successfully
echo ========================================
echo.

cd ..\..\..

exit /b 0
