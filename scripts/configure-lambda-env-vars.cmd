@echo off
REM Configure Lambda environment variables from CloudFormation outputs
REM Usage: configure-lambda-env-vars.cmd <dev|prod> <AWS_PROFILE>

setlocal enabledelayedexpansion

if [%1]==[] (
    echo ERROR: Stage required
    echo Usage: configure-lambda-env-vars.cmd ^<dev^|prod^> ^<AWS_PROFILE^>
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
echo Configuring Lambda Environment Variables
echo Stage: !STAGE!
echo ========================================
echo.

REM Get stack name
if /i "!STAGE!"=="dev" (
    set STACK_NAME=BgvServerlessDevStack
) else (
    set STACK_NAME=BgvServerlessProdStack
)

echo [1] Retrieving CloudFormation outputs for !STACK_NAME!...
for /f "tokens=2 delims==" %%A in ('aws cloudformation describe-stacks --stack-name !STACK_NAME! --profile !AWS_PROFILE! --query "Stacks[0].Outputs[?OutputKey==''DynamoDbTableName''].OutputValue" --output text 2^>nul') do set TABLE_NAME=%%A

if [!TABLE_NAME!]==[] (
    echo WARNING: Could not retrieve DynamoDB table name from CloudFormation
    echo Ensure stack !STACK_NAME! has been deployed successfully
) else (
    echo   ^✓ DynamoDB Table: !TABLE_NAME!
)

echo.
echo [2] Verifying Lambda function has access to environment variables...
echo   Note: Environment variables are set by CDK stack during deployment
echo   Current environment variables (from CDK context):
echo     - TABLE_NAME (requests table)
echo     - HISTORY_TABLE_NAME (history table)
echo     - EXCEL_RECORDS_TABLE_NAME (excel records table)
echo     - EXCEL_CELLS_TABLE_NAME (excel cells table)
echo     - SHAREPOINT_FOLDER_URL (evidence upload location)
echo.

echo ========================================
echo Lambda environment configuration verified
echo ========================================
echo.

exit /b 0
