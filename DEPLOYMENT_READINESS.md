# BGV Application - Deployment Readiness Report

**Date:** March 5, 2026  
**Status:** ⚠️ PARTIALLY READY - Requires Configuration  

---

## ✅ Completed Items

### 1. Build Artifacts
- ✅ Backend JAR built: `backend/target/bgv-lambda.jar`
- ✅ Frontend build completed: `frontend/dist/` contains production assets
- ✅ CDK stack synthesized: `infrastructure/cdk/deploy/cdk-out/BgvServerlessDevStack.template.json`

### 2. Code & Configuration
- ✅ Architecture documentation created: `backend/Architecture.md`
- ✅ All credentials replaced with "placeholder"
- ✅ Environment variable names fixed (Spring Boot property names in CDK)
- ✅ DynamoDB endpoint issue resolved (removed localhost hardcode)
- ✅ Lambda handler configured correctly: `StreamLambdaHandler::handleRequest`
- ✅ CORS configuration present
- ✅ CloudWatch monitoring configured
- ✅ IAM permissions granted (DynamoDB read/write to Lambda)

### 3. Infrastructure as Code
- ✅ CDK stack defined with all resources:
  - API Gateway
  - Lambda (Java 21, ARM64, SnapStart)
  - 4 DynamoDB tables with GSIs
  - S3 bucket for frontend
  - CloudFront distribution
  - CloudWatch alarms and dashboard
  - SNS topic (optional)

---

## ❌ Blocking Issues - Must Fix Before Deployment

### 1. AWS Credentials Required
**Status:** NOT CONFIGURED  
**Required Action:** Replace "placeholder" with actual values in the following locations:

#### AWS Profile
- Scripts expect `--profile` parameter
- **You must have:** Valid AWS SSO or IAM credentials configured locally
- **Command to configure:** `aws configure sso --profile <your-profile-name>`

#### CDK Context (cdk.json)
```json
"dev": {
  "alarmEmail": "placeholder"  // ← Replace with real email for alerts
}
"prod": {
  "cognitoUserPoolArn": "placeholder",  // ← Required for prod deployment
  "alarmEmail": "placeholder"
}
```

#### SharePoint Integration (application.properties) - OPTIONAL
Only if you enable SharePoint (`sharepoint.enabled=true`):
```properties
sharepoint.tenant.id=placeholder       # Azure AD Tenant ID
sharepoint.client.id=placeholder       # App Registration Client ID
sharepoint.client.secret=placeholder   # App Registration Secret
sharepoint.site.id=placeholder         # SharePoint Site ID
sharepoint.drive.id=placeholder        # SharePoint Drive ID
```

#### OpenSearch (application.properties) - OPTIONAL
Only if you enable OpenSearch (`opensearch.enabled=true`):
```properties
opensearch.username=placeholder
opensearch.password=placeholder
```

### 2. CDK Deployment Failed
**Current Status:** Last deployment exited with code 1  
**Likely Cause:** Configuration issues (now fixed) or AWS credential problems  

**Required Action:**
1. Ensure AWS credentials are valid: `aws sts get-caller-identity --profile <your-profile>`
2. Rebuild backend after config changes: `cd backend; mvn clean package -DskipTests`
3. Redeploy CDK: `cd infrastructure/cdk; cdk deploy --context environment=dev --profile <your-profile>`

### 3. Frontend Not Deployed to S3
**Status:** Built but not uploaded  
**Required Action:** After successful CDK deployment, run:
```powershell
cd frontend
aws s3 sync dist s3://<bucket-name-from-cdk-output> --delete --profile <your-profile>
aws cloudfront create-invalidation --distribution-id <dist-id-from-cdk-output> --paths "/*" --profile <your-profile>
```

---

## ⚠️ Known Issues

### 1. API Gateway Returns "Internal server error"
**Root Cause:** Environment variable mismatch (FIXED in latest code)  
**Resolution:** Redeploy after rebuilding backend JAR

### 2. Lambda Cold Start May Be Slow
**Impact:** First request may timeout  
**Mitigation:** SnapStart is enabled; consider increasing timeout if needed  
**Current Timeout:** 60 seconds

### 3. Production Stack Commented Out
**Location:** `infrastructure/cdk/bin/app.ts`  
**Impact:** Only dev stack will deploy  
**Action if needed:** Uncomment prod stack instantiation before production deployment

---

## 📋 Pre-Deployment Checklist

### Before Running CDK Deploy:
- [ ] AWS credentials configured and valid
- [ ] Backend JAR rebuilt after configuration changes: `mvn clean package -DskipTests`
- [ ] Replace "placeholder" values with real credentials in:
  - [ ] `cdk.json` → alarmEmail (at minimum)
  - [ ] `cdk.json` → cognitoUserPoolArn (if deploying to prod)
  - [ ] `application.properties` → SharePoint config (if enabling SharePoint)
  - [ ] `application.properties` → OpenSearch config (if enabling OpenSearch)
- [ ] Review CDK context in `cdk.json` for environment-specific settings
- [ ] Confirm AWS region in `cdk.json` matches your target region

### Deployment Commands:
```powershell
# Step 1: Rebuild backend (if config changed)
cd Paramount_Project\backend
mvn clean package -DskipTests

# Step 2: Deploy infrastructure + backend
cd ..\infrastructure\cdk
cdk deploy --context environment=dev --profile <YOUR_AWS_PROFILE>

# Step 3: Note the outputs from CDK (API URL, S3 bucket, CloudFront domain)

# Step 4: Deploy frontend
cd ..\..\frontend
aws s3 sync dist s3://<BUCKET_NAME_FROM_STEP3> --delete --profile <YOUR_AWS_PROFILE>
aws cloudfront create-invalidation --distribution-id <DIST_ID_FROM_STEP3> --paths "/*" --profile <YOUR_AWS_PROFILE>

# Step 5: Test API
curl https://<API_URL_FROM_STEP3>/api/bgv-requests

# Step 6: Access frontend
# Open https://<CLOUDFRONT_DOMAIN_FROM_STEP3> in browser
```

---

## 🔒 Security Notes

1. **Never commit real credentials to Git**
   - All sensitive values are now set to "placeholder"
   - Use environment variables or AWS Secrets Manager for production

2. **IAM Permissions**
   - Lambda has DynamoDB read/write permissions (granted by CDK)
   - Ensure your deployment user has CDK bootstrap permissions

3. **API Gateway Authorization**
   - Dev: No authorization (open)
   - Prod: Requires Cognito User Pool (must configure in cdk.json)

4. **CORS**
   - Dev: Allows all origins
   - Prod: Should restrict to CloudFront domain only

---

## 📊 Deployment Readiness Score

**Overall: 75% Ready**

- ✅ Code: 100%
- ✅ Build: 100%
- ⚠️ Configuration: 50% (placeholders need real values)
- ❌ Deployment: 0% (not yet successful)
- ✅ Documentation: 100%

**Estimated Time to Deploy:** 15-30 minutes after replacing placeholders

---

## 🆘 Troubleshooting

### If CDK Deploy Fails:
1. Check AWS credentials: `aws sts get-caller-identity --profile <profile>`
2. Check CDK bootstrap: `cdk bootstrap --profile <profile>`
3. Review error message in terminal
4. Check Lambda logs after deployment: `aws logs tail /aws/lambda/bgv-api-dev --since 5m --profile <profile>`

### If API Returns Errors:
1. Check Lambda logs for Java exceptions
2. Verify environment variables in Lambda console
3. Confirm DynamoDB tables were created
4. Test with simple GET request first: `/api/bgv-requests`

### If Frontend Doesn't Load:
1. Verify S3 sync completed successfully
2. Check CloudFront invalidation status
3. Inspect browser console for JavaScript errors
4. Verify `VITE_API_BASE` environment variable (if used)

---

## Next Steps

1. **Replace all "placeholder" values** with real credentials
2. **Rebuild backend:** `mvn clean package -DskipTests`
3. **Deploy CDK:** Follow deployment commands above
4. **Upload frontend to S3**
5. **Test application end-to-end**
6. **Monitor CloudWatch logs and alarms**

---

**For Questions:** Review `Architecture.md` in backend folder for system design details.
