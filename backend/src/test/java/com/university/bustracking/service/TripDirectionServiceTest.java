package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripDirectionServiceTest {

    @Mock private TripRepository tripRepository;
    @Mock private BusScheduleRepository busScheduleRepository;
    @Mock private BusLocationRepository busLocationRepository;
    @Mock private TransportRequestRepository transportRequestRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private TripService tripService;

    private User driver;
    private Bus bus;
    private BusRoute route;
    private Assignment assignment;
    private BusSchedule outboundSchedule;
    private BusSchedule returnSchedule;
    private List<BusStop> stops;
    private List<RouteStop> routeStops;

    @BeforeEach
    void setUp() {
        driver = new User();
        driver.setId(10L);
        driver.setRole(Role.DRIVER);
        driver.setUsername("driver1");

        DriverProfile profile = new DriverProfile();
        profile.setId(1L);
        profile.setStatus(ScheduleStatus.ACTIVE);
        driver.setDriverProfile(profile);

        bus = new Bus();
        bus.setId(100L);
        bus.setBusNumber("BUS-002");
        bus.setBusStatus(BusStatus.ACTIVE);

        route = new BusRoute();
        route.setId(50L);
        route.setRouteName("VARACHHA EXPRESS ROUTE");
        route.setRouteCode("VAR-01");
        route.setStatus(ScheduleStatus.ACTIVE);

        // Setup 5 route stops: Stop 1 (VIP Circle) to Stop 5 (P.P. Savani University)
        stops = new ArrayList<>();
        routeStops = new ArrayList<>();
        String[] stopNames = {
                "VIP Circle",
                "IT-PARK",
                "Stop 3",
                "Stop 4",
                "P.P. Savani University"
        };

        for (int i = 0; i < stopNames.length; i++) {
            BusStop stop = new BusStop();
            stop.setId((long) (i + 1));
            stop.setStopName(stopNames[i]);
            stop.setLatitude(21.2000 + i * 0.05);
            stop.setLongitude(72.8000 + i * 0.05);
            stops.add(stop);

            RouteStop rs = new RouteStop();
            rs.setId((long) (100 + i));
            rs.setRoute(route);
            rs.setStop(stop);
            rs.setStopOrder(i + 1);
            routeStops.add(rs);
        }
        route.setRouteStops(routeStops);

        assignment = new Assignment();
        assignment.setId(200L);
        assignment.setDriver(driver);
        assignment.setBus(bus);
        assignment.setRoute(route);
        assignment.setStatus(ScheduleStatus.ACTIVE);

        outboundSchedule = new BusSchedule();
        outboundSchedule.setId(301L);
        outboundSchedule.setAssignment(assignment);
        outboundSchedule.setDayOfWeek("Monday");
        outboundSchedule.setStartTime("07:30");
        outboundSchedule.setDirection(Direction.OUTBOUND);
        outboundSchedule.setStatus(ScheduleStatus.ACTIVE);

        returnSchedule = new BusSchedule();
        returnSchedule.setId(302L);
        returnSchedule.setAssignment(assignment);
        returnSchedule.setDayOfWeek("Monday");
        returnSchedule.setStartTime("16:30");
        returnSchedule.setDirection(Direction.RETURN);
        returnSchedule.setStatus(ScheduleStatus.ACTIVE);
    }

    @Test
    void testStartTrip_Outbound_InitializesFirstStopAndNextStop() {
        when(busScheduleRepository.findById(301L)).thenReturn(Optional.of(outboundSchedule));
        when(tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(busLocationRepository.findByBusId(bus.getId())).thenReturn(Optional.empty());

        Map<String, Object> result = tripService.startTrip(driver, 301L);
        assertTrue((Boolean) result.get("success"));

        ArgumentCaptor<BusLocation> locCaptor = ArgumentCaptor.forClass(BusLocation.class);
        verify(busLocationRepository).save(locCaptor.capture());
        BusLocation savedLocation = locCaptor.getValue();

        assertNotNull(savedLocation);
        assertEquals("VIP Circle", savedLocation.getCurrentStop().getStopName());
        assertEquals("IT-PARK", savedLocation.getNextStop().getStopName());
        assertEquals(0.0, savedLocation.getRouteProgress());
        assertFalse(savedLocation.getRouteCompleted());
    }

    @Test
    void testStartTrip_Return_InitializesLastStopAndSecondLastStop() {
        when(busScheduleRepository.findById(302L)).thenReturn(Optional.of(returnSchedule));
        when(tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(busLocationRepository.findByBusId(bus.getId())).thenReturn(Optional.empty());

        Map<String, Object> result = tripService.startTrip(driver, 302L);
        assertTrue((Boolean) result.get("success"));

        ArgumentCaptor<BusLocation> locCaptor = ArgumentCaptor.forClass(BusLocation.class);
        verify(busLocationRepository).save(locCaptor.capture());
        BusLocation savedLocation = locCaptor.getValue();

        assertNotNull(savedLocation);
        // RETURN direction must start at Stop 5 (P.P. Savani University)
        assertEquals("P.P. Savani University", savedLocation.getCurrentStop().getStopName());
        // Next stop must be Stop 4
        assertEquals("Stop 4", savedLocation.getNextStop().getStopName());
        assertEquals(0.0, savedLocation.getRouteProgress());
        assertFalse(savedLocation.getRouteCompleted());
    }

    @Test
    void testStartTrip_Validation_RouteWithoutStopsFails() {
        route.setRouteStops(Collections.emptyList());
        when(busScheduleRepository.findById(301L)).thenReturn(Optional.of(outboundSchedule));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                tripService.startTrip(driver, 301L)
        );
        assertTrue(ex.getMessage().contains("Route stops are not configured"));
    }

    @Test
    void testStartTrip_Validation_UnassignedDriverFails() {
        User otherDriver = new User();
        otherDriver.setId(99L);
        otherDriver.setRole(Role.DRIVER);

        when(busScheduleRepository.findById(301L)).thenReturn(Optional.of(outboundSchedule));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                tripService.startTrip(otherDriver, 301L)
        );
        assertTrue(ex.getMessage().contains("not assigned"));
    }

    @Test
    void testEndTrip_CompletesTripAndClearsNextStop() {
        Trip activeTrip = new Trip();
        activeTrip.setId(500L);
        activeTrip.setDriver(driver);
        activeTrip.setBus(bus);
        activeTrip.setRoute(route);
        activeTrip.setSchedule(outboundSchedule);
        activeTrip.setDirection(Direction.OUTBOUND);
        activeTrip.setStatus(TripStatus.ACTIVE);

        BusLocation loc = new BusLocation();
        loc.setBus(bus);
        loc.setCurrentStop(stops.get(4)); // Last stop
        loc.setNextStop(stops.get(3));
        loc.setIsMoving(true);

        when(tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE)).thenReturn(Optional.of(activeTrip));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));
        when(busLocationRepository.findByBusId(bus.getId())).thenReturn(Optional.of(loc));

        Map<String, Object> result = tripService.endTrip(driver);
        assertTrue((Boolean) result.get("success"));
        assertEquals(TripStatus.COMPLETED, activeTrip.getStatus());
        assertNotNull(activeTrip.getEndedAt());

        verify(busLocationRepository).save(loc);
        assertTrue(loc.getRouteCompleted());
        assertEquals(100.0, loc.getRouteProgress());
        assertNull(loc.getNextStop());
        assertFalse(loc.getIsMoving());
    }

    @Test
    void testPrepareReturn_TerminalStopOrder() {
        when(busScheduleRepository.findById(302L)).thenReturn(Optional.of(returnSchedule));
        when(busLocationRepository.findByBusId(bus.getId())).thenReturn(Optional.empty());
        when(busLocationRepository.save(any(BusLocation.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = tripService.prepareReturn(driver, 302L);
        assertTrue((Boolean) result.get("success"));

        ArgumentCaptor<BusLocation> locCaptor = ArgumentCaptor.forClass(BusLocation.class);
        verify(busLocationRepository).save(locCaptor.capture());
        BusLocation savedLocation = locCaptor.getValue();

        assertEquals("P.P. Savani University", savedLocation.getCurrentStop().getStopName());
        assertEquals("Stop 4", savedLocation.getNextStop().getStopName());
    }
}
