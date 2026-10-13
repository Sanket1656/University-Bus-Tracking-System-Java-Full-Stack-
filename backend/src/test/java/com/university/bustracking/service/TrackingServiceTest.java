package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackingServiceTest {

    @Mock private BusLocationRepository busLocationRepository;
    @Mock private BusRepository busRepository;
    @Mock private BusStopRepository busStopRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private TripRepository tripRepository;
    @Mock private TransportRequestRepository transportRequestRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private TrackingService trackingService;

    private Bus bus;
    private BusLocation location;
    private Trip trip;

    @BeforeEach
    void setUp() {
        bus = new Bus();
        bus.setId(3L);
        bus.setBusNumber("BUS-001");
        bus.setBusName("KATARGAM EXPRESS");

        location = new BusLocation();
        location.setId(10L);
        location.setBus(bus);
        location.setLatitude(21.485);
        location.setLongitude(72.992);
        location.setSpeed(0.0);
        location.setHeading(245.0);
        location.setIsMoving(false);
        location.setRouteProgress(100.0);
        location.setRouteCompleted(true);

        trip = new Trip();
        trip.setId(11L);
        trip.setBus(bus);
        trip.setStatus(TripStatus.COMPLETED);
        trip.setDirection(Direction.RETURN);
        trip.setStartedAt(LocalDateTime.now().minusHours(1));
        trip.setEndedAt(LocalDateTime.now().minusMinutes(10));
    }

    @Test
    void testGetBusStatus_WhenTripIsCompleted_PreservesLastLocationAndCompletedStatus() {
        when(busRepository.findById(3L)).thenReturn(Optional.of(bus));
        when(tripRepository.findByBusIdAndStatus(3L, TripStatus.ACTIVE)).thenReturn(Optional.empty());
        when(tripRepository.findFirstByBusIdOrderByCreatedAtDesc(3L)).thenReturn(Optional.of(trip));
        when(busLocationRepository.findByBusId(3L)).thenReturn(Optional.of(location));

        Map<String, Object> result = trackingService.getBusStatus(3L);

        assertTrue((Boolean) result.get("success"));
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.get("data");
        assertNotNull(data);

        @SuppressWarnings("unchecked")
        Map<String, Object> tripData = (Map<String, Object>) data.get("trip");
        assertNotNull(tripData);
        assertEquals("Completed", tripData.get("status"));
        assertEquals(11L, tripData.get("tripId"));

        BusLocation loc = (BusLocation) data.get("location");
        assertNotNull(loc);
        assertEquals(21.485, loc.getLatitude());
        assertEquals(72.992, loc.getLongitude());
        assertTrue(loc.getRouteCompleted());
        assertEquals(100.0, loc.getRouteProgress());
        assertFalse(loc.getIsMoving());
    }

    @Test
    void testGetBusStatus_WhenTripIsActive_ReturnsActiveTripAndLiveLocation() {
        trip.setStatus(TripStatus.ACTIVE);
        trip.setEndedAt(null);
        location.setIsMoving(true);
        location.setSpeed(42.5);
        location.setRouteCompleted(false);
        location.setRouteProgress(45.0);

        when(busRepository.findById(3L)).thenReturn(Optional.of(bus));
        when(tripRepository.findByBusIdAndStatus(3L, TripStatus.ACTIVE)).thenReturn(Optional.of(trip));
        when(busLocationRepository.findByBusId(3L)).thenReturn(Optional.of(location));

        Map<String, Object> result = trackingService.getBusStatus(3L);

        assertTrue((Boolean) result.get("success"));
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.get("data");
        assertNotNull(data);

        @SuppressWarnings("unchecked")
        Map<String, Object> tripData = (Map<String, Object>) data.get("trip");
        assertNotNull(tripData);
        assertEquals("Active", tripData.get("status"));

        BusLocation loc = (BusLocation) data.get("location");
        assertNotNull(loc);
        assertEquals(21.485, loc.getLatitude());
        assertEquals(72.992, loc.getLongitude());
        assertFalse(loc.getRouteCompleted());
        assertTrue(loc.getIsMoving());
        assertEquals(42.5, loc.getSpeed());
    }

    @Test
    void testGetBusStatus_WhenNoLocationExists_ReturnsNullLocationSafely() {
        when(busRepository.findById(3L)).thenReturn(Optional.of(bus));
        when(tripRepository.findByBusIdAndStatus(3L, TripStatus.ACTIVE)).thenReturn(Optional.of(trip));
        when(busLocationRepository.findByBusId(3L)).thenReturn(Optional.empty());

        Map<String, Object> result = trackingService.getBusStatus(3L);

        assertTrue((Boolean) result.get("success"));
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.get("data");
        assertNotNull(data);
        assertNull(data.get("location"));
    }

    @Test
    void testGetBusStatus_BusNotFound_ThrowsException() {
        when(busRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                trackingService.getBusStatus(99L)
        );
    }
}
