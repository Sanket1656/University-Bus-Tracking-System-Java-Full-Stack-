package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransportRequestServiceTest {

    @Mock private TransportRequestRepository transportRequestRepository;
    @Mock private BusStopRepository busStopRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private RouteStopRepository routeStopRepository;

    @InjectMocks
    private TransportRequestService transportRequestService;

    private Assignment activeAssignment;
    private Bus activeBus;
    private BusRoute activeRoute;
    private BusStop stop1;
    private BusStop stop2;
    private BusStop stopExternal;
    private User student1;
    private TransportRequest pendingRequest;

    @BeforeEach
    void setUp() {
        activeBus = new Bus();
        activeBus.setId(10L);
        activeBus.setBusNumber("BUS-001");
        activeBus.setBusCapacity(40);
        activeBus.setBusStatus(BusStatus.ACTIVE);

        activeRoute = new BusRoute("North Corridor", "NCR-01");
        activeRoute.setId(20L);
        activeRoute.setStatus(ScheduleStatus.ACTIVE);

        stop1 = new BusStop();
        stop1.setId(101L);
        stop1.setStopName("Station 1");

        stop2 = new BusStop();
        stop2.setId(102L);
        stop2.setStopName("Station 2");

        stopExternal = new BusStop();
        stopExternal.setId(999L);
        stopExternal.setStopName("Unknown Station");

        RouteStop rs1 = new RouteStop(activeRoute, stop1, 1);
        RouteStop rs2 = new RouteStop(activeRoute, stop2, 2);

        activeAssignment = new Assignment(activeBus, new User(), activeRoute, ScheduleStatus.ACTIVE);
        activeAssignment.setId(100L);

        student1 = new User();
        student1.setId(50L);

        pendingRequest = new TransportRequest();
        pendingRequest.setId(500L);
        pendingRequest.setStudent(student1);
        pendingRequest.setPreferredStop(stop1);
        pendingRequest.setStatus(RequestStatus.PENDING);
    }

    @Test
    @DisplayName("TEST 1 & 10: Valid stop, active assignment & seat -> Assignment succeeds")
    void testAssignStudents_ValidStop_Success() {
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1), new RouteStop(activeRoute, stop2, 2))
        );
        when(transportRequestRepository.countByAssignmentIdAndStatus(100L, RequestStatus.APPROVED)).thenReturn(0L);
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));
        when(transportRequestRepository.existsByAssignmentIdAndStudentIdAndStatus(100L, 50L, RequestStatus.APPROVED)).thenReturn(false);
        when(transportRequestRepository.findByStudentIdAndStatusAndIdNot(50L, RequestStatus.APPROVED, 500L)).thenReturn(Optional.empty());
        when(transportRequestRepository.existsByAssignmentIdAndSeatNumberAndStatus(100L, 5, RequestStatus.APPROVED)).thenReturn(false);

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        Map<String, Object> response = transportRequestService.assignStudents(100L, List.of(payload));

        assertTrue((Boolean) response.get("success"));
        assertEquals(RequestStatus.APPROVED, pendingRequest.getStatus());
        assertEquals(activeAssignment, pendingRequest.getAssignment());
        assertEquals(5, pendingRequest.getSeatNumber());
        verify(transportRequestRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("TEST 2: Preferred stop NOT on route -> Rejects with PREFERRED_STOP_NOT_ON_ROUTE")
    void testAssignStudents_PreferredStopNotOnRoute_ThrowsBadRequest() {
        pendingRequest.setPreferredStop(stopExternal);

        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1), new RouteStop(activeRoute, stop2, 2))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("PREFERRED_STOP_NOT_ON_ROUTE", ex.getCode());
        assertTrue(ex.getMessage().contains("is not included in the selected assignment's route"));
    }

    @Test
    @DisplayName("TEST 3: Student already assigned to SAME assignment -> Rejects with STUDENT_ALREADY_ASSIGNED")
    void testAssignStudents_AlreadyAssignedToSameAssignment_ThrowsConflict() {
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));
        when(transportRequestRepository.existsByAssignmentIdAndStudentIdAndStatus(100L, 50L, RequestStatus.APPROVED)).thenReturn(true);

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        ConflictException ex = assertThrows(ConflictException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("STUDENT_ALREADY_ASSIGNED", ex.getCode());
        assertEquals("Student is already assigned to this assignment.", ex.getMessage());
    }

    @Test
    @DisplayName("TEST 4: Student already assigned to ANOTHER active assignment -> Rejects with STUDENT_ALREADY_ASSIGNED_ELSEWHERE")
    void testAssignStudents_AlreadyAssignedElsewhere_ThrowsConflict() {
        Assignment otherAssignment = new Assignment(activeBus, new User(), activeRoute, ScheduleStatus.ACTIVE);
        otherAssignment.setId(200L);

        TransportRequest otherReq = new TransportRequest();
        otherReq.setId(501L);
        otherReq.setAssignment(otherAssignment);

        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));
        when(transportRequestRepository.existsByAssignmentIdAndStudentIdAndStatus(100L, 50L, RequestStatus.APPROVED)).thenReturn(false);
        when(transportRequestRepository.findByStudentIdAndStatusAndIdNot(50L, RequestStatus.APPROVED, 500L)).thenReturn(Optional.of(otherReq));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        ConflictException ex = assertThrows(ConflictException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("STUDENT_ALREADY_ASSIGNED_ELSEWHERE", ex.getCode());
        assertTrue(ex.getMessage().contains("Student is already assigned to another active assignment."));
    }

    @Test
    @DisplayName("TEST 5: Inactive assignment -> Rejects with ASSIGNMENT_INACTIVE")
    void testAssignStudents_InactiveAssignment_ThrowsBadRequest() {
        activeAssignment.setStatus(ScheduleStatus.INACTIVE);
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("ASSIGNMENT_INACTIVE", ex.getCode());
        assertEquals("This assignment is inactive and cannot accept new students.", ex.getMessage());
    }

    @Test
    @DisplayName("TEST 6: Student has no preferred stop -> Rejects with PREFERRED_STOP_REQUIRED")
    void testAssignStudents_NoPreferredStop_ThrowsBadRequest() {
        pendingRequest.setPreferredStop(null);

        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("PREFERRED_STOP_REQUIRED", ex.getCode());
        assertEquals("Student must select a preferred pickup stop before assignment.", ex.getMessage());
    }

    @Test
    @DisplayName("TEST 7: Inactive route -> Rejects with ROUTE_INACTIVE")
    void testAssignStudents_InactiveRoute_ThrowsBadRequest() {
        activeRoute.setStatus(ScheduleStatus.INACTIVE);
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("ROUTE_INACTIVE", ex.getCode());
        assertEquals("This assignment cannot accept students because its route is inactive.", ex.getMessage());
    }

    @Test
    @DisplayName("TEST 8: Route without stops -> Rejects with ROUTE_HAS_NO_STOPS")
    void testAssignStudents_RouteWithoutStops_ThrowsBadRequest() {
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(Collections.emptyList());

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("ROUTE_HAS_NO_STOPS", ex.getCode());
        assertEquals("This assignment's route has no configured stops.", ex.getMessage());
    }

    @Test
    @DisplayName("TEST 9: Non-pending request -> Rejects with INVALID_REQUEST_STATUS")
    void testAssignStudents_NonPendingRequest_ThrowsBadRequest() {
        pendingRequest.setStatus(RequestStatus.APPROVED);

        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("INVALID_REQUEST_STATUS", ex.getCode());
        assertEquals("This transport request is no longer pending and cannot be assigned.", ex.getMessage());
    }

    @Test
    @DisplayName("TEST 10b: Inactive bus -> Rejects with BUS_UNAVAILABLE")
    void testAssignStudents_InactiveBus_ThrowsBadRequest() {
        activeBus.setBusStatus(BusStatus.MAINTENANCE);
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 5);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("BUS_UNAVAILABLE", ex.getCode());
        assertTrue(ex.getMessage().contains("This assignment cannot accept students because its bus is maintenance."));
    }

    @Test
    @DisplayName("TEST 11: Seat number exceeds capacity -> Rejects with INVALID_SEAT_NUMBER")
    void testAssignStudents_SeatExceedsCapacity_ThrowsBadRequest() {
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 99); // Capacity is 40
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("INVALID_SEAT_NUMBER", ex.getCode());
        assertTrue(ex.getMessage().contains("Must be between 1 and"));
    }

    @Test
    @DisplayName("TEST 12: Seat number occupied -> Rejects with SEAT_ALREADY_OCCUPIED")
    void testAssignStudents_SeatOccupied_ThrowsConflict() {
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );
        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));
        when(transportRequestRepository.existsByAssignmentIdAndSeatNumberAndStatus(100L, 12, RequestStatus.APPROVED)).thenReturn(true);

        Map<String, Object> payload = Map.of("requestId", 500L, "seatNumber", 12);
        ConflictException ex = assertThrows(ConflictException.class, () ->
                transportRequestService.assignStudents(100L, List.of(payload))
        );

        assertEquals("SEAT_ALREADY_OCCUPIED", ex.getCode());
        assertTrue(ex.getMessage().contains("Seat number 12 is already occupied"));
    }

    @Test
    @DisplayName("TEST 13: Change assignment with stop not on new route -> Rejects with PREFERRED_STOP_NOT_ON_ROUTE")
    void testChangeAssignment_StopNotOnRoute_ThrowsBadRequest() {
        Assignment targetAssignment = new Assignment(activeBus, new User(), activeRoute, ScheduleStatus.ACTIVE);
        targetAssignment.setId(300L);

        pendingRequest.setPreferredStop(stopExternal);

        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));
        when(assignmentRepository.findById(300L)).thenReturn(Optional.of(targetAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                transportRequestService.changeAssignment(500L, 300L)
        );

        assertEquals("PREFERRED_STOP_NOT_ON_ROUTE", ex.getCode());
    }

    @Test
    @DisplayName("TEST 14: Change assignment to SAME assignment -> Rejects with STUDENT_ALREADY_ASSIGNED")
    void testChangeAssignment_SameAssignment_ThrowsConflict() {
        pendingRequest.setAssignment(activeAssignment);

        when(transportRequestRepository.findById(500L)).thenReturn(Optional.of(pendingRequest));
        when(assignmentRepository.findById(100L)).thenReturn(Optional.of(activeAssignment));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(20L)).thenReturn(
                List.of(new RouteStop(activeRoute, stop1, 1))
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                transportRequestService.changeAssignment(500L, 100L)
        );

        assertEquals("STUDENT_ALREADY_ASSIGNED", ex.getCode());
    }

    @Test
    @DisplayName("Seat Map: Computes capacity, totalOccupied, availableSeats and protects other students' privacy")
    @SuppressWarnings("unchecked")
    void testGetBusSeatMap_Success_CalculatesCountsAndProtectsPrivacy() {
        student1.setRole(Role.STUDENT);
        StudentProfile p1 = new StudentProfile();
        p1.setName("Alice Student");
        p1.setEnrollmentNumber("EN-101");
        p1.setBranch("CSE");
        student1.setStudentProfile(p1);

        TransportRequest myApprovedReq = new TransportRequest();
        myApprovedReq.setId(501L);
        myApprovedReq.setStudent(student1);
        myApprovedReq.setAssignment(activeAssignment);
        myApprovedReq.setSeatNumber(5);
        myApprovedReq.setStatus(RequestStatus.APPROVED);

        User student2 = new User("other_student", "pass", Role.STUDENT);
        student2.setId(52L);
        StudentProfile p2 = new StudentProfile();
        p2.setName("Bob Private");
        p2.setEnrollmentNumber("EN-999-SECRET");
        p2.setBranch("MECH");
        student2.setStudentProfile(p2);

        TransportRequest otherReq = new TransportRequest();
        otherReq.setId(502L);
        otherReq.setStudent(student2);
        otherReq.setAssignment(activeAssignment);
        otherReq.setSeatNumber(8);
        otherReq.setStatus(RequestStatus.APPROVED);

        when(transportRequestRepository.findByStudentIdAndStatus(50L, RequestStatus.APPROVED))
                .thenReturn(Optional.of(myApprovedReq));
        when(transportRequestRepository.findByAssignmentIdAndStatusOrderBySeatNumberAsc(100L, RequestStatus.APPROVED))
                .thenReturn(List.of(myApprovedReq, otherReq));

        Map<String, Object> result = transportRequestService.getBusSeatMap(student1);

        assertNotNull(result);
        assertEquals(true, result.get("success"));
        assertEquals(40, result.get("busCapacity"));
        assertEquals(2, result.get("totalOccupied"));
        assertEquals(38, result.get("availableSeats"));
        assertEquals(5, result.get("mySeat"));
        assertEquals(List.of(5, 8), result.get("occupiedSeats"));

        List<Map<String, Object>> passengerList = (List<Map<String, Object>>) result.get("data");
        assertEquals(2, passengerList.size());

        Map<String, Object> mySeatMap = passengerList.stream()
                .filter(p -> Integer.valueOf(5).equals(p.get("seatNumber")))
                .findFirst().orElseThrow();
        assertEquals(true, mySeatMap.get("isMine"));
        assertEquals("Alice Student", mySeatMap.get("name"));
        assertEquals("EN-101", mySeatMap.get("enrollmentNumber"));

        Map<String, Object> otherSeatMap = passengerList.stream()
                .filter(p -> Integer.valueOf(8).equals(p.get("seatNumber")))
                .findFirst().orElseThrow();
        assertEquals(false, otherSeatMap.get("isMine"));
        assertEquals("Occupied", otherSeatMap.get("name"));
        assertNull(otherSeatMap.get("enrollmentNumber"), "Other student's enrollment number must not be exposed to students");
        assertNull(otherSeatMap.get("branch"), "Other student's branch must not be exposed to students");
    }

    @Test
    @DisplayName("Seat Map: When Admin requests, full passenger details are provided")
    @SuppressWarnings("unchecked")
    void testGetBusSeatMap_AdminRole_ExposesAllPassengerDetails() {
        User adminUser = new User("admin_tester", "pass", Role.ADMIN);
        adminUser.setId(1L);

        TransportRequest adminApprovedReq = new TransportRequest();
        adminApprovedReq.setId(600L);
        adminApprovedReq.setStudent(adminUser);
        adminApprovedReq.setAssignment(activeAssignment);
        adminApprovedReq.setSeatNumber(1);
        adminApprovedReq.setStatus(RequestStatus.APPROVED);

        User student2 = new User("other_student", "pass", Role.STUDENT);
        student2.setId(52L);
        StudentProfile p2 = new StudentProfile();
        p2.setName("Bob Private");
        p2.setEnrollmentNumber("EN-999");
        student2.setStudentProfile(p2);

        TransportRequest studentReq = new TransportRequest();
        studentReq.setId(502L);
        studentReq.setStudent(student2);
        studentReq.setAssignment(activeAssignment);
        studentReq.setSeatNumber(8);
        studentReq.setStatus(RequestStatus.APPROVED);

        when(transportRequestRepository.findByStudentIdAndStatus(1L, RequestStatus.APPROVED))
                .thenReturn(Optional.of(adminApprovedReq));
        when(transportRequestRepository.findByAssignmentIdAndStatusOrderBySeatNumberAsc(100L, RequestStatus.APPROVED))
                .thenReturn(List.of(adminApprovedReq, studentReq));

        Map<String, Object> result = transportRequestService.getBusSeatMap(adminUser);

        List<Map<String, Object>> passengerList = (List<Map<String, Object>>) result.get("data");
        Map<String, Object> bobSeat = passengerList.stream()
                .filter(p -> Integer.valueOf(8).equals(p.get("seatNumber")))
                .findFirst().orElseThrow();
        assertEquals("Bob Private", bobSeat.get("name"));
        assertEquals("EN-999", bobSeat.get("enrollmentNumber"));
    }

    @Test
    @DisplayName("Seat Map: Empty bus returns zero occupied and all available")
    @SuppressWarnings("unchecked")
    void testGetBusSeatMap_EmptyBus_ZeroOccupiedAndAllAvailable() {
        student1.setRole(Role.STUDENT);
        TransportRequest emptyBusReq = new TransportRequest();
        emptyBusReq.setId(503L);
        emptyBusReq.setStudent(student1);
        emptyBusReq.setAssignment(activeAssignment);
        emptyBusReq.setSeatNumber(null);
        emptyBusReq.setStatus(RequestStatus.APPROVED);

        when(transportRequestRepository.findByStudentIdAndStatus(50L, RequestStatus.APPROVED))
                .thenReturn(Optional.of(emptyBusReq));
        when(transportRequestRepository.findByAssignmentIdAndStatusOrderBySeatNumberAsc(100L, RequestStatus.APPROVED))
                .thenReturn(Collections.emptyList());

        Map<String, Object> result = transportRequestService.getBusSeatMap(student1);

        assertEquals(40, result.get("busCapacity"));
        assertEquals(0, result.get("totalOccupied"));
        assertEquals(40, result.get("availableSeats"));
        assertNull(result.get("mySeat"));
        assertTrue(((List<?>) result.get("occupiedSeats")).isEmpty());
        assertTrue(((List<?>) result.get("data")).isEmpty());
    }

    @Test
    @DisplayName("Seat Map: When no approved request found, throws ResourceNotFoundException")
    void testGetBusSeatMap_NoApprovedRequest_ThrowsResourceNotFound() {
        when(transportRequestRepository.findByStudentIdAndStatus(50L, RequestStatus.APPROVED))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                transportRequestService.getBusSeatMap(student1)
        );
    }

    @Test
    @DisplayName("Seat Map: When no bus assigned yet, throws ResourceNotFoundException")
    void testGetBusSeatMap_NoBusAssigned_ThrowsResourceNotFound() {
        TransportRequest reqNoBus = new TransportRequest();
        reqNoBus.setStudent(student1);
        reqNoBus.setStatus(RequestStatus.APPROVED);
        reqNoBus.setAssignment(new Assignment(null, null, activeRoute, ScheduleStatus.ACTIVE));

        when(transportRequestRepository.findByStudentIdAndStatus(50L, RequestStatus.APPROVED))
                .thenReturn(Optional.of(reqNoBus));

        assertThrows(ResourceNotFoundException.class, () ->
                transportRequestService.getBusSeatMap(student1)
        );
    }
}
