# Deployment Handoff Checklist

## Purpose

This document is the runbook for deployment team handoff.

Scope includes:
- Lambda API (API Gateway + Lambda)
- DynamoDB (fresh tables, no legacy data migration)
- Frontend hosting on S3 + CloudFront

Out of scope for this phase:
- SharePoint real file upload integration (current route returns configured folder URL)

---

## Confirmed Functional Scope

Implemented API routes include:
- GET /api/bgv-requests
- POST /api/bgv-requests
- GET /api/bgv-requests/{id}
- PUT /api/bgv-requests/{id}
- DELETE /api/bgv-requests/{id}
- PATCH /api/bgv-requests/{id}/priority
- GET /api/bgv-requests/{id}/evidence
- GET /api/bgv-requests/role/{role}
- GET /api/bgv-requests/status/{status}
- GET /api/bgv-requests/ps/{psNumber}
- GET /api/bgv-requests/employee-type/{employeeType}
- GET /api/bgv-requests/history/ps/{psNumber}
- GET /api/bgv-requests/history/resource-ps/{resourcePsNo}
- GET /api/bgv-requests/history/candidate/{candidateId}
- GET /api/bgv-requests/history/request/{requestId}
- GET /api/bgv-requests/history/search/{searchTerm}
- GET /api/bgv-requests/config/country-georegion-mapping
- POST /api/bgv-requests/excel-upload
- GET /api/bgv-requests/excel-upload?year=YYYY&month=MM
- GET /api/bgv-requests/excel-upload/table?year=YYYY&month=MM
- GET /api/bgv-requests/excel-upload/table/latest
- POST /api/bgv-requests/upload-evidence

---

## Required Inputs from Deployment Team

Before running deployment:
- AWS Account ID
- AWS Region
- Deployment IAM permissions for CDK deploy (IAM, Lambda, API Gateway, CloudFront, S3, DynamoDB, CloudWatch)
- Frontend allowed origin for production CORS (CloudFront URL)
- AWS CLI profile or environment credentials

---

## Prerequisites

1. Install tooling
- Node.js 20+
- AWS CLI v2
- CDK CLI

2. Configure credentials

PowerShell:

```powershell
aws configure
aws sts get-caller-identity
```

3. Install project dependencies

```powershell
cd Paramount_Project/infrastructure/cdk
npm install
npm run build
```

---

## One-time Bootstrap (per account/region)

```powershell
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

---

## Dev Deployment Steps

1. Synthesize and verify stack

```powershell
cd Paramount_Project/infrastructure/cdk
npm run synth BgvServerlessDevStack
```

2. Deploy Dev stack

```powershell
npx cdk deploy BgvServerlessDevStack --require-approval never
```

3. Capture outputs from deployment terminal:
- ApiBaseUrl
- FrontendBucketName
- CloudFrontDomainName
- DynamoDbTableName
- DynamoDbHistoryTableName
- DynamoDbExcelRecordsTableName
- DynamoDbExcelCellsTableName

---

## Frontend Publish Steps (Dev)

1. Build frontend

```powershell
cd Paramount_Project/frontend
npm install
npm run build
```

2. Upload assets to S3 bucket from stack output

```powershell
aws s3 sync dist s3://<FrontendBucketName> --delete
```

3. Invalidate CloudFront cache

```powershell
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

4. Set frontend API base
- Ensure deployment uses ApiBaseUrl origin as VITE_API_BASE value
- VITE_API_BASE should be the host/root (without /api/bgv-requests suffix)

---

## Prod Deployment Steps

1. Update production CORS origin in cdk context before deploy:
- File: cdk.json
- Context key: prod.frontendDomain

2. Build and synth

```powershell
cd Paramount_Project/infrastructure/cdk
npm run build
npm run synth BgvServerlessProdStack
```

3. Deploy Prod stack

```powershell
npx cdk deploy BgvServerlessProdStack --require-approval never
```

4. Publish frontend to Prod bucket (same process as Dev)

---

## Smoke Test Checklist

After deployment, verify:

1. API health checks
- GET /api/bgv-requests returns 200
- POST /api/bgv-requests creates a record and returns 201
- GET by id, PUT, PATCH priority, DELETE work as expected

2. History checks
- create/update/delete generate history records
- history endpoints return results

3. Excel checks
- upload sample .xlsx via excel-upload endpoint
- table and latest endpoints return rows

4. Evidence checks
- upload-evidence accepts valid file extensions
- GET /{id}/evidence returns 302 when evidencePath exists

5. Frontend checks
- CloudFront URL loads application
- login and role navigation work
- PM/Admin/SuperAdmin main flows work without localhost dependency

---

## Rollback Plan

If deployment introduces issues:

Infrastructure rollback:
```powershell
npx cdk deploy <previous known-good stack version>
```

Frontend rollback:
- Re-sync previous frontend build to S3
- Run CloudFront invalidation

Emergency disable:
- Set API Gateway stage throttling tighter, or remove route access via deployment rollback

---

## Notes

- Legacy data migration is intentionally not required.
- Fresh DynamoDB tables are expected for production.
- SharePoint real upload integration is intentionally deferred in this phase.