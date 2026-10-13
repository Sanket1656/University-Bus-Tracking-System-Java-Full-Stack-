package com.university.bustracking.service;

import com.university.bustracking.dto.RegisterRequest;
import com.university.bustracking.entity.Role;
import com.university.bustracking.entity.User;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthRegistrationSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Public registration always creates a STUDENT account even if payload supplies ADMIN")
    void register_WhenRequestRoleIsAdmin_ShouldForceRoleStudent() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("admin_attacker");
        request.setPassword("SecretPass123");
        request.setRole(Role.ADMIN);

        when(userRepository.existsByUsername("admin_attacker")).thenReturn(false);
        when(passwordEncoder.encode("SecretPass123")).thenReturn("$2a$10$hashedAdminPass");

        Map<String, String> result = authService.register(request);

        assertNotNull(result);
        assertTrue(result.containsKey("message"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("admin_attacker", savedUser.getUsername());
        assertEquals("$2a$10$hashedAdminPass", savedUser.getPassword());
        assertEquals(Role.STUDENT, savedUser.getRole(), "User role must be forced to STUDENT");
        assertNotEquals(Role.ADMIN, savedUser.getRole(), "Privilege escalation to ADMIN must be prevented");
    }

    @Test
    @DisplayName("Public registration cannot create a DRIVER account")
    void register_WhenRequestRoleIsDriver_ShouldForceRoleStudent() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("fake_driver");
        request.setPassword("DriverPass123");
        request.setRole(Role.DRIVER);

        when(userRepository.existsByUsername("fake_driver")).thenReturn(false);
        when(passwordEncoder.encode("DriverPass123")).thenReturn("$2a$10$hashedDriverPass");

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals(Role.STUDENT, savedUser.getRole(), "Role DRIVER must be forced to STUDENT");
        assertNotEquals(Role.DRIVER, savedUser.getRole());
    }

    @Test
    @DisplayName("Public registration with null role defaults to STUDENT")
    void register_WhenRequestRoleIsNull_ShouldDefaultToStudent() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("student_user");
        request.setPassword("StudentPass123");
        request.setRole(null);

        when(userRepository.existsByUsername("student_user")).thenReturn(false);
        when(passwordEncoder.encode("StudentPass123")).thenReturn("$2a$10$hashedStudentPass");

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals(Role.STUDENT, savedUser.getRole());
    }

    @Test
    @DisplayName("Public registration rejects existing username")
    void register_WhenUsernameAlreadyExists_ShouldThrowBadRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existing_user");
        request.setPassword("Password123");

        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Public registration ensures password hashing before persistence")
    void register_ShouldHashPasswordWithPasswordEncoder() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("new_student");
        request.setPassword("PlaintextPassword");

        when(userRepository.existsByUsername("new_student")).thenReturn(false);
        when(passwordEncoder.encode("PlaintextPassword")).thenReturn("$2a$10$properlyHashed");

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("$2a$10$properlyHashed", savedUser.getPassword());
        assertNotEquals("PlaintextPassword", savedUser.getPassword());
    }
}
