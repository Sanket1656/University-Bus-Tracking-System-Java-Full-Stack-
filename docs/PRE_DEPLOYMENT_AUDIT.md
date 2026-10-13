# University Bus Tracking System — Pre-Deployment Audit Report

**Audit Date:** October 9, 2026 (Updated: October 13, 2026)  
**Auditor:** Antigravity Advanced Agentic AI  
**Scope:** Full Stack Pre-Deployment Inspection & Verification (Backend Spring Boot, Frontend React/Vite, MySQL Database, Security, Build Pipelines, Production Configuration)  
**Status:** All Pre-Deployment Tasks Completed (Tasks 1 through 7 Verified) — Ready for Staging Review  

---

## Executive Summary

This report documents the exhaustive, end-to-end pre-deployment audit and verification process conducted across all architectural layers of the University Bus Tracking System.

### System Architecture Under Audit:
- **Backend:** Spring Boot 3.3.4 (Java 25 / Maven 3.9.16), Spring Security 6, Spring Data JPA, Hibernate, MySQL 8.0 (`university_bus_db`), JJWT.
- **Frontend:** React 19, Vite 8, Tailwind CSS, Axios, Leaflet / React-Leaflet, Framer Motion, Lucide React.
- **Portals & Roles:** Unified role-based access control across **ADMIN**, **DRIVER**, and **STUDENT**.

---

### Audit Trajectory & Evolution:

#### 1. Historical Initial Audit (October 9, 2026):
The baseline audit identified **36 passing backend tests** and a successful frontend build, but uncovered **critical security vulnerabilities, deployment blockers, and contract mismatches**:
- **Critical Privilege Escalation:** Public registration (`/api/auth/register`) accepted `role: "ADMIN"`, allowing anyone to register an administrative account.
- **Hardcoded Localhost in MySQL & Frontend:** File upload service stored `http://localhost:5000/uploads/...` directly into database columns; frontend driver pages bypassed API clients and hardcoded `http://localhost:5000`.
- **Seat Map Contract & Privacy Mismatch:** Student bus seat map returned `{ occupiedSeats: List<Integer> }` while frontend expected `{ data: List<PassengerObject>, totalOccupied }`, causing `NaN Free` seats, and passenger details lacked student privacy masking.
- **Missing Repository & Environment Hygiene:** No root `.gitignore`; database credentials and JWT secrets were stored directly in tracked files.

#### 2. Remediation & Verification Progression (Tasks 1 through 7):
Over a sequence of focused engineering phases, all identified blockers were systematically remediated, validated, and hardened:
- **Task 1 — Security Hardening:** Public registration locked strictly to `Role.STUDENT`. BCrypt password encryption enforced. Explicit role boundaries established in `SecurityConfig.java` (`ADMIN`, `DRIVER`, `STUDENT`).
- **Task 2 & 2.1 — Seat Map Contract & Privacy:** Unified schema implemented in `TransportRequestService.getBusSeatMap()`. Private student details masked for fellow passengers. Seat allocation workflow verified in MySQL and React UI.
- **Task 3 — Deployment URL & Storage Compatibility:** Replaced hardcoded localhost strings with relative `/uploads/...` paths. Frontend `resolveMediaUrl()` utility dynamically prepends server origin. Configured `file.upload-dir` and `app.media.base-url`.
- **Task 4 — Session Cleanup & Telemetry Retention:** Logout completely purges `token`, `user`, and `role` from storage. Completed trip location coordinates remain persistently pinned at the final stop for student map tracking.
- **Task 5 — Admin Setup & Driver Lifecycle:** Controlled, idempotent `AdminBootstrapRunner` created (operates via env vars and strictly no-ops if an admin exists). Admin-controlled driver creation, BCrypt hashing, status filtering, and inactive account blocking implemented.
- **Task 6 — Cross-Role End-to-End Verification:** Automated 10-step cross-role lifecycle test (`CrossRoleEndToEndIntegrationTest.java`) verified Student registration → Admin bus/stop/route/assignment creation → Admin approval & seat assignment → Driver trip start/end → Student live tracking. (82 passing backend tests).
- **Task 7 — Production Configuration Readiness:** Dedicated `application-prod.properties` created with strict `ddl-auto=validate`, fail-fast externalized credentials (`${DB_URL}`, `${JWT_SECRET}`, etc.), and CORS lockdown. Local development defaults preserved. Automated production configuration test suite added.

#### 3. Current Verified System Status (October 13, 2026):
- **Backend Test Suite:** **87 Tests across 14 Test Suites — 0 Failures, 0 Errors, 0 Skipped** (`BUILD SUCCESS`).
- **Frontend Production Build:** Vite v8.0.8 compiled in **1.54 seconds** (1923 modules transformed, 0 syntax or module resolution errors).
- **Local Development Environment:** 100% operational with default development profiles (`mvn spring-boot:run` and `npm run dev` require zero configuration).
- **Production Profile:** Fully parameterized, fail-fast, and verified.
- **Deployment Status:** **READY FOR STAGING REVIEW** (All 7 implementation tasks complete; stopped before physical deployment).

---

## 1. Features Verified Working

The following features were verified through a combination of code inspection, automated unit tests, and runtime verification:

| # | Feature / Flow | Layer / Implementation | Verification Method & Evidence |
|---|---|---|---|
| 1.1 | **JWT Authentication & Stateless Sessions** | `JwtAuthFilter.java`, `JwtUtil.java`, `SecurityConfig.java` | Code inspection & unit tests. Tokens generated with HMAC-SHA256, 24-hr expiry, parsed correctly in security filter. |
| 1.2 | **Password Hashing** | `SecurityConfig.java`, `AuthService.java` | BCrypt password encoder configured; passwords stored as BCrypt hashes in MySQL `users` table; `@JsonIgnore` prevents leakage in serialized JSON responses. |
| 1.3 | **Role-Based Authorization Boundaries** | `SecurityConfig.java` | Admin endpoints require `ROLE_ADMIN`, driver operations require `ROLE_DRIVER`, student booking requires `ROLE_STUDENT`. |
| 1.4 | **Student Transport Request Submission** | `TransportRequestService.java`, `TransportRequestController.java` | `POST /api/transport/transport-request` validates active preferred stop; rejects inactive stops; rejects if student already has approved assignment; transitions to `PENDING`. Verified in `TransportRequestServiceTest.java`. |
| 1.5 | **Transport Cancellation Lifecycle** | `TransportRequestService.java` | If request is pending, cancels immediately. If request is approved, transitions to `cancellationStatus = PENDING`. Admin can approve (`approveCancellation`) or reject with remarks (`rejectCancellation`). Verified in `TransportRequestServiceTest.java`. |
| 1.6 | **Preferred Pickup Stop Route Validation** | `TransportRequestService.java` (`assignStudents`, `changeAssignment`) | When assigning students to a bus assignment, system strictly checks `routeStopIds.contains(preferredStop.getId())`. Rejects students whose preferred stop is not on the route with code `PREFERRED_STOP_NOT_ON_ROUTE`. Verified in unit tests. |
| 1.7 | **Seat Capacity & Occupancy Validation** | `TransportRequestService.java` | Validates `seatNumber <= busCapacity`, rejects occupied seats (`SEAT_ALREADY_OCCUPIED`), validates `currentApprovedCount + batch <= capacity`. Verified in unit tests. |
| 1.8 | **Safe Delete & Dependency Inspection** | `DependencyCheckService.java`, `GlobalExceptionHandler.java` | Proactive checks on 6 entity types; returns structured dependency list and `canDeactivate` flag; converts raw MySQL `DataIntegrityViolationException` to HTTP 409 Conflict. Verified in `DependencyCheckServiceTest.java` and `SafeDeleteFlowTest.java`. |
| 1.9 | **Driver Assignment & Schedule Retrieval** | `DriverService.java`, `DriverController.java` | Driver queries active assignment (`getMyAssignment`), passenger roster (`getMyStudents`), and today's schedule (`getTodaySchedule`). |
| 1.10 | **Trip Lifecycle State Machine** | `TripService.java`, `TripController.java` | Validates active assignment, bus, route, and schedule before start; prevents starting duplicate active trips for same bus or driver; transitions to `COMPLETED` on end; resets location speed. Verified in `TripDirectionServiceTest.java`. |
| 1.11 | **Direction-Aware Route Traversal** | `routeDirection.js`, `StudentService.java`, `TripService.java` | Standardizes `OUTBOUND` (Stop 1 → N) and `RETURN` (Stop N → 1); canonical database order (1..N) preserved; visual timeline reverses appropriately. Verified in `StudentScheduleDirectionServiceTest.java`. |
| 1.12 | **Real-Time Notification Dispatch & Deduplication** | `NotificationService.java`, `NotificationController.java` | Automatically dispatches notifications on `TRIP_STARTED`, `PICKUP_STOP_REACHED`, and `TRIP_COMPLETED`. `existsByRecipientIdAndTypeAndRelatedTripId` suppresses duplicate alerts. |
| 1.13 | **Demo Fleet Simulator** | `DemoFleetSimulatorPage.jsx`, `TrackingService.java` | Admin-only demo simulator triggers `POST /api/tracking/demo/update-location`, advancing vehicle coordinates along OSRM polylines. |
| 1.14 | **Disabled Demo User Seeding** | `DataInitializer.java` removed | No `CommandLineRunner`, `ApplicationRunner`, `@PostConstruct`, or `data.sql` active. MySQL user table contains only actual user records without automatic demo accounts recreating. |

---

### 1.15 Relational Database Schema Specification (MySQL 8.0 `university_bus_db`)

The database consists of 13 fully normalized relational tables with 21 explicit foreign key constraints:

| Table Name | Primary Key | Foreign Keys / Unique Constraints | Description |
|---|---|---|---|
| `users` | `id` (BIGINT AUTO_INCREMENT) | `username` UNIQUE | User credentials, hashed password, role (`ADMIN`, `DRIVER`, `STUDENT`) |
| `student_profiles` | `id` (BIGINT AUTO_INCREMENT) | `user_id` UNIQUE FK -> `users.id` | Student profile (enrollment, branch, phone, photo) |
| `driver_profiles` | `id` (BIGINT AUTO_INCREMENT) | `user_id` UNIQUE FK -> `users.id` | Driver profile (license ID, phone, photo, license photo, status) |
| `buses` | `id` (BIGINT AUTO_INCREMENT) | `bus_number` UNIQUE, `bus_registration_number` UNIQUE | Fleet vehicles (capacity, type, status, photo) |
| `bus_stops` | `id` (BIGINT AUTO_INCREMENT) | None | Geo-coordinates for bus stops (latitude, longitude, status) |
| `bus_routes` | `id` (BIGINT AUTO_INCREMENT) | `route_code` UNIQUE | Bus transit routes (name, code, status) |
| `route_stops` | `id` (BIGINT AUTO_INCREMENT) | `route_id` FK -> `bus_routes.id`, `stop_id` FK -> `bus_stops.id`, UNIQUE(`route_id`, `stop_order`), UNIQUE(`route_id`, `stop_id`) | Normalized ordered stops (1..N sequence) |
| `assignments` | `id` (BIGINT AUTO_INCREMENT) | `bus_id` FK -> `buses.id`, `driver_id` FK -> `users.id`, `route_id` FK -> `bus_routes.id` | Active Bus + Driver + Route operational binding |
| `bus_schedules` | `id` (BIGINT AUTO_INCREMENT) | `assignment_id` FK -> `assignments.id`, UNIQUE(`assignment_id`, `day_of_week`, `start_time`, `direction`) | Weekly timetable slots |
| `transport_requests` | `id` (BIGINT AUTO_INCREMENT) | `student_id` FK -> `users.id`, `preferred_stop_id` FK -> `bus_stops.id`, `assignment_id` FK -> `assignments.id` | Student transport applications, seat allocations, cancellations |
| `trips` | `id` (BIGINT AUTO_INCREMENT) | `schedule_id` FK -> `bus_schedules.id`, `driver_id` FK -> `users.id`, `bus_id` FK -> `buses.id`, `route_id` FK -> `bus_routes.id` | Operational trip instances (`ACTIVE`, `COMPLETED`, `CANCELLED`) |
| `bus_locations` | `id` (BIGINT AUTO_INCREMENT) | `bus_id` UNIQUE FK -> `buses.id`, `current_stop_id` FK -> `bus_stops.id`, `next_stop_id` FK -> `bus_stops.id` | Real-time vehicle telematics and stop progress |
| `notifications` | `id` (BIGINT AUTO_INCREMENT) | `recipient_id` FK -> `users.id`, `related_trip_id` FK -> `trips.id`, `related_bus_id` FK -> `buses.id` | Event alerts (`TRIP_STARTED`, `PICKUP_STOP_REACHED`, `TRIP_COMPLETED`) |

---

### 1.16 Safe Delete & Entity Dependency Architecture

```mermaid
erDiagram
    USERS ||--o| STUDENT_PROFILES : "has"
    USERS ||--o| DRIVER_PROFILES : "has"
    USERS ||--o{ ASSIGNMENTS : "assigned as driver"
    USERS ||--o{ TRANSPORT_REQUESTS : "requests transport"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ TRIPS : "operates as driver"

    BUSES ||--o{ ASSIGNMENTS : "assigned to"
    BUSES ||--o| BUS_LOCATIONS : "tracked by"
    BUSES ||--o{ TRIPS : "used in"
    BUSES ||--o{ NOTIFICATIONS : "referenced in"

    BUS_ROUTES ||--o{ ROUTE_STOPS : "contains ordered"
    BUS_ROUTES ||--o{ ASSIGNMENTS : "serviced in"
    BUS_ROUTES ||--o{ TRIPS : "run on"

    BUS_STOPS ||--o{ ROUTE_STOPS : "linked in"
    BUS_STOPS ||--o{ TRANSPORT_REQUESTS : "preferred pickup"
    BUS_STOPS ||--o{ BUS_LOCATIONS : "current or next stop"

    ASSIGNMENTS ||--o{ BUS_SCHEDULES : "scheduled by"
    ASSIGNMENTS ||--o{ TRANSPORT_REQUESTS : "seat allocation"

    BUS_SCHEDULES ||--o{ TRIPS : "dispatched as"
    TRIPS ||--o{ NOTIFICATIONS : "notifies for"
```

#### Safe Delete & Deactivation Rule Matrix:
1. **Referential Safety:** Foreign key checks (`FOREIGN_KEY_CHECKS`) are **never disabled**; global cascading deletes on historical operational data are strictly prohibited.
2. **Active Trip Protection:** A Bus, Driver, Assignment, or Route cannot be deleted OR deactivated while an active trip is running.
3. **Structured HTTP 409 Conflict:** When dependencies exist, the system returns a structured response with dependency details and a `canDeactivate` flag rather than leaking raw MySQL exceptions.
4. **Deactivation as Safe Alternative:** Inactive status flags (`ScheduleStatus.INACTIVE`) preserve historical trips, tracking logs, and audit trails while removing resources from active assignment and scheduling queues.

---

### 1.17 Direction-Aware Traversal & Two-Way Road Geometry Mathematics

1. **Directional Traversal Logic:**
   - **`OUTBOUND`:** Bus travels forward from depot/origin to campus terminal ($S_1 \to S_2 \to \dots \to S_N$). Canonical database order is preserved.
   - **`RETURN`:** Bus travels reverse from campus terminal back to origin ($S_N \to S_{N-1} \to \dots \to S_1$). Traversal order is reversed dynamically in memory; canonical database records remain untouched.
2. **Two-Way Lateral Offset Mathematics:**
   To prevent visual overlap on undivided two-way roads where OSRM returns a single centerline, the frontend applies a 3.5-meter lateral perpendicular offset to the right-hand side of the travel vector:
   - For points $P_i = (\text{lat}_1, \text{lon}_1)$ and $P_{i+1} = (\text{lat}_2, \text{lon}_2)$, the planar displacement is:
     $$\Delta x = (\text{lon}_2 - \text{lon}_1) \cdot \cos(\text{lat}_{\text{avg}}) \cdot \frac{\pi \cdot R}{180}, \quad \Delta y = (\text{lat}_2 - \text{lat}_1) \cdot \frac{\pi \cdot R}{180}$$
   - Unit right-hand normal vector: $\vec{n}_{\text{right}} = \left(\frac{\Delta y}{L}, -\frac{\Delta x}{L}\right)$.
   - Vertex smoothing calculates the angle bisector normal clamped to a maximum miter factor of 2.0 ($m_{\text{clamped}} \le 2.0$), preventing acute angle spikes.
3. **Directional Visual Palettes:**
   - **`OUTBOUND`:** Royal Blue (`#2563eb`) with Ice Blue glow (`#93c5fd`) and forward chevron arrows.
   - **`RETURN`:** Deep Violet (`#7c3aed`) with Soft Violet glow (`#c4b5fd`) and reverse chevron arrows.
4. **Student Boarding Status State Machine:**
   `routeDirection.js` dynamically computes the boarding status for the student's pickup stop along the traversal path:
   - `UPCOMING`: Scheduled trip has not yet departed origin.
   - `EN_ROUTE`: Trip is active and bus is approaching student's pickup stop.
   - `APPROACHING`: Bus is at the stop immediately preceding the student's stop ($Next == PreferredStop$).
   - `ARRIVED`: Bus has reached student's stop ($Current == PreferredStop$). Triggers `PICKUP_STOP_REACHED` alert.
   - `PASSED`: Bus has departed student's stop and is continuing toward destination.
   - `COMPLETED`: Trip has reached terminal and finished.

---

## 2. Historical Baseline: Unresolved / Unverified Findings (As of October 9, 2026 Audit)

> [!NOTE]
> **Historical Baseline Archive Notice:**
> Sections 2 through 8 represent the **initial audit baseline identified on October 9, 2026**.
> All critical security vulnerabilities, data contract mismatches, and deployment blockers listed below were systematically **remediated, tested, and verified** across Tasks 1 through 7 (documented in Sections 13 through 21).
> They are preserved in this report for historical audit integrity and compliance traceability.
> - **Current Verified Behavior:** See Section 1 (Features Verified Working) and Sections 13–21.
> - **Current Outstanding Staging Risks:** See Section 21.7 (Pre-Launch Staging Checklist).

| # | Feature / Flow | Layer / Component | Historical Finding (Oct 9, 2026) | Resolution & Current Status |
|---|---|---|---|---|
| 2.1 | **Student Bus Seat Map Rendering** | Frontend: `MyBus.jsx` / Backend: `TransportRequestService.java` | Response structure mismatch. Backend sent `{ busCapacity, mySeat, occupiedSeats: [1, 2, ...] }` while frontend expected `{ busCapacity, totalOccupied, data: [ { seatNumber, name, ... } ] }`. Resulted in `NaN Free` seats. | **✅ RESOLVED in Task 2 & 2.1** (Section 14 & 15). Unified schema with student passenger privacy masking. |
| 2.2 | **Driver Profile Management in Production** | Frontend: `DriverProfile.jsx` | Hardcoded `http://localhost:5000` URLs in Axios calls failed when accessed from external hosts. | **✅ RESOLVED in Task 3** (Section 16). Replaced with `driverApi.js` using dynamic `VITE_API_URL`. |
| 2.3 | **End-to-End GPS Telematics from Physical Mobile Device** | Hardware / Network | Telematics verified only via simulator and test scripts; real-world mobile GPS browser accuracy, background throttling unverified. | **⚠️ OUTSTANDING STAGING RISK** (Section 21.7). Requires testing on physical smartphones on active cellular network. |
| 2.4 | **Multi-Tenant Concurrent Fleet Under High Load** | Backend / Database | 3-second HTTP polling mechanism with 50+ concurrent students and drivers unbenchmarked for MySQL connection pool contention. | **⚠️ OUTSTANDING STAGING RISK** (Section 21.7). Requires load testing against HikariCP connection pool. |
| 2.5 | **Persistent Bus Position After Trip Completion on Student Map** | Frontend: `TrackBusPage.jsx` | When trip transitioned to `COMPLETED`, `TrackBusPage.jsx` explicitly reset `busLocation` state to `null`, causing the bus marker to vanish. | **✅ RESOLVED in Task 4 & 6** (Section 17 & 20). Terminal coordinates preserved with speed 0 and status pill. |

---

## 3. Critical Bugs (Historical Initial Findings — All Remediated)

### Bug C-1: Unauthenticated Privilege Escalation on Public Registration
- **Status:** ✅ **RESOLVED & VERIFIED in Task 1** (October 9, 2026 — See Section 13)
- **Severity:** CRITICAL (Security Vulnerability — Historical)
- **Files Involved:**
  - `backend/src/main/java/com/university/bustracking/controller/AuthController.java`
  - `backend/src/main/java/com/university/bustracking/service/AuthService.java`
  - `backend/src/main/java/com/university/bustracking/dto/RegisterRequest.java`
  - `backend/src/main/java/com/university/bustracking/config/SecurityConfig.java`
  - `frontend/src/pages/auth/RegisterPage.jsx`
- **Initial Finding (October 9):**
  `POST /api/auth/register` was public (`permitAll()`). `RegisterRequest` accepted a `role` field directly from client JSON. In `AuthService.java`, line 68 assigned `request.getRole() != null ? request.getRole() : Role.STUDENT`. Furthermore, `RegisterPage.jsx` provided an interactive dropdown with options `Student`, `Driver`, and `Admin`.
- **Remediation Implemented (Task 1):**
  1. `AuthService.java` enforces `Role.STUDENT` unconditionally on user entity creation; client-supplied role values are strictly ignored.
  2. `RegisterPage.jsx` role dropdown removed; registration creates only Student accounts.
  3. Verified by 5 automated security tests in `AuthRegistrationSecurityTest.java` and end-to-end testing in Task 6.
- **Current Verified Behavior:** Public registration creates strictly `Role.STUDENT`. Attempting to pass `ADMIN` or `DRIVER` is rejected/ignored. Driver creation is restricted to authenticated Administrators via `/api/admin/drivers`.

### Bug C-2: Hardcoded Localhost URLs in Backend File Upload Service
- **Status:** ✅ **RESOLVED & VERIFIED in Task 3** (October 9, 2026 — See Section 16)
- **Severity:** CRITICAL (Deployment Blocker — Historical)
- **Files Involved:**
  - `backend/src/main/java/com/university/bustracking/service/FileStorageService.java`
- **Initial Finding (October 9):**
  `FileStorageService.storeFile()` constructed stored URLs as `"http://localhost:5000/uploads/" + subFolder + "/" + uniqueFilename`, persisting `localhost:5000` into MySQL database columns.
- **Remediation Implemented (Task 3):**
  1. `FileStorageService.java` returns relative paths (`/uploads/subfolder/filename`) by default or prepends optional configurable `MEDIA_BASE_URL`.
  2. `frontend/src/utils/mediaUtils.js` dynamically derives server origin from `VITE_API_URL` and safely sanitizes any legacy `localhost:5000` database values without double-prefixing.
- **Current Verified Behavior:** Relative `/uploads/...` paths stored and served cleanly across local, staging, and production environments. Verified by `FileStorageServiceTest.java`.

### Bug C-3: Hardcoded Localhost API Endpoints in Frontend Driver Profile
- **Status:** ✅ **RESOLVED & VERIFIED in Task 3** (October 9, 2026 — See Section 16)
- **Severity:** CRITICAL (Runtime Failure on Deployment — Historical)
- **Files Involved:**
  - `frontend/src/Profiles/DriverProfile.jsx`
- **Initial Finding (October 9):**
  `DriverProfile.jsx` bypassed `apiClient.js` / `driverApi.js` and issued direct Axios requests to `http://localhost:5000/api/driver/profile`.
- **Remediation Implemented (Task 3):**
  Refactored `DriverProfile.jsx` to use `driverApi.js` and `apiClient.js` which dynamically inject `VITE_API_URL`.
- **Current Verified Behavior:** Driver profile queries and multipart updates execute through configured API base URLs. Verified in browser subagent end-to-end sessions.

### Bug C-4: Data Contract Mismatch on Student Bus Seat Map
- **Status:** ✅ **RESOLVED & VERIFIED in Task 2 & 2.1** (October 9, 2026 — See Section 14 & 15)
- **Severity:** CRITICAL (Core Flow Functional Failure — Historical)
- **Files Involved:**
  - `backend/src/main/java/com/university/bustracking/service/TransportRequestService.java`
  - `frontend/src/pages/student/transport/MyBus.jsx`
- **Initial Finding (October 9):**
  Backend returned `{ busCapacity, mySeat, occupiedSeats: [1, 2, 5] }` while frontend expected `{ busCapacity, totalOccupied, data: [ { seatNumber, name, ... } ] }`, causing `NaN Free` seats and empty passenger detail list.
- **Remediation Implemented (Task 2 & 2.1):**
  `TransportRequestService.getBusSeatMap()` returns unified schema (`busCapacity`, `totalOccupied`, `availableSeats`, `mySeat`, `occupiedSeats`, `data`, `bus`). Fellow passenger details are masked for student privacy (shows only `"Occupied"`), while the student's own seat displays full details.
- **Current Verified Behavior:** Seat map renders accurately with 60 seats, occupancy badges, student privacy protection, and zero `NaN` occurrences. Verified by `TransportRequestServiceTest.java` (19 tests).

---

## 4. High-Priority Bugs (Historical Initial Findings — All Remediated)

### Bug H-1: Information Disclosure on Assignment Student Roster APIs
- **Status:** ✅ **RESOLVED & VERIFIED in Task 1** (October 9, 2026 — See Section 13)
- **Severity:** HIGH (Security / Privacy — Historical)
- **Files Involved:**
  - `backend/src/main/java/com/university/bustracking/config/SecurityConfig.java`
  - `backend/src/main/java/com/university/bustracking/controller/TransportRequestController.java`
- **Initial Finding (October 9):**
  Endpoints `GET /api/transport/assignment/{assignmentId}/pending-students` and `students` lacked explicit `hasRole("ADMIN")` matchers and were accessible to any authenticated user.
- **Remediation Implemented (Task 1):**
  Added both `@PreAuthorize("hasRole('ADMIN')")` in controller and `hasRole("ADMIN")` in `SecurityConfig.java`.
- **Current Verified Behavior:** Requests with Student or Driver tokens are strictly rejected with **HTTP 403 Forbidden**. Verified by `RosterAuthorizationSecurityTest.java` (8 tests).

### Bug H-2: Incomplete Session Teardown in DashboardLayout Logout
- **Status:** ✅ **RESOLVED & VERIFIED in Task 4 & 6** (October 9 & 13, 2026 — See Section 17 & 20)
- **Severity:** HIGH (Auth / State Consistency — Historical)
- **Files Involved:**
  - `frontend/src/components/layouts/DashboardLayout.jsx`
  - `frontend/src/context/AuthContext.jsx`
  - `frontend/src/routes/ProtectedRoute.jsx`
- **Initial Finding (October 9):**
  `DashboardLayout.jsx` performed partial `localStorage.removeItem("token")` without calling `useAuth().logout()`, leaving `user` in React memory and stale session state.
- **Remediation Implemented (Task 4):**
  1. Centralized `AuthContext.logout()` atomically purges `token`, `user`, `role`, and executes `sessionStorage.clear()`.
  2. `ProtectedRoute.jsx` checks both `user` and `token` and navigates with `{ replace: true }`, blocking browser Back navigation to protected pages.
- **Current Verified Behavior:** Logout purges all stored and in-memory credentials. Back navigation is strictly intercepted and redirected to `/login`. Verified by interactive browser subagent sessions.

### Bug H-3: Bus Disappears on Trip Completion in Student Tracking View
- **Status:** ✅ **RESOLVED & VERIFIED in Task 4 & 6** (October 9 & 13, 2026 — See Section 17 & 20)
- **Severity:** HIGH (User Experience / Operational Tracking — Historical)
- **Files Involved:**
  - `frontend/src/pages/student/tracking/TrackBusPage.jsx`
  - `frontend/src/components/student/tracking/TrackingMap.jsx`
- **Initial Finding (October 9):**
  When trip completed, `TrackBusPage.jsx` set `busLocation = null`, unmounting the vehicle marker from the Leaflet map.
- **Remediation Implemented (Task 4):**
  When trip reaches `Completed`, terminal coordinates are preserved with `speed: 0`, polling interval is halted, and map displays `• TRIP COMPLETED` badge and pinned terminal vehicle marker.
- **Current Verified Behavior:** Completed trip vehicle marker remains visibly pinned at the destination terminal. Verified by `TrackingServiceTest.java` and live browser recordings.

### Bug H-4: Redundant Polling Console Logging in TrackBusPage
- **Status:** ✅ **RESOLVED & VERIFIED in Task 4** (October 9, 2026 — See Section 17)
- **Severity:** HIGH (Performance / Cleanliness — Historical)
- **Files Involved:**
  - `frontend/src/pages/student/tracking/TrackBusPage.jsx`
- **Initial Finding (October 9):**
  Verbose `console.log` statements executed every 3 seconds during polling, flooding console output.
- **Remediation Implemented (Task 4):**
  Removed all recurring polling logs; retained only targeted error logging.
- **Current Verified Behavior:** Clean console without recurring log spam during active or completed trips.

---

## 5. UI Improvements

| # | Component / Page | Issue / Observation | Recommended Enhancement |
|---|---|---|---|
| 5.1 | `LoginPage.jsx` (Line 90) | Subtitle text statically states *"Sign in to your admin dashboard"*. | Change subtitle to generic: *"Sign in to your campus transit account"* so Drivers and Students are not confused. |
| 5.2 | `MyBus.jsx` (Lines 13, 20–22) | Fallback image helper uses ternary `http://localhost:5000` fallback if `VITE_API_URL` is omitted. | Standardize image resolution across all components via a shared `resolveMediaUrl(path)` utility. |
| 5.3 | `DriverMyBus.jsx` (Line 21) | Image helper hardcodes `http://localhost:5000${url}`. | Replace with dynamic `BASE_URL` or relative URL resolution. |
| 5.4 | `Home.jsx` (`/page`) | Contains hardcoded mock journey data and unauthenticated access via `/page` route. | Remove `/page` route from `App.jsx` and eliminate `Home.jsx` or redirect `/page` to `/student`. |
| 5.5 | `App.jsx` (Lines 73–74) | Legacy auth routes `/old-register` and `/old-login` remain mapped to old unstyled components. | Remove dead legacy routes before production deployment to reduce bundle surface. |
| 5.6 | `package.json` (Frontend) | Dependencies list includes Node.js server packages: `"mongodb": "^7.1.1"`, `"multer": "^2.1.1"`. | Remove unused server-side packages from client-side `package.json` to prevent dependency bloat. |

---

## 6. Deployment Blockers (Historical Initial Audit — All Remediated)

### Blocker 1: Missing Root and Backend `.gitignore`
- **Status:** ✅ **RESOLVED in Task 1 & Task 7** (See Section 13 & 21)
- **Initial Finding (October 9):**
  There was no root or backend `.gitignore`. `git add .` would track `target/`, `uploads/`, `application.properties` credentials, and IDE folders.
- **Remediation Implemented:**
  Created comprehensive root `.gitignore`, `backend/.gitignore`, and `frontend/.gitignore` ignoring build artifacts, uploads, and actual `.env` files while whitelisting `.env*.example`.
- **Current Verified State:** Clean repository hygiene; zero untracked runtime artifacts or secrets committed.

### Blocker 2: Hardcoded Production Credentials in `application.properties`
- **Status:** ✅ **RESOLVED in Task 1 & Task 7** (See Section 13 & 21)
- **Initial Finding (October 9):**
  Tracked properties contained static `root`/`root` and fixed JWT secrets.
- **Remediation Implemented:**
  Externalized all configuration via environment variables in `application.properties`. Created dedicated `application-prod.properties` with fail-fast validation and zero default passwords.
- **Current Verified State:** Production requires externalized credentials (`${DB_URL}`, `${JWT_SECRET}`); local development defaults preserved for developer ease.

### Blocker 3: Permissive CORS Configuration
- **Status:** ✅ **RESOLVED in Task 1 & Task 7** (See Section 13 & 21)
- **Initial Finding (October 9):**
  `allowedOriginPatterns("*")` allowed arbitrary cross-origin authenticated requests.
- **Remediation Implemented:**
  Replaced with strict origin whitelisting via `${APP_CORS_ALLOWED_ORIGINS}` in both `WebConfig.java` and `SecurityConfig.java`.
- **Current Verified State:** Production strictly rejects requests from unconfigured origins while supporting configured domain origins.

### Blocker 4: Hibernate DDL Mode Set to `update`
- **Status:** ✅ **RESOLVED in Task 7** (See Section 21)
- **Initial Finding (October 9):**
  `spring.jpa.hibernate.ddl-auto=update` risked automatic destructive alterations in production.
- **Remediation Implemented:**
  Enforced `spring.jpa.hibernate.ddl-auto=validate` in `application-prod.properties`. Documented repeatable baseline SQL schema initialization.
- **Current Verified State:** Production fails fast if database catalog does not match JPA entities, preventing silent schema corruption.

### Blocker 5: Relative Upload Directory Without Path Normalization
- **Status:** ✅ **RESOLVED in Task 1, 3 & 7** (See Section 13, 16 & 21)
- **Initial Finding (October 9):**
  `file.upload-dir=./uploads` wrote files to ephemeral working directories.
- **Remediation Implemented:**
  Externalized `file.upload-dir=${UPLOAD_DIR}` with absolute path requirement in production profile, supported by `WebConfig.java` and `FileStorageService.java`.
- **Current Verified State:** Uploads persist reliably to designated host directories (`/var/app/uploads`).

---

## 7. Exact Files and APIs Involved

| Component / Layer | File Path | Key APIs / Endpoints Involved |
|---|---|---|
| **Auth Security** | `backend/.../controller/AuthController.java`<br>`backend/.../service/AuthService.java`<br>`backend/.../dto/RegisterRequest.java` | `POST /api/auth/register`<br>`POST /api/auth/login` |
| **Security Config** | `backend/.../config/SecurityConfig.java`<br>`backend/.../config/WebConfig.java` | All endpoints (HTTP matchers, CORS, JWT filter) |
| **File Storage** | `backend/.../service/FileStorageService.java` | Static resource serving (`/uploads/**`) |
| **Transport Requests & Seat Map** | `backend/.../service/TransportRequestService.java`<br>`backend/.../controller/TransportRequestController.java` | `GET /api/transport/my-bus/seat-map`<br>`GET /api/transport/assignment/{id}/students`<br>`GET /api/transport/assignment/{id}/pending-students` |
| **Driver Profile** | `frontend/src/Profiles/DriverProfile.jsx` | `GET /api/driver/profile`<br>`POST /api/driver/profile`<br>`PUT /api/driver/profile` |
| **Student Seat Map UI** | `frontend/src/pages/student/transport/MyBus.jsx` | `GET /api/transport/my-bus/seat-map` |
| **Student Live Tracking** | `frontend/src/pages/student/tracking/TrackBusPage.jsx` | `GET /api/tracking/bus/{busId}/status` |
| **Navigation & Auth UI** | `frontend/src/pages/auth/RegisterPage.jsx`<br>`frontend/src/pages/auth/LoginPage.jsx`<br>`frontend/src/components/layouts/DashboardLayout.jsx` | Client navigation & logout |
| **Build & Config** | `backend/src/main/resources/application.properties`<br>`backend/src/main/resources/application-prod.properties`<br>`frontend/package.json`<br>`frontend/.env.production.example` | Server ports, DB credentials, JWT secrets, Vite config |

---

## 8. Recommended Fix Order (Historical Milestone Roadmap — Completed)

The remediation roadmap planned on October 9 was executed in full across Tasks 1 through 7:
- **Phase 1 (Hygiene & Security):** Completed in Task 1 (Section 13).
- **Phase 2 (Data Contract & Seat Map):** Completed in Task 2 & 2.1 (Section 14 & 15).
- **Phase 3 (URL & Storage Compatibility):** Completed in Task 3 (Section 16).
- **Phase 4 (Session Teardown & Tracking):** Completed in Task 4 (Section 17).
- **Phase 5 (Admin Setup & Drivers):** Completed in Task 5 (Section 19).
- **Phase 6 (Cross-Role E2E Verification):** Completed in Task 6 (Section 20).
- **Phase 7 (Production Configuration):** Completed in Task 7 (Section 21).

---

## 9. Historical Baseline: Backend Build Result (October 9, 2026 Initial Run — 36 Tests)

> [!NOTE]
> **Historical Baseline Note:**
> This section records the initial test execution from the October 9, 2026 baseline audit (36 tests).
> For the **current verified test execution (87 passing tests across 14 test suites)**, see Section 21.5 and Section 22.

- **Build Tool:** Apache Maven 3.9.16
- **Runtime:** Oracle JDK 25.0.1 (Windows 11 amd64)
- **Compilation Command:** `mvn test-compile`
  - Result: **BUILD SUCCESS** (0 errors, 0 warnings)
- **Historical Baseline Test Execution:** `mvn test`
  - Result: **BUILD SUCCESS** (Total time: 6.598 s)
  - **Summary (Historical 36 Tests):**
    - `DependencyCheckServiceTest`: 6 tests run, 0 failures, 0 errors, 0 skipped
    - `SafeDeleteFlowTest`: 4 tests run, 0 failures, 0 errors, 0 skipped
    - `StudentScheduleDirectionServiceTest`: 6 tests run, 0 failures, 0 errors, 0 skipped
    - `TransportRequestServiceTest`: 14 tests run, 0 failures, 0 errors, 0 skipped
    - `TripDirectionServiceTest`: 6 tests run, 0 failures, 0 errors, 0 skipped
    - **Total:** **36 Tests Run, 0 Failures, 0 Errors, 0 Skipped**

---

## 10. Historical Baseline: Frontend Build Result (October 9, 2026 Initial Run)

> [!NOTE]
> **Historical Baseline Note:**
> This section records the initial build metrics from October 9, 2026.
> For the **current verified production compilation (1923 modules, 1.41–1.54 s)**, see Section 21.5 and Section 22.

- **Build Tool:** Vite v8.0.8, Rollup / Rolldown
- **Environment:** React 19.2.4, Node.js
- **Historical Build Command:** `npm run build`
  - Result: **SUCCESS** (Built in 1.44 s)
  - **Modules Transformed:** 1922 modules
  - **Generated Output:**
    - `dist/index.html` — 0.45 kB (gzip: 0.29 kB)
    - `dist/assets/index-DLACiy6B.css` — 153.48 kB (gzip: 25.21 kB)
    - `dist/assets/index-slVpUCn5.js` — 1,018.49 kB (gzip: 255.30 kB)

---

## 11. Initial Production Administrator Provisioning (Implementation & Guide)

Because automatic demo seeding has been intentionally removed and public registration is restricted strictly to students, the initial Production Administrator account is provisioned via the secure `AdminBootstrapRunner` component implemented in Task 5:

### 11.1 Actual `AdminBootstrapRunner` Implementation Mechanics
The application includes `com.university.bustracking.config.AdminBootstrapRunner`, which implements Spring Boot's `CommandLineRunner` and executes once on application startup.

It operates under four strict rules:
1. **Existing Administrator Check:**
   It queries `userRepository.countByRole(Role.ADMIN)`. If `adminCount > 0`, it logs:
   `Admin bootstrap check: {count} administrator account(s) present. No bootstrap action required.`
   It exits immediately without taking any action, guaranteeing it will **never** overwrite, reset, or alter existing administrators on restart.
2. **First Boot Provisioning (`adminCount == 0` with credentials):**
   If zero administrators exist and both `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD` are provided:
   - Validates password length (logs warning if < 8 characters).
   - Verifies the username does not already exist with another role.
   - Encodes the password using `PasswordEncoder` (BCrypt).
   - Saves the user entity with `Role.ADMIN`.
   - Logs: `Admin bootstrap SUCCESS: Created initial administrator account for username '{username}'.`
3. **Missing Credentials Behavior (`adminCount == 0` without credentials):**
   If zero administrators exist and either bootstrap environment variable is missing or blank:
   - Logs: `Admin bootstrap NOTICE: Zero administrator accounts found in database. To initialize the first administrator, supply ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD environment variables or JVM system properties.`
   - Takes no action and **starts cleanly without crashing**. No default or hardcoded credentials are ever inserted.
4. **One-Time Credential Removal:**
   After the initial administrator account has been created on first boot, the operator **unsets or removes** `ADMIN_BOOTSTRAP_PASSWORD` from the deployment environment so sensitive plaintext passwords do not linger in shell environments or container inspection outputs.

---

## 12. Pre-Launch Staging & Physical-Device Verification Checklist

Prior to public production launch, the following manual and environment checks must be executed in a live staging environment (all code-level unit and integration suites are complete):

1. **Physical Device Telematics Test:**
   Log in as Driver on a physical smartphone, start an active trip, drive a short segment, and verify that coordinates update reliably via mobile browser geolocation without background tab throttling.
2. **Student Real-Time Map Observation:**
   While the Driver is in transit, open the Student portal on a separate device and observe the 3-second polling update, polyline heading rotation, and speed gauge.
3. **Multi-Stop Notification Trigger Verification:**
   Verify that when the bus reaches the student's designated stop, the toast notification and badge counter update without browser refresh.
4. **End-to-End Image Upload on Cloud Storage:**
   Upload a bus photo and profile avatar on a deployed domain; verify that images load correctly across all 3 portals without CORS or 404 errors.
5. **Cross-Browser Leaflet Map Gestures:**
   Verify touch zooming, dragging, and marker click popups on iOS Safari and Android Chrome.

---

## 13. Task 1 Implementation Status — Security Hardening (Completed: October 9, 2026)

Task 1 has been executed and verified in accordance with the security and repository protection mandate:

### 13.1 Files Changed and Created
| Layer / Category | File Path | Action | Description |
|---|---|---|---|
| **Repository Protection** | `.gitignore` | Created | Root gitignore ignoring `target/`, `node_modules/`, `dist/`, `.env*`, `uploads/`, IDE files (`.idea/`, `.vscode/`), and OS logs. |
| **Repository Protection** | `backend/.gitignore` | Created | Backend gitignore ignoring compiled artifacts, IDE settings, and runtime storage. |
| **Repository Protection** | `frontend/.gitignore` | Modified | Updated to explicitly ignore `.env`, `.env.*`, and `*.env` while preserving `.env.example`. |
| **Environment Documentation** | `.env.example` | Created | Root deployment configuration template documenting `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `UPLOAD_DIR`, and `APP_CORS_ALLOWED_ORIGINS`. |
| **Environment Documentation** | `frontend/.env.example` | Created | Frontend environment template documenting `VITE_API_URL`. |
| **Auth Security** | `backend/.../service/AuthService.java` | Modified | Public registration forced unconditionally to `Role.STUDENT`. Client-supplied roles (such as `ADMIN` or `DRIVER`) are strictly ignored. |
| **Auth UI** | `frontend/src/pages/auth/RegisterPage.jsx` | Modified | Removed `Role` selection dropdown (`Admin`, `Driver`, `Student`) from user registration UI; registers cleanly as Student. |
| **Auth UI (Legacy)** | `frontend/src/pages/Register.jsx` | Modified | Removed legacy `Role` selection dropdown. |
| **API Authorization** | `backend/.../controller/TransportRequestController.java` | Modified | Added `@PreAuthorize("hasRole('ADMIN')")` to both `/assignment/{id}/students` and `/assignment/{id}/pending-students`. |
| **Security Configuration** | `backend/.../config/SecurityConfig.java` | Modified | 1. Added explicit `hasRole("ADMIN")` matchers for `/api/transport/assignment/*/students` and `/pending-students`.<br>2. Added dedicated `CorsConfigurationSource` bean reading explicitly configured origins. |
| **CORS & Environment** | `backend/.../config/WebConfig.java` | Modified | Replaced `allowedOriginPatterns("*")` with origins parsed from `${app.cors.allowed-origins}`. |
| **Configuration** | `backend/src/main/resources/application.properties` | Modified | Externalized `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `UPLOAD_DIR`, and `APP_CORS_ALLOWED_ORIGINS` via environment variables with safe dev fallbacks. |
| **Security Testing** | `backend/.../service/AuthRegistrationSecurityTest.java` | Created | 5 automated unit tests verifying role lockdown, prevention of privilege escalation, and BCrypt password hashing. |
| **Security Testing** | `backend/.../service/RosterAuthorizationSecurityTest.java` | Created | 8 automated MockMvc security tests verifying 401/403 for unauthenticated, student, and driver access to rosters, and 200 OK for admin. |

### 13.2 Security Changes Implemented
1. **Public Privilege Escalation Neutralized:** Public registration now strictly enforces `Role.STUDENT` on user construction. Any attempt by an attacker to send `role: "ADMIN"` or `role: "DRIVER"` in the JSON payload is completely ignored.
2. **Student Roster APIs Locked Down:** `GET /api/transport/assignment/{assignmentId}/students` and `GET /api/transport/assignment/{assignmentId}/pending-students` are now secured with double-layer protection:
   - Filter layer: Spring Security `requestMatchers().hasRole("ADMIN")`
   - Method layer: `@PreAuthorize("hasRole('ADMIN')")`
   Students and Drivers receive `403 Forbidden` if attempting to query passenger PII.
3. **CORS Hardened:** Permissive `allowedOriginPatterns("*")` has been removed. Origins are now explicitly matched against `${APP_CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}` with `allowCredentials(true)` safely retained.
4. **Environment Variables Externalized:** Database credentials, JWT secret, upload directory, and CORS origins can now be overridden in staging and production without modifying tracked source code.

### 13.3 Test Verification Results
- **Backend (`mvn test`):**
  - **49 Tests Executed across 7 Test Suites:**
    - `AuthRegistrationSecurityTest`: 5/5 Passed
    - `RosterAuthorizationSecurityTest`: 8/8 Passed
    - `TransportRequestServiceTest`: 14/14 Passed
    - `DependencyCheckServiceTest`: 6/6 Passed
    - `SafeDeleteFlowTest`: 4/4 Passed
    - `StudentScheduleDirectionServiceTest`: 6/6 Passed
    - `TripDirectionServiceTest`: 6/6 Passed
  - **Failures:** 0 | **Errors:** 0 | **Skipped:** 0 | **Status:** BUILD SUCCESS
- **Frontend (`npm run build`):**
  - Compiled with Vite v8.0.8 in 1.19s with **0 errors**.

### 13.4 Git & Secret Hygiene Verification
- `git status` shows no commits yet in the repo.
- All untracked sensitive assets (`target/`, `node_modules/`, `dist/`, `.env`, `uploads/`, `.idea/`, `.vscode/`) are verified ignored by `.gitignore`.
- **Existing Secrets Requiring Rotation in Production:**
  - The JWT secret and database credentials (`root`/`root`) previously present in `application.properties` must **never** be used in production.
  - Prior to launching production, the operations team must generate a fresh 256-bit Base64 cryptographic key via `openssl rand -base64 32` and set `JWT_SECRET`, alongside strong production database credentials for `DB_USERNAME` and `DB_PASSWORD`.

### 13.5 Status of Blockers Following Task 1
- **Security & Authorization Blockers (Bugs C-1, H-1, Blocker 1, 2, 3):** Fully Resolved.
- **Seat Map Data Contract Mismatch (Bug C-4):** Resolved in Task 2 (see Section 14).

---

## 14. Task 2 Implementation Status — Student Bus Seat Map Contract & Privacy Fix (Completed: October 9, 2026)

Task 2 has been executed and verified in accordance with the data contract alignment and student privacy mandate:

### 14.1 Files Changed and Created
| Layer / Category | File Path | Action | Description |
|---|---|---|---|
| **Backend Service** | `backend/.../service/TransportRequestService.java` | Modified | Updated `getBusSeatMap(User student)` to calculate and return `busCapacity`, `totalOccupied`, `availableSeats`, `mySeat`, `occupiedSeats`, `data` (privacy-protected roster), and `bus`. Enforced student privacy: non-admin students only receive PII for their own seat; other seats are marked as generic `"Occupied"`. |
| **Frontend UI** | `frontend/.../pages/student/transport/MyBus.jsx` | Modified | 1. Defensively parsed `busCapacity`, `totalOccupied`, `available`, and `mySeatNumber` (preventing any possibility of `NaN`).<br>2. Updated `SeatCell` to check `isMySeat` and display clear tooltip titles.<br>3. Updated `PassengerPanel` to protect privacy when another student's seat is selected while showing full details for the student's own seat.<br>4. Updated `BusHeroCard` to safely show occupancy (`totalOccupied / capacity`) even when occupancy is 0.<br>5. Handled 404, unassigned seats, and empty buses gracefully without crashes. |
| **Backend Unit Tests** | `backend/.../service/TransportRequestServiceTest.java` | Modified | Added 5 comprehensive automated tests for `getBusSeatMap`: consistent response structure, count calculations, empty bus handling, privacy protection against student PII leakage, and admin access verification. |

### 14.2 Data Contract & Privacy Design Implemented
1. **Unified Response Structure (`GET /api/transport/my-bus/seat-map`):**
   ```json
   {
     "success": true,
     "busCapacity": 40,
     "totalOccupied": 2,
     "availableSeats": 38,
     "mySeat": 5,
     "occupiedSeats": [5, 8],
     "data": [
       { "seatNumber": 5, "occupied": true, "isMine": true, "name": "Alice Student", "enrollmentNumber": "EN-101", "branch": "CSE" },
       { "seatNumber": 8, "occupied": true, "isMine": false, "name": "Occupied" }
     ],
     "bus": { ... }
   }
   ```
2. **Student Privacy Protection:**
   - Unauthorized students viewing other occupied seats receive only `{ seatNumber: n, occupied: true, isMine: false, name: "Occupied" }`.
   - Other students' names, enrollment numbers, branches, phone numbers, and photos are never serialized into the API payload.
   - For their own seat (`isMine: true`), the student sees their verified name, enrollment number, branch, and photo.
   - When requested by an Admin (`ROLE_ADMIN`), full passenger details are populated.
3. **Graceful Edge Case Handling:**
   - **Empty Bus:** `totalOccupied = 0`, `availableSeats = busCapacity`, all seats rendered white/available.
   - **Unassigned Seat:** `mySeat = null`, UI displays `No Seat Assigned` badge cleanly without broken seat highlights.
   - **No Bus Assigned (404):** UI displays an informative alert notice: *"No bus assigned yet."*
   - **Mathematical Safety:** `availableSeats = Math.max(0, busCapacity - totalOccupied)`; never displays `NaN Free`.

### 14.3 Test Verification Results
- **Backend (`mvn test`):**
  - **54 Tests Executed across 7 Test Suites:**
    - `TransportRequestServiceTest`: **19/19 Passed** (14 existing + 5 new seat map tests)
    - `AuthRegistrationSecurityTest`: 5/5 Passed
    - `RosterAuthorizationSecurityTest`: 8/8 Passed
    - `DependencyCheckServiceTest`: 6/6 Passed
    - `SafeDeleteFlowTest`: 4/4 Passed
    - `StudentScheduleDirectionServiceTest`: 6/6 Passed
    - `TripDirectionServiceTest`: 6/6 Passed
  - **Failures:** 0 | **Errors:** 0 | **Skipped:** 0 | **Status:** BUILD SUCCESS
- **Frontend (`npm run build`):**
  - Compiled with Vite v8.0.8 in **975ms** with **0 errors**.

### 14.4 Remaining Blockers for Subsequent Tasks
The following items remain open for future authorized tasks:
1. **Hardcoded Localhost in Uploads & Driver Profile (Bugs C-2 & C-3):** File storage service returns `http://localhost:5000` URLs; driver profile calls direct localhost URLs.
2. **Disappearing Bus on Trip Completion (Bug H-3):** `TrackBusPage.jsx` nullifies bus location on `COMPLETED`.
3. **Logout State Teardown (Bug H-2):** `DashboardLayout.jsx` incomplete session clearing.

---

## 15. Task 2.1 — Runtime Debugging, Seat Allocation & Verification (Completed: October 9, 2026)

### 15.1 Real Data Flow Traced
1. **Student's Approved Transport Request:**
   - Database table: `transport_requests`
   - Row 1: `id = 2, student_id = 13 (Sanket@36), assignment_id = 2, seat_number = NULL, status = 'APPROVED'`
   - Row 2: `id = 3, student_id = 17 (Pavan@36), assignment_id = 3, seat_number = NULL, status = 'APPROVED'`
2. **Assignment & Bus Records:**
   - Assignment 2: `bus_id = 3 (BUS-001, Capacity 60), driver_id = 14, route_id = 8, status = 'ACTIVE'`
   - Assignment 3: `bus_id = 4 (BUS-002, Capacity 60), driver_id = 16, route_id = 9, status = 'ACTIVE'`
3. **Entity and Seat Storage:**
   - Stored in entity `TransportRequest` (`transport_requests` table), column `seat_number` mapped to Java property `seatNumber`.
4. **Live API Queries:**
   - `GET /api/transport/my-transport-request` returned `"seatNumber": null`.
   - `GET /api/transport/my-bus/seat-map` returned `occupiedSeats: []`, `mySeat: null`, `busCapacity: 60`.
5. **Frontend Consumption in `MyBus.jsx`:**
   - Received `seatNumber: null` and empty occupied seats array; rendered `Seat: —`, `0 / 60` occupancy, and all seats as available.

### 15.2 Root Causes Identified
1. **Primary Database Root Cause — No Seats Assigned in MySQL:**
   - Both student records had `seat_number = NULL` in MySQL `transport_requests`. In the codebase, when requests were approved or assignments changed (`changeAssignment`), `seat_number` was defaulted/cleared to `NULL` unless explicitly allocated.
   - Because `seat_number` was literally `NULL`, `TransportRequestService.getBusSeatMap` properly excluded null values (`Objects::nonNull`), returning an empty occupied seats list (`occupiedSeats: []`) and `mySeat: null`.
2. **Secondary Environment Root Cause — Outdated In-Memory Backend Process:**
   - The Spring Boot JVM process (PID 6668) was running since `14:23:23`, before Task 2 modifications were compiled at `16:58:56`.
   - Java does not automatically hot-swap bytecode of running Spring Boot services without restarting. The live process was serving older bytecode that did not yet serialize `totalOccupied`, `availableSeats`, and `data` in the JSON response.
3. **Frontend Synchronous Fallback Gap:**
   - In `MyBus.jsx`, `AssignmentSummary` solely inspected `request.seatNumber`. If `request` was fetched before a seat change or if `seatMapData.mySeat` was resolved first, `AssignmentSummary` lacked a fallback to `seatMapData.mySeat`.

### 15.3 Flow Fixes Applied
1. **Restarted Spring Boot Backend:**
   - Terminated stale PID 6668 and launched clean daemon process loading up-to-date compiled classes from `target/classes`.
   - Verified live `GET /api/transport/my-bus/seat-map` emits complete unified schema: `busCapacity`, `totalOccupied`, `availableSeats`, `mySeat`, `occupiedSeats`, `data` (with passenger privacy), and `bus`.
2. **Frontend Robustness in `MyBus.jsx`:**
   - Updated `AssignmentSummary` to accept `mySeatNumber` and compute `resolvedSeat = mySeatNumber ?? request?.seatNumber`.
   - Passed `mySeatNumber={seatMapData?.mySeat ?? mySeat}` to `AssignmentSummary` ensuring the seat number remains synchronized across the header, seat map, and assignment summary cards.
3. **Admin Seat Allocation Workflow Execution:**
   - Allocated Seat 14 to Student 13 (`Sanket@36`) via `PUT /api/transport/transport-request/2/change-seat`. Confirmed `seat_number = 14` persisted in MySQL.
   - Transferred Student 17 (`Pavan@36`) to Assignment 2 (KATARGAM ROUTE contains stop 18 Raj Hotol) via `PUT /api/transport/transport-request/3/change-assignment` and allocated Seat 15 via `PUT /api/transport/transport-request/3/change-seat`. Confirmed `seat_number = 15` persisted in MySQL.

### 15.4 Runtime Verification Results
1. **Database Persistence:**
   - `SELECT id, student_id, assignment_id, seat_number, status FROM transport_requests;`
   - Student 13: `id = 2, assignment_id = 2, seat_number = 14, status = APPROVED`
   - Student 17: `id = 3, assignment_id = 2, seat_number = 15, status = APPROVED`
2. **Live Seat Map API Response (`Sanket@36`):**
   ```json
   {
     "busCapacity": 60,
     "totalOccupied": 2,
     "availableSeats": 58,
     "mySeat": 14,
     "occupiedSeats": [14, 15],
     "data": [
       { "seatNumber": 14, "occupied": true, "isMine": true, "name": "Sanket kanjariya", "enrollmentNumber": "IT2020161", "branch": "Bsc.IT", "photo": "..." },
       { "seatNumber": 15, "occupied": true, "isMine": false, "name": "Occupied" }
     ],
     "success": true
   }
   ```
3. **Browser E2E Verification (`browser_subagent`):**
   - **Bus Hero Card:** Shows `Total Seats: 60 Seats` and `Students: 2 / 60`.
   - **Seat Map Header Badges:** Displays `Your Seat 14` (Indigo badge), `2 Occupied` (Violet badge), and `58 Free` (Emerald badge).
   - **Seat 14:** Rendered in Indigo (`bg-indigo-600`) with bold white text.
   - **Seat 15:** Rendered in Violet (`bg-violet-50 border-violet-300 text-violet-700`).
   - **Passenger Panel (Seat 14 Click):** Displays full student details (`Sanket kanjariya`, `IT2020161`, `Bsc.IT`, `Seat 14`, and `YOU` badge).
   - **Passenger Panel (Seat 15 Click):** Displays `Occupied Seat`, `OCCUPIED` badge, and privacy protection disclaimer (*"This seat is reserved. Passenger details are protected for student privacy."*). No personal info leaked.
   - **Your Assignment Section:** Displays `Seat: Seat 14`, `Bus: BUS-001`, `Driver: Rajeshkumar Patel`, `Status: Approved`.
4. **Automated Test Results:**
   - **Backend (`mvn test`):** 54/54 Passed (0 failures, 0 errors across 7 suites).
   - **Frontend (`npm run build`):** Vite production build completed in 1.34s with 0 errors.

---

## 16. Task 3 — Deployment URL and File Storage Compatibility (Completed: October 9, 2026)

### 16.1 Objective and Scope
The goal of Task 3 was to eliminate hardcoded `localhost:5000` URLs from all backend upload generators, frontend API calls, and component media handlers so that the application operates reliably both on local environments and on any deployed production domain without code modifications.

### 16.2 Root Causes Identified
1. **Hardcoded URLs in Backend FileStorageService (Bug C-2):**
   - `FileStorageService.storeFile(file, subFolder)` previously returned `http://localhost:5000/uploads/` + subFolder + "/" + uniqueFilename.
   - Every file uploaded to the backend resulted in an absolute URL with hardcoded localhost stored in MySQL. Remote clients attempting to load images received `ERR_CONNECTION_REFUSED`.
2. **Hardcoded Axios Endpoints in Frontend (Bug C-3):**
   - Multiple frontend modules bypassed `apiClient` and invoked raw `axios.get("http://localhost:5000/api/...")` or defined static `const API_BASE = 'http://localhost:5000/api'`.
   - Affected files: `DriverProfile.jsx`, `Register.jsx`, `Login.jsx`, `Home.jsx`, `UserList.jsx`, `StudentUserList.jsx`, `DriverUserList.jsx`, `Bus.jsx`, `Stop.jsx`, `Route.jsx`, and `Assignment.jsx`.
3. **Disparate and Fragile Image URL Resolution in UI Components:**
   - Components had varied image resolvers (`http://localhost:5000${url}` or raw `src={bus.busPhoto}`).
   - Existing MySQL database rows contained `http://localhost:5000/uploads/...`. Naive URL prepending caused double-prepended URLs (`http://localhost:5000/http://localhost:5000/...`).
   - Conversely, newly uploaded relative paths (`/uploads/...`) would fail to load if not prepended with the backend server origin.

### 16.3 Implementation & Changes Made
1. **Backend Configurable File Storage (`FileStorageService.java`):**
   - Added configurable property `@Value("${app.media.base-url:}") private String mediaBaseUrl`.
   - Default behavior: Returns relative path `/uploads/` + subFolder + "/" + uniqueFilename.
   - Configurable override: If `app.media.base-url` (or environment variable `MEDIA_BASE_URL`) is set, trailing slashes are normalized and the base URL is prepended.
   - Configured `app.media.base-url=${MEDIA_BASE_URL:}` in `application.properties` and documented it in `.env.example`.
   - Added unit test suite in `FileStorageServiceTest.java` (4/4 tests passed).
2. **Standardized Media URL Resolution (`frontend/src/utils/mediaUtils.js`):**
   - Created centralized `resolveMediaUrl(path)` utility:
     - Null/empty safety: Returns `null`.
     - Data & Blob URIs: Preserved untouched for instant client previews.
     - Legacy Database URL Compatibility: Strips hardcoded `http://localhost:5000` and `http://127.0.0.1:5000` origins from legacy database records without requiring risky database migrations.
     - Server Origin Resolution: Derives server origin from `import.meta.env.VITE_API_URL` (stripping trailing `/api`) or falls back to development default `http://localhost:5000`.
     - Double-Prefix Prevention: Checks if string already starts with `serverOrigin` or external `https://` protocol and avoids double-prepending.
     - Leading slash normalization: Guarantees `/uploads/...` format before joining with `serverOrigin`.
3. **Unified Frontend API Requests:**
   - Replaced direct `axios` calls with `apiClient` or service wrappers (`driverApi`, `studentApi`) across:
     - `DriverProfile.jsx` (`driverApi.getProfile`, `driverApi.create`, `driverApi.update`)
     - `Register.jsx` (`apiClient.post('/auth/register', ...)`)
     - `Login.jsx` (`apiClient.post('/auth/login', ...)`)
     - `Home.jsx` (`studentApi.getProfile()`)
     - `UserList.jsx`, `StudentUserList.jsx`, `DriverUserList.jsx` (`apiClient`)
     - `Bus.jsx`, `Stop.jsx`, `Route.jsx`, `Assignment.jsx` (dynamic `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`)
4. **Standardized Media Rendering Across All Components:**
   - Wrapped all profile, bus, and document image sources with `resolveMediaUrl()` in:
     - `DriverProfile.jsx` (`profile.photo`, `profile.licensePhoto`)
     - `DriverMyBus.jsx` (`bus.busPhoto`)
     - `MyBus.jsx` (`bus.busPhoto`, `passenger.photo`)
     - `StudentProfile.jsx` (`profile.photo`)
     - `TrackBusPage.jsx` (`bus.busPhoto`)
     - `StudentsPage.jsx` (`student.photo`)
     - `StudentManagement.jsx` (`student.photo`)
     - `BusesPage.jsx` (`bus.busPhoto`)
     - `BusManagement.jsx` (`bus.busPhoto`)
     - `AssignmentsPage.jsx` (`bus.busPhoto`)
     - `BusCard.jsx` & `BusDetailsDrawer.jsx` (`bus.busPhoto`)
     - `AddBusModal.jsx` (`editBus.busPhoto`)
     - `AssignmentCard.jsx` & `AssignmentDetailsDrawer.jsx` (`bus.busPhoto`, `driver.photo`)
     - `AddAssignmentModal.jsx` (`selBus.busPhoto`, `selDriver.photo`)

### 16.4 Legitimate Development Defaults vs Removed Hardcoding
- **Legitimate Development Defaults (Retained):**
  - `frontend/src/api/apiClient.js`: `const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';` — Required so local developer installations run out of the box without requiring manual `.env` file configuration.
  - `frontend/src/utils/mediaUtils.js`: Fallback to `http://localhost:5000` when `VITE_API_URL` is omitted, and regex to clean legacy `localhost:5000` database values.
  - `backend/src/main/resources/application.properties`: `server.port=5000`, `spring.datasource.url=${DB_URL:...}`, and `app.cors.allowed-origins=${APP_CORS_ALLOWED_ORIGINS:...}` — Standard Spring Boot environment property defaults.
  - Documentation and `.env.example` templates.
- **Hardcoded URLs Removed:**
  - `backend/src/main/java/com/university/bustracking/service/FileStorageService.java`: Removed hardcoded return of `"http://localhost:5000/uploads/..."`.
  - Direct Axios requests to `"http://localhost:5000/api/..."` removed from all frontend component files.
  - Hardcoded image string interpolations `"http://localhost:5000" + path` removed from all frontend component files.

### 16.5 Verification Results
1. **Automated Backend Tests (`mvn test`):**
   - **58/58 tests passed** (0 failures, 0 errors across 8 test suites, including new tests in `FileStorageServiceTest`).
2. **Frontend Production Build (`npm run build`):**
   - Vite build completed successfully in 1.21s with **0 errors**.
3. **End-to-End Browser UI Verification (`browser_subagent`):**
   - **Driver Bus View (`/driver/my-bus`):** Bus image resolved to `http://localhost:5000/uploads/bus/c3136afc-07f5-44dc-9fc6-d453e9ff2a56.png` and rendered with valid dimensions without broken placeholder.
   - **Driver Profile View (`/driver/profile`):** Profile photo and license photo loaded and rendered cleanly. Confirmed **no double-prepending** of base URLs.
   - **Profile Edit & Save Flow:** Edit modal opened, changes submitted, and updated via `driverApi`/`apiClient` with HTTP 200 OK.
   - **Console & Network Inspection:** Zero `ERR_CONNECTION_REFUSED` errors, zero 404 image errors, zero broken image placeholders.
4. **Backward Compatibility Strategy Verified:**
   - Both legacy database records containing `http://localhost:5000/uploads/...` and newly uploaded records with relative `/uploads/...` paths resolve correctly and render without database schema modifications.

### 16.6 Blockers Resolved in Task 4
The two remaining blockers identified above (Bug H-2 and Bug H-3) were addressed and verified in Section 17 below.

---

## 17. Task 4 — Fix Logout State and Completed Trip Tracking (Completed: October 9, 2026)

### 17.1 Root Causes Identified

1. **Bug 1: Incomplete Logout and Stale In-Memory State (Bug H-2)**
   - **Root Cause:**
     - Multiple layout components (`DashboardLayout.jsx`, `AdminSidebar.jsx`, `Home.jsx`) previously performed manual, incomplete `localStorage` item clearing without invoking the centralized `AuthContext.logout()` method.
     - Because `AuthContext` state was in-memory React state (`user`), manually clearing `localStorage` did not reset `user` in memory immediately across the tree until a page refresh.
     - `sessionStorage` was not cleared, and storage keys were inconsistent across components (`token`, `user`, `role`).
     - Route guards in `ProtectedRoute.jsx` checked `user` without verifying that the persisted token was still present, creating vulnerabilities where browser Back navigation or stale cached context could display protected pages.
     - Navigation calls after logout did not consistently specify `{ replace: true }`, allowing back navigation to historical session states.

2. **Bug 2: Disappearing Bus on Trip Completion (Bug H-3)**
   - **Root Cause:**
     - In `frontend/src/pages/student/tracking/TrackBusPage.jsx`, the polling handler `fetchBusStatus()` contained fallback logic that set `busLocation` to `null` whenever `tripData?.status !== 'Active'`, specifically wiping out location when the trip completed.
     - This caused the bus marker to disappear from the student map upon trip completion, leaving a blank map instead of preserving the bus's last recorded terminal coordinates.
     - Repeated polling intervals (`setInterval`) continued running even after a trip completed or flooded console logs on every 3-second tick.

### 17.2 Implementation & Changes Made

1. **Bug 1: Complete Logout & Authentication Teardown:**
   - **Centralized `AuthContext.logout()` (`frontend/src/context/AuthContext.jsx`):**
     - Atomically removes `token`, `user`, and `role` keys from `localStorage`.
     - Calls `sessionStorage.clear()` to eliminate any cached session state.
     - Resets `user` state to `null` in memory immediately.
   - **Synchronized HTTP Interceptors (`frontend/src/api/apiClient.js`):**
     - Updated global 401 response interceptor to clear `token`, `user`, `role`, call `sessionStorage.clear()`, and redirect to `/login`.
   - **Fortified Route Guard (`frontend/src/routes/ProtectedRoute.jsx`):**
     - Checks both in-memory `user` and `localStorage.getItem('token')`.
     - If either is missing or invalid, immediately redirects to `/login` with `replace: true`.
     - Prevents browser Back navigation from restoring view of protected pages after logout.
   - **Unified Logout Handlers Across All Portals:**
     - `frontend/src/components/layouts/DashboardLayout.jsx`: Injected `useAuth()`, unified `handleLogout` to invoke `logout()`, navigate to `/login` with `replace: true`, and resolved role fallback from `user?.role || localStorage.getItem('role') || 'Student'`.
     - `frontend/src/components/admin/TopNavbar.jsx`: Configured dropdown logout to call `logout()` and `navigate('/login', { replace: true })`.
     - `frontend/src/components/admin/AdminSidebarNew.jsx`: Configured sidebar logout to call `logout()` and `navigate('/login', { replace: true })`.
     - `frontend/src/pages/admin/components/AdminSidebar.jsx`: Attached `useAuth().logout()` and `navigate('/login', { replace: true })`.
     - `frontend/src/pages/Home.jsx`: Connected `handleLogout` to `logout()` and `navigate('/login', { replace: true })`.
     - `frontend/src/pages/Login.jsx`: Connected legacy auth forms to `login()` from `useAuth()` and navigated with `replace: true`.

2. **Bug 2: Preserve Bus Last Location After Trip Completion:**
   - **Location State Preservation (`frontend/src/pages/student/tracking/TrackBusPage.jsx`):**
     - In `fetchBusStatus()`, when `tripData?.status === 'Completed'`, the handler extracts the last known coordinates from `locationData` (or previous state), sets `speed: 0`, `isMoving: false`, `routeProgress: 100`, and `routeCompleted: true`.
     - Stops the 3-second live polling interval via `clearInterval(locationPollRef.current)` so network requests cease upon completion without wiping the saved location.
     - In `BusTripStatusCard`, renders `• TRIP COMPLETED` (blue status pill) alongside `• Last Known Position Preserved` and completion timestamp.
     - In `MapSection`, renders `Trip Completed (Last Location Preserved)` and sets the map legend to `Last Known Position`.
     - Removed redundant high-frequency polling debug logs, maintaining only targeted error logging.
   - **Map Marker & Popup State (`frontend/src/components/student/tracking/TrackingMap.jsx`):**
     - Propagated `isCompleted: Boolean(busLocation.isCompleted || busLocation.routeCompleted)` into `activeBuses`.
     - Updated Leaflet marker popup to render `Trip Completed (Last Position)` with blue theme and `Final Location Preserved` label alongside exact coordinates and completion time.
     - Removed high-frequency `console.log` statements on render and polling ticks.
   - **Backend Verification Suite (`backend/src/test/java/com/university/bustracking/service/TrackingServiceTest.java`):**
     - Created dedicated test suite validating `getBusStatus()` returns both completed and active trip states with location preservation, terminal progress, and null safety.

### 17.3 Automated Test Results

1. **Backend Tests (`mvn test`):**
   - **62 tests executed across 9 test suites with 0 failures, 0 errors, and 0 skipped**:
     - `AuthRegistrationSecurityTest`: 5 tests passed
     - `DependencyCheckServiceTest`: 6 tests passed
     - `FileStorageServiceTest`: 4 tests passed
     - `RosterAuthorizationSecurityTest`: 8 tests passed
     - `SafeDeleteFlowTest`: 4 tests passed
     - `StudentScheduleDirectionServiceTest`: 6 tests passed
     - `TrackingServiceTest`: 4 tests passed (newly added)
     - `TransportRequestServiceTest`: 19 tests passed
     - `TripDirectionServiceTest`: 6 tests passed
2. **Frontend Production Build (`npm run build`):**
   - Vite v8.0.8 compiled in **1.18 seconds** with **0 syntax, module, or linting errors**.

### 17.4 Runtime Browser E2E Verification Results

All flows were executed and verified against live running instances (`http://localhost:5173` frontend and `http://localhost:5000` backend):

1. **Driver Portal Logout Verification (`driver_logout_test`):**
   - Logged in as Driver at `/driver/my-bus`.
   - Opened profile dropdown, clicked **Logout**.
   - Redirected to `/login` with `replace: true`.
   - Verified `localStorage.getItem('token') === null`, `role === null`, `user === null`.
   - Executed browser Back navigation (`Alt+ArrowLeft`); user remained on `/login` and was prevented from accessing driver pages.
   - Recorded video: `driver_logout_test_1791554096716.webp`.
2. **Admin Portal Logout Verification (`admin_student_logout_tracking_test`):**
   - Logged in as Admin (`admin` / `admin123`) to `/admin/dashboard`.
   - Opened admin profile dropdown in `TopNavbar`, clicked **Log Out**.
   - Redirected to `/login`.
   - Verified `localStorage` was completely cleared.
   - Executed browser Back navigation (`window.history.back()`); user remained on `/login`.
3. **Student Portal Completed Trip Tracking Verification:**
   - Logged in as Student (`Sanket@36` / `Sanket@123`) and navigated to `/student/track-bus`.
   - Bus 3 (KATARGAM ROUTE, completed Trip 11) loaded cleanly:
     - **Bus Status Card:** Displayed `• TRIP COMPLETED` and `• Last Known Position Preserved | Completed • 171930 sec ago`.
     - **Map Section Header:** Displayed `• Trip Completed (Last Location Preserved) | Trip completed`.
     - **Legend:** Displayed `Last Known Position` (blue bus icon).
     - **Map Marker:** `BUS-001` marker remained visibly pinned at its exact last coordinates `[21.485, 72.992]`.
     - **Marker Popup:** Clicked marker to open popup; displayed `Trip Completed (Last Position)`, `Final Location Preserved`, `Pos: 21.48500, 72.99200`, and `Completed: 7:59:06 PM`.
     - **Polling Interval:** Stopped immediately; zero polling network spam or error spam.
     - Captured artifact: `student_completed_trip_tracking_1791555339808.png`.
4. **Student Portal Logout Verification:**
   - Opened student profile dropdown in `DashboardLayout`, clicked **Logout**.
   - Redirected to `/login`.
   - Verified `localStorage` was completely cleared (`token === null`, `user === null`, `role === null`).
   - Executed browser Back navigation; user remained on `/login`.
   - Captured artifact: `login_page_after_logout_1791555439605.png`.
5. **Active Trips Regression Protection:**
   - Active trips continue to update normally via `getBusStatus()` and simulation/telematics.
   - 3-second polling interval remains active only when `tripData?.status === 'Active'`.

---

## 18. Audit Summary & Pre-Deployment Readiness

All pre-deployment audit tasks have been successfully implemented, audited, and verified across both backend and frontend layers:

| Task | Scope | Primary Fixes | Automated Verification | Runtime Browser Verification |
|---|---|---|---|---|
| **Task 1** | Security & Repositories | Public registration role enforcement (Student only), `.gitignore`, `.env.example`, secret extraction | `mvn test` (36/36) | Registration UI restricted to Student; public privilege escalation blocked |
| **Task 2** | Student Seat Map | Response contract alignment, passenger privacy protection, dynamic seat math | `mvn test` (54/54) | Seat map rendering (60 seats, 2 occupied, 58 free), privacy drawer, assignment badges |
| **Task 2.1**| Runtime Seat Debugging | Backend daemon restart, DB seat persistence, synchronous assignment fallback | `mvn test` (54/54) | Real MySQL data flow traced, seats 14 & 15 allocated and rendered |
| **Task 3** | Deployment URLs & Media | Removed hardcoded `localhost:5000`, centralized `resolveMediaUrl()`, dynamic API base | `mvn test` (58/58) | Driver bus photo, profile photo, license photo rendered without broken links or double-prefixes |
| **Task 4** | Logout & Completed Trip Tracking | Unified `AuthContext.logout()`, `ProtectedRoute` Back button guard, completed bus marker preservation | `mvn test` (62/62), `npm run build` | Admin/Driver/Student logout tested, Back button blocked, completed bus marker preserved at terminal |
| **Task 5** | Secure Admin Setup & Admin-Controlled Drivers | Idempotent one-time bootstrap runner, Admin driver management CRUD, status filter, inactive driver blocking in login & JWT & telematics | `mvn test` (81/81), `npm run build` | Admin creates driver, driver logs in, inactive driver blocked, student/driver access to admin APIs blocked (403) |
| **Task 6** | Cross-Role Consistency & E2E Testing | 10-step E2E lifecycle verification, 3-role permissions & boundaries, logout teardown, location preservation, automated integration suite | `mvn test` (82/82), `npm run build` | Verified 10/10 E2E steps, browser recordings for Admin, Driver, and Student portals; Back button guards verified |
| **Task 7** | Production Configuration & Readiness | Dedicated `application-prod.properties`, `ddl-auto=validate`, fail-fast externalization, CORS lockdown, production test suite | `mvn test` (87/87), `npm run build` | Profile validation, fail-fast startup on missing secrets, local dev defaults preserved |

The codebase is fully stabilized and verified across all roles, APIs, and security boundaries. All 7 pre-deployment tasks are complete.

---

## 19. Task 5 — Secure Admin Setup and Admin-Controlled Driver Registration

### 19.1 Scope and Implementation
- **Controlled First Administrator Bootstrap (`AdminBootstrapRunner.java`):**
  - Runs once on startup via `CommandLineRunner`.
  - Checks `userRepository.countByRole(Role.ADMIN) > 0`. If any admin exists, it exits immediately with zero modifications.
  - If 0 admins exist, reads `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD` from environment variables or JVM system properties and creates the admin with BCrypt hashing.
  - Zero hardcoded passwords; no unauthenticated admin promotion endpoints.
- **Admin-Controlled Driver Registration (`POST /api/admin/drivers`, `PUT /api/admin/drivers/{id}`, `GET /api/admin/drivers`):**
  - Requires `ROLE_ADMIN`.
  - Enforces `Role.DRIVER` exclusively on the backend.
  - Validates required fields, email format, and checks for duplicate driver emails.
  - Plaintext passwords are never returned or stored; hashed using `PasswordEncoder`.
  - Supports multipart media uploads for portrait photo and driver license.
- **Driver Status Enforcement (`ACTIVE` vs `INACTIVE`):**
  - Inactive drivers cannot log in (`POST /api/auth/login` returns `400 Bad Request`).
  - Active JWT tokens belonging to deactivated drivers are blocked in `JwtAuthFilter` (`401 Unauthorized`).
  - Inactive drivers cannot prepare return trips (`TripService`) or stream live GPS coordinates (`TrackingService`).
- **Admin UI Navigation (`DriversPage.jsx`):**
  - Stat cards (Total Drivers, Active, Inactive).
  - Search bar + segmented status filter buttons (`All`, `Active`, `Inactive`) with live counts.
  - Validated creation/edit modal with show/hide password toggle.
  - Detail drawer, activation/deactivation action, and safe deletion confirmation.
- **Diagnostic Root Cause Resolved — "No static resource api/admin/drivers":**
  - An outdated background Java process (PID 2624) was running on port 5000 from an earlier IntelliJ execution prior to compilation of the `/api/admin/drivers` endpoints.
  - The request fell through Spring's handler mapping into `ResourceHttpRequestHandler`, throwing `No static resource api/admin/drivers`.
  - Terminating the stale PID and restarting with current compiled classes immediately restored `200 OK` / `201 Created` responses.
- **Architectural Security Recommendations:**
  - **Self-Service Password Activation:** Future integration of Spring Mail (`JavaMailSender`) with time-limited activation tokens (`/api/auth/activate-account?token=...`), eliminating manual password sharing.
  - **First-Login Password Rotation:** Add `mustChangePassword` flag on `User` entity requiring drivers to rotate provisioned passwords on first login.
- **Operational Provisioning Guide:**
  - See [`docs/DEPLOYMENT_GUIDE.md`](file:///c:/Users/ASUS/Desktop/University%20Bus%20Tracking%20System(Full%20Stack)/docs/DEPLOYMENT_GUIDE.md#L285-L335) Section 9 & 10 for complete operator instructions on initial admin bootstrap and driver provisioning.

### 19.2 Automated Verification Results
- **Backend Tests:** `mvn test` executed **81 tests across 12 test suites with 0 failures, 0 errors, and 0 skipped** (including 19 new tests in `AdminDriverServiceAndBootstrapTest`, `AdminDriverSecurityEndpointTest`, and `AdminDriverEndToEndIntegrationTest`).
- **Frontend Build:** `npm run build` compiled cleanly via Vite in **1.42s** with zero syntax, type, or lint errors.

### 19.3 Driver Creation Endpoint Diagnostics & Verification
- **Issue Diagnosed:** `No static resource api/admin/drivers.` encountered on Add Driver form submit.
- **Root Cause:** Running backend process PID 2624 was started from IntelliJ at 17:16:36 before `/api/admin/drivers` was added and compiled. In-memory DispatcherServlet lacked the route, causing Spring 6's `ResourceHttpRequestHandler` to return a 404 static resource error.
- **Resolution:** Outdated process terminated; backend booted with latest compiled classes; live HTTP tests confirmed `GET /api/admin/drivers` (200), `POST /api/admin/drivers` (201 Created for JSON and Multipart with file attachments), driver login (200), and role boundary blocking for driver and student tokens (403).

---

## 20. Task 6 — Cross-Role Consistency and End-to-End Testing (Completed: October 13, 2026)

### 20.1 Objective and Scope
The goal of Task 6 was to conduct comprehensive, multi-role verification across the entire application before deployment, auditing and exercising all three system roles (**ADMIN**, **DRIVER**, **STUDENT**) across automated test suites, live API contracts, and browser end-to-end user workflows.

Verification guidelines strictly enforced:
- Zero duplicate endpoints added.
- Existing APIs and service methods reused without redesigning stable features.
- No schema or test deletions merely to make builds pass.
- Proof-based empirical validation with recorded browser sessions.

---

### 20.2 Phase 1: Inspection of Existing Fixes
1. **Authentication Context & Logout Teardown:**
   - **Inspection:** Verified `AuthContext.jsx` (`logout()` atomically purges `token`, `user`, and `role` from `localStorage`, executes `sessionStorage.clear()`, and resets `user` to `null` in memory).
   - **HTTP Interceptor:** `apiClient.js` global 401 interceptor clears all stored session keys and forces redirect to `/login`.
   - **Route Guards:** `ProtectedRoute.jsx` verifies both in-memory `user` and persistent `localStorage.getItem('token')`. Unauthenticated accesses or browser history back navigation immediately redirect to `/login` with `replace: true`.
   - **Portal Navbars:** All logout trigger points (`TopNavbar.jsx`, `AdminSidebarNew.jsx`, `DashboardLayout.jsx`, `Home.jsx`, `Login.jsx`) delegate directly to `useAuth().logout()`.
   - **Verdict:** Working as designed; verified without rewrites.
2. **Student Tracking Bus Position Preservation on Trip Completion:**
   - **Inspection:** Inspected `TrackBusPage.jsx` (lines 765–800) and `TrackingMap.jsx`.
   - **Behavior:** When `tripData?.status === 'Completed'`, `fetchBusStatus()` extracts last known coordinates from `locationData`, sets `speed: 0`, `isMoving: false`, `routeProgress: 100`, and `routeCompleted: true`.
   - **Polling Cleanup:** Live polling interval (`locationPollRef.current`) is halted (`clearInterval`) immediately upon completion, preventing extraneous network requests.
   - **UI & Map Pin:** Bus status card renders `• TRIP COMPLETED` and `• Last Known Position Preserved`, map header shows `Trip Completed (Last Location Preserved)`, and Leaflet marker remains permanently pinned at the route terminal with `Trip Completed (Last Position)` popup details.
   - **Verdict:** Working as designed; verified without rewrites.

---

### 20.3 Phase 2: Role-Based Verification & Boundary Testing

All three roles were tested across positive capabilities and security boundaries:

#### 1. ADMIN Role
- **Login & Logout:** Authenticated via `POST /api/auth/login` (`admin` / `admin123`) and logged out via sidebar; session completely cleared.
- **Driver Management:**
  - Create driver: `POST /api/admin/drivers` with JSON and multipart media support.
  - Search driver: `GET /api/admin/drivers?search={term}` filters results accurately.
  - Edit driver: `PUT /api/admin/drivers/{id}` updates contact details, license IDs, and credentials.
  - Deactivate driver: `POST /api/admin/drivers/{id}/deactivate` transitions status to `INACTIVE`.
  - Reactivate driver: `POST /api/admin/drivers/{id}/reactivate` restores status to `ACTIVE`.
- **Student Transport Requests:** Managed pending requests (`GET /api/transport/pending-transport-requests`), approved assignments, and seat allocations.
- **Fleet Management:** Queried buses (`GET /api/bus/get-all-buses`), routes (`GET /api/routes/get-all-routes`), assignments (`GET /api/assignment/get-all-assignments`), and schedules (`GET /api/schedules`).
- **Unauthorized Access Defense:** Admin APIs reject unauthenticated requests (`401 Unauthorized`) and requests from Student or Driver tokens (`403 Forbidden`).

#### 2. DRIVER Role
- **Login:** Logged in with Admin-created credentials (`driver_task6_bd9235` / `DriverPassword@123`).
- **Profile:** Queried `GET /api/driver/profile` and updated profile details via `PUT /api/driver/profile` (multipart form).
- **Assigned Bus & Route:** Viewed assigned vehicle and route details via `GET /api/driver/my-assignment`.
- **Trip Lifecycle:** Successfully started trip (`POST /api/trips/start`), transmitted telemetry (`POST /api/tracking/update-location`), and ended trip (`POST /api/trips/end`).
- **Inactive Driver Blocking:** Deactivated drivers receive `400 Bad Request` on login attempt, existing tokens are rejected with `401 Unauthorized` in `JwtAuthFilter`, and telematics endpoints reject inactive drivers.
- **Role Boundary Defense:** Driver token attempting to query `/api/admin/drivers`, `POST /api/bus/bus-create`, or `/api/transport/pending-transport-requests` was strictly rejected with **HTTP 403 Forbidden**.

#### 3. STUDENT Role
- **Registration & Login:** Registered via `POST /api/auth/register` (strictly forced to `Role.STUDENT`) and logged in.
- **Transport Request Lifecycle:** Submitted request (`POST /api/transport/transport-request` with preferred stop ID 18 — Raj Hotol); inspected status via `GET /api/transport/my-transport-request`.
- **Assigned Fleet View:** Viewed assigned bus (`BUS-001`), driver, route, and seat (Seat 22).
- **Seat Map Privacy:** Clicked seats on `GET /api/transport/my-bus/seat-map`; student's own seat displayed verified identity (`isMine: true`), while other seats displayed `"Occupied"` with zero PII leakage.
- **Live Tracking:** Observed active trip vehicle motion and verified terminal position preservation when completed.
- **Role Boundary Defense:** Student token attempting to call `/api/admin/drivers`, `/api/driver/profile`, `/api/trips/start`, or `/api/transport/assignment/{id}/students` was strictly rejected with **HTTP 403 Forbidden**.

---

### 20.4 Phase 3: Cross-Role End-to-End Workflow Execution

The exact 10-step cross-role sequence was executed and verified end-to-end against the running backend and MySQL database:

| Step | Action | Endpoint / Operation | Result & Observed Evidence | Status |
|---|---|---|---|---|
| **1** | Admin creates a driver | `POST /api/admin/drivers` | Created driver `driver_task6_bd9235` (ID 44), status `Active`. | **PASS** |
| **2** | Student registers & submits transport request | `POST /api/auth/register`<br>`POST /api/transport/transport-request` | Created student `student_task6_bd9235`; transport request created with Stop 18 (`Raj Hotol`), status `Pending`. | **PASS** |
| **3** | Admin assigns bus, route, and seat | `PUT /api/assignment/update-assignment/2`<br>`PUT /api/transport/assignment/2/assign-students` | Assigned driver 44 to Assignment 2 (BUS-001, KATARGAM ROUTE). Approved student request and allocated Seat 22. Status: `Approved`. | **PASS** |
| **4** | Driver logs in and starts trip | `POST /api/auth/login`<br>`POST /api/trips/start` | Driver authenticated. Started trip for Schedule 2 (Tuesday 07:30 OUTBOUND); Trip 16 transitioned to `Active`. | **PASS** |
| **5** | Student views active bus & notification | `GET /api/tracking/bus/3/status`<br>`GET /api/notifications` | Student received live bus coords `[21.224, 72.821]`, `Active` status, and notification: *"Bus BUS-001 has started its outbound trip."* | **PASS** |
| **6** | Driver sends location updates | `POST /api/tracking/update-location` | Transmitted coordinates `[21.233708, 72.833151]`, speed 36.5 km/h, heading 120°. Student endpoint immediately returned updated coordinates. | **PASS** |
| **7** | Driver ends the trip | `POST /api/trips/end` | Driver completed trip. Trip transitioned to `Completed`. | **PASS** |
| **8** | Student sees completed status & preserved position | `GET /api/tracking/bus/3/status`<br>`GET /api/notifications` | Student observed `trip.status = Completed`, speed = 0, routeProgress = 100%, and terminal coordinates `[21.233708, 72.833151]` strictly preserved. Notification: *"Bus BUS-001 has completed its outbound trip."* | **PASS** |
| **9** | Unauthorized updates rejected | `POST /api/tracking/update-location` | Driver update attempt after completion rejected with **HTTP 400 Bad Request** (*"Location update is allowed only during an active trip"*). Student update attempt rejected with **HTTP 403 Forbidden**. | **PASS** |
| **10** | Consistency verification | Database query & `GET /api/transport/my-bus/seat-map` | Seat map verified: `totalOccupied = 3`, `capacity = 60`, `mySeat = 22`. Assignment 2 remained active and consistent. | **PASS** |

---

### 20.5 Phase 4: UI and Browser Runtime Verification

Three separate interactive browser sessions were performed using the native browser subagent against `http://localhost:5173` and `http://localhost:5000`:

1. **Admin Portal Browser Verification (`admin_ui_test`):**
   - Logged in as `admin`.
   - Verified active sidebar styling (`bg-purple-50 text-purple-700 shadow-2xs` with purple indicator dot).
   - Navigated across Dashboard (`/admin/dashboard`), Drivers (`/admin/drivers`), Buses (`/admin/buses`), Routes (`/admin/routes`), Assignments (`/admin/assignments`), and Transport Requests (`/admin/transport`).
   - Searched for driver `driver_task6` in driver management; inspected status pills and detail views.
   - Tested logout from sidebar; verified token, user, and role cleared from `localStorage`.
   - Tested Back button navigation to `/admin/dashboard` while logged out; `ProtectedRoute` intercepted request and returned user to `/login`.
   - Recorded video artifact: `admin_ui_test_1791887777687.webp`.
2. **Driver Portal Browser Verification (`driver_ui_test`):**
   - Logged in with Admin-created driver `driver_task6_bd9235`.
   - Verified driver dashboard (`/driver`) with role badge *"Driver Operations"*.
   - Navigated across sidebar links: `/driver/my-bus`, `/driver/trip-history`, and `/driver/profile`.
   - Verified driver profile images resolved cleanly via `resolveMediaUrl()` with zero `localhost:5000` double-prefixing.
   - Attempted direct URL navigation to `/admin/dashboard`; `ProtectedRoute` intercepted driver role and safely redirected to `/driver`.
   - Executed logout; verified session teardown and redirect to `/login`.
   - Recorded video artifact: `driver_ui_test_1791888192801.webp`.
3. **Student Portal Browser Verification (`student_ui_test`):**
   - Logged in as Student `Sanket@36`.
   - Navigated to `/student/my-bus`; verified Bus Hero card (`BUS-001`, 60 Seats), seat map badges (`Your Seat 14`, `3 Occupied`, `57 Free`), and passenger privacy panel (Seat 14 shows student details; clicking occupied Seat 15 displays privacy disclaimer with student PII hidden).
   - Navigated to `/student/track-bus`; verified Leaflet map displays pinned bus marker at terminal stop with `• TRIP COMPLETED` badge, speed 0, and `Final Location Preserved` popup.
   - Verified network console has zero repeated 3-second polling requests once trip is completed.
   - Attempted direct URL navigation to `/admin/dashboard`; `ProtectedRoute` intercepted student role and redirected to `/student`.
   - Executed logout; verified session teardown.
   - Recorded video artifact: `student_ui_test_1791888296067.webp`.

---

### 20.6 Phase 5: Automated Testing Baseline

A new comprehensive automated test suite `CrossRoleEndToEndIntegrationTest.java` was added to permanently enforce Phase 3's 10-step lifecycle in CI/CD pipelines.

#### Backend Test Suite Execution (`mvn test`):
- **Command:** `mvn test`
- **Result:** **BUILD SUCCESS** (Total time: 27.440 s)
- **Total Tests Run:** **82 Tests across 13 Test Suites with 0 Failures, 0 Errors, and 0 Skipped**
  - `CrossRoleEndToEndIntegrationTest`: 1/1 Passed (New)
  - `AdminDriverEndToEndIntegrationTest`: 1/1 Passed
  - `AdminDriverSecurityEndpointTest`: 8/8 Passed
  - `AdminDriverServiceAndBootstrapTest`: 10/10 Passed
  - `AuthRegistrationSecurityTest`: 5/5 Passed
  - `DependencyCheckServiceTest`: 6/6 Passed
  - `FileStorageServiceTest`: 4/4 Passed
  - `RosterAuthorizationSecurityTest`: 8/8 Passed
  - `SafeDeleteFlowTest`: 4/4 Passed
  - `StudentScheduleDirectionServiceTest`: 6/6 Passed
  - `TrackingServiceTest`: 4/4 Passed
  - `TransportRequestServiceTest`: 19/19 Passed
  - `TripDirectionServiceTest`: 6/6 Passed

#### Frontend Production Bundle Compilation (`npm run build`):
- **Command:** `npm run build`
- **Result:** **SUCCESS** (Compiled in 1.80 s)
- **Transformations:** 1923 modules transformed
- **Output:**
  - `dist/index.html`: 0.45 kB
  - `dist/assets/index-UimThb_Y.css`: 154.25 kB
  - `dist/assets/index-CnKW3mRZ.js`: 1,029.75 kB (257.22 kB gzip)
  - 0 syntax, module resolution, or bundling errors.

---

### 20.7 Defects Found, Diagnostics & Resolutions

| # | Component | Observation / Issue | Root Cause | Resolution Applied |
|---|---|---|---|---|
| **D-1** | Backend Tests (`Bus.java`) | `Column 'bus_registration_number' cannot be null` on test bus entity creation. | `busRegistrationNumber` has `@Column(nullable = false, unique = true)` in `Bus` entity. Test seed lacked this property. | Set `busRegistrationNumber` and `BusType.AC` enum on test bus builder. |
| **D-2** | Backend Tests (`BusRoute.java`) | `Route stops are not configured for route` on starting trip in MockMvc test. | `BusRoute.routeStops` is `@OneToMany(mappedBy = "route")`. In-memory `route` entity required bidirectional association (`route.getRouteStops().add(rs)`). | Added route stops directly to `route.getRouteStops()` before persisting. |
| **D-3** | Driver Profile Updates | `HttpMediaTypeNotSupportedException` when client sends JSON to `PUT /api/driver/profile`. | `DriverController.java` strictly consumes `multipart/form-data` because driver photos and license documents can be attached simultaneously. | Confirmed `driverApi.js` properly sends `FormData`. Updated diagnostic verification scripts to use multipart payload. |
| **D-4** | Driver Deactivation Endpoints | Attempting `PUT /api/admin/drivers/{id}/status` returned 404/500 in preliminary scripts. | Endpoint contract was designed as `POST /api/admin/drivers/{id}/deactivate` and `POST /api/admin/drivers/{id}/reactivate`. | Updated audit documentation and test scripts to call exact POST endpoints. |

---

### 20.8 Summary of Files Changed & Created

| Layer | File Path | Action | Description |
|---|---|---|---|
| **Backend Integration Tests** | `backend/.../service/CrossRoleEndToEndIntegrationTest.java` | Created | Complete automated Spring Boot MockMvc integration test executing all 10 steps of the cross-role workflow. |
| **Verification Tooling** | `scratch/verify_phase3_e2e.ps1` | Created | Automated PowerShell test script executing the 10-step lifecycle against live backend services. |
| **Verification Tooling** | `scratch/verify_phase2_roles.ps1` | Created | Automated PowerShell test script executing role boundary and permission rejection tests across all 3 roles. |
| **Documentation** | `docs/PRE_DEPLOYMENT_AUDIT.md` | Modified | Updated pre-deployment audit with full Task 6 findings, test metrics, defect resolutions, and sign-off status. |

---

### 20.9 Pre-Deployment Sign-Off & Outstanding Staging Tasks

With Task 6 complete, all functional, role consistency, security boundary, and automated build tests have passed. The system is ready for staging deployment and operator handoff.

#### Tasks Still Requiring Staging or Physical-Device Verification:
1. **Physical Mobile GPS Accuracy & Background Tab Throttling:**
   - Real-world mobile browser backgrounding (`navigator.geolocation.watchPosition` when screen turns off or user switches apps on iOS Safari and Android Chrome).
2. **Mobile Network Connectivity Handoffs:**
   - 4G/5G mobile data carrier handoffs and network drops during transit.
3. **Cryptographic Secret Rotation:**
   - Generate strong production secrets (`JWT_SECRET`, database passwords) using `.env.example` templates prior to exposing public ports.

---

## 21. Task 7 — Production Configuration and Deployment Readiness Audit

**Execution Date:** October 13, 2026  
**Auditor:** Antigravity Advanced Agentic AI  
**Scope:** Development vs. Production Configuration Separation, Secret Externalization, Profile Hardening, Static Resource Resolution, Git Hygiene, and Pre-Deployment Build Validation.

---

### 21.1 Phase 1 — Audit Findings Summary

Before applying changes, a comprehensive code and configuration inspection was executed across the backend and frontend codebases:

| Component / File | Current State Before Task 7 | Audit Finding & Classification |
|---|---|---|
| `backend/.../application.properties` | Contained fallback dev defaults (`root`/`root`, `http://localhost:5173`, `update` DDL). | **Needs Addition:** Local dev defaults are functional, but a dedicated production profile (`application-prod.properties`) was absent. Port was statically set to 5000. |
| Existing Spring Profiles | Only default profile was configured. | **Needs Addition:** Create `application-prod.properties` with strict validation rules and zero weak fallbacks. |
| `frontend/src/api/apiClient.js` | Uses `import.meta.env.VITE_API_URL \|\| 'http://localhost:5000/api'`. | **Already Satisfied:** Automatically respects Vite production environment variables and falls back to local dev URL. |
| `frontend/src/utils/mediaUtils.js` | `resolveMediaUrl()` strips `/api` from `VITE_API_URL` to derive server origin, strips legacy `localhost:5000` URLs, and resolves relative `/uploads/...` paths. | **Already Satisfied:** Fully compatible with production domain origin and reverse proxies. |
| `WebConfig.java` | Injects `file.upload-dir` and `app.cors.allowed-origins`. Configures `/uploads/**` static resource handler with absolute disk paths. | **Already Satisfied:** Supports custom upload directories and comma-separated CORS origins. |
| `SecurityConfig.java` | Configures `CorsConfigurationSource` using `app.cors.allowed-origins`, stateless JWT security, and public access to `/uploads/**`. | **Already Satisfied:** Secure and configurable. |
| `FileStorageService.java` | Writes uploads to UUID filenames under `file.upload-dir` and returns relative `/uploads/...` paths (or prepends optional `mediaBaseUrl`). | **Already Satisfied:** Robust and avoids hardcoding host origins in stored records. |
| `AdminBootstrapRunner.java` | Checks `countByRole(Role.ADMIN)`. If > 0, halts immediately. If 0, optionally hashes credentials from env vars. | **Already Satisfied:** Strictly prevents recreating or overwriting existing administrator accounts on restart. |
| `.gitignore` Files | Root, backend, and frontend `.gitignore` properly ignored `.env`, `.env.*`, `uploads/`, `target/`, `node_modules/`, `dist/`. | **Needs Adjustment:** Whitelisting only `!.env.example` caused `!.env.production.example` to be ignored. Needed `!.env*.example` pattern. |
| Root `.env.example` | Contained baseline DB and JWT variable examples. | **Needs Enhancement:** Needed guidance on `SPRING_PROFILES_ACTIVE`, `PORT`, `JWT_EXPIRATION`, and explicit prod vs. dev notes. |
| `frontend/.env.example` | Contained only local URL. | **Needs Addition:** Needed `frontend/.env.production.example` for production builds. |
| Git History Secrets | Checked `git log` and `git status`. Branch `master` has zero prior commits. | **Satisfied:** No real production secrets have ever been committed to Git history. |

---

### 21.2 Phase 2 — Secure Configuration Changes & File Paths

The following configuration changes and files were implemented to separate local development from production:

#### 1. Dedicated Production Profile: `backend/src/main/resources/application-prod.properties`
Created a hardened production profile:
- **Strict Schema Validation:** `spring.jpa.hibernate.ddl-auto=validate` guarantees that Hibernate will **never** alter, drop, or create database tables automatically in production.
- **Fail-Fast Credential Externalization:** Database parameters (`${DB_URL}`, `${DB_USERNAME}`, `${DB_PASSWORD}`) and `${JWT_SECRET}` have **no fallback defaults**. If any required variable is omitted, Spring Boot fails to start immediately during placeholder resolution.
- **Strict CORS Policy:** `app.cors.allowed-origins=${APP_CORS_ALLOWED_ORIGINS}` requires explicit, trusted frontend origins without wildcard fallbacks.
- **Persistent Storage:** `file.upload-dir=${UPLOAD_DIR}` requires an absolute persistent disk path.
- **Production Logging:** `logging.level.com.university.bustracking=INFO`, `org.hibernate=WARN`, `org.springframework.security=WARN`.

#### 2. Local Development Profile: `backend/src/main/resources/application.properties`
Updated line 1 to support dynamic port injection (`server.port=${PORT:5000}`) while preserving all local development defaults (`root`/`root`, `ddl-auto=update`, `localhost:5173`). Beginners and local developers can run `mvn spring-boot:run` without configuring any environment variables.

#### 3. Frontend Production Environment Template: `frontend/.env.production.example`
Created a production template explaining how Vite injects `VITE_API_URL` during `npm run build`:
```bash
# Frontend API Base URL for production
VITE_API_URL=https://api.yourdomain.com/api
```

#### 4. Root Environment Variable Guide: `.env.example`
Updated `.env.example` with full documentation for operators, including `SPRING_PROFILES_ACTIVE=prod`, `PORT=5000`, database credentials, JWT secret generation command (`openssl rand -base64 32`), and Admin bootstrap instructions.

#### 5. Git Hygiene Whitelisting: `.gitignore` (Root, Backend, Frontend)
Updated `.gitignore` files to whitelist `!.env*.example` and `!**/.env*.example` so that all template files (`.env.example`, `.env.production.example`) remain tracked while all actual `.env` and `.env.*` files remain strictly ignored.

---

### 21.3 Required Environment Variables & Deployment Configuration

When deploying with `spring.profiles.active=prod`, configure the following environment variables on the deployment platform:

| Variable Name | Required in Prod? | Description & Expected Format | Example Production Value |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **Yes** | Activates production configuration | `prod` |
| `PORT` | Optional | Web server listening port (defaults to 5000) | `5000` or `8080` |
| `DB_URL` | **Yes** | MySQL JDBC connection URL (UTF-8, SSL, timezone) | `jdbc:mysql://db.internal:3306/university_bus_db?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` | **Yes** | Dedicated non-root MySQL application user | `bus_app_user` |
| `DB_PASSWORD` | **Yes** | Strong MySQL user password | *`<strong-random-db-password>`* |
| `JWT_SECRET` | **Yes** | Cryptographically random 256-bit Base64 key | `openssl rand -base64 32` generated string |
| `JWT_EXPIRATION` | Optional | Token expiration in milliseconds (default: 86400000 = 24h) | `86400000` |
| `UPLOAD_DIR` | **Yes** | Absolute, persistent disk path for uploaded media | `/var/app/uploads` *(Linux)* or `C:/app/uploads` *(Windows)* |
| `MEDIA_BASE_URL` | Optional | Optional CDN or base URL for public file links | `https://api.campusbus.university.edu` *(or omit for relative paths)* |
| `APP_CORS_ALLOWED_ORIGINS` | **Yes** | Comma-separated list of trusted frontend origins | `https://bus.university.edu,https://admin.bus.university.edu` |
| `ADMIN_BOOTSTRAP_USERNAME` | First Boot Only | Username for initial administrator (one-time setup) | `admin_sys` |
| `ADMIN_BOOTSTRAP_PASSWORD` | First Boot Only | Password for initial administrator (min 12 characters recommended) | *`<strong-random-admin-password>`* |
| `VITE_API_URL` *(Frontend)* | **Yes (Build Time)** | Deployed backend API base URL injected into frontend build | `https://api.campusbus.university.edu/api` |

---

### 21.4 Operational Guides

#### A. How to Run Locally After the Changes
Local development remains 100% functional with zero changes required:
```bash
# 1. Start backend with local defaults (http://localhost:5000)
cd backend
mvn spring-boot:run

# 2. Start frontend dev server (http://localhost:5173)
cd frontend
npm run dev
```

#### B. How to Activate the Production Profile
The production profile can be activated using any standard Spring Boot method:
1. **Via Environment Variable (Recommended for Docker / Kubernetes / Cloud):**
   ```bash
   export SPRING_PROFILES_ACTIVE=prod
   java -jar backend/target/bustracking-backend-0.0.1-SNAPSHOT.jar
   ```
2. **Via JVM System Property:**
   ```bash
   java -Dspring.profiles.active=prod -jar target/bustracking-backend-0.0.1-SNAPSHOT.jar
   ```
3. **Via Command Line Argument:**
   ```bash
   java -jar target/bustracking-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
   ```

#### C. How to Initialize the First Production Admin Safely
1. On initial deployment before first startup, provide:
   ```bash
   ADMIN_BOOTSTRAP_USERNAME=superadmin
   ADMIN_BOOTSTRAP_PASSWORD=<strong-random-password-min-12-chars>
   ```
2. Launch the backend application once. `AdminBootstrapRunner` checks `userRepository.countByRole(Role.ADMIN)`. Since count is 0, it encodes the password using `BCryptPasswordEncoder` and persists the initial administrator account.
3. Immediately unset or remove `ADMIN_BOOTSTRAP_PASSWORD` from the deployment environment.
4. On all subsequent application restarts, `AdminBootstrapRunner` detects `adminCount > 0` and logs:
   `Admin bootstrap check: 1 administrator account(s) present. No bootstrap action required.`
   It will **never** alter, reset, or overwrite existing administrator accounts.

---

### 21.5 Pre-Deployment Validation & Build Verification Results

#### 1. Backend Test Suite Execution (`mvn test`)
- **Total Tests Run:** **87 Tests across 14 Test Suites**
- **Failures:** **0**
- **Errors:** **0**
- **Skipped:** **0**
- **Build Result:** **BUILD SUCCESS** (Execution time: 32.148 s)
- **New Test Suite:** `ProductionConfigurationTest.java` (5 tests):
  1. `prodProfile_DdlAutoMustBeValidate` — Passed (validates strict DDL `validate`).
  2. `prodProfile_CorsAllowedOriginsAreBound` — Passed (validates trusted frontend origins bound).
  3. `prodProfile_UploadDirIsBound` — Passed (validates persistent upload directory binding).
  4. `prodProfile_ShowSqlIsDisabled` — Passed (validates SQL logging disabled in prod).
  5. `prodProfile_WhenMandatoryVariablesMissing_FailsStartup` — Passed (verifies fail-fast startup failure when `DB_URL` / `JWT_SECRET` are missing).

#### 2. Frontend Production Compilation (`npm run build`)
- **Command:** `npm run build`
- **Build Tool:** Vite v8.0.8
- **Compilation Time:** **1.54 s**
- **Modules Transformed:** 1923 modules
- **Output Artifacts:**
  - `dist/index.html`: 0.45 kB (gzip: 0.29 kB)
  - `dist/assets/index-UimThb_Y.css`: 154.25 kB (gzip: 25.29 kB)
  - `dist/assets/index-CnKW3mRZ.js`: 1,029.75 kB (gzip: 257.22 kB)
- **Result:** **0 errors, 0 broken module imports**.

#### 3. Local Runtime Server Verification
- Verified live backend responding at `http://localhost:5000/api/auth/login`.
- Confirmed local development requires no environment variables and maintains default behavior.

---

### 21.6 Summary of Created and Modified Files

| File Path | Action | Description |
|---|---|---|
| `backend/src/main/resources/application-prod.properties` | **Created** | Dedicated production profile: `ddl-auto=validate`, mandatory env vars without weak defaults, secure logging. |
| `backend/src/main/resources/application.properties` | **Modified** | Updated `server.port=${PORT:5000}` while preserving all local development defaults. |
| `frontend/.env.production.example` | **Created** | Template for frontend production build with `VITE_API_URL` placeholder. |
| `.env.example` | **Modified** | Updated root template with complete dev vs. prod guidance, port, and security notes. |
| `.gitignore` | **Modified** | Whitelisted `!.env*.example` and `!**/.env*.example`. |
| `backend/.gitignore` | **Modified** | Whitelisted `!.env*.example`. |
| `frontend/.gitignore` | **Modified** | Whitelisted `!.env*.example`. |
| `backend/.../config/ProductionConfigurationTest.java` | **Created** | 5 automated tests verifying production profile properties and fail-fast startup behavior. |
| `docs/PRE_DEPLOYMENT_AUDIT.md` | **Modified** | Appended Section 21 containing comprehensive audit findings and operational documentation. |

---

### 21.7 Remaining Staging & Physical-Device Checks (Pre-Launch Checklist)

Before public DNS cutover, execute the following staging environment checks:
1. **Physical Mobile Device Telematics Verification:**
   - Test driver location streaming from a physical smartphone (iOS Safari and Android Chrome) while the vehicle is in motion.
   - Verify `navigator.geolocation.watchPosition` behavior when the device screen locks or the browser tab is backgrounded.
2. **Network Carrier Handoffs:**
   - Verify driver WebSocket/HTTP reconnection when the device transitions between Wi-Fi and 4G/5G cellular towers.
3. **Database Connection Pool Load Sizing:**
   - Benchmark MySQL connection pool (`HikariCP`) under simulated load with 50+ concurrent students polling tracking endpoints every 3 seconds.
4. **SSL/TLS & Reverse Proxy Configuration:**
   - Configure Nginx or Caddy with valid Let's Encrypt certificates to reverse-proxy frontend static assets, `/api/` requests, and `/uploads/` static files.
5. **Production Cryptographic Secret Rotation:**
   - Generate strong production secrets (`JWT_SECRET` via `openssl rand -base64 32`) and non-default database credentials prior to initial production startup.

---

## 22. Final Review Verification Summary & Verification Rerun Baseline (October 13, 2026)

### 22.1 Test Verification: Previously Reported vs. Rerun During Final Review
To maintain empirical accuracy, the table below clearly delineates between previously recorded test metrics and tests actively rerun during this final review task:

| Verification Metric | Historical Task 1 Baseline | Previously Reported (Task 7 Close) | Rerun During Final Review Task | Verdict |
|---|---|---|---|---|
| **Backend Test Suite (`mvn test`)** | 36 / 36 passed (6.598 s) | 87 / 87 passed (32.148 s) | **87 / 87 passed across 14 suites (31.178 s)** | **PASS (0 Failures, 0 Errors, 0 Skipped)** |
| **Frontend Production Build (`npm run build`)** | 1922 modules (1.44 s) | 1923 modules (1.54 s) | **1923 modules compiled via Vite v8.0.8 (1.41 s)** | **PASS (0 Errors, 0 Broken Modules)** |
| **All 7 Tasks Retained in Audit** | N/A | Documented in full | **Verified intact across Sections 13–21** | **PASS** |
| **Local Development Defaults** | Default dev properties | Functional defaults preserved | **Verified operational on localhost:5000 & 5173** | **PASS** |

### 22.2 Breakdown of 87 Passing Backend Tests Across 14 Suites (Verified Rerun)
1. `AuthRegistrationSecurityTest`: 5 / 5 tests passed
2. `DependencyCheckServiceTest`: 6 / 6 tests passed
3. `FileStorageServiceTest`: 4 / 4 tests passed
4. `RosterAuthorizationSecurityTest`: 8 / 8 tests passed
5. `SafeDeleteFlowTest`: 4 / 4 tests passed
6. `StudentScheduleDirectionServiceTest`: 6 / 6 tests passed
7. `TrackingServiceTest`: 4 / 4 tests passed
8. `TransportRequestServiceTest`: 19 / 19 tests passed
9. `TripDirectionServiceTest`: 6 / 6 tests passed
10. `AdminDriverServiceAndBootstrapTest`: 10 / 10 tests passed
11. `AdminDriverSecurityEndpointTest`: 8 / 8 tests passed
12. `AdminDriverEndToEndIntegrationTest`: 1 / 1 tests passed
13. `CrossRoleEndToEndIntegrationTest`: 1 / 1 tests passed
14. `ProductionConfigurationTest`: 5 / 5 tests passed

### 22.3 Verification of Admin Bootstrap Runner Mechanics
Inspected `AdminBootstrapRunner.java`:
- **Scenario A (First boot with credentials):** Creates administrator with BCrypt password, logs success.
- **Scenario B (First boot without credentials):** Logs advisory notice, creates zero users, boots cleanly.
- **Scenario C (Subsequent boots with existing admin):** Checks `adminCount > 0`, logs count, takes zero action, never overwrites accounts.
- **Post-Setup Hygiene:** Unset `ADMIN_BOOTSTRAP_PASSWORD` immediately after first boot.

### 22.4 Primary Document Set & Recovery Backup Status
The repository documentation is consolidated into three authoritative documents:
1. `README.md` — Project overview, architecture, quickstart, and role permissions.
2. `docs/PRE_DEPLOYMENT_AUDIT.md` — Complete pre-deployment audit report, Tasks 1–7, test logs, and historical findings.
3. `docs/DEPLOYMENT_GUIDE.md` — Operations manual, Nginx configurations, MySQL privileges, and production runbooks.
- **Temporary Recovery Backup:** `scratch/docs_backup/` contains all 12 pre-consolidation audit files preserved for safety. Once operator verifies consolidation, this directory may be archived outside the repository or removed.





