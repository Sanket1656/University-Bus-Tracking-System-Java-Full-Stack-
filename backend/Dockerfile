# ==============================================================================
# Stage 1: Build executable JAR using Maven and Eclipse Temurin OpenJDK 21
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source files and package executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Minimal production runtime using Eclipse Temurin JRE 21
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Run as non-root user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Default configuration for demo/free-tier deployment
# Retains full support for runtime overrides via Render environment variables
ENV SPRING_PROFILES_ACTIVE=prod \
    UPLOAD_DIR=/tmp/uploads

# Ensure default upload directory exists with write permissions for appuser
RUN mkdir -p /tmp/uploads && chown -R appuser:appgroup /tmp/uploads

# Copy executable JAR from builder stage
COPY --from=builder /build/target/bustracking-1.0.0.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

# Render dynamically injects $PORT (default fallback to 5000 / 10000)
EXPOSE 5000 10000

# Start Spring Boot backend
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
