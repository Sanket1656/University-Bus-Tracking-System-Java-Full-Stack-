-- ==============================================================================
-- University Bus Tracking System — Baseline Relational Schema (MySQL 8.0 & TiDB)
-- Description: Baseline schema definition for 13 normalized tables and 21 FKs.
-- Compatible with: MySQL 8.0+ and TiDB Cloud Starter (Serverless)
-- Generated: 2026-10-14
-- Note: Safe for repeatable initialization; uses IF NOT EXISTS.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: student_profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NULL,
    branch VARCHAR(255) NULL,
    enrollment_number VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    address VARCHAR(255) NULL,
    area VARCHAR(255) NULL,
    landmark VARCHAR(255) NULL,
    photo VARCHAR(255) NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_student_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_student_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: driver_profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(255) NULL,
    age VARCHAR(255) NULL,
    license_id VARCHAR(255) NULL,
    address VARCHAR(255) NULL,
    area VARCHAR(255) NULL,
    landmark VARCHAR(255) NULL,
    photo VARCHAR(255) NULL,
    license_photo VARCHAR(255) NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_driver_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_driver_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: buses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bus_name VARCHAR(255) NOT NULL,
    bus_number VARCHAR(255) NOT NULL,
    bus_registration_number VARCHAR(255) NOT NULL,
    bus_type VARCHAR(255) NULL DEFAULT 'NON_AC',
    bus_capacity INT NOT NULL,
    bus_status VARCHAR(255) NULL DEFAULT 'ACTIVE',
    bus_photo VARCHAR(255) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_buses_bus_number UNIQUE (bus_number),
    CONSTRAINT uk_buses_bus_reg_number UNIQUE (bus_registration_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: bus_stops
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_stops (
    id BIGINT NOT NULL AUTO_INCREMENT,
    stop_name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: bus_routes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_routes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    route_name VARCHAR(255) NOT NULL,
    route_code VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_bus_routes_route_code UNIQUE (route_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: route_stops
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_stops (
    id BIGINT NOT NULL AUTO_INCREMENT,
    route_id BIGINT NOT NULL,
    stop_id BIGINT NOT NULL,
    stop_order INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_route_stops_route_order UNIQUE (route_id, stop_order),
    CONSTRAINT uk_route_stops_route_stop UNIQUE (route_id, stop_id),
    CONSTRAINT fk_route_stops_route FOREIGN KEY (route_id) REFERENCES bus_routes (id) ON DELETE CASCADE,
    CONSTRAINT fk_route_stops_stop FOREIGN KEY (stop_id) REFERENCES bus_stops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: assignments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bus_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    route_id BIGINT NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_assignments_bus FOREIGN KEY (bus_id) REFERENCES buses (id),
    CONSTRAINT fk_assignments_driver FOREIGN KEY (driver_id) REFERENCES users (id),
    CONSTRAINT fk_assignments_route FOREIGN KEY (route_id) REFERENCES bus_routes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: bus_schedules
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_schedules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    assignment_id BIGINT NOT NULL,
    day_of_week VARCHAR(255) NOT NULL,
    start_time VARCHAR(255) NOT NULL,
    direction VARCHAR(255) NOT NULL DEFAULT 'OUTBOUND',
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_schedules_slot UNIQUE (assignment_id, day_of_week, start_time, direction),
    CONSTRAINT fk_schedules_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: transport_requests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    preferred_stop_id BIGINT NOT NULL,
    assignment_id BIGINT NULL,
    seat_number INT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    remarks VARCHAR(255) NULL,
    cancellation_status VARCHAR(255) NOT NULL DEFAULT 'NONE',
    cancellation_reason VARCHAR(255) NULL,
    cancellation_remarks VARCHAR(255) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_transport_requests_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_transport_requests_stop FOREIGN KEY (preferred_stop_id) REFERENCES bus_stops (id),
    CONSTRAINT fk_transport_requests_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: trips
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id BIGINT NOT NULL AUTO_INCREMENT,
    schedule_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    bus_id BIGINT NOT NULL,
    route_id BIGINT NOT NULL,
    direction VARCHAR(255) NOT NULL DEFAULT 'OUTBOUND',
    status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
    started_at DATETIME(6) NULL,
    ended_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_trips_schedule FOREIGN KEY (schedule_id) REFERENCES bus_schedules (id),
    CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES users (id),
    CONSTRAINT fk_trips_bus FOREIGN KEY (bus_id) REFERENCES buses (id),
    CONSTRAINT fk_trips_route FOREIGN KEY (route_id) REFERENCES bus_routes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: bus_locations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bus_locations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bus_id BIGINT NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    speed DOUBLE NULL DEFAULT 0.0,
    heading DOUBLE NULL DEFAULT 0.0,
    is_moving BIT(1) NULL DEFAULT 0,
    current_stop_index INT NULL,
    current_stop_id BIGINT NULL,
    next_stop_id BIGINT NULL,
    route_progress DOUBLE NULL DEFAULT 0.0,
    route_completed BIT(1) NULL DEFAULT 0,
    updated_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_bus_locations_bus_id UNIQUE (bus_id),
    CONSTRAINT fk_bus_locations_bus FOREIGN KEY (bus_id) REFERENCES buses (id),
    CONSTRAINT fk_bus_locations_current_stop FOREIGN KEY (current_stop_id) REFERENCES bus_stops (id),
    CONSTRAINT fk_bus_locations_next_stop FOREIGN KEY (next_stop_id) REFERENCES bus_stops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Table: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipient_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    related_trip_id BIGINT NULL,
    related_bus_id BIGINT NULL,
    is_read BIT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id),
    CONSTRAINT fk_notifications_trip FOREIGN KEY (related_trip_id) REFERENCES trips (id),
    CONSTRAINT fk_notifications_bus FOREIGN KEY (related_bus_id) REFERENCES buses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
