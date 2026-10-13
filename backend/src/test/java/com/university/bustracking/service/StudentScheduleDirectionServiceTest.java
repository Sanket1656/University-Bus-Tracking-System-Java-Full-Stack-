package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentScheduleDirectionServiceTest {

    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private TransportRequestRepository transportRequestRepository;
    @Mock private BusScheduleRepository busScheduleRepository;
    @Mock private TripRepository tripRepository;
    @Mock private BusLocationRepository busLocationRepository;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private StudentService studentService;

    private User student;
    private Bus bus;
    private BusRoute route;
    private Assignment assignment;
    private TransportRequest transportRequest;
    private BusStop stopA;
    private BusStop stopB;
    private BusStop stopC;
    private BusStop stopD;
    private BusStop stopE;
    private List<RouteStop> routeStops;
    private BusSchedule outboundSchedule;
    private BusSchedule returnSchedule;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(50L);
        student.setRole(Role.STUDENT);
        student.setUsername("student1");

        bus = new Bus();
        bus.setId(100L);
        bus.setBusNumber("BUS-002");
        bus.setBusStatus(BusStatus.ACTIVE);

        stopA = createStop(1L, "VIP Circle", 21.22, 72.88);
        stopB = createStop(2L, "IT-PARK", 21.23, 72.89);
        stopC = createStop(3L, "Stop 3 - Market", 21.24, 72.90);
        stopD = createStop(4L, "Stop 4 - Highschool", 21.25, 72.91);
        stopE = createStop(5L, "P.P. Savani University", 21.26, 72.92);

        route = new BusRoute();
        route.setId(200L);
        route.setRouteName("VARACHHA EXPRESS ROUTE");
        route.setRouteCode("VER-01");
        route.setStatus(ScheduleStatus.ACTIVE);

        routeStops = new ArrayList<>();
        routeStops.add(new RouteStop(route, stopA, 1));
        routeStops.add(new RouteStop(route, stopB, 2));
        routeStops.add(new RouteStop(route, stopC, 3));
        routeStops.add(new RouteStop(route, stopD, 4));
        routeStops.add(new RouteStop(route, stopE, 5));
        route.setRouteStops(routeStops);

        assignment = new Assignment();
        assignment.setId(300L);
        assignment.setBus(bus);
        assignment.setRoute(route);
        assignment.setStatus(ScheduleStatus.ACTIVE);

        transportRequest = new TransportRequest();
        transportRequest.setId(400L);
        transportRequest.setStudent(student);
        transportRequest.setPreferredStop(stopC); // Preferred pickup is C
        transportRequest.setAssignment(assignment);
        transportRequest.setSeatNumber(12);
        transportRequest.setStatus(RequestStatus.APPROVED);

        String today = LocalDate.now().getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        outboundSchedule = new BusSchedule();
        outboundSchedule.setId(1001L);
        outboundSchedule.setAssignment(assignment);
        outboundSchedule.setDayOfWeek(today);
        outboundSchedule.setStartTime("07:30");
        outboundSchedule.setDirection(Direction.OUTBOUND);
        outboundSchedule.setStatus(ScheduleStatus.ACTIVE);

        returnSchedule = new BusSchedule();
        returnSchedule.setId(1002L);
        returnSchedule.setAssignment(assignment);
        returnSchedule.setDayOfWeek(today);
        returnSchedule.setStartTime("16:30");
        returnSchedule.setDirection(Direction.RETURN);
        returnSchedule.setStatus(ScheduleStatus.ACTIVE);
    }

    private BusStop createStop(Long id, String name, double lat, double lng) {
        BusStop s = new BusStop();
        s.setId(id);
        s.setStopName(name);
        s.setLatitude(lat);
        s.setLongitude(lng);
        return s;
    }

    @Test
    void testGetMySchedules_NoApprovedAssignment_ReturnsEmptyState() {
        when(transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED))
                .thenReturn(Optional.empty());

        Map<String, Object> result = studentService.getMySchedules(student);

        assertTrue((Boolean) result.get("success"));
        Map<?, ?> data = (Map<?, ?>) result.get("data");
        assertNull(data.get("assignment"));
        assertNull(data.get("activeTrip"));
        assertNull(data.get("nextTrip"));
    }

    @Test
    void testGetMySchedules_OutboundScheduled_ReturnsCorrectInitialStopsAndPickup() {
        when(transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED))
                .thenReturn(Optional.of(transportRequest));
        when(busScheduleRepository.findTodayActiveSchedules(anyList(), anyString(), eq(ScheduleStatus.ACTIVE)))
                .thenReturn(Collections.singletonList(outboundSchedule));
        when(busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(assignment.getId(), ScheduleStatus.ACTIVE))
                .thenReturn(Collections.singletonList(outboundSchedule));
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(tripRepository.findTodayTripsByScheduleIds(anyList(), any(), any()))
                .thenReturn(Collections.emptyList());

        Map<String, Object> result = studentService.getMySchedules(student);

        assertTrue((Boolean) result.get("success"));
        Map<?, ?> data = (Map<?, ?>) result.get("data");

        // Verify Student's preferred stop is preserved
        BusStop pickup = (BusStop) data.get("pickupStop");
        assertNotNull(pickup);
        assertEquals("Stop 3 - Market", pickup.getStopName());

        // Verify Next Trip
        Map<?, ?> nextTrip = (Map<?, ?>) data.get("nextTrip");
        assertNotNull(nextTrip);
        assertEquals("OUTBOUND", nextTrip.get("direction"));
        assertEquals("NEXT", nextTrip.get("tripState"));

        BusStop startStop = (BusStop) nextTrip.get("startStop");
        BusStop endStop = (BusStop) nextTrip.get("endStop");
        assertEquals("VIP Circle", startStop.getStopName());
        assertEquals("P.P. Savani University", endStop.getStopName());

        Map<?, ?> tripSnapshot = (Map<?, ?>) nextTrip.get("trip");
        assertEquals("VIP Circle", tripSnapshot.get("currentStop"));
        assertEquals("IT-PARK", tripSnapshot.get("nextStop"));
        assertEquals(0.0, tripSnapshot.get("progress"));
    }

    @Test
    void testGetMySchedules_ReturnScheduled_ReturnsReversedStopsAndSamePickup() {
        when(transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED))
                .thenReturn(Optional.of(transportRequest));
        when(busScheduleRepository.findTodayActiveSchedules(anyList(), anyString(), eq(ScheduleStatus.ACTIVE)))
                .thenReturn(Collections.singletonList(returnSchedule));
        when(busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(assignment.getId(), ScheduleStatus.ACTIVE))
                .thenReturn(Collections.singletonList(returnSchedule));
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(tripRepository.findTodayTripsByScheduleIds(anyList(), any(), any()))
                .thenReturn(Collections.emptyList());

        Map<String, Object> result = studentService.getMySchedules(student);

        Map<?, ?> data = (Map<?, ?>) result.get("data");

        // Preferred stop C remains unchanged!
        BusStop pickup = (BusStop) data.get("pickupStop");
        assertEquals("Stop 3 - Market", pickup.getStopName());

        Map<?, ?> nextTrip = (Map<?, ?>) data.get("nextTrip");
        assertNotNull(nextTrip);
        assertEquals("RETURN", nextTrip.get("direction"));

        // RETURN: start is E (terminal), end is A (origin)
        BusStop startStop = (BusStop) nextTrip.get("startStop");
        BusStop endStop = (BusStop) nextTrip.get("endStop");
        assertEquals("P.P. Savani University", startStop.getStopName());
        assertEquals("VIP Circle", endStop.getStopName());

        // Initial current is E, next is D
        Map<?, ?> tripSnapshot = (Map<?, ?>) nextTrip.get("trip");
        assertEquals("P.P. Savani University", tripSnapshot.get("currentStop"));
        assertEquals("Stop 4 - Highschool", tripSnapshot.get("nextStop"));
        assertEquals(0.0, tripSnapshot.get("progress"));
    }

    @Test
    void testGetMySchedules_ActiveTripHasPriorityOverLaterSchedule() {
        Trip activeTrip = new Trip();
        activeTrip.setId(501L);
        activeTrip.setSchedule(outboundSchedule);
        activeTrip.setDirection(Direction.OUTBOUND);
        activeTrip.setStatus(TripStatus.ACTIVE);

        BusLocation loc = new BusLocation();
        loc.setCurrentStop(stopB);
        loc.setNextStop(stopC);
        loc.setRouteProgress(25.0);
        loc.setSpeed(35.0);
        loc.setIsMoving(true);

        when(transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED))
                .thenReturn(Optional.of(transportRequest));
        when(busScheduleRepository.findTodayActiveSchedules(anyList(), anyString(), eq(ScheduleStatus.ACTIVE)))
                .thenReturn(Arrays.asList(outboundSchedule, returnSchedule));
        when(busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(assignment.getId(), ScheduleStatus.ACTIVE))
                .thenReturn(Arrays.asList(outboundSchedule, returnSchedule));
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE))
                .thenReturn(Optional.of(activeTrip));
        when(busLocationRepository.findByBusId(bus.getId()))
                .thenReturn(Optional.of(loc));
        when(tripRepository.findTodayTripsByScheduleIds(anyList(), any(), any()))
                .thenReturn(Collections.singletonList(activeTrip));

        Map<String, Object> result = studentService.getMySchedules(student);

        Map<?, ?> data = (Map<?, ?>) result.get("data");

        // Active Trip is populated with live telemetry
        Map<?, ?> activeTripData = (Map<?, ?>) data.get("activeTrip");
        assertNotNull(activeTripData);
        assertEquals("Active", activeTripData.get("status"));
        assertEquals("OUTBOUND", activeTripData.get("direction"));
        assertEquals("IT-PARK", activeTripData.get("currentStop"));
        assertEquals("Stop 3 - Market", activeTripData.get("nextStop"));
        assertEquals(25.0, activeTripData.get("progress"));

        // Next Trip is the upcoming afternoon schedule (RETURN)
        Map<?, ?> nextTrip = (Map<?, ?>) data.get("nextTrip");
        assertNotNull(nextTrip);
        assertEquals("RETURN", nextTrip.get("direction"));
        assertEquals("UPCOMING", nextTrip.get("tripState"));
    }

    @Test
    void testGetMySchedules_OutboundCompleted_ReturnBecomesNextTrip() {
        Trip completedOutbound = new Trip();
        completedOutbound.setId(501L);
        completedOutbound.setSchedule(outboundSchedule);
        completedOutbound.setDirection(Direction.OUTBOUND);
        completedOutbound.setStatus(TripStatus.COMPLETED);

        when(transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED))
                .thenReturn(Optional.of(transportRequest));
        when(busScheduleRepository.findTodayActiveSchedules(anyList(), anyString(), eq(ScheduleStatus.ACTIVE)))
                .thenReturn(Arrays.asList(outboundSchedule, returnSchedule));
        when(busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(assignment.getId(), ScheduleStatus.ACTIVE))
                .thenReturn(Arrays.asList(outboundSchedule, returnSchedule));
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE))
                .thenReturn(Optional.empty()); // No active trip
        when(tripRepository.findTodayTripsByScheduleIds(anyList(), any(), any()))
                .thenReturn(Collections.singletonList(completedOutbound));

        Map<String, Object> result = studentService.getMySchedules(student);

        Map<?, ?> data = (Map<?, ?>) result.get("data");

        assertNull(data.get("activeTrip")); // Active trip is null

        // NEXT trip is automatically the RETURN schedule
        Map<?, ?> nextTrip = (Map<?, ?>) data.get("nextTrip");
        assertNotNull(nextTrip);
        assertEquals("RETURN", nextTrip.get("direction"));
        assertEquals("NEXT", nextTrip.get("tripState"));

        // RETURN direction-aware start/next stops
        Map<?, ?> snapshot = (Map<?, ?>) nextTrip.get("trip");
        assertEquals("P.P. Savani University", snapshot.get("currentStop"));
        assertEquals("Stop 4 - Highschool", snapshot.get("nextStop"));
        assertEquals(0.0, snapshot.get("progress"));
    }

    @Test
    void testGetMySchedules_AllTripsCompleted_FlagsAllTripsCompleted() {
        Trip completedOutbound = new Trip();
        completedOutbound.setId(501L);
        completedOutbound.setSchedule(outboundSchedule);
        completedOutbound.setStatus(TripStatus.COMPLETED);

        Trip completedReturn = new Trip();
        completedReturn.setId(502L);
        completedReturn.setSchedule(returnSchedule);
        completedReturn.setStatus(TripStatus.COMPLETED);

        when(transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED))
                .thenReturn(Optional.of(transportRequest));
        when(busScheduleRepository.findTodayActiveSchedules(anyList(), anyString(), eq(ScheduleStatus.ACTIVE)))
                .thenReturn(Arrays.asList(outboundSchedule, returnSchedule));
        when(busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(assignment.getId(), ScheduleStatus.ACTIVE))
                .thenReturn(Arrays.asList(outboundSchedule, returnSchedule));
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(tripRepository.findTodayTripsByScheduleIds(anyList(), any(), any()))
                .thenReturn(Arrays.asList(completedOutbound, completedReturn));

        Map<String, Object> result = studentService.getMySchedules(student);

        Map<?, ?> data = (Map<?, ?>) result.get("data");

        assertNull(data.get("activeTrip"));
        assertNull(data.get("nextTrip"));
        assertEquals(true, data.get("allTripsCompletedToday"));
    }
}
