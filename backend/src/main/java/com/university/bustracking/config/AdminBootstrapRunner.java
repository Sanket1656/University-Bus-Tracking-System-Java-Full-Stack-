package com.university.bustracking.config;

import com.university.bustracking.entity.Role;
import com.university.bustracking.entity.User;
import com.university.bustracking.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Controlled, one-time bootstrap component for initializing the first administrator account.
 *
 * Requirements:
 * 1. Checks if any ADMIN user already exists in the database.
 * 2. If at least one ADMIN exists, it immediately exits without taking any action.
 *    It will NEVER silently recreate, reset, or overwrite administrator accounts on restarts.
 * 3. If zero ADMIN accounts exist, it reads the credentials from environment variables / system properties:
 *    - ADMIN_BOOTSTRAP_USERNAME (or app.admin.bootstrap.username)
 *    - ADMIN_BOOTSTRAP_PASSWORD (or app.admin.bootstrap.password)
 *    If both are provided, it hashes the password using PasswordEncoder and creates the first administrator.
 *    If not provided, it logs an operator advisory message on startup.
 * 4. No hardcoded default credentials or secrets are used.
 */
@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @Value("${app.admin.bootstrap.username:${ADMIN_BOOTSTRAP_USERNAME:}}")
    private String bootstrapUsername;

    @Value("${app.admin.bootstrap.password:${ADMIN_BOOTSTRAP_PASSWORD:}}")
    private String bootstrapPassword;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.execute("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL");
            } catch (Exception ignored) {
                // Table might not exist yet or already altered
            }
        }

        long adminCount = userRepository.countByRole(Role.ADMIN);
        if (adminCount > 0) {
            logger.info("Admin bootstrap check: {} administrator account(s) present. No bootstrap action required.", adminCount);
            return;
        }

        String username = (bootstrapUsername != null) ? bootstrapUsername.trim() : "";
        String password = (bootstrapPassword != null) ? bootstrapPassword.trim() : "";

        if (!username.isEmpty() && !password.isEmpty()) {
            if (password.length() < 8) {
                logger.warn("Admin bootstrap: Provided bootstrap password is less than 8 characters. Consider using a stronger password.");
            }

            if (userRepository.existsByUsername(username)) {
                logger.warn("Admin bootstrap: Username '{}' already exists with a different role. Cannot bootstrap this username.", username);
                return;
            }

            User admin = new User(username, passwordEncoder.encode(password), Role.ADMIN);
            userRepository.save(admin);
            logger.info("Admin bootstrap SUCCESS: Created initial administrator account for username '{}'.", username);
        } else {
            logger.info("Admin bootstrap NOTICE: Zero administrator accounts found in database. " +
                    "To initialize the first administrator, supply ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD environment variables or JVM system properties.");
        }
    }
}
