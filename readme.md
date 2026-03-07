# BGV Request Management System

A Background Verification (BGV) Request Management System built with **Java 21 Spring Boot** backend, **React + Vite** frontend, and **AWS DynamoDB** for data persistence.

## Architecture

**Technology Stack:**
- **Frontend**: React 18.2 + Vite (Standard SPA)
- **Backend**: Java 21 Spring Boot REST API (Embedded Tomcat)
- **Database**: AWS DynamoDB (4 tables with Global Secondary Indices)
- **Deployment**: Standard Spring Boot deployment (Docker, EC2, ECS, Elastic Beanstalk, etc.)
- **Optional**: SharePoint Graph API integration, OpenSearch (disabled by default)

> **Note**: This is a traditional 3-tier web application. Lambda-based architecture has been removed.

## Project Structure

```
BGV_Final/
├── Paramount_Project/
│   ├── backend/                    # Java 21 Spring Boot Application
│   │   ├── src/main/java/com/bgv/application/
│   │   │   ├── BgvApplication.java               # Spring Boot main class
│   │   │   ├── controller/
│   │   │   │   └── BgvRequestController.java     # REST endpoints
│   │   │   ├── service/
│   │   │   │   ├── BgvRequestService.java        # Business logic
│   │   │   │   ├── BgvRequestHistoryService.java # History tracking
│   │   │   │   └── ExcelUploadService.java       # Excel processing
│   │   │   ├── repository/
│   │   │   │   ├── BgvRequestRepository.java     # DynamoDB access
│   │   │   │   ├── BgvRequestHistoryRepository.java
│   │   │   │   └── BgvExcelUpload*Repository.java
│   │   │   ├── entity/
│   │   │   │   ├── BgvRequest.java               # Main entity
│   │   │   │   ├── BgvRequestHistory.java        # History records
│   │   │   │   └── BgvExcelUpload*.java          # Excel data
│   │   │   ├── dto/
│   │   │   │   └── BgvRequestDTO.java            # Data transfer objects
│   │   │   └── config/
│   │   │       ├── DynamoDBConfig.java           # DynamoDB client config
│   │   │       └── OpenSearchConfig.java         # Optional search
│   │   ├── src/main/resources/
│   │   │   ├── application.properties            # Spring Boot config
│   │   │   └── application-prod.properties       # Production config
│   │   ├── pom.xml                               # Maven dependencies
│   │   ├── SPRING_BOOT_DEPLOYMENT.md             # Deployment guide
│   │   └── target/
│   │       └── bgv-service.jar                   # Executable Spring Boot JAR
│   │
│   ├── frontend/                   # React + Vite SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── PmForm.jsx                    # Project Manager form
│   │   │   │   ├── AdminForm.jsx                 # Admin dashboard & form
│   │   │   │   ├── SuperAdmin.jsx                # Super Admin analytics
│   │   │   │   ├── History.jsx                   # History search
│   │   │   │   ├── HistoryModal.jsx              # History detail view
│   │   │   │   ├── PmDashboard.jsx               # PM request tracker
│   │   │   │   ├── YearlyDashboard.jsx           # Excel upload dashboard
│   │   │   │   └── ThemeToggleButton.jsx         # Dark/Light mode
│   │   │   ├── services/
│   │   │   │   └── bgvService.js                 # API client
│   │   │   ├── styles/
│   │   │   │   ├── form.css                      # Form styling
│   │   │   │   ├── admin-table.css               # Table styling
│   │   │   │   ├── theme.css                     # Theme variables
│   │   │   │   └── ltimindtree.css               # Brand styling
│   │   │   ├── App.jsx                           # Main router
│   │   │   └── main.jsx                          # Entry point
│   │   ├── vite.config.js                        # Vite build config
│   │   ├── package.json
│   │   └── dist/                                 # Production build (generated)
│   │
│   └── infrastructure/             # AWS CDK (deprecated - for Lambda only)
│       └── cdk/                    # No longer used for Spring Boot deployment
│
└── scripts/                        # Deployment scripts (deprecated - for Lambda only)
```

## Features

### PM Role Form Fields:
1. **BGV Requested by - PS No** (Number)
2. **BGV Requested by - Name** (Text - Login details)
3. **RR Number** (Decimal Number)
4. **Candidate ID / RH ID** (Text)
5. **Resource Name** (Text)
6. **Resource PS.No** (Number)
7. **Resource Type** (Dropdown: External, Internal)
8. **Geo Region** (Dropdown: India, LATAM, Europe, APAC, Australia)
9. **Country** (Dropdown: India, USA, Canada, UK, Australia, Mexico, Brazil, Germany, France)

### Admin Role Form Fields:
- All PM fields (for reference/validation)
- **Status** (Dropdown: Pending, Approved, Rejected, On Hold)
- **BGV Initiated By** (Text)
- **Comments from PMO Team** (Text Area)
- **Resource Onboarding Type** (Dropdown: Regular Request, Express Request)
- **Request Submitted on (Date)** (Date picker)

## Backend Setup

### Prerequisites:
- Java 21
- Maven 3.6+
- Spring Boot 3.1.5
- **AWS Account** with DynamoDB access
- **AWS CLI** configured with credentials

### Installation:

1. Configure AWS credentials:
```bash
aws configure
```

2. Navigate to backend directory:
```bash
cd Paramount_Project/backend
```

3. Update `src/main/resources/application.properties`:
   - Set your AWS region
   - Configure DynamoDB table names
   - Set CORS allowed origins for your frontend domain

4. Build the project:
```bash
mvn clean package
```

5. Run the application:
```bash
mvn spring-boot:run
```

Or run the JAR directly:
```bash
java -jar target/bgv-service.jar
```

The backend will start on `http://localhost:8080`

### Database:
- Uses **AWS DynamoDB** for data persistence
- Tables are automatically created on application startup
- 4 DynamoDB tables:
  - `LTM-mne-paramount-BgvRequests`
  - `LTM-mne-paramount-BgvRequestHistory`
  - `LTM-mne-paramount-BgvExcelUploadRecords`
  - `LTM-mne-paramount-BgvExcelUploadCells`

### Deployment:
For production deployment options (Docker, AWS ECS, Elastic Beanstalk, EC2), see [SPRING_BOOT_DEPLOYMENT.md](Paramount_Project/backend/SPRING_BOOT_DEPLOYMENT.md)

## Frontend Setup

### Prerequisites:
- Node.js 16+ and npm

### Installation:

1. Navigate to frontend directory:
```bash
cd Paramount_Project/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Build for production:
```bash
npm run build
```

## API Endpoints

### Base URL: `http://localhost:8080/api/bgv-requests`

#### Create Request
```
POST /api/bgv-requests
Content-Type: application/json

{
  "psNumber": "12345",
  "requestedByName": "John Doe",
  "rrNumber": 123.45,
  "candidateId": "CAND001",
  "resourceName": "Jane Smith",
  "resourcePsNo": "67890",
  "resourceType": "EXTERNAL",
  "geoRegion": "INDIA",
  "country": "INDIA",
  "status": "PENDING",
  "bgvInitiatedBy": "Admin User",
  "commentsFromPmo": "Standard background check",
  "onboardingType": "REGULAR_REQUEST",
  "requestSubmittedOn": "2024-01-19",
  "userRole": "PM"
}
```

#### Get All Requests
```
GET /api/bgv-requests
```

#### Get Request by ID
```
GET /api/bgv-requests/{id}
```

#### Get Requests by Role
```
GET /api/bgv-requests/role/{role}
```
- Roles: `PM`, `ADMIN`

#### Get Requests by Status
```
GET /api/bgv-requests/status/{status}
```
- Status: `PENDING`, `APPROVED`, `REJECTED`, `ON_HOLD`

#### Update Request
```
PUT /api/bgv-requests/{id}
Content-Type: application/json

{request body same as POST}
```

#### Delete Request
```
DELETE /api/bgv-requests/{id}
```

## Form Validation

### PM Form Validation:
- PS Number: Required, must be numeric
- Requested by Name: Required
- RR Number: Required, must be positive
- Candidate ID: Required
- Resource Name: Required
- Resource PS.No: Required, must be numeric
- Resource Type: Required
- Geo Region: Required
- Country: Required

### Admin Form Validation:
- All PM validations (when provided)
- Status: Required
- BGV Initiated By: Required
- Onboarding Type: Required
- Request Submitted on: Required, cannot be future date

## Technologies Used

### Backend:
- **Spring Boot 3.1.5** - Web framework
- **AWS DynamoDB** - NoSQL database
- **AWS SDK 2.20+** - DynamoDB enhanced client
- **Lombok** - Boilerplate reduction
- **Jakarta Validation** - Input validation
- **Apache POI 5.2.5** - Excel file processing
- **Microsoft Graph SDK** - SharePoint integration (optional)

### Frontend:
- **React 18.2.0** - UI library
- **Vite 5.0.0** - Build tool & dev server
- **Axios** - HTTP client
- **CSS3** - Styling with theme support

### Infrastructure:
- **AWS DynamoDB** - Data persistence with GSI
- **AWS IAM** - Access management for DynamoDB
- Standard Spring Boot deployment (no Lambda, no API Gateway)

## Development Guidelines

### Backend Development:
1. Add new endpoints in `controller/BgvRequestController.java`
2. Add business logic in `service/BgvRequestService.java`
3. Update entity in `entity/BgvRequest.java` if adding new fields
4. Update DTO in `dto/BgvRequestDTO.java` for input validation

### Frontend Development:
1. Create new form components in `src/components/`
2. Add API service methods in `src/services/bgvService.js`
3. Use provided CSS classes for consistent styling
4. Implement validation in form component's `validateForm()` method

## Error Handling

- All API responses follow a standard format with `success`, `message`, and `data` fields
- Form validation errors are displayed inline below each field
- API errors are displayed as alert messages
- Network errors are caught and displayed to the user

## CORS Configuration

The backend is configured to accept requests from `http://localhost:5173` (frontend default port).
To change this, modify the `app.cors.allowed-origins` property in `src/main/resources/application.properties`:

```properties
app.cors.allowed-origins=http://localhost:5173,https://your-production-domain.com
```

## Configuration Management

### Country to Geo-Region Mapping

The country to geo-region mapping used in the PM form is now dynamically configurable and can be updated after deployment without code changes.

**Location:** The mapping is configured in:
- Development: `backend/src/main/resources/application.properties`
- Production: `backend/src/main/resources/application-prod.properties`

**Property Name:** `bgv.country.georegion.mapping`

**Format:** `COUNTRY:GEOREGION,COUNTRY:GEOREGION,...`

**Example:**
```properties
bgv.country.georegion.mapping=INDIA:INDIA,UK:EUROPE,GERMANY:EUROPE,FRANCE:EUROPE,AUSTRALIA:AUSTRALIA,MEXICO:LATAM,BRAZIL:LATAM,USA:USA_AND_CANADA,CANADA:USA_AND_CANADA
```

**To update mapping after deployment:**
1. Edit the properties file in your deployment environment
2. Restart the Spring Boot application
3. The frontend will automatically fetch the updated mapping

**Note:** Country and GeoRegion values must match the enums defined in `BgvRequest.java`:
- **Countries:** INDIA, USA, CANADA, UK, AUSTRALIA, MEXICO, BRAZIL, GERMANY, FRANCE
- **GeoRegions:** INDIA, LATAM, EUROPE, APAC, AUSTRALIA, USA_AND_CANADA

## Future Enhancements

- User authentication and authorization (AWS Cognito)
- Advanced search with OpenSearch integration
- Request tracking and status history improvements
- Email/SMS notifications (AWS SES/SNS)
- Advanced reporting and analytics dashboards
- Enhanced file upload with S3 integration
- API rate limiting and throttling
- Comprehensive test coverage
- CI/CD pipeline automation

## Troubleshooting

### Backend won't start:
1. Ensure Java 21 is installed: `java -version`
2. Check Maven installation: `mvn -v`
3. Clear Maven cache: `mvn clean`

### Frontend won't start:
1. Delete `node_modules` folder
2. Run `npm install` again
3. Check Node version: `node -v`

### API connection issues:
1. Ensure backend is running on port 8080
2. Check CORS configuration in `application.properties`
3. Verify endpoint URLs in `bgvService.js`

### DynamoDB connection issues:
1. Verify AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions for DynamoDB operations
3. Ensure AWS region matches your DynamoDB tables
4. Check `dynamodb.endpoint` is not set (for AWS) or set to local endpoint

### Build issues:
1. Ensure Java 21 is installed: `java -version`
2. Clean Maven cache: `mvn clean`
3. Update dependencies: `mvn dependency:resolve`

## License

This project is for internal use at MnE.

---------------------------------------------------------------------
##Important notes (Author - Anapana Karthik Reddy)

What you need to know about the application - It is a use case highly made from the perspective of being able to keep track of the many bgv requests made by the project manager, their status, the admin to accept them or reject them based on various conditions, and for the super admin to see overall process of how many requests of which project manager are pending, data export to excel.

So, its basically a three role based access, right now the authentication is only the correct entering of your PS Number(assuming you are a project manager accessing this application), then the basic details can be filled overall in the pm submit request page. There is another feature express request, where the evidence needs to be uploaded, preferably an email pdf, The sharepoint integration is not done yet.


---------------------------------------------------------------------------------PROBLEMS FACED DURING DEPLOYMENT --

Deployment method followed is the ec2 for tomcat/backend through the war file, s3+cloudfront for frontend(react), dynamodb for the database. Cors policy was one of the major problems faced.

SOLUTION - solving cache error for the cors, enforcing cloudfront link everywhere, rechecking the s3 location(just in case), and reuploading the dist contents in the region where backend is, also CLOUDFRONT - INVALIDATION - /*, this has to be done without fail.


Mostly based on Ohio region (us-east-2). 


An alternative approach could have been using the docker image, docker compose, which would have been way more easier, but due to constraints could not be fulfilled.