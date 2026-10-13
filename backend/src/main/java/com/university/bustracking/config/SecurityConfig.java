package com.university.bustracking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Admin-only management endpoints
                .requestMatchers(HttpMethod.POST, "/api/bus/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/bus/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/bus/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/stop/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/stop/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/stop/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/routes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/routes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/routes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/schedules/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/schedules/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/schedules/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/assignment/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/assignment/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/assignment/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/get-all-users", "/api/auth/get-all-drivers", "/api/auth/get-all-students", "/api/auth/delete-user/**", "/api/auth/drivers/**", "/api/auth/students/**", "/api/auth/users/**").hasRole("ADMIN")
                .requestMatchers("/api/tracking/demo/**").hasRole("ADMIN")
                .requestMatchers("/api/transport/pending-transport-requests", "/api/transport/approved-transport-requests", "/api/transport/pending-cancellation-requests").hasRole("ADMIN")
                .requestMatchers("/api/transport/transport-request/*/approve-cancellation", "/api/transport/transport-request/*/reject-cancellation").hasRole("ADMIN")
                .requestMatchers("/api/transport/transport-request/*/reject", "/api/transport/transport-request/*/change-assignment", "/api/transport/transport-request/*/change-seat").hasRole("ADMIN")
                .requestMatchers("/api/transport/assignment/*/assign-students", "/api/transport/assignment/*/students", "/api/transport/assignment/*/pending-students").hasRole("ADMIN")

                // Driver-only operational endpoints
                .requestMatchers("/api/driver/**").hasRole("DRIVER")
                .requestMatchers("/api/trips/start", "/api/trips/end", "/api/trips/prepare-return").hasRole("DRIVER")
                .requestMatchers("/api/tracking/update-location").hasRole("DRIVER")

                // Student-only endpoints
                .requestMatchers("/api/student/**").hasRole("STUDENT")
                .requestMatchers("/api/transport/transport-request", "/api/transport/my-transport-request", "/api/transport/transport-request/my-cancel-request", "/api/transport/transport-request/update-preferred-stop", "/api/transport/my-bus/seat-map").hasRole("STUDENT")

                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
