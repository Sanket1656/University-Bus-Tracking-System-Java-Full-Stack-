package com.university.bustracking.service;

import com.university.bustracking.config.JwtAuthFilter;
import com.university.bustracking.config.SecurityConfig;
import com.university.bustracking.controller.TransportRequestController;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TransportRequestController.class)
@Import(SecurityConfig.class)
class RosterAuthorizationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TransportRequestService transportRequestService;

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
    @DisplayName("Unauthenticated request to assignment students roster is rejected")
    void getAssignmentStudents_Unauthenticated_ShouldBeUnauthorizedOrForbidden() throws Exception {
        mockMvc.perform(get("/api/transport/assignment/1/students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated STUDENT cannot access assignment students roster")
    @WithMockUser(username = "student1", roles = {"STUDENT"})
    void getAssignmentStudents_AsStudent_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/transport/assignment/1/students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated DRIVER cannot access assignment students roster")
    @WithMockUser(username = "driver1", roles = {"DRIVER"})
    void getAssignmentStudents_AsDriver_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/transport/assignment/1/students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated ADMIN can access assignment students roster")
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    void getAssignmentStudents_AsAdmin_ShouldSucceed() throws Exception {
        when(transportRequestService.getAssignmentStudents(eq(1L)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/transport/assignment/1/students"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Unauthenticated request to pending-students roster is rejected")
    void getPendingStudents_Unauthenticated_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/transport/assignment/1/pending-students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated STUDENT cannot access pending-students roster")
    @WithMockUser(username = "student1", roles = {"STUDENT"})
    void getPendingStudents_AsStudent_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/transport/assignment/1/pending-students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated DRIVER cannot access pending-students roster")
    @WithMockUser(username = "driver1", roles = {"DRIVER"})
    void getPendingStudents_AsDriver_ShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/transport/assignment/1/pending-students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated ADMIN can access pending-students roster")
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    void getPendingStudents_AsAdmin_ShouldSucceed() throws Exception {
        when(transportRequestService.getPendingStudentsForAssignment(eq(1L)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/transport/assignment/1/pending-students"))
                .andExpect(status().isOk());
    }
}
