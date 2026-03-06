# WAR File Deployment Guide

## ✅ WAR File Successfully Created!

**File Location:** `target/bgv-service.war`  
**File Size:** 121.51 MB  
**Build Date:** March 5, 2026

---

## 📦 Deployment Options

### **Option 1: Apache Tomcat** ⭐ Most Common

#### Quick Deploy:
```bash
# 1. Copy WAR to Tomcat webapps folder
cp target/bgv-service.war /path/to/tomcat/webapps/

# 2. Start Tomcat (it will auto-deploy)
/path/to/tomcat/bin/startup.sh    # Linux/Mac
/path/to/tomcat/bin/startup.bat   # Windows

# 3. Access application
http://localhost:8080/bgv-service/api/bgv-requests
```

#### Clean Deploy:
```bash
# Stop Tomcat
/path/to/tomcat/bin/shutdown.sh

# Remove old deployment
rm -rf /path/to/tomcat/webapps/bgv-service*

# Copy new WAR
cp target/bgv-service.war /path/to/tomcat/webapps/

# Start Tomcat
/path/to/tomcat/bin/startup.sh
```

---

### **Option 2: AWS Elastic Beanstalk**

```bash
# Using EB CLI
eb init -p "Tomcat 10 with Corretto 21" bgv-app
eb create bgv-production
eb deploy

# Or upload via AWS Console
# 1. Elastic Beanstalk → Create Application
# 2. Platform: Tomcat 10 with Corretto 21
# 3. Upload: target/bgv-service.war
# 4. Deploy
```

**Access:** `http://your-app.elasticbeanstalk.com/api/bgv-requests`

---

### **Option 3: JBoss/WildFly**

```bash
# Copy to deployments folder
cp target/bgv-service.war /path/to/wildfly/standalone/deployments/

# Application will auto-deploy
# Check logs at: /path/to/wildfly/standalone/log/server.log
```

---

### **Option 4: WebLogic**

1. Open WebLogic Admin Console
2. Domain Structure → Deployments
3. Click "Install"
4. Upload `bgv-service.war`
5. Select "Install this deployment as an application"
6. Finish and activate changes

---

## 🔧 Environment Configuration

### **Required Environment Variables:**

Set these in your application server:

```properties
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key       # Or use IAM role
AWS_SECRET_ACCESS_KEY=your_secret_key   # Or use IAM role

# DynamoDB Tables (if different from default)
dynamodb.table.bgvRequests=LTM-mne-paramount-BgvRequests
dynamodb.table.bgvRequestHistory=LTM-mne-paramount-BgvRequestHistory
dynamodb.table.bgvExcelUploadRecords=LTM-mne-paramount-BgvExcelUploadRecords
dynamodb.table.bgvExcelUploadCells=LTM-mne-paramount-BgvExcelUploadCells

# CORS (replace with your frontend URL)
app.cors.allowed-origins=https://your-frontend-domain.com
```

### **For Tomcat:**
Create `setenv.sh` (Linux/Mac) or `setenv.bat` (Windows) in Tomcat's `bin` folder:

```bash
# setenv.sh
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

---

## 🌐 Access URLs

After deployment, your API will be available at:

```
# Tomcat
http://localhost:8080/bgv-service/api/bgv-requests

# Custom Context Root (if you rename WAR to ROOT.war)
http://localhost:8080/api/bgv-requests

# AWS Elastic Beanstalk
http://your-app-name.elasticbeanstalk.com/api/bgv-requests
```

---

## 🔍 Testing the Deployment

```bash
# Health check (if you have Spring Actuator enabled)
curl http://localhost:8080/bgv-service/actuator/health

# Get all BGV requests
curl http://localhost:8080/bgv-service/api/bgv-requests

# Create a test request
curl -X POST http://localhost:8080/bgv-service/api/bgv-requests \
  -H "Content-Type: application/json" \
  -d '{
    "psNumber": "12345",
    "requestedByName": "Test User",
    "rrNumber": 100.0,
    "candidateId": "TEST001",
    "resourceName": "Test Resource",
    "resourcePsNo": "67890",
    "resourceType": "EXTERNAL",
    "geoRegion": "INDIA",
    "country": "INDIA",
    "status": "PENDING",
    "userRole": "PM"
  }'
```

---

## 🚨 Troubleshooting

### **1. Application Won't Start**

**Check logs:**
```bash
# Tomcat
tail -f /path/to/tomcat/logs/catalina.out

# Check for DynamoDB connection errors
grep -i "dynamodb" /path/to/tomcat/logs/catalina.out
```

**Common Issues:**
- ❌ AWS credentials not configured → Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- ❌ DynamoDB tables don't exist → Application will auto-create them on first run
- ❌ Network issue → Check security groups/firewall for DynamoDB access

### **2. CORS Errors from Frontend**

Update `app.cors.allowed-origins` with your frontend URL:
```properties
app.cors.allowed-origins=https://your-frontend.com,http://localhost:5173
```

### **3. DynamoDB Connection Timeout**

Ensure:
- AWS credentials are valid: `aws sts get-caller-identity`
- Security groups allow outbound HTTPS (port 443)
- IAM role has DynamoDB permissions

---

## 📋 Deployment Checklist

- [ ] WAR file built successfully (121.51 MB)
- [ ] AWS credentials configured
- [ ] DynamoDB tables accessible (or auto-create permissions)
- [ ] Application server installed (Tomcat/JBoss/WebLogic)
- [ ] Environment variables set
- [ ] CORS configured with frontend URL
- [ ] Deployed WAR to application server
- [ ] Application started successfully
- [ ] Tested API endpoints
- [ ] Frontend configured with backend URL

---

## 🎯 Production Recommendations

1. **Use IAM Roles instead of access keys** (for AWS deployments)
2. **Enable HTTPS** with SSL/TLS certificate
3. **Configure logging** to monitor application behavior
4. **Set up monitoring** with CloudWatch or application monitoring tools
5. **Configure auto-scaling** for high availability
6. **Regular backups** of DynamoDB tables
7. **Security groups** to restrict access

---

## 📞 Support

For issues or questions:
1. Check application logs first
2. Verify AWS credentials and permissions
3. Ensure DynamoDB tables are accessible
4. Review environment variable configuration

---

**Deployment Complete! 🎉**

Your Spring Boot application is now packaged as a WAR file and ready for deployment to any Java EE application server!
