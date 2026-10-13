package com.university.bustracking.config;

import com.university.bustracking.entity.Role;
import com.university.bustracking.entity.ScheduleStatus;
import com.university.bustracking.entity.User;
import com.university.bustracking.repository.DriverProfileRepository;
import com.university.bustracking.repository.UserRepository;
import com.university.bustracking.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository, DriverProfileRepository driverProfileRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.driverProfileRepository = driverProfileRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // Invalid or expired token
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userRepository.findByUsername(username).orElse(null);

            if (user != null && jwtUtil.validateToken(jwt, user.getUsername())) {
                // Prevent inactive drivers from authenticating or performing protected actions
                if (user.getRole() == Role.DRIVER) {
                    boolean isInactive = driverProfileRepository.findByUserId(user.getId())
                            .map(dp -> dp.getStatus() == ScheduleStatus.INACTIVE)
                            .orElse(false);
                    if (isInactive) {
                        filterChain.doFilter(request, response);
                        return;
                    }
                }

                String roleName = user.getRole().name();
                List<SimpleGrantedAuthority> authorities = Arrays.asList(
                    new SimpleGrantedAuthority("ROLE_" + roleName),
                    new SimpleGrantedAuthority(roleName),
                    new SimpleGrantedAuthority(user.getRole().getValue())
                );

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        user, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
