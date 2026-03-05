# API Documentation and Examples

## Base URL
```
http://localhost:8080/api/bgv-requests
```

## API Endpoints

### 1. Create BGV Request
**Endpoint:** `POST /api/bgv-requests`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
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

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "BGV Request created successfully",
  "data": {
    "id": 1,
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
    "createdAt": "2024-01-19T10:30:45",
    "updatedAt": "2024-01-19T10:30:45",
    "userRole": "PM"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Error creating BGV Request: Validation failed"
}
```

---

### 2. Get All BGV Requests
**Endpoint:** `GET /api/bgv-requests`

**Request:**
```bash
curl http://localhost:8080/api/bgv-requests
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
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
      "createdAt": "2024-01-19T10:30:45",
      "updatedAt": "2024-01-19T10:30:45",
      "userRole": "PM"
    },
    {
      "id": 2,
      ...
    }
  ],
  "total": 2
}
```

---

### 3. Get BGV Request by ID
**Endpoint:** `GET /api/bgv-requests/{id}`

**Request:**
```bash
curl http://localhost:8080/api/bgv-requests/1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
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
    "createdAt": "2024-01-19T10:30:45",
    "updatedAt": "2024-01-19T10:30:45",
    "userRole": "PM"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "BGV Request not found"
}
```

---

### 4. Update BGV Request
**Endpoint:** `PUT /api/bgv-requests/{id}`

**Headers:**
```
Content-Type: application/json
```

**Request:**
```bash
curl -X PUT http://localhost:8080/api/bgv-requests/1 \
  -H "Content-Type: application/json" \
  -d '{
    "psNumber": "12345",
    "requestedByName": "John Doe",
    "rrNumber": 150.75,
    "candidateId": "CAND001",
    "resourceName": "Jane Smith",
    "resourcePsNo": "67890",
    "resourceType": "INTERNAL",
    "geoRegion": "USA",
    "country": "USA",
    "status": "APPROVED",
    "bgvInitiatedBy": "Admin User",
    "commentsFromPmo": "Updated comment",
    "onboardingType": "EXPRESS_REQUEST",
    "requestSubmittedOn": "2024-01-19",
    "userRole": "ADMIN"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "BGV Request updated successfully",
  "data": {
    "id": 1,
    "psNumber": "12345",
    "requestedByName": "John Doe",
    "rrNumber": 150.75,
    "candidateId": "CAND001",
    "resourceName": "Jane Smith",
    "resourcePsNo": "67890",
    "resourceType": "INTERNAL",
    "geoRegion": "USA",
    "country": "USA",
    "status": "APPROVED",
    "bgvInitiatedBy": "Admin User",
    "commentsFromPmo": "Updated comment",
    "onboardingType": "EXPRESS_REQUEST",
    "requestSubmittedOn": "2024-01-19",
    "createdAt": "2024-01-19T10:30:45",
    "updatedAt": "2024-01-19T11:45:30",
    "userRole": "ADMIN"
  }
}
```

---

### 5. Get Requests by Role
**Endpoint:** `GET /api/bgv-requests/role/{role}`

**Roles:** `PM`, `ADMIN`

**Request:**
```bash
curl http://localhost:8080/api/bgv-requests/role/PM
curl http://localhost:8080/api/bgv-requests/role/ADMIN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "psNumber": "12345",
      "requestedByName": "John Doe",
      ...
      "userRole": "PM"
    }
  ],
  "total": 1
}
```

---

### 6. Get Requests by Status
**Endpoint:** `GET /api/bgv-requests/status/{status}`

**Status Values:** `PENDING`, `APPROVED`, `REJECTED`, `ON_HOLD`

**Request:**
```bash
curl http://localhost:8080/api/bgv-requests/status/PENDING
curl http://localhost:8080/api/bgv-requests/status/APPROVED
curl http://localhost:8080/api/bgv-requests/status/REJECTED
curl http://localhost:8080/api/bgv-requests/status/ON_HOLD
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "psNumber": "12345",
      "requestedByName": "John Doe",
      ...
      "status": "PENDING"
    }
  ],
  "total": 1
}
```

---

### 7. Delete BGV Request
**Endpoint:** `DELETE /api/bgv-requests/{id}`

**Request:**
```bash
curl -X DELETE http://localhost:8080/api/bgv-requests/1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "BGV Request deleted successfully"
}
```

---

## Field Specifications

### Data Types and Enums

#### Resource Type
- `EXTERNAL`
- `INTERNAL`

#### Geo Region
- `INDIA`
- `LATAM`
- `EUROPE`
- `APAC`
- `AUSTRALIA`

#### Country
- `INDIA`
- `USA`
- `CANADA`
- `UK`
- `AUSTRALIA`
- `MEXICO`
- `BRAZIL`
- `GERMANY`
- `FRANCE`

#### Request Status
- `PENDING` (initial status)
- `APPROVED`
- `REJECTED`
- `ON_HOLD`

#### Onboarding Type
- `REGULAR_REQUEST`
- `EXPRESS_REQUEST`

#### User Role
- `PM` (Project Manager)
- `ADMIN`

---

## Validation Rules

### Required Fields:
- `psNumber` - Must be numeric
- `requestedByName` - Non-empty string
- `rrNumber` - Positive decimal number
- `candidateId` - Non-empty string
- `resourceName` - Non-empty string
- `resourcePsNo` - Must be numeric
- `resourceType` - Valid enum
- `geoRegion` - Valid enum
- `country` - Valid enum
- `status` - Valid enum
- `bgvInitiatedBy` - Non-empty string
- `onboardingType` - Valid enum
- `requestSubmittedOn` - Valid date (not future)
- `userRole` - Valid enum (PM or ADMIN)

### Optional Fields:
- `commentsFromPmo` - Text (any length)

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 201 | Created | Request successful |
| 200 | OK | Request successful |
| 400 | Bad Request | Check validation errors |
| 404 | Not Found | Check if ID exists |
| 500 | Internal Error | Server error, check logs |

---

## Common cURL Examples

### Create Request
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
    "bgvInitiatedBy": "Admin",
    "commentsFromPmo": "Test request",
    "onboardingType": "REGULAR_REQUEST",
    "requestSubmittedOn": "2024-01-19",
    "userRole": "PM"
  }'
```

### Get All Requests
```bash
curl http://localhost:8080/api/bgv-requests
```

### Get Specific Request
```bash
curl http://localhost:8080/api/bgv-requests/1
```

### Update Request
```bash
curl -X PUT http://localhost:8080/api/bgv-requests/1 \
  -H "Content-Type: application/json" \
  -d '{...updated data...}'
```

### Delete Request
```bash
curl -X DELETE http://localhost:8080/api/bgv-requests/1
```

### Filter by Role
```bash
curl http://localhost:8080/api/bgv-requests/role/PM
```

### Filter by Status
```bash
curl http://localhost:8080/api/bgv-requests/status/APPROVED
```

---

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "total": 10
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Testing with Postman

1. Create a new Collection
2. Add requests for each endpoint
3. Set environment variable: `{{base_url}}` = `http://localhost:8080`
4. Use `{{base_url}}/api/bgv-requests` for endpoints
5. Save request bodies as templates

---

## Rate Limiting
Currently not implemented. To be added in production.

## Authentication
Currently not implemented. To be added in production.

## CORS
Configured to allow requests from `http://localhost:5173` (frontend port).
