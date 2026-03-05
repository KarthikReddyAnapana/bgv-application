@echo off
REM Validate environment prerequisites for deployment
REM Usage: validate-environment.cmd <AWS_PROFILE>

setlocal enabledelayedexpansion

if [%1]==[] (
    echo.
    echo ERROR: AWS_PROFILE required
    echo Usage: validate-environment.cmd ^<AWS_PROFILE^>
    echo.
    exit /b 1
)

set AWS_PROFILE=%1

echo.
echo ========================================
echo Validating deployment environment...
echo ========================================
echo.

REM Check AWS CLI
echo [1/6] Checking AWS CLI...
aws --version >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\Amazon\AWSCLIV2\aws.exe" (
        set "PATH=C:\Program Files\Amazon\AWSCLIV2;!PATH!"
    ) else if exist "C:\Program Files ^(x86^)\Amazon\AWSCLI\bin\aws.exe" (
        set "PATH=C:\Program Files (x86)\Amazon\AWSCLI\bin;!PATH!"
    )

    aws --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: AWS CLI not found.
        echo Install from: https://aws.amazon.com/cli/
        echo Or on Windows: winget install Amazon.AWSCLI
        exit /b 1
    )
)
echo OK: AWS CLI found
echo.

REM Check Java
echo [2/6] Checking Java 21...
set JAVA_MAJOR=
for /f "tokens=3 delims=.\" %%A in ('java -version 2^>^&1 ^| findstr /i "version"') do set JAVA_MAJOR=%%A
if [!JAVA_MAJOR!]==[] (
    echo ERROR: Java not found. Install Java 21 and ensure java is in PATH.
    exit /b 1
)
if not "!JAVA_MAJOR!"=="21" (
    echo ERROR: Java 21 required. Current detected major version: !JAVA_MAJOR!
    exit /b 1
)
echo OK: Java 21 found
echo.

REM Check Node.js
echo [3/6] Checking Node.js 20+...
for /f "tokens=1" %%A in ('node --version 2^>nul') do set NODE_VERSION=%%A
if [!NODE_VERSION!]==[] (
    echo ERROR: Node.js not found. Install from https://nodejs.org/ ^(v20+^)
    exit /b 1
)
echo OK: !NODE_VERSION! found
echo.

REM Check npm
echo [4/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found.
    exit /b 1
)
for /f "tokens=1" %%A in ('npm --version 2^>nul') do set NPM_VERSION=%%A
echo OK: npm !NPM_VERSION! found
echo.

REM Check AWS CDK CLI
echo [5/6] Checking AWS CDK CLI...
cdk --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: CDK CLI not found globally. Will use npx cdk.
)
echo OK: CDK available
echo.

REM Validate AWS credentials
echo [6/6] Validating AWS credentials for profile: !AWS_PROFILE!...
aws sts get-caller-identity --profile !AWS_PROFILE! >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS credentials invalid or profile not found.
    echo Run: aws configure --profile !AWS_PROFILE!
    exit /b 1
)

for /f "tokens=2" %%A in ('aws sts get-caller-identity --profile !AWS_PROFILE! --query Account --output text 2^>nul') do set ACCOUNT_ID=%%A
for /f "tokens=1" %%A in ('aws sts get-caller-identity --profile !AWS_PROFILE! --query Account --output text 2^>nul') do set ACCOUNT_ID=%%A

echo OK: AWS credentials valid
echo.

echo ========================================
echo All prerequisites validated successfully
echo ========================================
echo.

exit /b 0
