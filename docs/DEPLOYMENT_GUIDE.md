# University Bus Tracking System — Production Deployment & Operations Guide

**System:** University Bus Tracking System (Full Stack)  
**Target Roles:** DevOps Engineers, System Administrators, Project Evaluators  
**Scope:** Production Configuration, Database Setup, Build Pipelines, Static Storage, Security Hardening, and Staging Verification.

---

## 1. Architecture & Deployment Overview

The University Bus Tracking System is structured as a decoupled full-stack application:

```
[ Client Browsers / Mobile Devices ]
                 │
                 ▼ HTTPS (Port 443)
       [ Nginx / Reverse Proxy ]
        ├── /api/**      ─────────► [ Spring Boot Backend (Port 5000) ]
        ├── /uploads/**  ─────────► [ Persistent Storage Disk (/var/app/uploads) ]
        └── /*           ─────────► [ React / Vite Static SPA (dist/) ]
                                                  │
                                                  ▼ JDBC (Port 3306)
                                     [ MySQL 8.0 Database Server ]
```

- **Backend:** Spring Boot 3.3.4 (Java 21/25), Spring Security 6, Spring Data JPA / Hibernate, JJWT. Packaged as an executable JAR.
- **Frontend:** React 19, Vite 8, Tailwind CSS, Axios, Leaflet. Built into static HTML, CSS, and JS bundles in `dist/`.
- **Database:** MySQL 8.0+ running with InnoDB engine and `utf8mb4` encoding.
- **File Storage:** Local persistent filesystem directory mapped to `/uploads/**` for bus photos and driver verification documents.

---

## 2. Local Development vs. Production Configuration

The backend supports two operational profiles: **Default (Development)** and **`prod` (Production)**.

| Configuration Area | Development (`application.properties`) | Production (`application-prod.properties`) |
|---|---|---|
| **Active Profile** | `default` (no profile flag required) | `prod` (via `SPRING_PROFILES_ACTIVE=prod`) |
| **Server Port** | `5000` (configurable via `PORT`) | Configured via `PORT` (defaults to 5000) |
| **Database Connection** | Defaults to `localhost:3306`, user `root`, password `root` | **Mandatory:** `${DB_URL}`, `${DB_USERNAME}`, `${DB_PASSWORD}` without fallbacks |
| **Hibernate DDL Auto** | `update` (automatically applies schema changes) | **`validate`** (strictly verifies schema; never alters tables at runtime) |
| **SQL Logging** | `show-sql=false`, formatted SQL enabled | `show-sql=false`, `format_sql=false`, minimal logging |
| **JWT Secret** | Fallback key provided for quick local boot | **Mandatory:** Cryptographically strong 256-bit Base64 secret via `JWT_SECRET` |
| **CORS Policy** | Defaults to `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5173` | **Mandatory:** Explicit trusted domains via `APP_CORS_ALLOWED_ORIGINS` |
| **File Upload Directory**| Defaults to `./uploads` | **Mandatory:** Absolute persistent path via `UPLOAD_DIR` |
| **Fail-Fast Safety** | Uses sensible dev defaults | **Fails startup immediately** if any required secret or configuration is absent |

---

## 3. Required Environment Variables

When running with `SPRING_PROFILES_ACTIVE=prod`, the backend requires the following environment variables. Do **not** commit actual secret values to version control.

### Backend Environment Variables

| Variable Name | Required? | Description & Constraints | Example Production Value |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **Yes** | Activates the production profile | `prod` |
| `PORT` | Optional | Web server port (defaults to 5000) | `5000` |
| `DB_URL` | **Yes** | MySQL JDBC URL (enable SSL, UTC timezone) | `jdbc:mysql://db.internal:3306/university_bus_db?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` | **Yes** | Dedicated non-root MySQL application user | `bus_app_user` |
| `DB_PASSWORD` | **Yes** | Strong, unique database password | *`<strong-random-db-password>`* |
| `JWT_SECRET` | **Yes** | 256-bit Base64-encoded HMAC key (min 32 bytes) | Generated via `openssl rand -base64 32` |
| `JWT_EXPIRATION` | Optional | Token validity in ms (default: 86400000 = 24h) | `86400000` |
| `UPLOAD_DIR` | **Yes** | Absolute, persistent filesystem directory path | `/var/app/uploads` *(Linux)* or `C:/app/uploads` *(Windows)* |
| `MEDIA_BASE_URL` | Optional | Public CDN or root domain for file links | `https://api.campusbus.university.edu` *(or omit for relative paths)* |
| `APP_CORS_ALLOWED_ORIGINS`| **Yes** | Comma-separated list of trusted frontend origins | `https://bus.university.edu,https://admin.bus.university.edu` |
| `ADMIN_BOOTSTRAP_USERNAME`| First Boot Only | Initial administrator username | `superadmin` |
| `ADMIN_BOOTSTRAP_PASSWORD`| First Boot Only | Initial administrator password (min 12 chars) | *`<strong-random-admin-password>`* |

### Frontend Build-Time Environment Variables

Because the frontend is a client-side Single Page Application (SPA), environment variables are embedded into JavaScript bundles **at compile time**:

| Variable Name | Required? | Description | Example Production Value |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | Backend API base URL (must include `/api` suffix) | `https://api.campusbus.university.edu/api` |
| `VITE_OSRM_URL` | Optional | OSRM routing server URL (default: public OSRM) | `https://router.project-osrm.org` |

---

## 4. MySQL Database Preparation

### 4.1 Database & User Creation (Least Privilege Separation)
Connect to your MySQL 8.0 server as `root` (or administrative DBA) and create a dedicated database with utf8mb4 collation:

```sql
-- 1. Create database with UTF-8 character encoding
CREATE DATABASE IF NOT EXISTS university_bus_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Create Schema Migration / DBA User (used for running baseline DDL and versioned migrations)
CREATE USER IF NOT EXISTS 'bus_migration_user'@'%' IDENTIFIED BY '<strong-migration-password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES 
    ON university_bus_db.* TO 'bus_migration_user'@'%';

-- 3. Create Runtime Application User (used strictly by Spring Boot runtime)
-- Principle of Least Privilege: NO DROP, NO ALTER, NO administrative privileges
CREATE USER IF NOT EXISTS 'bus_app_user'@'%' IDENTIFIED BY '<strong-runtime-password>';
GRANT SELECT, INSERT, UPDATE, DELETE 
    ON university_bus_db.* TO 'bus_app_user'@'%';

-- 4. Apply privilege changes
FLUSH PRIVILEGES;
```

### 4.2 Controlled Schema Initialization (Repeatable Baseline SQL)
The production profile strictly enforces:
```properties
spring.jpa.hibernate.ddl-auto=validate
```
Hibernate will **never** execute `CREATE TABLE`, `ALTER TABLE`, or `DROP TABLE` statements at runtime in production. Schema changes must be applied via a reviewed, controlled process prior to service launch.

1. **Execute Reviewed Baseline DDL Script:**
   Apply the reviewed baseline SQL schema containing all 13 normalized tables and 21 foreign key constraints using the migration account:
   ```bash
   mysql -u bus_migration_user -p university_bus_db < backend/src/main/resources/schema.sql
   ```
   *(Or run the reviewed baseline DDL script provided in your release package).*

2. **Verify Schema Tables & Constraints:**
   Log into MySQL and confirm that all 13 tables are present:
   ```sql
   USE university_bus_db;
   SHOW TABLES;
   ```
   Expected tables (13):
   - `assignments`, `bus_locations`, `bus_routes`, `bus_schedules`, `bus_stops`, `buses`
   - `driver_profiles`, `notifications`, `route_stops`, `student_profiles`
   - `transport_requests`, `trips`, `users`

3. **Production Validation Guarantee:**
   When Spring Boot starts with `spring.profiles.active=prod`, Hibernate's `SchemaValidator` compares JPA entity annotations against the database catalog. If any column, table, or constraint is missing or mismatched, Spring Boot fails fast on boot and logs the discrepancy without modifying live database tables.

---

## 5. Backend Build & Startup Commands

### 5.1 Package the Production JAR
Ensure Java 21 or 25 and Maven 3.9+ are installed. Run the packaging command from the `backend/` directory:

```bash
cd backend
mvn clean package -DskipTests
```
This produces the executable JAR: `target/bustracking-backend-0.0.1-SNAPSHOT.jar`.

### 5.2 Production Startup

#### Method 1: Environment Variables in Shell / Systemd
```bash
export SPRING_PROFILES_ACTIVE=prod
export PORT=5000
export DB_URL="jdbc:mysql://localhost:3306/university_bus_db?useSSL=false&serverTimezone=UTC"
export DB_USERNAME="bus_app_user"
export DB_PASSWORD="<strong-random-db-password>"
export JWT_SECRET="<strong-base64-jwt-secret-min-256-bit>"
export UPLOAD_DIR="/var/app/uploads"
export APP_CORS_ALLOWED_ORIGINS="https://bus.university.edu"

java -jar target/bustracking-backend-0.0.1-SNAPSHOT.jar
```

#### Method 2: Systemd Service Unit (`/etc/systemd/system/bustracking.service`)
```ini
[Unit]
Description=University Bus Tracking Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=bustracking
WorkingDirectory=/var/app/backend
ExecStart=/usr/bin/java -jar /var/app/backend/bustracking-backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

Environment=SPRING_PROFILES_ACTIVE=prod
Environment=PORT=5000
Environment=DB_URL=jdbc:mysql://127.0.0.1:3306/university_bus_db?useSSL=false&serverTimezone=UTC
Environment=DB_USERNAME=bus_app_user
Environment=DB_PASSWORD=<strong-random-db-password>
Environment=JWT_SECRET=<strong-base64-jwt-secret-min-256-bit>
Environment=UPLOAD_DIR=/var/app/uploads
Environment=APP_CORS_ALLOWED_ORIGINS=https://bus.university.edu

[Install]
WantedBy=multi-user.target
```

#### Method 3: Docker Deployment (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "5000:5000"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - PORT=5000
      - DB_URL=jdbc:mysql://db:3306/university_bus_db?useSSL=false&serverTimezone=UTC
      - DB_USERNAME=bus_app_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - UPLOAD_DIR=/var/app/uploads
      - APP_CORS_ALLOWED_ORIGINS=https://bus.university.edu
      - ADMIN_BOOTSTRAP_USERNAME=${ADMIN_BOOTSTRAP_USERNAME}
      - ADMIN_BOOTSTRAP_PASSWORD=${ADMIN_BOOTSTRAP_PASSWORD}
    volumes:
      - bus_uploads:/var/app/uploads
    depends_on:
      - db

  db:
    image: mysql:8.0
    restart: always
    environment:
      - MYSQL_DATABASE=university_bus_db
      - MYSQL_USER=bus_app_user
      - MYSQL_PASSWORD=${DB_PASSWORD}
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  bus_uploads:
  mysql_data:
```

---

## 6. Frontend Production Build & `VITE_API_URL` Configuration

### 6.1 Understanding Compile-Time Injection
In Vite, `import.meta.env.VITE_*` variables are statically replaced with literal strings during `npm run build`. Changing system environment variables on the web server after the build has no effect on already compiled JavaScript bundles.

### 6.2 Configuring `VITE_API_URL` for Production
1. In the `frontend/` directory, create `.env.production` (or configure `VITE_API_URL` in your CI/CD runner):
   ```bash
   # frontend/.env.production
   VITE_API_URL=https://api.campusbus.university.edu/api
   ```
   > [!IMPORTANT]
   > The URL must include the `/api` path suffix and match the public reverse-proxy domain routing to the backend.

2. Run the production build command:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
3. The compiled assets are placed in `frontend/dist/`:
   - `dist/index.html` (entry point)
   - `dist/assets/*.css` (optimized styles)
   - `dist/assets/*.js` (bundled JavaScript)

4. Deploy the contents of `frontend/dist/` to your static web server or CDN bucket.

---

## 7. Reverse Proxy, HTTPS & CORS Configuration (Nginx)

In production, place an Nginx reverse proxy in front of the services to provide SSL termination, serve static files, and forward API requests.

### 7.1 Understanding How the Frontend Resolves APIs and Media
The frontend utilizes two key resolution mechanisms:
1. **API Requests (`apiClient.js`):** Uses `VITE_API_URL` as Axios `baseURL`.
2. **Uploaded Media (`resolveMediaUrl.js`):** Strips `/api` from `VITE_API_URL` to derive the base server origin.
   - If `VITE_API_URL=/api` (unified domain), media paths like `/uploads/bus/photo.jpg` resolve to `https://bus.university.edu/uploads/bus/photo.jpg`.
   - If `VITE_API_URL=https://api.campusbus.university.edu/api` (separate API subdomain), media paths resolve to `https://api.campusbus.university.edu/uploads/bus/photo.jpg`.

Depending on your DNS and domain strategy, choose **Pattern A** or **Pattern B** below.

---

### 7.2 Architecture Pattern A: Unified Single Domain (Recommended)
In this topology, both the frontend SPA, backend REST API, and uploaded media are served under a single public domain (`bus.university.edu`).

- **Frontend Build Configuration:** `VITE_API_URL=/api` (or `https://bus.university.edu/api`)
- **Backend CORS Configuration:** `APP_CORS_ALLOWED_ORIGINS=https://bus.university.edu`

```nginx
# /etc/nginx/sites-available/bus.university.edu
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name bus.university.edu;
    return 301 https://$host$request_uri;
}

# Production HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bus.university.edu;

    ssl_certificate /etc/letsencrypt/live/bus.university.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bus.university.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 1. Frontend Static SPA Assets
    root /var/www/bus-tracking/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Uploaded Media & Files (/uploads/ -> /var/app/uploads/)
    location /uploads/ {
        alias /var/app/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri =404;
    }

    # 3. Backend REST API Reverse Proxy (/api/ -> Spring Boot Port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # File upload size limit (align with Spring's 10MB limit)
        client_max_body_size 20M;

        # HTTP/1.1 and keepalive
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

### 7.3 Architecture Pattern B: Dedicated API Subdomain
In this topology, the SPA runs on the primary domain (`bus.university.edu` or a CDN), while the backend API and uploads run on a dedicated API subdomain (`api.campusbus.university.edu`).

- **Frontend Build Configuration:** `VITE_API_URL=https://api.campusbus.university.edu/api`
- **Backend CORS Configuration:** `APP_CORS_ALLOWED_ORIGINS=https://bus.university.edu`
- **Upload Resolution Verification:** Because `resolveMediaUrl()` strips `/api` from `VITE_API_URL`, media paths resolve to `https://api.campusbus.university.edu/uploads/...`. Therefore, the **API subdomain server block MUST route `/uploads/` directly to storage**.

```nginx
# /etc/nginx/sites-available/bus-tracking-split

# HTTP to HTTPS redirect for both domains
server {
    listen 80;
    listen [::]:80;
    server_name bus.university.edu api.campusbus.university.edu;
    return 301 https://$host$request_uri;
}

# -------------------------------------------------------------
# 1. Frontend SPA Server Block (bus.university.edu)
# -------------------------------------------------------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bus.university.edu;

    ssl_certificate /etc/letsencrypt/live/bus.university.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bus.university.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/bus-tracking/frontend/dist;
    index index.html;

    # Client-side routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# -------------------------------------------------------------
# 2. Backend API & Media Server Block (api.campusbus.university.edu)
# -------------------------------------------------------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.campusbus.university.edu;

    ssl_certificate /etc/letsencrypt/live/api.campusbus.university.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.campusbus.university.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Upload file size limit
    client_max_body_size 20M;

    # Uploaded Media & Files (matches resolveMediaUrl origin)
    location /uploads/ {
        alias /var/app/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        # Allow cross-origin image embedding from the frontend domain
        add_header Access-Control-Allow-Origin "https://bus.university.edu";
        try_files $uri =404;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 8. Persistent Upload Storage Requirements

1. **Absolute Filesystem Path:**
   Configure `UPLOAD_DIR` to point to a permanent storage directory on the host:
   - Linux: `/var/app/uploads`
   - Windows: `C:/app/uploads`
2. **Directory Permissions:**
   Ensure the service user (e.g. `bustracking` or the container user) has read and write permissions:
   ```bash
   sudo mkdir -p /var/app/uploads
   sudo chown -R bustracking:bustracking /var/app/uploads
   sudo chmod -R 755 /var/app/uploads
   ```
3. **Subfolder Creation:**
   The backend's `FileStorageService` automatically creates subdirectories (`student/profile`, `driver/profile`, `driver/licensePhoto`, `bus`) inside `UPLOAD_DIR` on demand.
4. **Media URL Resolution:**
   The frontend utility `resolveMediaUrl()` strips `/api` from `VITE_API_URL` to derive the origin and prepends it to relative `/uploads/...` paths, ensuring images resolve correctly on deployed domains.

---

## 9. Secure Initial Administrator Creation

To prevent unauthorized access while avoiding default credentials, the application uses `AdminBootstrapRunner`:

### 9.1 First Startup Provisioning Procedure
1. On initial deployment before first startup, provide bootstrap credentials via environment variables:
   ```bash
   export ADMIN_BOOTSTRAP_USERNAME="system_admin"
   export ADMIN_BOOTSTRAP_PASSWORD="<strong-random-admin-password>"
   ```
2. Start the backend service once.
3. `AdminBootstrapRunner` checks `userRepository.countByRole(Role.ADMIN)`:
   - Since count is 0, it creates the administrator account with a BCrypt-hashed password.
   - It outputs the confirmation log:
     `Admin bootstrap SUCCESS: Created initial administrator account for username 'system_admin'.`
4. **Immediately unset or remove** `ADMIN_BOOTSTRAP_PASSWORD` from the deployment environment:
   ```bash
   unset ADMIN_BOOTSTRAP_PASSWORD
   ```

### 9.2 Safe Restart Guarantee
On all subsequent application restarts:
- `AdminBootstrapRunner` detects `adminCount > 0`.
- It outputs:
  `Admin bootstrap check: 1 administrator account(s) present. No bootstrap action required.`
- It exits immediately without taking any action. It will **never** overwrite, reset, or alter existing administrators.

### 9.3 Behavior When Bootstrap Credentials Are Omitted
If no administrator exists and the bootstrap variables are omitted:
- Spring Boot logs an advisory notice:
  `Admin bootstrap NOTICE: Zero administrator accounts found in database. To initialize the first administrator, supply ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD environment variables or JVM system properties.`
- The server starts safely without creating any insecure or default accounts.

---

## 10. Admin-Controlled Driver Provisioning Flow

Public registration strictly creates `STUDENT` accounts. Driver accounts can only be created by an authenticated `ADMIN`:

1. Admin logs into the system via `/login`.
2. Admin navigates to `/admin/drivers` and clicks **+ Add Driver**.
3. Admin enters driver credentials (username, password), contact information, license number, and uploads optional portrait and license photos.
4. Backend hashes the password with BCrypt, assigns `Role.DRIVER`, and sets `status = ScheduleStatus.ACTIVE`.
5. The provisioned driver logs in at `/login` and accesses the Driver Portal (`/driver/dashboard`).

---

## 11. Staging Deployment Checklist & Smoke Tests

Before opening the application to campus users, execute this smoke test checklist on the staging environment:

| Step | Test Objective | Action & Endpoint | Expected Verification |
|---|---|---|---|
| **1** | Health & Startup Check | `GET /api/auth/login` (OPTIONS / POST) | Returns HTTP 200/400 (not 404 or 502 Bad Gateway). |
| **2** | Initial Admin Authentication | `POST /api/auth/login` with admin credentials | Returns HTTP 200, JWT token, and `role: "Admin"`. |
| **3** | Public Registration Lockdown | `POST /api/auth/register` with payload `{"role": "ADMIN"}` | User is created as `STUDENT` (role escalation rejected). |
| **4** | Admin Driver Creation | `POST /api/admin/drivers` with admin token | Driver created; password hashed; returned in driver roster. |
| **5** | Driver Authentication & Portal | `POST /api/auth/login` with driver credentials | Returns HTTP 200, JWT token, and `role: "Driver"`. |
| **6** | Role Boundary Rejection | Driver token calling `GET /api/admin/buses` | Spring Security rejects with HTTP 403 Forbidden. |
| **7** | Student Booking Flow | Student submits `POST /api/transport/transport-request` | Request transitions to `PENDING`; visible in Admin pending queue. |
| **8** | Seat Allocation & Seat Map | Admin calls `PUT .../assign-students` | Seat allocated; `GET /api/transport/my-bus/seat-map` reflects student seat. |
| **9** | Directional Trip Lifecycle | Driver starts `OUTBOUND` trip and sends telematics | Live location updates on Admin & Student tracking maps. |
| **10** | Safe Delete Protection | Admin attempts to delete a Bus with active trip | Rejected with HTTP 409 Conflict (`ACTIVE_TRIP_EXISTS`). |
| **11** | Media Asset Access | View uploaded bus photo via `https://domain/uploads/...` | Image renders cleanly with HTTP 200. |

---

## 12. Pre-Launch Operations Summary & Related Documentation

- **Development Defaults Preserved:** Local developers can run `mvn spring-boot:run` and `npm run dev` with zero setup.
- **Production Strictly Hardened:** `application-prod.properties` enforces `validate` DDL, strong external secrets, and fail-fast startup.
- **Repository Clean:** No real secrets, passwords, or compiled assets are tracked in Git.

### Related Documentation:
- **[University Bus Tracking System README (`README.md`)](file:///c:/Users/ASUS/Desktop/University%20Bus%20Tracking%20System(Full%20Stack)/README.md):** Quickstart guide, architecture overview, role features, and directory structure.
- **[Pre-Deployment Audit Report (`docs/PRE_DEPLOYMENT_AUDIT.md`)](file:///c:/Users/ASUS/Desktop/University%20Bus%20Tracking%20System(Full%20Stack)/docs/PRE_DEPLOYMENT_AUDIT.md):** Comprehensive technical audit covering Tasks 1–7, empirical verification tests (87 passing backend tests), security boundaries, and defect resolutions.

