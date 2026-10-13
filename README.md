# University Bus Tracking System (Full Stack)

A production-ready, full-stack transit management and live bus tracking platform designed for university campuses. The system is built with a **Spring Boot 3 + MySQL** backend and a **React 19 + Vite 8 + Tailwind CSS** frontend, featuring interactive **Leaflet** maps, role-based security, seat allocation, and real-time student telematics.

---

## 📌 Project Overview & Key Features

The system orchestrates daily campus transit operations across three dedicated user roles:

### 1. 🛡️ Administrator Portal
- **Fleet & Infrastructure CRUD:** Manage buses (with capacities and vehicle photos), bus stops (with GPS coordinates), and transit corridors with ordered route stops.
- **Resource Assignments:** Pair Bus + Driver + Route into unified operational assignments.
- **Weekly Timetable Scheduling:** Configure directional departure slots (`OUTBOUND` toward campus and `RETURN` toward residential stops).
- **Transport Request Queue:** Review student transport applications, validate route coverage, and allocate specific bus seat numbers.
- **Live Fleet Tracking & Simulator:** Interactive campus-wide Leaflet map showing all active buses, with a built-in virtual demo fleet simulator.
- **Safe Resource Management:** Pre-flight dependency detection preventing destructive deletions and offering clean resource deactivation.

### 2. 🚍 Driver Portal
- **Trip Cockpit:** One-click trip dispatching (`Start Trip` and `End Trip`) with automatic route direction initialization (`OUTBOUND` vs `RETURN`).
- **Directional Traversal:** Real-time progression tracking indicating current stop, next stop, route progress percentage, and speed.
- **Student Roster:** Real-time list of all students approved for the driver's vehicle with assigned seat numbers and pickup stops.
- **Return Trip Preparation:** Automatic terminal repositioning for the return journey upon completing the morning outbound run.

### 3. 🎓 Student Portal
- **Transport Pass Application:** Select preferred pickup stop along campus transit routes and apply for bus transport.
- **Interactive Bus Seat Map:** Visual 3+aisle+2 bus seat map displaying student's assigned seat number, occupancy statistics, and privacy-protected passenger cards.
- **Direction-Aware Journey View:** High-level journey dashboard showing departure times, assigned driver, vehicle details, and boarding status (`Approaching`, `Arrived`, `En Route`).
- **Live Vehicle Tracking:** Real-time map displaying the bus location along OSRM road geometry, updated dynamically via 3-second polling.
- **System Alerts:** Automated notifications triggered when the trip starts, when the bus reaches the student's boarding stop, and when the trip finishes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | Spring Boot 3.3.4, Java 21 / 25 |
| **Security & Auth** | Spring Security 6, Stateless JWT (io.jsonwebtoken 0.12.6), BCrypt Password Encryption |
| **Database & ORM** | MySQL 8.0 (`university_bus_db`), Spring Data JPA, Hibernate (13 normalized tables, 21 foreign keys) |
| **Frontend Framework**| React 19, Vite 8 |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons, Framer Motion |
| **Routing** | React Router 7 with Role-Based Protected Routes (`<ProtectedRoute>`) |
| **Maps & Routing** | Leaflet 1.9, React-Leaflet, Open Source Routing Machine (OSRM) Road Polylines |
| **HTTP Client** | Axios with automated Bearer JWT request/response interceptors |
| **Build & Tooling** | Maven 3.9+, Node.js 20+, npm |

---

## 📁 Project Directory Structure

```
.
├── backend/                              # Spring Boot Backend Service
│   ├── src/main/java/com/university/bustracking/
│   │   ├── config/                       # Security, Web MVC, JWT Filter, Admin Bootstrap
│   │   ├── controller/                   # REST API Controllers (/api/**)
│   │   ├── dto/                          # Request & Response Data Transfer Objects
│   │   ├── entity/                       # JPA Relational Domain Entities
│   │   ├── repository/                   # Spring Data JPA Database Repositories
│   │   ├── service/                      # Core Business Logic & Security Services
│   │   └── util/                         # JWT Utility & Security Helpers
│   ├── src/main/resources/
│   │   ├── application.properties        # Default Development Configuration
│   │   └── application-prod.properties   # Hardened Production Profile (ddl-auto=validate)
│   └── src/test/                         # Automated Backend Test Suite (87 tests across 14 suites)
├── frontend/                             # React + Vite Frontend Application
│   ├── src/
│   │   ├── api/                          # Modular Axios API Services (apiClient, authApi, etc.)
│   │   ├── components/                   # Shared UI, Modals, Tables, Leaflet Map Components
│   │   ├── context/                      # AuthContext, NotificationContext, ToastContext
│   │   ├── pages/                        # Admin, Driver, and Student Portal Pages
│   │   ├── utils/                        # Media Resolution, Direction Mathematics, Route Geometry
│   │   └── App.jsx                       # Application Entry Point & Protected Routing
│   ├── .env.example                      # Frontend Local Environment Template
│   └── .env.production.example           # Frontend Production Environment Template
├── docs/                                 # Consolidated Project Documentation
│   ├── PRE_DEPLOYMENT_AUDIT.md           # Authoritative Pre-Deployment Audit Report
│   └── DEPLOYMENT_GUIDE.md               # Production Setup, Configuration & Operations Guide
├── .env.example                          # Root Environment Variables Template
└── pom.xml / package.json                # Project Build Configurations
```

---

## 💻 Prerequisites & Local Setup

### 1. Prerequisites
- **Java Development Kit (JDK):** Version 21 or 25 installed (`java -version`).
- **Apache Maven:** Version 3.9+ installed (`mvn -version`).
- **Node.js:** Version 20+ and **npm** installed (`node -v`, `npm -v`).
- **MySQL Database Server:** MySQL 8.0+ running on `localhost:3306`.

### 2. Database Preparation
Create the local MySQL database (the default development configuration connects to `localhost:3306` with user `root` and password `root`):

```sql
CREATE DATABASE IF NOT EXISTS university_bus_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

> [!TIP]
> If your local MySQL instance uses a different username or password, copy `.env.example` to `.env` or set `DB_USERNAME` and `DB_PASSWORD` in your terminal.

---

## 🚀 Running the Application Locally

### Step 1: Start the Backend Service
```bash
cd backend
mvn spring-boot:run
```
The backend starts up on **`http://localhost:5000`** and exposes REST APIs under `/api/**`.

### Step 2: Start the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts up on **`http://localhost:5173`**.

---

## 🔐 Initial Administrator Setup & User Roles

The application enforces strict role isolation:
- **Student Accounts:** Created freely via the public registration screen at `http://localhost:5173/register` (`Role.STUDENT` is enforced on the server).
- **Driver Accounts:** Can **only** be provisioned and managed by authenticated Administrators via the Admin Panel at `/admin/drivers`.
- **First Administrator Account:** Because automatic demo data seeding has been disabled, initialize your first administrator safely on first boot:

```bash
# In PowerShell / Command Prompt before running backend:
$env:ADMIN_BOOTSTRAP_USERNAME="admin"
$env:ADMIN_BOOTSTRAP_PASSWORD="YourSecureAdminPassword123!"
mvn spring-boot:run
```
On boot, `AdminBootstrapRunner` creates the initial administrator with a BCrypt-hashed password. Once created, remove the environment variables. The runner detects `adminCount > 0` on all future startups and will never reset or overwrite existing accounts.

---

## 🧪 Testing & Build Verification

The application maintains a comprehensive automated test suite and clean production compilation:

```bash
# Run backend test suite (87 tests across 14 suites):
cd backend
mvn test

# Run frontend production build:
cd frontend
npm run build
```

---

## 📚 Consolidated Documentation

For in-depth technical details, architectural audits, and production deployment specifications, consult the primary documents in `docs/`:

1. **[Pre-Deployment Audit Report (`docs/PRE_DEPLOYMENT_AUDIT.md`)](file:///c:/Users/ASUS/Desktop/University%20Bus%20Tracking%20System(Full%20Stack)/docs/PRE_DEPLOYMENT_AUDIT.md):**  
   The single authoritative technical audit report detailing Tasks 1 through 7, security boundaries, database schema, direction mathematics, automated test results, defect diagnostics, and staging checklists.
2. **[Production Deployment Guide (`docs/DEPLOYMENT_GUIDE.md`)](file:///c:/Users/ASUS/Desktop/University%20Bus%20Tracking%20System(Full%20Stack)/docs/DEPLOYMENT_GUIDE.md):**  
   Step-by-step operations guide covering production environment variables, `application-prod.properties`, Nginx reverse-proxy setup, SSL/TLS, compile-time `VITE_API_URL` configuration, persistent upload storage, and pre-launch smoke tests.
