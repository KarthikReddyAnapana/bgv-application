# BGV Serverless Infrastructure (AWS CDK)

This CDK app provisions:

- API Gateway (`/api/bgv-requests`) backed by Lambda
- DynamoDB table for BGV requests
- S3 bucket for frontend artifacts
- CloudFront distribution for frontend hosting

Two stacks are created:

- `BgvServerlessDevStack`
- `BgvServerlessProdStack`

## Prerequisites

- Node.js 20+
- AWS CLI configured (`aws configure`)
- CDK bootstrapped in target account/region

## Install and Build

```powershell
cd infrastructure/cdk
npm install
npm run build
```

## Bootstrap (first time per account/region)

```powershell
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

## Synthesize

```powershell
npm run synth
```

## Deploy

```powershell
npm run deploy:dev
npm run deploy:prod
```

## Outputs to capture after deploy

- `ApiBaseUrl` (use as frontend `VITE_API_BASE`)
- `CloudFrontDomainName` (frontend URL)
- `FrontendBucketName` (upload frontend build assets)
- `DynamoDbTableName`

## Frontend publish flow

1. Build frontend:

```powershell
cd ../../frontend
npm run build
```

2. Upload to S3 bucket (replace bucket name):

```powershell
aws s3 sync dist s3://<FrontendBucketName> --delete
```

3. Invalidate CloudFront cache (replace distribution id):

```powershell
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

## Current API scope

Implemented routes in Lambda:

- `GET /api/bgv-requests`
- `POST /api/bgv-requests`
- `GET /api/bgv-requests/{id}`
- `PUT /api/bgv-requests/{id}`
- `DELETE /api/bgv-requests/{id}`
- `PATCH /api/bgv-requests/{id}/priority`
- `GET /api/bgv-requests/role/{role}`
- `GET /api/bgv-requests/status/{status}`
- `GET /api/bgv-requests/ps/{psNumber}`
- `GET /api/bgv-requests/employee-type/{employeeType}`
- `GET /api/bgv-requests/history/ps/{psNumber}`
- `GET /api/bgv-requests/history/resource-ps/{resourcePsNo}`
- `GET /api/bgv-requests/history/candidate/{candidateId}`
- `GET /api/bgv-requests/history/request/{requestId}`
- `GET /api/bgv-requests/history/search/{searchTerm}`
- `GET /api/bgv-requests/config/country-georegion-mapping`
- `POST /api/bgv-requests/excel-upload` (multipart)
- `GET /api/bgv-requests/excel-upload?year=YYYY&month=MM`
- `GET /api/bgv-requests/excel-upload/table?year=YYYY&month=MM`
- `GET /api/bgv-requests/excel-upload/table/latest`
- `POST /api/bgv-requests/upload-evidence` (multipart)

Not yet implemented in Lambda parity:

- SharePoint real file upload (current implementation returns configured folder URL + generated filename)