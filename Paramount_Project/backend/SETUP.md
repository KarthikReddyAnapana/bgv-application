# Backend Setup and Installation Guide

## Prerequisites

Before setting up the backend, ensure you have:
- **Java Development Kit (JDK) 21**
- **Maven 3.6 or higher**
- **Git** (optional)

## Installation Steps

### 1. Verify Java Installation
```bash
java -version
```
Should output Java 21

### 2. Verify Maven Installation
```bash
mvn -v
```
Should output Maven 3.6+

### 3. Navigate to Backend Directory
```bash
cd bgv-application/backend
```

### 4. Build the Project
```bash
mvn clean install
```

This command will:
- Clean any previous build artifacts
- Download all dependencies
- Compile the Java code
- Run any tests
- Package the application

### 5. Run the Application
```bash
mvn spring-boot:run
```

Or, if you want to run the packaged JAR:
```bash
java -jar target/bgv-service-1.0.0.jar
```

The application will start on `http://localhost:8080`

## Database Configuration

The application uses **H2 Database** (in-memory database) for development.

### H2 Console
Access the H2 database console at: `http://localhost:8080/h2-console`

**Default credentials:**
- JDBC URL: `jdbc:h2:mem:testdb`
- User Name: `sa`
- Password: (leave blank)

## Available Endpoints

Once the backend is running, you can test the API using tools like Postman, cURL, or your frontend.

### Example API Call (create a BGV request):
```bash
curl -X POST http://localhost:8080/api/bgv-requests \
  -H "Content-Type: application/json" \
  -d '{
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
    "commentsFromPmo": "Standard check",
    "onboardingType": "REGULAR_REQUEST",
    "requestSubmittedOn": "2024-01-19",
    "userRole": "PM"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/bgv/application/
│   │   │   ├── BgvApplication.java          # Main Spring Boot Application
│   │   │   ├── entity/
│   │   │   │   └── BgvRequest.java          # JPA Entity
│   │   │   ├── dto/
│   │   │   │   └── BgvRequestDTO.java       # Data Transfer Object with Validation
│   │   │   ├── repository/
│   │   │   │   └── BgvRequestRepository.java # Data Access Layer
│   │   │   ├── service/
│   │   │   │   └── BgvRequestService.java   # Business Logic Layer
│   │   │   └── controller/
│   │   │       └── BgvRequestController.java # REST API Controller
│   │   └── resources/
│   │       └── application.properties        # Configuration File
│   └── test/                                 # Test classes
├── pom.xml                                   # Maven Configuration
└── target/                                   # Build output (generated)
```

## Configuration File (application.properties)

Located at: `src/main/resources/application.properties`

Key configurations:
- `server.port=8080` - Server port
- `spring.h2.console.enabled=true` - H2 console access
- `spring.jpa.hibernate.ddl-auto=create-drop` - Auto create/drop schema on startup

## Dependencies

Main dependencies included in `pom.xml`:

1. **spring-boot-starter-web** - Web development
2. **spring-boot-starter-data-jpa** - ORM support
3. **spring-boot-starter-validation** - Input validation
4. **h2database** - In-memory database
5. **lombok** - Boilerplate reduction

## Troubleshooting

### Issue: "Java version not supported"
**Solution:** Update your Java version to 21
```bash
java -version
```

### Issue: "Maven command not found"
**Solution:** Install Maven or add it to your PATH

### Issue: "Port 8080 already in use"
**Solution:** Kill the process using port 8080 or change the port in `application.properties`:
```properties
server.port=8081
```

### Issue: "Build fails with dependency errors"
**Solution:** Clear Maven cache and rebuild
```bash
mvn clean install -U
```

## Testing the API

### Using Postman:
1. Open Postman
2. Create a new POST request to `http://localhost:8080/api/bgv-requests`
3. Set Content-Type header to `application/json`
4. Add request body and send

### Using cURL:
See example API call section above

## Connecting with Frontend

The frontend (React) is configured to connect to `http://localhost:8080`.

Make sure both services are running:
1. Backend on port 8080
2. Frontend on port 5173

## IDE Setup (Optional)

### Using IntelliJ IDEA:
1. Open the project: File > Open > select `backend` folder
2. Maven should be automatically detected
3. Right-click on `pom.xml` > Maven > Reload

### Using VS Code:
1. Install Extension Pack for Java
2. Open the `backend` folder
3. Maven extension will automatically detect the project

## Building for Production

### Create executable JAR:
```bash
mvn clean package
```

### Run the JAR:
```bash
java -jar target/bgv-service-1.0.0.jar
```

## Next Steps

1. Start the backend: `mvn spring-boot:run`
2. Start the frontend: Go to `frontend` folder and run `npm run dev`
3. Open `http://localhost:5173` in your browser
4. Use the forms to submit BGV requests
