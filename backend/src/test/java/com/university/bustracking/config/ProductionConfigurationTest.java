package com.university.bustracking.config;

import com.university.bustracking.BusTrackingApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
        "DB_URL=jdbc:mysql://localhost:3306/university_bus_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true",
        "DB_USERNAME=root",
        "DB_PASSWORD=root",
        "JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
        "UPLOAD_DIR=./uploads",
        "APP_CORS_ALLOWED_ORIGINS=https://bus.university.edu,https://admin.bus.university.edu"
})
class ProductionConfigurationTest {

    @Autowired
    private Environment environment;

    @Test
    @DisplayName("Production Profile: DDL auto must be strictly set to 'validate'")
    void prodProfile_DdlAutoMustBeValidate() {
        String ddlAuto = environment.getProperty("spring.jpa.hibernate.ddl-auto");
        assertEquals("validate", ddlAuto, "Production profile must enforce ddl-auto=validate to protect schema");
    }

    @Test
    @DisplayName("Production Profile: CORS allowed origins must bind explicitly without wildcards")
    void prodProfile_CorsAllowedOriginsAreBound() {
        String corsOrigins = environment.getProperty("app.cors.allowed-origins");
        assertNotNull(corsOrigins);
        assertTrue(corsOrigins.contains("https://bus.university.edu"));
        assertTrue(corsOrigins.contains("https://admin.bus.university.edu"));
        assertFalse(corsOrigins.contains("*"), "Production CORS must never allow open wildcards");
    }

    @Test
    @DisplayName("Production Profile: Upload directory must bind to configured path")
    void prodProfile_UploadDirIsBound() {
        String uploadDir = environment.getProperty("file.upload-dir");
        assertEquals("./uploads", uploadDir);
    }

    @Test
    @DisplayName("Production Profile: Show-SQL must be disabled in production")
    void prodProfile_ShowSqlIsDisabled() {
        String showSql = environment.getProperty("spring.jpa.show-sql");
        assertEquals("false", showSql);
    }

    @Test
    @DisplayName("Production Profile: Missing mandatory environment variables causes startup failure")
    void prodProfile_WhenMandatoryVariablesMissing_FailsStartup() {
        SpringApplication app = new SpringApplication(BusTrackingApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);

        // Intentionally start with 'prod' profile without supplying DB_URL, JWT_SECRET, etc.
        // It must throw an exception because placeholders cannot be resolved.
        Exception exception = assertThrows(Exception.class, () -> {
            app.run("--spring.profiles.active=prod", "--spring.main.banner-mode=off");
        });

        assertNotNull(exception);
    }
}
