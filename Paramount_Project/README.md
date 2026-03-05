# BGV Request Management System

A comprehensive Background Verification (BGV) Request Management System built with Java Spring Boot backend and React + Vite frontend.

## Project Structure

```
bgv-application/
├── backend/           # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/bgv/application/
│   │   │   │   ├── BgvApplication.java
│   │   │   │   ├── entity/
│   │   │   │   │   └── BgvRequest.java
│   │   │   │   ├── dto/
│   │   │   │   │   └── BgvRequestDTO.java
│   │   │   │   ├── repository/
│   │   │   │   │   └── BgvRequestRepository.java
│   │   │   │   ├── service/
│   │   │   │   │   └── BgvRequestService.java
│   │   │   │   └── controller/
│   │   │   │       └── BgvRequestController.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   └── pom.xml
└── frontend/          # React + Vite Application
    ├── src/
    │   ├── components/
    │   │   ├── PmForm.jsx
    │   │   └── AdminForm.jsx
    │   ├── services/
    │   │   └── bgvService.js
    │   ├── styles/
    │   │   └── form.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
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

### Installation:

1. Navigate to backend directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Database:
- Uses H2 in-memory database for development
- Database console available at `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:testdb`

## Frontend Setup

### Prerequisites:
- Node.js 16+ and npm

### Installation:

1. Navigate to frontend directory:
```bash
cd frontend
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
- **Spring Data JPA** - ORM
- **H2 Database** - In-memory database
- **Lombok** - Boilerplate reduction
- **Jakarta Validation** - Input validation

### Frontend:
- **React 18.2.0** - UI library
- **Vite 5.0.0** - Build tool
- **Axios** - HTTP client
- **CSS3** - Styling

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
To change this, modify the `@CrossOrigin` annotation in `BgvRequestController.java`.

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

- User authentication and authorization
- Database migration to production database (PostgreSQL/MySQL)
- Request tracking and status history
- Email notifications
- Advanced reporting and analytics
- File upload for supporting documents
- API rate limiting
- Test coverage improvements

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
2. Check CORS configuration
3. Verify endpoint URLs in `bgvService.js`

## License

This project is for internal use at Paramount.
