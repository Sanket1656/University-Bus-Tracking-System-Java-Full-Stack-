package com.university.bustracking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.bustracking.dto.CreateDriverRequest;
import com.university.bustracking.dto.LoginRequest;
import com.university.bustracking.dto.LoginResponse;
import com.university.bustracking.dto.RegisterRequest;
import com.university.bustracking.entity.*;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CrossRoleEndToEndIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BusRouteRepository busRouteRepository;

    @Autowired
    private BusStopRepository busStopRepository;

    @Autowired
    private RouteStopRepository routeStopRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @Autowired
    private TransportRequestRepository transportRequestRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BusLocationRepository busLocationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Complete Phase 3 Cross-Role E2E: Admin creates driver -> Student requests transport -> Admin assigns bus/seat -> Driver starts trip -> Student tracks live & notif -> Driver updates loc -> Driver ends trip -> Student verifies completed & preserved location -> Unauthorized updates rejected")
    void completeCrossRoleWorkflow() throws Exception {
        // --- SETUP SEED DATA ---
        // Create Admin
        User adminUser = new User("cross_admin", passwordEncoder.encode("AdminPass123!"), Role.ADMIN);
        userRepository.save(adminUser);

        // Create Bus
        Bus bus = new Bus();
        bus.setBusNumber("BUS-CROSS-101");
        bus.setBusName("Cross Campus Cruiser");
        bus.setBusRegistrationNumber("GJ-05-CR-1011");
        bus.setBusType(BusType.AC);
        bus.setBusCapacity(40);
        bus.setBusStatus(BusStatus.ACTIVE);
        bus = busRepository.save(bus);

        // Create Stops
        BusStop stopA = new BusStop();
        stopA.setStopName("Campus Gate A");
        stopA.setLatitude(21.2000);
        stopA.setLongitude(72.8000);
        stopA.setStatus(ScheduleStatus.ACTIVE);
        stopA = busStopRepository.save(stopA);

        BusStop stopB = new BusStop();
        stopB.setStopName("Central Library");
        stopB.setLatitude(21.2500);
        stopB.setLongitude(72.8500);
        stopB.setStatus(ScheduleStatus.ACTIVE);
        stopB = busStopRepository.save(stopB);

        // Create Route
        BusRoute route = new BusRoute();
        route.setRouteName("Cross Route 101");
        route.setRouteCode("CR-101");
        route.setStatus(ScheduleStatus.ACTIVE);
        route = busRouteRepository.save(route);

        RouteStop rsA = new RouteStop(route, stopA, 1);
        RouteStop rsB = new RouteStop(route, stopB, 2);
        route.getRouteStops().add(rsA);
        route.getRouteStops().add(rsB);
        route = busRouteRepository.save(route);

        // --- STEP 0: ADMIN LOGIN ---
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setUsername("cross_admin");
        adminLogin.setPassword("AdminPass123!");

        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse adminAuth = objectMapper.readValue(adminLoginRes.getResponse().getContentAsString(), LoginResponse.class);
        String adminToken = adminAuth.getToken();
        assertNotNull(adminToken);

        // --- STEP 1: ADMIN CREATES A DRIVER ---
        CreateDriverRequest createDriver = new CreateDriverRequest(
                "cross_driver", "DriverPass123!", "Kishore Driver", "kishore.driver@university.edu");
        createDriver.setPhone("9876543210");
        createDriver.setLicenseId("DL-CROSS-101");

        MvcResult driverCreateRes = mockMvc.perform(post("/api/admin/drivers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createDriver)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        User driverUser = userRepository.findByUsername("cross_driver").orElseThrow();
        assertEquals(Role.DRIVER, driverUser.getRole());

        // Create Assignment for Bus, Driver, Route
        Assignment assignment = new Assignment(bus, driverUser, route, ScheduleStatus.ACTIVE);
        assignment = assignmentRepository.save(assignment);

        // Create Bus Schedule
        BusSchedule schedule = new BusSchedule();
        schedule.setAssignment(assignment);
        schedule.setDayOfWeek("Monday");
        schedule.setStartTime("08:00");
        schedule.setDirection(Direction.OUTBOUND);
        schedule.setStatus(ScheduleStatus.ACTIVE);
        schedule = busScheduleRepository.save(schedule);

        // --- STEP 2: STUDENT REGISTERS AND SUBMITS TRANSPORT REQUEST ---
        RegisterRequest studentReg = new RegisterRequest();
        studentReg.setUsername("cross_student");
        studentReg.setPassword("StudentPass123!");
        studentReg.setRole(Role.STUDENT);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(studentReg)))
                .andExpect(status().isOk());

        User studentUser = userRepository.findByUsername("cross_student").orElseThrow();

        LoginRequest studentLogin = new LoginRequest();
        studentLogin.setUsername("cross_student");
        studentLogin.setPassword("StudentPass123!");

        MvcResult studentLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(studentLogin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse studentAuth = objectMapper.readValue(studentLoginRes.getResponse().getContentAsString(), LoginResponse.class);
        String studentToken = studentAuth.getToken();
        assertNotNull(studentToken);

        // Student submits transport request with preferred stop B (Library)
        Map<String, Object> reqPayload = Map.of("preferredStop", stopB.getId());
        MvcResult trRes = mockMvc.perform(post("/api/transport/transport-request")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("Pending"))
                .andReturn();

        TransportRequest studentTr = transportRequestRepository.findByStudentId(studentUser.getId()).orElseThrow();
        assertEquals(RequestStatus.PENDING, studentTr.getStatus());

        // --- STEP 3: ADMIN ASSIGNS BUS, ROUTE, AND SEAT ---
        Map<String, Object> assignPayload = Map.of(
                "students", List.of(
                        Map.of("requestId", studentTr.getId(), "seatNumber", 12)
                )
        );

        mockMvc.perform(put("/api/transport/assignment/" + assignment.getId() + "/assign-students")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(assignPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        TransportRequest approvedTr = transportRequestRepository.findById(studentTr.getId()).orElseThrow();
        assertEquals(RequestStatus.APPROVED, approvedTr.getStatus());
        assertEquals(12, approvedTr.getSeatNumber());
        assertEquals(assignment.getId(), approvedTr.getAssignment().getId());

        // --- STEP 4: DRIVER LOGS IN AND STARTS THE TRIP ---
        LoginRequest driverLogin = new LoginRequest();
        driverLogin.setUsername("cross_driver");
        driverLogin.setPassword("DriverPass123!");

        MvcResult driverLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(driverLogin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse driverAuth = objectMapper.readValue(driverLoginRes.getResponse().getContentAsString(), LoginResponse.class);
        String driverToken = driverAuth.getToken();
        assertNotNull(driverToken);

        Map<String, Object> startTripPayload = Map.of("scheduleId", schedule.getId());
        mockMvc.perform(post("/api/trips/start")
                .header("Authorization", "Bearer " + driverToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startTripPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.trip.status").value("Active"));

        Trip activeTrip = tripRepository.findByDriverIdAndStatus(driverUser.getId(), TripStatus.ACTIVE).orElseThrow();
        assertEquals(TripStatus.ACTIVE, activeTrip.getStatus());

        // --- STEP 5: STUDENT VIEWS ACTIVE BUS AND RECEIVES NOTIFICATION ---
        mockMvc.perform(get("/api/tracking/bus/" + bus.getId() + "/status")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trip.status").value("Active"))
                .andExpect(jsonPath("$.data.location.latitude").value(21.2000))
                .andExpect(jsonPath("$.data.location.longitude").value(72.8000));

        // Verify Student notification received
        mockMvc.perform(get("/api/notifications")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].type").value("TRIP_STARTED"));

        // --- STEP 6: DRIVER SENDS LOCATION UPDATES ---
        Map<String, Object> locUpdate = new HashMap<>();
        locUpdate.put("busId", bus.getId());
        locUpdate.put("latitude", 21.2250);
        locUpdate.put("longitude", 72.8250);
        locUpdate.put("speed", 42.0);
        locUpdate.put("heading", 90.0);
        locUpdate.put("isMoving", true);
        locUpdate.put("routeProgress", 50.0);
        locUpdate.put("routeCompleted", false);

        mockMvc.perform(post("/api/tracking/update-location")
                .header("Authorization", "Bearer " + driverToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(locUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Student sees updated location in real-time
        mockMvc.perform(get("/api/tracking/bus/" + bus.getId() + "/status")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.location.latitude").value(21.2250))
                .andExpect(jsonPath("$.data.location.longitude").value(72.8250))
                .andExpect(jsonPath("$.data.location.speed").value(42.0));

        // --- STEP 7: DRIVER ENDS THE TRIP ---
        mockMvc.perform(post("/api/trips/end")
                .header("Authorization", "Bearer " + driverToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Trip endedTrip = tripRepository.findById(activeTrip.getId()).orElseThrow();
        assertEquals(TripStatus.COMPLETED, endedTrip.getStatus());

        // --- STEP 8: STUDENT SEES COMPLETED STATUS AND LAST VALID LOCATION PRESERVED ---
        mockMvc.perform(get("/api/tracking/bus/" + bus.getId() + "/status")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trip.status").value("Completed"))
                .andExpect(jsonPath("$.data.location.latitude").value(21.2250))
                .andExpect(jsonPath("$.data.location.longitude").value(72.8250))
                .andExpect(jsonPath("$.data.location.speed").value(0.0))
                .andExpect(jsonPath("$.data.location.routeCompleted").value(true));

        // Verify Student notification for TRIP_COMPLETED
        mockMvc.perform(get("/api/notifications")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.type == 'TRIP_COMPLETED')]").exists());

        // --- STEP 9: UNAUTHORIZED LOCATION UPDATES AFTER COMPLETION ARE REJECTED ---
        // Driver update after completion -> 400 Bad Request
        mockMvc.perform(post("/api/tracking/update-location")
                .header("Authorization", "Bearer " + driverToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(locUpdate)))
                .andExpect(status().isBadRequest());

        // Student attempt to update location -> 403 Forbidden
        mockMvc.perform(post("/api/tracking/update-location")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(locUpdate)))
                .andExpect(status().isForbidden());

        // --- STEP 10: VERIFY DATABASE RECORDS & ASSIGNMENTS REMAIN CONSISTENT ---
        // Student Seat Map verification
        mockMvc.perform(get("/api/transport/my-bus/seat-map")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.busCapacity").value(40))
                .andExpect(jsonPath("$.totalOccupied").value(1))
                .andExpect(jsonPath("$.availableSeats").value(39))
                .andExpect(jsonPath("$.mySeat").value(12));

        // Assignment check
        Assignment verifiedAsgn = assignmentRepository.findById(assignment.getId()).orElseThrow();
        assertEquals(ScheduleStatus.ACTIVE, verifiedAsgn.getStatus());
        assertEquals(driverUser.getId(), verifiedAsgn.getDriver().getId());
        assertEquals(bus.getId(), verifiedAsgn.getBus().getId());
    }
}
