# BGV Request Management System

Background verification (BGV) request tracking for PM, PMO Admin, and Super Admin roles.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 21, Spring Boot 3.1, Spring Security, JWT, JPA, Flyway |
| Database | H2 file (`backend/data/bgverificationdb`) in PostgreSQL mode |
| Frontend | React 18, Vite, Axios (hash-based routing) |

## Run locally

### Backend
```bash
cd backend
mvn spring-boot:run
```
Or use `dev-run.ps1` (stops any old instance on port 8080 first).

- API: http://localhost:8080
- H2 console: http://localhost:8080/h2-console (`jdbc:h2:file:./data/bgverificationdb`, user `sa`, no password)

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

## Login

1. Enter PS Number
2. Select role (PM / PMO Admin / Super Admin)
3. Continue — JWT is obtained automatically in the background

Demo accounts (seeded on first run): `hr@demo.com` and `admin@demo.com` with password `Password123!`

## Project layout

```
BGV_Final_v24.0/
├── backend/    Spring Boot API
├── frontend/   React UI
└── README.md
```
