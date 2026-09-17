# BGV Request Management System

Background verification (BGV) request tracking application for PM, PMO Admin, and Super Admin roles.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 21, Spring Boot 3.1, Spring Security, JWT, JPA, Flyway |
| Database | H2 file (`backend/data/bgverificationdb`) in PostgreSQL mode |
| Frontend | React 18, Vite, Axios, hash-based routing |

## Application Preview

### Login Screen

![BGV Login Screen](images/bgv-screenshot-01.jpeg)

### Dashboard

![BGV Dashboard](images/bgv-screenshot-02.jpeg)

### Request Management

![BGV Request Management](images/bgv-screenshot-03.jpeg)

### Application Screens

![BGV Application Screenshot 4](images/bgv-screenshot-04.jpeg)

![BGV Application Screenshot 5](images/bgv-screenshot-05.jpeg)

![BGV Application Screenshot 6](images/bgv-screenshot-06.jpeg)

![BGV Application Screenshot 7](images/bgv-screenshot-07.jpeg)

![BGV Application Screenshot 8](images/bgv-screenshot-08.jpeg)

![BGV Application Screenshot 9](images/bgv-screenshot-09.jpeg)

![BGV Application Screenshot 10](images/bgv-screenshot-10.jpeg)

![BGV Application Screenshot 11](images/bgv-screenshot-11.jpeg)

![BGV Application Screenshot 12](images/bgv-screenshot-12.jpeg)

![BGV Application Screenshot 13](images/bgv-screenshot-13.jpeg)

## Run Locally

### Backend

```bash
cd backend
mvn spring-boot:run
```

Or use `dev-run.ps1`, which stops any old instance running on port `8080` first.

- API: http://localhost:8080
- H2 Console: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/bgverificationdb`
- Username: `sa`
- Password: Leave empty

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Application: http://localhost:5173

## Login

1. Enter PS Number.
2. Select a role:
   - PM
   - PMO Admin
   - Super Admin
3. Continue — JWT is obtained automatically in the background.

### Demo Accounts

Demo accounts are seeded on the first run:

| Account | Password |
|---------|----------|
| `hr@demo.com` | `Password123!` |
| `admin@demo.com` | `Password123!` |

## Project Layout

```text
BGV_Final_v24.0/
├── backend/       Spring Boot API
├── frontend/      React UI
├── images/        Application screenshots
├── .gitignore
└── README.md
```
