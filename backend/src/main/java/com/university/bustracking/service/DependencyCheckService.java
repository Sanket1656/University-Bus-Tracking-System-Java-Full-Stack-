package com.university.bustracking.service;

import com.university.bustracking.dto.DependencyItemDto;
import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.entity.*;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DependencyCheckService {

    private final BusRepository busRepository;
    private final BusRouteRepository busRouteRepository;
    private final BusStopRepository busStopRepository;
    private final AssignmentRepository assignmentRepository;
    private final BusScheduleRepository busScheduleRepository;
    private final TripRepository tripRepository;
    private final BusLocationRepository busLocationRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final UserRepository userRepository;
    private final RouteStopRepository routeStopRepository;

    public DependencyCheckService(BusRepository busRepository,
                                  BusRouteRepository busRouteRepository,
                                  BusStopRepository busStopRepository,
                                  AssignmentRepository assignmentRepository,
                                  BusScheduleRepository busScheduleRepository,
                                  TripRepository tripRepository,
                                  BusLocationRepository busLocationRepository,
                                  TransportRequestRepository transportRequestRepository,
                                  UserRepository userRepository,
                                  RouteStopRepository routeStopRepository) {
        this.busRepository = busRepository;
        this.busRouteRepository = busRouteRepository;
        this.busStopRepository = busStopRepository;
        this.assignmentRepository = assignmentRepository;
        this.busScheduleRepository = busScheduleRepository;
        this.tripRepository = tripRepository;
        this.busLocationRepository = busLocationRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.userRepository = userRepository;
        this.routeStopRepository = routeStopRepository;
    }

    public ResourceDependencyResponse checkBusDependencies(Long busId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));

        long activeTrips = tripRepository.countByBusIdAndStatus(busId, TripStatus.ACTIVE);
        long totalTrips = tripRepository.countByBusId(busId);
        long historicalTrips = Math.max(0, totalTrips - activeTrips);

        long activeAssignments = assignmentRepository.countByBusIdAndStatus(busId, ScheduleStatus.ACTIVE);
        long inactiveAssignments = assignmentRepository.countByBusIdAndStatus(busId, ScheduleStatus.INACTIVE);
        long schedules = busScheduleRepository.countByAssignmentBusId(busId);
        long locationRecords = busLocationRepository.countByBusId(busId);

        List<DependencyItemDto> items = new ArrayList<>();
        if (activeTrips > 0) {
            items.add(new DependencyItemDto("ACTIVE_TRIP", activeTrips, activeTrips + " active trip is currently running with this bus."));
        }
        if (activeAssignments > 0) {
            items.add(new DependencyItemDto("ACTIVE_ASSIGNMENT", activeAssignments, activeAssignments + " active assignment uses this bus."));
        }
        if (inactiveAssignments > 0) {
            items.add(new DependencyItemDto("INACTIVE_ASSIGNMENT", inactiveAssignments, inactiveAssignments + " inactive assignment references this bus."));
        }
        if (schedules > 0) {
            items.add(new DependencyItemDto("SCHEDULE", schedules, schedules + " schedule(s) use this bus."));
        }
        if (historicalTrips > 0) {
            items.add(new DependencyItemDto("HISTORICAL_TRIP", historicalTrips, historicalTrips + " historical trip(s) are linked to this bus."));
        }
        if (locationRecords > 0) {
            items.add(new DependencyItemDto("LOCATION_RECORD", locationRecords, locationRecords + " GPS tracking record(s) linked to this bus."));
        }

        boolean hasActiveTrip = activeTrips > 0;
        boolean canDelete = items.isEmpty();
        boolean canDeactivate = !hasActiveTrip;

        String code = hasActiveTrip ? "ACTIVE_TRIP_EXISTS" : (!canDelete ? "RESOURCE_IN_USE" : "OK");
        String message = hasActiveTrip
                ? "Bus " + bus.getBusNumber() + " cannot be deleted or deactivated while an active trip is running."
                : (!canDelete
                    ? "Bus " + bus.getBusNumber() + " cannot be deleted because it is currently referenced by other records."
                    : "Bus " + bus.getBusNumber() + " has no dependencies and can be safely deleted.");

        return new ResourceDependencyResponse(
                true, code, message, "BUS", bus.getId(), bus.getBusName() + " (" + bus.getBusNumber() + ")",
                canDelete, canDeactivate, items
        );
    }

    public ResourceDependencyResponse checkDriverDependencies(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));

        if (driver.getRole() != Role.DRIVER) {
            throw new ResourceNotFoundException("User is not a driver");
        }

        long activeTrips = tripRepository.countByDriverIdAndStatus(driverId, TripStatus.ACTIVE);
        long totalTrips = tripRepository.countByDriverId(driverId);
        long historicalTrips = Math.max(0, totalTrips - activeTrips);

        long activeAssignments = assignmentRepository.countByDriverIdAndStatus(driverId, ScheduleStatus.ACTIVE);
        long inactiveAssignments = assignmentRepository.countByDriverIdAndStatus(driverId, ScheduleStatus.INACTIVE);
        long schedules = busScheduleRepository.countByAssignmentDriverId(driverId);

        List<DependencyItemDto> items = new ArrayList<>();
        if (activeTrips > 0) {
            items.add(new DependencyItemDto("ACTIVE_TRIP", activeTrips, activeTrips + " active trip is currently being operated by this driver."));
        }
        if (activeAssignments > 0) {
            items.add(new DependencyItemDto("ACTIVE_ASSIGNMENT", activeAssignments, activeAssignments + " active assignment has this driver assigned."));
        }
        if (inactiveAssignments > 0) {
            items.add(new DependencyItemDto("INACTIVE_ASSIGNMENT", inactiveAssignments, inactiveAssignments + " inactive assignment references this driver."));
        }
        if (schedules > 0) {
            items.add(new DependencyItemDto("SCHEDULE", schedules, schedules + " schedule(s) reference this driver."));
        }
        if (historicalTrips > 0) {
            items.add(new DependencyItemDto("HISTORICAL_TRIP", historicalTrips, historicalTrips + " historical trip(s) were operated by this driver."));
        }

        boolean hasActiveTrip = activeTrips > 0;
        boolean canDelete = items.isEmpty();
        boolean canDeactivate = !hasActiveTrip;

        String code = hasActiveTrip ? "ACTIVE_TRIP_EXISTS" : (!canDelete ? "RESOURCE_IN_USE" : "OK");
        String driverName = driver.getDriverProfile() != null && driver.getDriverProfile().getName() != null
                ? driver.getDriverProfile().getName() : driver.getUsername();
        String message = hasActiveTrip
                ? "Driver " + driverName + " cannot be deleted or deactivated while an active trip is running."
                : (!canDelete
                    ? "Driver " + driverName + " cannot be deleted because operational records exist."
                    : "Driver " + driverName + " has no dependencies and can be safely deleted.");

        return new ResourceDependencyResponse(
                true, code, message, "DRIVER", driver.getId(), driverName,
                canDelete, canDeactivate, items
        );
    }

    public ResourceDependencyResponse checkRouteDependencies(Long routeId) {
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));

        long activeTrips = tripRepository.countByRouteIdAndStatus(routeId, TripStatus.ACTIVE);
        long totalTrips = tripRepository.countByRouteId(routeId);
        long historicalTrips = Math.max(0, totalTrips - activeTrips);

        long activeAssignments = assignmentRepository.countByRouteIdAndStatus(routeId, ScheduleStatus.ACTIVE);
        long inactiveAssignments = assignmentRepository.countByRouteIdAndStatus(routeId, ScheduleStatus.INACTIVE);
        long schedules = busScheduleRepository.countByAssignmentRouteId(routeId);

        List<DependencyItemDto> items = new ArrayList<>();
        if (activeTrips > 0) {
            items.add(new DependencyItemDto("ACTIVE_TRIP", activeTrips, activeTrips + " active trip is currently in progress along this route."));
        }
        if (activeAssignments > 0) {
            items.add(new DependencyItemDto("ACTIVE_ASSIGNMENT", activeAssignments, activeAssignments + " active assignment operates on this route."));
        }
        if (inactiveAssignments > 0) {
            items.add(new DependencyItemDto("INACTIVE_ASSIGNMENT", inactiveAssignments, inactiveAssignments + " inactive assignment references this route."));
        }
        if (schedules > 0) {
            items.add(new DependencyItemDto("SCHEDULE", schedules, schedules + " schedule(s) reference this route corridor."));
        }
        if (historicalTrips > 0) {
            items.add(new DependencyItemDto("HISTORICAL_TRIP", historicalTrips, historicalTrips + " historical trip(s) were completed on this route."));
        }

        boolean hasActiveTrip = activeTrips > 0;
        boolean canDelete = items.isEmpty();
        boolean canDeactivate = !hasActiveTrip;

        String code = hasActiveTrip ? "ACTIVE_TRIP_EXISTS" : (!canDelete ? "RESOURCE_IN_USE" : "OK");
        String message = hasActiveTrip
                ? "Route " + route.getRouteName() + " cannot be deleted or deactivated while an active trip is running."
                : (!canDelete
                    ? "Route " + route.getRouteName() + " cannot be deleted because it is currently in use."
                    : "Route " + route.getRouteName() + " has no dependencies and can be safely deleted.");

        return new ResourceDependencyResponse(
                true, code, message, "ROUTE", route.getId(), route.getRouteName() + " (" + route.getRouteCode() + ")",
                canDelete, canDeactivate, items
        );
    }

    public ResourceDependencyResponse checkStopDependencies(Long stopId) {
        BusStop stop = busStopRepository.findById(stopId)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found with id: " + stopId));

        long routeCount = routeStopRepository.countByStopId(stopId);
        long studentCount = transportRequestRepository.countByPreferredStopId(stopId);
        long locationCount = busLocationRepository.countByCurrentStop_IdOrNextStop_Id(stopId, stopId);

        List<RouteStop> routeStops = routeStopRepository.findByStopId(stopId);
        boolean hasActiveTrip = false;
        for (RouteStop rs : routeStops) {
            if (tripRepository.existsByRouteIdAndStatus(rs.getRoute().getId(), TripStatus.ACTIVE)) {
                hasActiveTrip = true;
                break;
            }
        }

        List<DependencyItemDto> items = new ArrayList<>();
        if (hasActiveTrip) {
            items.add(new DependencyItemDto("ACTIVE_TRIP", 1, "An active trip is currently running on a route that includes this stop."));
        }
        if (routeCount > 0) {
            items.add(new DependencyItemDto("ROUTE", routeCount, "Used by " + routeCount + " route(s) in their sequence."));
        }
        if (studentCount > 0) {
            items.add(new DependencyItemDto("STUDENT_REQUEST", studentCount, studentCount + " student(s) selected this as their preferred pickup stop."));
        }
        if (locationCount > 0) {
            items.add(new DependencyItemDto("LOCATION_RECORD", locationCount, locationCount + " live vehicle location record(s) reference this stop."));
        }

        boolean canDelete = (routeCount + studentCount + locationCount) == 0;
        boolean canDeactivate = !hasActiveTrip;

        String code = hasActiveTrip ? "ACTIVE_TRIP_EXISTS" : (!canDelete ? "RESOURCE_IN_USE" : "OK");
        String message = hasActiveTrip
                ? "Stop '" + stop.getStopName() + "' cannot be deactivated or deleted while an active trip is in progress on this stop's route."
                : (!canDelete
                    ? "Stop '" + stop.getStopName() + "' cannot be deleted because it is in use by routes or students."
                    : "Stop '" + stop.getStopName() + "' has no dependencies and can be safely deleted.");

        return new ResourceDependencyResponse(
                true, code, message, "STOP", stop.getId(), stop.getStopName(),
                canDelete, canDeactivate, items
        );
    }

    public ResourceDependencyResponse checkAssignmentDependencies(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        long activeTrips = tripRepository.countByScheduleAssignmentIdAndStatus(assignmentId, TripStatus.ACTIVE);
        long totalTrips = tripRepository.countByScheduleAssignmentId(assignmentId);
        long historicalTrips = Math.max(0, totalTrips - activeTrips);

        long schedules = busScheduleRepository.countByAssignmentId(assignmentId);
        long studentCount = transportRequestRepository.countByAssignmentId(assignmentId);

        List<DependencyItemDto> items = new ArrayList<>();
        if (activeTrips > 0) {
            items.add(new DependencyItemDto("ACTIVE_TRIP", activeTrips, activeTrips + " active trip is currently running under this assignment."));
        }
        if (schedules > 0) {
            items.add(new DependencyItemDto("SCHEDULE", schedules, schedules + " schedule(s) are bound to this assignment."));
        }
        if (studentCount > 0) {
            items.add(new DependencyItemDto("SEAT_ASSIGNMENT", studentCount, studentCount + " student(s) have assigned seats on this bus assignment."));
        }
        if (historicalTrips > 0) {
            items.add(new DependencyItemDto("HISTORICAL_TRIP", historicalTrips, historicalTrips + " historical trip(s) were completed under this assignment."));
        }

        boolean hasActiveTrip = activeTrips > 0;
        boolean canDelete = items.isEmpty();
        boolean canDeactivate = !hasActiveTrip;

        String code = hasActiveTrip ? "ACTIVE_TRIP_EXISTS" : (!canDelete ? "RESOURCE_IN_USE" : "OK");
        String assignmentTitle = "Assignment #" + assignment.getId() + " (" + assignment.getBus().getBusNumber() + " / " + assignment.getRoute().getRouteCode() + ")";
        String message = hasActiveTrip
                ? "This assignment cannot be deleted or deactivated while an active trip is running."
                : (!canDelete
                    ? "This assignment cannot be deleted because schedules, students, or trip histories are bound to it."
                    : "This assignment has no dependencies and can be safely deleted.");

        return new ResourceDependencyResponse(
                true, code, message, "ASSIGNMENT", assignment.getId(), assignmentTitle,
                canDelete, canDeactivate, items
        );
    }

    public ResourceDependencyResponse checkStudentDependencies(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (student.getRole() != Role.STUDENT) {
            throw new ResourceNotFoundException("User is not a student");
        }

        long totalRequests = transportRequestRepository.countByStudentId(studentId);
        boolean hasApproved = transportRequestRepository.findByStudentIdAndStatus(studentId, RequestStatus.APPROVED).isPresent();

        List<DependencyItemDto> items = new ArrayList<>();
        if (totalRequests > 0) {
            items.add(new DependencyItemDto("TRANSPORT_REQUEST", totalRequests, totalRequests + " transport request(s) exist for this student."));
        }
        if (hasApproved) {
            items.add(new DependencyItemDto("ACTIVE_TRANSPORT", 1, "Student has an approved active transit assignment."));
        }

        boolean canDelete = totalRequests == 0;
        boolean canDeactivate = true;

        String studentName = student.getStudentProfile() != null && student.getStudentProfile().getName() != null
                ? student.getStudentProfile().getName() : student.getUsername();
        String code = !canDelete ? "RESOURCE_IN_USE" : "OK";
        String message = !canDelete
                ? "Student " + studentName + " cannot be deleted because historical or active transport records exist."
                : "Student " + studentName + " has no dependencies and can be safely deleted.";

        return new ResourceDependencyResponse(
                true, code, message, "STUDENT", student.getId(), studentName,
                canDelete, canDeactivate, items
        );
    }
}
