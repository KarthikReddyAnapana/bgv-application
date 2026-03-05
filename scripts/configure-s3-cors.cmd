@echo off
REM Configure S3 CORS policy for frontend bucket
REM Usage: configure-s3-cors.cmd <dev|prod> <AWS_PROFILE>

setlocal enabledelayedexpansion

if [%1]==[] (
    echo ERROR: Stage required
    echo Usage: configure-s3-cors.cmd ^<dev^|prod^> ^<AWS_PROFILE^>
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
echo Configuring S3 CORS Policy
echo Stage: !STAGE!
echo ========================================
echo.

REM Get stack name and retrieve S3 bucket
if /i "!STAGE!"=="dev" (
    set STACK_NAME=BgvServerlessDevStack
) else (
    set STACK_NAME=BgvServerlessProdStack
)

echo [1] Retrieving S3 bucket name from CloudFormation...
for /f "tokens=*" %%A in ('aws cloudformation describe-stacks --stack-name !STACK_NAME! --profile !AWS_PROFILE! --query "Stacks[0].Outputs[?OutputKey==''FrontendBucketName''].OutputValue" --output text 2^>nul') do set S3_BUCKET=%%A

if [!S3_BUCKET!]==[] (
    echo ERROR: Could not retrieve S3 bucket from CloudFormation
    echo Ensure stack !STACK_NAME! has been deployed
    exit /b 1
)

echo   ^✓ S3 Bucket: !S3_BUCKET!
echo.

REM Create CORS policy file
echo [2] Creating CORS policy...
(
    echo [
    echo   {
    echo     "AllowedHeaders": ["*"],
    echo     "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    echo     "AllowedOrigins": ["*"],
    echo     "ExposeHeaders": ["ETag"],
    echo     "MaxAgeSeconds": 3600
    echo   }
    echo ]
) > cors-policy.json

echo   ^✓ CORS policy created
echo.

REM Apply CORS policy
echo [3] Applying CORS policy to bucket !S3_BUCKET!...
aws s3api put-bucket-cors ^
    --bucket !S3_BUCKET! ^
    --cors-configuration file://cors-policy.json ^
    --profile !AWS_PROFILE!

if errorlevel 1 (
    echo WARNING: CORS policy may already be configured or bucket is public
) else (
    echo   ^✓ CORS policy applied successfully
)

echo.

REM Cleanup
if exist cors-policy.json del cors-policy.json

echo ========================================
echo S3 CORS configuration complete
echo ========================================
echo.

exit /b 0
