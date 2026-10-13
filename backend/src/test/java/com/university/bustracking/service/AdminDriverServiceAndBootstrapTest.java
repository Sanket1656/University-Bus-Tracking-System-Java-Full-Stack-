package com.university.bustracking.service;

import com.university.bustracking.config.AdminBootstrapRunner;
import com.university.bustracking.dto.LoginRequest;
import com.university.bustracking.dto.LoginResponse;
import com.university.bustracking.dto.RegisterRequest;
import com.university.bustracking.dto.UserSummaryDto;
import com.university.bustracking.entity.DriverProfile;
import com.university.bustracking.entity.Role;
import com.university.bustracking.entity.ScheduleStatus;
import com.university.bustracking.entity.User;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.repository.DriverProfileRepository;
import com.university.bustracking.repository.UserRepository;
import com.university.bustracking.util.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminDriverServiceAndBootstrapTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DriverProfileRepository driverProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AuthService authService;

    // ── DRIVER CREATION TESTS ──

    @Test
    @DisplayName("Admin can create driver with exclusively backend-assigned DRIVER role and hashed password")
    void createDriver_ValidInput_Success() {
        when(userRepository.existsByUsername("new_driver")).thenReturn(false);
        when(driverProfileRepository.existsByEmail("driver@university.edu")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass123")).thenReturn("$2a$10$hashedDriverSecret");

        User savedUser = new User("new_driver", "$2a$10$hashedDriverSecret", Role.DRIVER);
        savedUser.setId(10L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Map<String, Object> response = authService.createDriver(
                "new_driver",
                "SecurePass123",
                "Ramesh Kumar",
                "driver@university.edu",
                "+91 9876543210",
                "40",
                "DL-998877",
                "Campus Quarters",
                "South Campus",
                "Gate 2",
                null,
                null
        );

        assertNotNull(response);
        assertEquals(true, response.get("success"));
        assertEquals("Driver created successfully", response.get("message"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User createdUser = userCaptor.getValue();
        assertEquals("new_driver", createdUser.getUsername());
        assertEquals(Role.DRIVER, createdUser.getRole(), "Role must be explicitly DRIVER");
        assertEquals("$2a$10$hashedDriverSecret", createdUser.getPassword(), "Password must be hashed");

        ArgumentCaptor<DriverProfile> profileCaptor = ArgumentCaptor.forClass(DriverProfile.class);
        verify(driverProfileRepository).save(profileCaptor.capture());
        DriverProfile createdProfile = profileCaptor.getValue();
        assertEquals("Ramesh Kumar", createdProfile.getName());
        assertEquals("driver@university.edu", createdProfile.getEmail());
        assertEquals(ScheduleStatus.ACTIVE, createdProfile.getStatus());

        // Ensure returned summary never exposes plaintext password
        Object dataObj = response.get("data");
        assertTrue(dataObj instanceof UserSummaryDto);
        UserSummaryDto summary = (UserSummaryDto) dataObj;
        assertEquals("new_driver", summary.getUsername());
        assertEquals(Role.DRIVER, summary.getRole());
    }

    @Test
    @DisplayName("Driver creation rejects duplicate email")
    void createDriver_DuplicateEmail_ThrowsBadRequest() {
        when(userRepository.existsByUsername("driver_two")).thenReturn(false);
        when(driverProfileRepository.existsByEmail("existing@university.edu")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.createDriver(
                "driver_two",
                "SecurePass123",
                "Second Driver",
                "existing@university.edu",
                null, null, null, null, null, null, null, null
        ));

        assertTrue(ex.getMessage().contains("email already exists"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Driver creation rejects invalid email format")
    void createDriver_InvalidEmailFormat_ThrowsBadRequest() {
        when(userRepository.existsByUsername("driver_bad_email")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.createDriver(
                "driver_bad_email",
                "SecurePass123",
                "Bad Email Driver",
                "not-an-email",
                null, null, null, null, null, null, null, null
        ));

        assertTrue(ex.getMessage().contains("Invalid email format"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Driver creation rejects duplicate username")
    void createDriver_DuplicateUsername_ThrowsBadRequest() {
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.createDriver(
                "existing_user",
                "SecurePass123",
                "Test Driver",
                "test@university.edu",
                null, null, null, null, null, null, null, null
        ));

        assertTrue(ex.getMessage().contains("Username already exists"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Driver creation rejects password shorter than 6 characters")
    void createDriver_ShortPassword_ThrowsBadRequest() {
        when(userRepository.existsByUsername("driver_short")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.createDriver(
                "driver_short",
                "123",
                "Short Pass Driver",
                "short@university.edu",
                null, null, null, null, null, null, null, null
        ));

        assertTrue(ex.getMessage().contains("at least 6 characters"));
        verify(userRepository, never()).save(any(User.class));
    }

    // ── INACTIVE DRIVER LOGIN TESTS ──

    @Test
    @DisplayName("Inactive driver account is blocked from login")
    void login_InactiveDriver_ThrowsBadRequest() {
        User driverUser = new User("inactive_driver", "$2a$10$hashedPass", Role.DRIVER);
        driverUser.setId(5L);

        DriverProfile inactiveProfile = new DriverProfile();
        inactiveProfile.setStatus(ScheduleStatus.INACTIVE);

        when(userRepository.findByUsername("inactive_driver")).thenReturn(Optional.of(driverUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPass")).thenReturn(true);
        when(driverProfileRepository.findByUserId(5L)).thenReturn(Optional.of(inactiveProfile));

        LoginRequest request = new LoginRequest();
        request.setUsername("inactive_driver");
        request.setPassword("password123");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().toLowerCase().contains("inactive"), "Must indicate driver account is inactive");
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    @DisplayName("Active driver account can log in successfully")
    void login_ActiveDriver_Success() {
        User driverUser = new User("active_driver", "$2a$10$hashedPass", Role.DRIVER);
        driverUser.setId(6L);

        DriverProfile activeProfile = new DriverProfile();
        activeProfile.setStatus(ScheduleStatus.ACTIVE);

        when(userRepository.findByUsername("active_driver")).thenReturn(Optional.of(driverUser));
        when(passwordEncoder.matches("password123", "$2a$10$hashedPass")).thenReturn(true);
        when(driverProfileRepository.findByUserId(6L)).thenReturn(Optional.of(activeProfile));
        when(jwtUtil.generateToken(driverUser)).thenReturn("mock.jwt.token");

        LoginRequest request = new LoginRequest();
        request.setUsername("active_driver");
        request.setPassword("password123");

        LoginResponse response = authService.login(request);
        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("active_driver", response.getUser().getUsername());
        assertEquals(Role.DRIVER, response.getUser().getRole());
    }

    // ── FIRST ADMINISTRATOR BOOTSTRAP TESTS ──

    @Test
    @DisplayName("Admin bootstrap creates initial admin when zero admins exist and credentials provided")
    void adminBootstrap_WhenZeroAdminsAndCredentialsProvided_CreatesAdmin() {
        UserRepository mockUserRepo = mock(UserRepository.class);
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);

        when(mockUserRepo.countByRole(Role.ADMIN)).thenReturn(0L);
        when(mockUserRepo.existsByUsername("superadmin")).thenReturn(false);
        when(mockEncoder.encode("SuperSecret123!")).thenReturn("$2a$10$hashedSuperAdminSecret");

        AdminBootstrapRunner runner = new AdminBootstrapRunner(mockUserRepo, mockEncoder);
        ReflectionTestUtils.setField(runner, "bootstrapUsername", "superadmin");
        ReflectionTestUtils.setField(runner, "bootstrapPassword", "SuperSecret123!");

        runner.run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(mockUserRepo, times(1)).save(captor.capture());
        User createdAdmin = captor.getValue();
        assertEquals("superadmin", createdAdmin.getUsername());
        assertEquals(Role.ADMIN, createdAdmin.getRole());
        assertEquals("$2a$10$hashedSuperAdminSecret", createdAdmin.getPassword());
    }

    @Test
    @DisplayName("Admin bootstrap does NOTHING when at least one administrator already exists")
    void adminBootstrap_WhenAdminAlreadyExists_DoesNothing() {
        UserRepository mockUserRepo = mock(UserRepository.class);
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);

        when(mockUserRepo.countByRole(Role.ADMIN)).thenReturn(1L);

        AdminBootstrapRunner runner = new AdminBootstrapRunner(mockUserRepo, mockEncoder);
        ReflectionTestUtils.setField(runner, "bootstrapUsername", "should_not_create");
        ReflectionTestUtils.setField(runner, "bootstrapPassword", "ShouldNotCreate123!");

        runner.run();

        verify(mockUserRepo, never()).save(any(User.class));
        verify(mockEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Admin bootstrap does NOTHING when zero admins exist but no credentials supplied")
    void adminBootstrap_WhenZeroAdminsAndNoCredentials_DoesNothing() {
        UserRepository mockUserRepo = mock(UserRepository.class);
        PasswordEncoder mockEncoder = mock(PasswordEncoder.class);

        when(mockUserRepo.countByRole(Role.ADMIN)).thenReturn(0L);

        AdminBootstrapRunner runner = new AdminBootstrapRunner(mockUserRepo, mockEncoder);
        ReflectionTestUtils.setField(runner, "bootstrapUsername", "");
        ReflectionTestUtils.setField(runner, "bootstrapPassword", "");

        runner.run();

        verify(mockUserRepo, never()).save(any(User.class));
        verify(mockEncoder, never()).encode(anyString());
    }
}
