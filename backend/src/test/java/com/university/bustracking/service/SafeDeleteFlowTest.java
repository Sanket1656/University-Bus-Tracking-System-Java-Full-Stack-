package com.university.bustracking.service;

import com.university.bustracking.dto.DependencyItemDto;
import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ResourceInUseException;
import com.university.bustracking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafeDeleteFlowTest {

    @Mock private BusRepository busRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private DependencyCheckService dependencyCheckService;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private TripRepository tripRepository;
    @Mock private NotificationService notificationService;
    @Mock private TransportRequestRepository transportRequestRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusLocationRepository busLocationRepository;
    @Mock private NotificationRepository notificationRepository;

    @InjectMocks
    private BusService busService;

    private Bus bus;

    @BeforeEach
    void setUp() {
        bus = new Bus();
        bus.setId(1L);
        bus.setBusName("City Express");
        bus.setBusNumber("BUS-001");
        bus.setBusRegistrationNumber("MH-04-1234");
        bus.setBusStatus(BusStatus.ACTIVE);
    }

    @Test
    void testDeleteBus_BlockedWhenInUse() {
        when(busRepository.findById(1L)).thenReturn(Optional.of(bus));

        ResourceDependencyResponse blockedResponse = new ResourceDependencyResponse(
                false, "RESOURCE_IN_USE", "Bus cannot be deleted because it is in use",
                "BUS", 1L, "BUS-001",
                false, true,
                List.of(new DependencyItemDto("ACTIVE_ASSIGNMENT", 1, "1 active assignment uses this bus."))
        );
        when(dependencyCheckService.checkBusDependencies(1L)).thenReturn(blockedResponse);

        ResourceInUseException ex = assertThrows(ResourceInUseException.class, () -> busService.deleteBus(1L));
        assertNotNull(ex.getResponse());
        assertEquals("RESOURCE_IN_USE", ex.getResponse().getCode());
        assertFalse(ex.getResponse().isCanDelete());
        assertTrue(ex.getResponse().isCanDeactivate());

        verify(busRepository, never()).delete(any());
    }

    @Test
    void testDeleteBus_SucceedsWhenNoDependencies() {
        when(busRepository.findById(1L)).thenReturn(Optional.of(bus));

        ResourceDependencyResponse okResponse = new ResourceDependencyResponse(
                true, "OK", "Bus can be safely deleted",
                "BUS", 1L, "BUS-001",
                true, false,
                Collections.emptyList()
        );
        when(dependencyCheckService.checkBusDependencies(1L)).thenReturn(okResponse);

        Map<String, Object> result = busService.deleteBus(1L);
        assertTrue((Boolean) result.get("success"));
        verify(busRepository, times(1)).delete(bus);
    }

    @Test
    void testDeactivateBus_BlockedWhenActiveTripRunning() {
        when(busRepository.findById(1L)).thenReturn(Optional.of(bus));
        when(tripRepository.existsByBusIdAndStatus(1L, TripStatus.ACTIVE)).thenReturn(true);

        ResourceDependencyResponse activeTripResponse = new ResourceDependencyResponse(
                false, "ACTIVE_TRIP_EXISTS", "Active trip running",
                "BUS", 1L, "BUS-001",
                false, false,
                List.of(new DependencyItemDto("ACTIVE_TRIP", 1, "Active trip running"))
        );
        when(dependencyCheckService.checkBusDependencies(1L)).thenReturn(activeTripResponse);

        ResourceInUseException ex = assertThrows(ResourceInUseException.class, () -> busService.deactivateBus(1L));
        assertEquals("ACTIVE_TRIP_EXISTS", ex.getResponse().getCode());
        assertFalse(ex.getResponse().isCanDeactivate());
    }

    @Test
    void testDeactivateBus_SuccessAndNotifiesAssignedUsers() {
        when(busRepository.findById(1L)).thenReturn(Optional.of(bus));
        when(tripRepository.existsByBusIdAndStatus(1L, TripStatus.ACTIVE)).thenReturn(false);
        when(busRepository.save(any(Bus.class))).thenReturn(bus);

        User driver = new User("driver1", "pass", Role.DRIVER);
        driver.setId(10L);
        BusRoute route = new BusRoute("Campus Route", "R1");
        route.setId(20L);

        Assignment assignment = new Assignment(bus, driver, route, ScheduleStatus.ACTIVE);
        assignment.setId(100L);

        when(assignmentRepository.findAllByBusIdAndStatus(1L, ScheduleStatus.ACTIVE))
                .thenReturn(List.of(assignment));
        when(transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(100L, RequestStatus.APPROVED))
                .thenReturn(List.of(200L));

        User student = new User("student1", "pass", Role.STUDENT);
        student.setId(200L);
        when(userRepository.findById(200L)).thenReturn(Optional.of(student));

        Map<String, Object> result = busService.deactivateBus(1L);

        assertTrue((Boolean) result.get("success"));
        assertEquals(BusStatus.INACTIVE, bus.getBusStatus());
        assertEquals(ScheduleStatus.INACTIVE, assignment.getStatus());

        // Verify notification dispatched to driver and student
        verify(notificationService, times(1)).createNotification(
                eq(driver), eq(NotificationType.BUS_DEACTIVATED), anyString(), anyString(), isNull(), eq(bus)
        );
        verify(notificationService, times(1)).createNotification(
                eq(student), eq(NotificationType.BUS_DEACTIVATED), anyString(), anyString(), isNull(), eq(bus)
        );
    }
}
