# Spring Boot Backend Deployment Guide

This backend has been converted to a **plain Java Spring Boot application** with DynamoDB integration. The Lambda-based architecture has been removed.

## Architecture

- **Backend**: Java Spring Boot REST API (runs on port 8080)
- **Database**: AWS DynamoDB (for data persistence)
- **Frontend**: React with Vite

## Prerequisites

- **Java 21** or higher
- **Maven 3.8+**
- **AWS Account** with DynamoDB access
- **AWS CLI** configured with appropriate credentials

## Configuration

### AWS Credentials

Set up your AWS credentials using one of these methods:

1. **AWS CLI Configuration** (recommended):
   ```bash
   aws configure
   ```

2. **Environment Variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=us-east-1
   ```

3. **IAM Role** (for EC2/ECS deployment):
   Attach an IAM role with DynamoDB permissions to your compute instance.

### Application Properties

Edit `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080

# AWS Configuration
aws.region=us-east-1

# CORS Configuration
app.cors.allowed-origins=http://localhost:5173,https://your-frontend-domain.com

# DynamoDB Table Names
dynamodb.table.bgvRequests=LTM-mne-paramount-BgvRequests
dynamodb.table.bgvRequestHistory=LTM-mne-paramount-BgvRequestHistory
dynamodb.table.bgvExcelUploadRecords=LTM-mne-paramount-BgvExcelUploadRecords
dynamodb.table.bgvExcelUploadCells=LTM-mne-paramount-BgvExcelUploadCells
```

## Build

From the `backend` directory:

```bash
mvn clean package
```

This creates `target/bgv-service.jar`.

## Run Locally

```bash
java -jar target/bgv-service.jar
```

Or using Maven:

```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

## Deploy to Production

### Option 1: Docker Container

1. Create a `Dockerfile`:

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/bgv-service.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

2. Build and run:

```bash
docker build -t bgv-service .
docker run -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID=xxx \
  -e AWS_SECRET_ACCESS_KEY=xxx \
  -e AWS_REGION=us-east-1 \
  bgv-service
```

### Option 2: AWS Elastic Beanstalk

1. Install EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize and deploy:
   ```bash
   eb init -p "Corretto 21" bgv-service
   eb create bgv-production
   eb deploy
   ```

### Option 3: AWS ECS/Fargate

Deploy the Docker container to ECS with Fargate for serverless container hosting.

### Option 4: Traditional Server

1. Copy `bgv-service.jar` to your server
2. Create a systemd service:

```ini
[Unit]
Description=BGV Service
After=network.target

[Service]
Type=simple
User=bgv
WorkingDirectory=/opt/bgv
ExecStart=/usr/bin/java -jar /opt/bgv/bgv-service.jar
Restart=on-failure
Environment="AWS_REGION=us-east-1"

[Install]
WantedBy=multi-user.target
```

3. Start the service:
   ```bash
   sudo systemctl enable bgv-service
   sudo systemctl start bgv-service
   ```

## API Endpoints

All endpoints are under `/api/bgv-requests`:

- `GET /api/bgv-requests` - List all requests
- `GET /api/bgv-requests/{id}` - Get request by ID
- `POST /api/bgv-requests` - Create new request
- `PUT /api/bgv-requests/{id}` - Update request
- `DELETE /api/bgv-requests/{id}` - Delete request

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for detailed API documentation.

## DynamoDB Setup

The application will **automatically create tables** on startup if they don't exist. Ensure your AWS credentials have permissions for:

- `dynamodb:CreateTable`
- `dynamodb:DescribeTable`
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Query`
- `dynamodb:Scan`

## Frontend Configuration

Update the frontend API endpoint in `frontend/src/services/bgvService.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api';  // For local development
// const API_BASE_URL = 'https://api.your-domain.com/api';  // For production
```

## Health Check

The Spring Boot Actuator endpoints are available:

- `GET /actuator/health` - Application health status

## Monitoring

- Check application logs: `tail -f logs/spring.log`
- Monitor with AWS CloudWatch (configure in application.properties)
- Use Spring Boot Actuator metrics

## Troubleshooting

### DynamoDB Connection Issues

- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM permissions for DynamoDB
- Verify region configuration matches DynamoDB table region

### CORS Errors

Update `app.cors.allowed-origins` in application.properties with your frontend URL.

### Port Already in Use

Change the port in application.properties:
```properties
server.port=8081
```

## Migration from Lambda

The Lambda handlers have been removed. The application now runs as a standard Spring Boot web application:

- ✅ Plain Java Spring Boot backend
- ✅ React Vite frontend
- ✅ DynamoDB intact and functional
- ❌ Lambda functions removed
- ❌ API Gateway removed (use direct HTTP endpoints)
