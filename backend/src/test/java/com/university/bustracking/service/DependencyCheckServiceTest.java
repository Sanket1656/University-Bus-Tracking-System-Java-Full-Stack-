package com.university.bustracking.service;

import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.entity.*;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DependencyCheckServiceTest {

    @Mock private BusRepository busRepository;
    @Mock private BusRouteRepository busRouteRepository;
    @Mock private BusStopRepository busStopRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private BusScheduleRepository busScheduleRepository;
    @Mock private TripRepository tripRepository;
    @Mock private BusLocationRepository busLocationRepository;
    @Mock private TransportRequestRepository transportRequestRepository;
    @Mock private RouteStopRepository routeStopRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private DependencyCheckService dependencyCheckService;

    private Bus sampleBus;

    @BeforeEach
    void setUp() {
        sampleBus = new Bus();
        sampleBus.setId(10L);
        sampleBus.setBusName("Bus Alpha");
        sampleBus.setBusNumber("BUS-101");
        sampleBus.setBusRegistrationNumber("REG-101");
        sampleBus.setBusType(BusType.NON_AC);
        sampleBus.setBusCapacity(40);
        sampleBus.setBusStatus(BusStatus.ACTIVE);
    }

    @Test
    void testCheckBusDependencies_NoDependencies() {
        when(busRepository.findById(10L)).thenReturn(Optional.of(sampleBus));
        when(tripRepository.countByBusIdAndStatus(10L, TripStatus.ACTIVE)).thenReturn(0L);
        when(tripRepository.countByBusId(10L)).thenReturn(0L);
        when(assignmentRepository.countByBusIdAndStatus(10L, ScheduleStatus.ACTIVE)).thenReturn(0L);
        when(assignmentRepository.countByBusIdAndStatus(10L, ScheduleStatus.INACTIVE)).thenReturn(0L);
        when(busScheduleRepository.countByAssignmentBusId(10L)).thenReturn(0L);
        when(busLocationRepository.countByBusId(10L)).thenReturn(0L);

        ResourceDependencyResponse resp = dependencyCheckService.checkBusDependencies(10L);

        assertNotNull(resp);
        assertTrue(resp.isSuccess());
        assertTrue(resp.isCanDelete());
        assertTrue(resp.isCanDeactivate());
        assertEquals("OK", resp.getCode());
        assertTrue(resp.getDependencies().isEmpty());
    }

    @Test
    void testCheckBusDependencies_WithHistoricalRecords() {
        when(busRepository.findById(10L)).thenReturn(Optional.of(sampleBus));
        when(tripRepository.countByBusIdAndStatus(10L, TripStatus.ACTIVE)).thenReturn(0L);
        when(tripRepository.countByBusId(10L)).thenReturn(5L);
        when(assignmentRepository.countByBusIdAndStatus(10L, ScheduleStatus.ACTIVE)).thenReturn(1L);
        when(assignmentRepository.countByBusIdAndStatus(10L, ScheduleStatus.INACTIVE)).thenReturn(0L);
        when(busScheduleRepository.countByAssignmentBusId(10L)).thenReturn(2L);
        when(busLocationRepository.countByBusId(10L)).thenReturn(50L);

        ResourceDependencyResponse resp = dependencyCheckService.checkBusDependencies(10L);

        assertNotNull(resp);
        assertFalse(resp.isCanDelete(), "Bus with historical records and active assignment must NOT be deletable");
        assertTrue(resp.isCanDeactivate(), "Bus without active trip CAN be deactivated");
        assertEquals("RESOURCE_IN_USE", resp.getCode());
        assertEquals(4, resp.getDependencies().size());
    }

    @Test
    void testCheckBusDependencies_WithActiveTrip() {
        when(busRepository.findById(10L)).thenReturn(Optional.of(sampleBus));
        when(tripRepository.countByBusIdAndStatus(10L, TripStatus.ACTIVE)).thenReturn(1L);
        when(tripRepository.countByBusId(10L)).thenReturn(3L);
        when(assignmentRepository.countByBusIdAndStatus(10L, ScheduleStatus.ACTIVE)).thenReturn(1L);
        when(assignmentRepository.countByBusIdAndStatus(10L, ScheduleStatus.INACTIVE)).thenReturn(0L);
        when(busScheduleRepository.countByAssignmentBusId(10L)).thenReturn(1L);
        when(busLocationRepository.countByBusId(10L)).thenReturn(10L);

        ResourceDependencyResponse resp = dependencyCheckService.checkBusDependencies(10L);

        assertNotNull(resp);
        assertFalse(resp.isCanDelete(), "Cannot delete while active trip is running");
        assertFalse(resp.isCanDeactivate(), "Cannot deactivate while active trip is running");
        assertEquals("ACTIVE_TRIP_EXISTS", resp.getCode());
    }

    @Test
    void testCheckRouteDependencies_WithAssignmentsAndTrips() {
        BusRoute route = new BusRoute("North Campus", "R-01");
        route.setId(5L);

        when(busRouteRepository.findById(5L)).thenReturn(Optional.of(route));
        when(tripRepository.countByRouteIdAndStatus(5L, TripStatus.ACTIVE)).thenReturn(0L);
        when(tripRepository.countByRouteId(5L)).thenReturn(10L);
        when(assignmentRepository.countByRouteIdAndStatus(5L, ScheduleStatus.ACTIVE)).thenReturn(1L);
        when(assignmentRepository.countByRouteIdAndStatus(5L, ScheduleStatus.INACTIVE)).thenReturn(0L);
        when(busScheduleRepository.countByAssignmentRouteId(5L)).thenReturn(2L);

        ResourceDependencyResponse resp = dependencyCheckService.checkRouteDependencies(5L);

        assertNotNull(resp);
        assertFalse(resp.isCanDelete());
        assertTrue(resp.isCanDeactivate());
        assertEquals("RESOURCE_IN_USE", resp.getCode());
    }

    @Test
    void testCheckStopDependencies_NoDependencies() {
        BusStop stop = new BusStop("Main Gate", 12.9716, 77.5946);
        stop.setId(100L);

        when(busStopRepository.findById(100L)).thenReturn(Optional.of(stop));
        when(routeStopRepository.countByStopId(100L)).thenReturn(0L);
        when(transportRequestRepository.countByPreferredStopId(100L)).thenReturn(0L);
        when(busLocationRepository.countByCurrentStop_IdOrNextStop_Id(100L, 100L)).thenReturn(0L);
        when(routeStopRepository.findByStopId(100L)).thenReturn(Collections.emptyList());

        ResourceDependencyResponse resp = dependencyCheckService.checkStopDependencies(100L);

        assertNotNull(resp);
        assertTrue(resp.isSuccess());
        assertTrue(resp.isCanDelete());
        assertTrue(resp.isCanDeactivate());
        assertEquals("OK", resp.getCode());
        assertTrue(resp.getDependencies().isEmpty());
    }

    @Test
    void testCheckStopDependencies_WithLocationRecords() {
        BusStop stop = new BusStop("Library", 12.9720, 77.5950);
        stop.setId(101L);

        when(busStopRepository.findById(101L)).thenReturn(Optional.of(stop));
        when(routeStopRepository.countByStopId(101L)).thenReturn(0L);
        when(transportRequestRepository.countByPreferredStopId(101L)).thenReturn(0L);
        when(busLocationRepository.countByCurrentStop_IdOrNextStop_Id(101L, 101L)).thenReturn(2L);
        when(routeStopRepository.findByStopId(101L)).thenReturn(Collections.emptyList());

        ResourceDependencyResponse resp = dependencyCheckService.checkStopDependencies(101L);

        assertNotNull(resp);
        assertFalse(resp.isCanDelete());
        assertTrue(resp.isCanDeactivate());
        assertEquals("RESOURCE_IN_USE", resp.getCode());
        assertEquals(1, resp.getDependencies().size());
        assertEquals("LOCATION_RECORD", resp.getDependencies().get(0).getType());
    }
}
