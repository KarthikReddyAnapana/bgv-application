@echo off
REM Deploy frontend to S3 and invalidate CloudFront
REM Usage: deploy-frontend.cmd <dev|prod> <AWS_PROFILE> <S3_BUCKET> [DISTRIBUTION_ID]

setlocal enabledelayedexpansion

if [%1]==[] (
    echo ERROR: Stage required
    echo Usage: deploy-frontend.cmd ^<dev^|prod^> ^<AWS_PROFILE^> ^<S3_BUCKET^> [DISTRIBUTION_ID]
    exit /b 1
)

if [%2]==[] (
    echo ERROR: AWS_PROFILE required
    exit /b 1
)

if [%3]==[] (
    echo ERROR: S3_BUCKET required
    exit /b 1
)

set STAGE=%1
set AWS_PROFILE=%2
set S3_BUCKET=%3
set DISTRIBUTION_ID=%4

echo.
echo ========================================
echo Deploying Frontend - Stage: !STAGE!
echo S3 Bucket: !S3_BUCKET!
echo ========================================
echo.

cd Paramount_Project\frontend

REM Install dependencies
echo [1] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    exit /b 1
)
echo.

REM Build frontend
echo [2] Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)
echo.

REM Upload to S3
echo [3] Uploading to S3 bucket: !S3_BUCKET!...
call aws s3 sync dist s3://!S3_BUCKET! --delete --profile !AWS_PROFILE!
if errorlevel 1 (
    echo ERROR: S3 sync failed
    exit /b 1
)
echo.

REM Invalidate CloudFront if distribution ID provided
if not [!DISTRIBUTION_ID!]==[] (
    echo [4] Invalidating CloudFront distribution: !DISTRIBUTION_ID!...
    call aws cloudfront create-invalidation --distribution-id !DISTRIBUTION_ID! --paths "/*" --profile !AWS_PROFILE!
    if errorlevel 1 (
        echo WARNING: CloudFront invalidation failed. Cache may not refresh immediately.
    )
    echo.
) else (
    echo [4] SKIPPING CloudFront invalidation (no distribution ID provided)
    echo.
)

echo ========================================
echo Frontend deployment completed successfully
echo ========================================
echo.

cd ..\..\

exit /b 0
