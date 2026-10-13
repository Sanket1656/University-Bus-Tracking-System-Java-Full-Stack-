package com.university.bustracking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.bustracking.dto.CreateDriverRequest;
import com.university.bustracking.dto.LoginRequest;
import com.university.bustracking.dto.LoginResponse;
import com.university.bustracking.dto.RegisterRequest;
import com.university.bustracking.entity.Role;
import com.university.bustracking.entity.ScheduleStatus;
import com.university.bustracking.entity.User;
import com.university.bustracking.repository.DriverProfileRepository;
import com.university.bustracking.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminDriverEndToEndIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Complete End-to-End Workflow: Student Reg -> Admin Login -> Admin Creates Driver -> Driver Login -> Deactivate -> Reactivate")
    void fullAdminDriverLifecycleWorkflow() throws Exception {
        // 1. Student Registration: Public registration always creates STUDENT
        RegisterRequest studentReg = new RegisterRequest();
        studentReg.setUsername("e2e_student");
        studentReg.setPassword("StudentPass123");
        studentReg.setRole(Role.ADMIN); // Malicious payload attempting admin escalation

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(studentReg)))
                .andExpect(status().isOk());

        User createdStudent = userRepository.findByUsername("e2e_student").orElseThrow();
        assertEquals(Role.STUDENT, createdStudent.getRole(), "Privilege escalation must be blocked");

        // 1b. Student Login
        LoginRequest studentLogin = new LoginRequest();
        studentLogin.setUsername("e2e_student");
        studentLogin.setPassword("StudentPass123");

        MvcResult studentLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(studentLogin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse studentAuth = objectMapper.readValue(
                studentLoginRes.getResponse().getContentAsString(), LoginResponse.class);
        String studentToken = studentAuth.getToken();
        assertNotNull(studentToken);

        // Student tries to access Admin Driver endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/admin/drivers")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // Student tries to create a driver -> 403 Forbidden
        CreateDriverRequest illicitDriverCreate = new CreateDriverRequest(
                "hacked_driver", "Pass1234", "Hack Name", "hack@test.edu");
        mockMvc.perform(post("/api/admin/drivers")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(illicitDriverCreate)))
                .andExpect(status().isForbidden());

        // 2. Admin Setup & Login
        User adminUser = new User("e2e_admin", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("e2e_admin");
        adminLogin.setPassword("AdminPass123!");

        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse adminAuth = objectMapper.readValue(
                adminLoginRes.getResponse().getContentAsString(), LoginResponse.class);
        String adminToken = adminAuth.getToken();
        assertNotNull(adminToken);

        // 3. Admin creates a Driver
        CreateDriverRequest newDriverReq = new CreateDriverRequest(
                "e2e_driver", "DriverSecret123", "Mahesh Verma", "mahesh.driver@university.edu");
        newDriverReq.setPhone("+91 9811122233");
        newDriverReq.setLicenseId("DL-CAMPUS-2026");

        MvcResult driverCreateRes = mockMvc.perform(post("/api/admin/drivers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDriverReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("e2e_driver"))
                .andReturn();

        User createdDriverUser = userRepository.findByUsername("e2e_driver").orElseThrow();
        assertEquals(Role.DRIVER, createdDriverUser.getRole());
        assertTrue(passwordEncoder.matches("DriverSecret123", createdDriverUser.getPassword()));

        // Ensure driver profile was created with active status
        var driverProf = driverProfileRepository.findByUserId(createdDriverUser.getId()).orElseThrow();
        assertEquals("Mahesh Verma", driverProf.getName());
        assertEquals(ScheduleStatus.ACTIVE, driverProf.getStatus());

        // Admin lists drivers (unpaginated returns array)
        mockMvc.perform(get("/api/admin/drivers")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Admin lists drivers with pagination & status filters
        mockMvc.perform(get("/api/admin/drivers?page=1&limit=10&status=active")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.summary.total").isNumber())
                .andExpect(jsonPath("$.summary.active").isNumber());

        // 4. Driver logs in through standard login page
        LoginRequest driverLogin = new LoginRequest();
        driverLogin.setUsername("e2e_driver");
        driverLogin.setPassword("DriverSecret123");

        MvcResult driverLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(driverLogin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse driverAuth = objectMapper.readValue(
                driverLoginRes.getResponse().getContentAsString(), LoginResponse.class);
        String driverToken = driverAuth.getToken();
        assertNotNull(driverToken);
        assertEquals("Driver", driverAuth.getUser().getRole().getValue());

        // Driver accesses Driver profile endpoint -> 200 OK
        mockMvc.perform(get("/api/driver/profile")
                .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true))
                .andExpect(jsonPath("$.data.name").value("Mahesh Verma"));

        // Driver cannot access Admin endpoints -> 403 Forbidden
        mockMvc.perform(get("/api/admin/drivers")
                .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isForbidden());

        // 5. Admin deactivates Driver
        mockMvc.perform(post("/api/admin/drivers/" + createdDriverUser.getId() + "/deactivate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        var deactivatedProf = driverProfileRepository.findByUserId(createdDriverUser.getId()).orElseThrow();
        assertEquals(ScheduleStatus.INACTIVE, deactivatedProf.getStatus());

        // 6. Deactivated Driver is blocked from login -> 400 Bad Request
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(driverLogin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Your driver account is inactive. Please contact the administrator."));

        // Inactive Driver using existing token is rejected on protected endpoints -> 403 Forbidden
        mockMvc.perform(get("/api/driver/profile")
                .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isForbidden());

        // 7. Admin reactivates Driver
        mockMvc.perform(post("/api/admin/drivers/" + createdDriverUser.getId() + "/reactivate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        var reactivatedProf = driverProfileRepository.findByUserId(createdDriverUser.getId()).orElseThrow();
        assertEquals(ScheduleStatus.ACTIVE, reactivatedProf.getStatus());

        // 8. Driver can log in again after reactivation
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(driverLogin)))
                .andExpect(status().isOk());
    }
}
