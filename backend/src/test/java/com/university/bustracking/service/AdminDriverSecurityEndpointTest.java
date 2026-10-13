package com.university.bustracking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.bustracking.config.JwtAuthFilter;
import com.university.bustracking.config.SecurityConfig;
import com.university.bustracking.controller.AdminController;
import com.university.bustracking.dto.CreateDriverRequest;
import com.university.bustracking.dto.UserSummaryDto;
import com.university.bustracking.entity.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import(SecurityConfig.class)
class AdminDriverSecurityEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BusService busService;

    @MockBean
    private BusRouteService busRouteService;

    @MockBean
    private BusStopService busStopService;

    @MockBean
    private AssignmentService assignmentService;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @BeforeEach
    void setUpFilter() throws Exception {
        doAnswer(invocation -> {
            HttpServletRequest req = invocation.getArgument(0);
            HttpServletResponse res = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
    }

    @Test
    @DisplayName("Unauthenticated request to create driver is rejected")
    void createDriver_Unauthenticated_ShouldBeForbidden() throws Exception {
        CreateDriverRequest req = new CreateDriverRequest("driver_u", "Pass1234", "Driver Name", "d@test.edu");

        mockMvc.perform(post("/api/admin/drivers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT role cannot access driver creation endpoint")
    @WithMockUser(username = "student_user", roles = {"STUDENT"})
    void createDriver_AsStudent_ShouldBeForbidden() throws Exception {
        CreateDriverRequest req = new CreateDriverRequest("driver_s", "Pass1234", "Driver Name", "d@test.edu");

        mockMvc.perform(post("/api/admin/drivers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DRIVER role cannot access driver creation endpoint")
    @WithMockUser(username = "existing_driver", roles = {"DRIVER"})
    void createDriver_AsDriver_ShouldBeForbidden() throws Exception {
        CreateDriverRequest req = new CreateDriverRequest("driver_d", "Pass1234", "Driver Name", "d@test.edu");

        mockMvc.perform(post("/api/admin/drivers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN role can create a driver via JSON request")
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    void createDriver_AsAdmin_ShouldSucceed() throws Exception {
        CreateDriverRequest req = new CreateDriverRequest("new_driver_admin", "Pass1234", "Legal Driver", "legal@test.edu");

        UserSummaryDto summary = new UserSummaryDto();
        summary.setId(99L);
        summary.setUsername("new_driver_admin");
        summary.setRole(Role.DRIVER);

        Map<String, Object> serviceResult = new HashMap<>();
        serviceResult.put("success", true);
        serviceResult.put("message", "Driver created successfully");
        serviceResult.put("data", summary);

        when(authService.createDriver(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(serviceResult);

        mockMvc.perform(post("/api/admin/drivers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Driver created successfully"));
    }

    @Test
    @DisplayName("Unauthenticated request to list drivers is rejected")
    void getDrivers_Unauthenticated_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/drivers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("STUDENT role cannot access driver list endpoint")
    @WithMockUser(username = "student_user", roles = {"STUDENT"})
    void getDrivers_AsStudent_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/drivers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DRIVER role cannot access admin driver list endpoint")
    @WithMockUser(username = "driver_user", roles = {"DRIVER"})
    void getDrivers_AsDriver_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/drivers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN role can list drivers")
    @WithMockUser(username = "admin_user", roles = {"ADMIN"})
    void getDrivers_AsAdmin_ShouldSucceed() throws Exception {
        Map<String, Object> listResult = new HashMap<>();
        listResult.put("data", Collections.emptyList());
        listResult.put("summary", Map.of("total", 0, "active", 0, "inactive", 0));

        when(authService.getAllDrivers(any(), any(), any(), any(), any(Boolean.class)))
                .thenReturn(listResult);

        mockMvc.perform(get("/api/admin/drivers"))
                .andExpect(status().isOk());
    }
}
