@echo off
REM Master deployment orchestrator for BGV Application
REM Usage: deploy.cmd --stage <dev|prod> --profile <AWS_PROFILE> [--firstDeploy] [--backend-only] [--skip-build]
REM
REM Examples:
REM   deploy.cmd --stage dev --profile myprofile --firstDeploy
REM   deploy.cmd --stage dev --profile myprofile
REM   deploy.cmd --stage prod --profile myprofile --backend-only

node deploy.js %*
exit /b %errorlevel%
