# Quick Start Guide

## 5-Minute Setup

### Prerequisites Check
```bash
java -version    # Should be Java 21
mvn -v          # Should be Maven 3.6+
node -v         # Should be Node.js 16+
npm -v          # Should be npm 8+
```

---

## Start Backend (Terminal 1)

```bash
cd bgv-application/backend
mvn spring-boot:run
```

**Expected Output:**
```
...
2024-01-19 10:30:45.123 INFO 1234 --- [main] 
  o.s.b.w.embedded.tomcat.TomcatWebServer  : 
  Tomcat started on port(s): 8080
```

---

## Start Frontend (Terminal 2)

```bash
cd bgv-application/frontend
npm install
npm run dev
```

**Expected Output:**
```
VITE v5.0.0 ready in 234 ms

➜  Local:   http://localhost:5173/
```

---

## Access Application

Open your browser and go to: **http://localhost:5173**

You should see the BGV Request Management System with two tabs:
- **PM Form** - For Project Manager role
- **Admin Form** - For Admin role

---

## Test the Application

### Fill PM Form:
1. Click on "PM Form" tab
2. Fill all required fields (marked with *)
3. Click "Submit Request"
4. See success message

### Fill Admin Form:
1. Click on "Admin Form" tab
2. Fill all required fields
3. Click "Process Request"
4. See success message

---

## Check Backend Data

Access H2 Database Console:
1. Open: http://localhost:8080/h2-console
2. JDBC URL: `jdbc:h2:mem:testdb`
3. User: `sa`
4. Password: (leave blank)
5. Click "Connect"
6. Run SQL: `SELECT * FROM bgv_requests;`

---

## API Testing

### Using cURL (Terminal 3):

```bash
# Get all requests
curl http://localhost:8080/api/bgv-requests

# Create a request
curl -X POST http://localhost:8080/api/bgv-requests \
  -H "Content-Type: application/json" \
  -d '{
    "psNumber": "12345",
    "requestedByName": "John Doe",
    "rrNumber": 100.50,
    "candidateId": "CAND001",
    "resourceName": "Jane Smith",
    "resourcePsNo": "67890",
    "resourceType": "EXTERNAL",
    "geoRegion": "INDIA",
    "country": "INDIA",
    "status": "PENDING",
    "bgvInitiatedBy": "Admin",
    "commentsFromPmo": "Test",
    "onboardingType": "REGULAR_REQUEST",
    "requestSubmittedOn": "2024-01-19",
    "userRole": "PM"
  }'
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Java version: `java -version` should be 21 |
| Frontend won't start | Run `npm install` in frontend folder |
| Port 8080 in use | Change port in `backend/src/main/resources/application.properties` |
| Port 5173 in use | Use `npm run dev -- --port 5174` |
| API connection fails | Ensure backend is running on port 8080 |
| Forms look broken | Hard refresh: `Ctrl+Shift+R` (Windows) |

---

## File Structure Summary

```
bgv-application/
├── backend/           # Spring Boot (runs on 8080)
│   ├── pom.xml
│   └── src/
├── frontend/          # React + Vite (runs on 5173)
│   ├── package.json
│   └── src/
├── README.md          # Full documentation
└── (you are here)
```

---

## Next Steps

1. ✅ Run backend and frontend
2. ✅ Test PM and Admin forms
3. ✅ Check data in H2 console
4. 📖 Read [Main README.md](README.md) for complete documentation
5. 📝 Read [Backend SETUP.md](backend/SETUP.md) for backend details
6. 🎨 Read [Frontend SETUP.md](frontend/SETUP.md) for frontend details

---

## Field Reference

### PM Form (9 fields)
- PS Number (number)
- Requested by Name (text)
- RR Number (decimal)
- Candidate ID (text)
- Resource Name (text)
- Resource PS.No (number)
- Resource Type (dropdown: External/Internal)
- Geo Region (dropdown: India/LATAM/Europe/APAC/Australia)
- Country (dropdown: 9 countries)

### Admin Form (14 fields)
- All 9 PM fields PLUS:
- Status (dropdown: Pending/Approved/Rejected/On Hold)
- BGV Initiated By (text)
- Comments from PMO Team (textarea)
- Resource Onboarding Type (dropdown: Regular/Express)
- Request Submitted on (date picker)

---

## API Endpoints Summary

```
POST   /api/bgv-requests              # Create request
GET    /api/bgv-requests              # Get all
GET    /api/bgv-requests/{id}         # Get by ID
GET    /api/bgv-requests/role/{role}  # Filter by role
GET    /api/bgv-requests/status/{status} # Filter by status
PUT    /api/bgv-requests/{id}         # Update request
DELETE /api/bgv-requests/{id}         # Delete request
```

---

## Need Help?

1. Check terminal output for error messages
2. Open browser DevTools: Press `F12`
3. Go to Console tab for client-side errors
4. Go to Network tab to check API calls
5. Check backend logs in backend terminal

**Happy Testing! 🚀**
