package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final BusScheduleRepository busScheduleRepository;
    private final BusLocationRepository busLocationRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TripService(TripRepository tripRepository,
                       BusScheduleRepository busScheduleRepository,
                       BusLocationRepository busLocationRepository,
                       TransportRequestRepository transportRequestRepository,
                       UserRepository userRepository,
                       NotificationService notificationService) {
        this.tripRepository = tripRepository;
        this.busScheduleRepository = busScheduleRepository;
        this.busLocationRepository = busLocationRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Map<String, Object> startTrip(User driver, Long scheduleId) {
        if (driver.getRole() != Role.DRIVER) {
            throw new BadRequestException("Only drivers can access trip lifecycle APIs");
        }

        if (scheduleId == null) {
            throw new BadRequestException("scheduleId is required");
        }

        BusSchedule schedule = busScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        if (driver.getDriverProfile() != null && driver.getDriverProfile().getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Driver account is inactive and cannot operate trips.");
        }

        if (schedule.getStatus() != ScheduleStatus.ACTIVE) {
            throw new BadRequestException("Cannot start trip on an inactive schedule.");
        }

        Assignment assignment = schedule.getAssignment();
        if (assignment == null) {
            throw new BadRequestException("Schedule has no assignment");
        }

        if (assignment.getStatus() != ScheduleStatus.ACTIVE) {
            throw new BadRequestException("Cannot start trip with an inactive assignment.");
        }

        if (assignment.getDriver() == null || !assignment.getDriver().getId().equals(driver.getId())) {
            throw new BadRequestException("You are not assigned to this schedule/trip.");
        }

        Bus bus = assignment.getBus();
        if (bus == null || bus.getBusStatus() != BusStatus.ACTIVE) {
            throw new BadRequestException("Cannot start trip with an inactive bus (" + (bus != null ? bus.getBusNumber() : "N/A") + ").");
        }

        BusRoute route = assignment.getRoute();
        if (route == null || route.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Cannot start trip on an inactive route (" + (route != null ? route.getRouteName() : "N/A") + ").");
        }

        List<RouteStop> rStops = route.getRouteStops();
        if (rStops == null || rStops.isEmpty()) {
            throw new BadRequestException("Route stops are not configured for route: " + route.getRouteName());
        }

        if (schedule.getDirection() == null) {
            throw new BadRequestException("Schedule direction is not configured");
        }

        if (tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE).isPresent()) {
            throw new ConflictException("Driver already has an active trip");
        }
        if (tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE).isPresent()) {
            throw new ConflictException("Bus already has an active trip");
        }

        Trip trip = new Trip();
        trip.setSchedule(schedule);
        trip.setDriver(driver);
        trip.setBus(bus);
        trip.setRoute(route);
        trip.setDirection(schedule.getDirection());
        trip.setStatus(TripStatus.ACTIVE);
        trip.setStartedAt(LocalDateTime.now());
        Trip savedTrip = tripRepository.save(trip);

        // Sort route stops canonically by stopOrder
        List<RouteStop> sortedStops = new ArrayList<>(rStops);
        sortedStops.sort(Comparator.comparingInt(rs -> rs.getStopOrder() != null ? rs.getStopOrder() : 0));

        // Initialize or update BusLocation to start stop coordinates based on trip direction
        BusStop startStop;
        BusStop nextStop;
        if (schedule.getDirection() == Direction.RETURN) {
            startStop = sortedStops.get(sortedStops.size() - 1).getStop();
            nextStop = (sortedStops.size() > 1)
                    ? sortedStops.get(sortedStops.size() - 2).getStop()
                    : null;
        } else {
            startStop = sortedStops.get(0).getStop();
            nextStop = (sortedStops.size() > 1)
                    ? sortedStops.get(1).getStop()
                    : null;
        }

        BusLocation location = busLocationRepository.findByBusId(bus.getId()).orElse(new BusLocation());
        location.setBus(bus);
        location.setLatitude(startStop != null ? startStop.getLatitude() : 0.0);
        location.setLongitude(startStop != null ? startStop.getLongitude() : 0.0);
        location.setSpeed(0.0);
        location.setHeading(0.0);
        location.setIsMoving(false);
        location.setCurrentStopIndex(0);
        location.setCurrentStop(startStop);
        location.setNextStop(nextStop);
        location.setRouteProgress(0.0);
        location.setRouteCompleted(false);
        busLocationRepository.save(location);

        // Send Notifications
        String directionLabel = schedule.getDirection() == Direction.RETURN ? "return" : "outbound";
        List<Long> studentIds = transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(assignment.getId(), RequestStatus.APPROVED);

        for (Long sId : studentIds) {
            userRepository.findById(sId).ifPresent(studentUser -> {
                notificationService.createNotification(
                        studentUser,
                        NotificationType.TRIP_STARTED,
                        "Bus Started",
                        "Bus " + bus.getBusNumber() + " has started its " + directionLabel + " trip.",
                        savedTrip,
                        bus
                );
            });
        }

        notificationService.createNotification(
                driver,
                NotificationType.TRIP_STARTED,
                "Trip Started",
                "Bus " + bus.getBusNumber() + " " + directionLabel + " trip has started successfully.",
                savedTrip,
                bus
        );

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin,
                    NotificationType.TRIP_STARTED,
                    "Trip Started",
                    "Bus " + bus.getBusNumber() + " " + directionLabel + " trip has been started by the assigned driver.",
                    savedTrip,
                    bus
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Trip started successfully");
        response.put("trip", savedTrip);
        response.put("data", savedTrip);
        return response;
    }

    public Map<String, Object> getCurrentTrip(User driver) {
        Optional<Trip> activeTripOpt = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("trip", activeTripOpt.orElse(null));
        response.put("data", activeTripOpt.orElse(null));
        return response;
    }

    @Transactional
    public Map<String, Object> prepareReturn(User driver, Long scheduleId) {
        if (driver.getRole() != Role.DRIVER) {
            throw new BadRequestException("Only drivers can prepare return trips");
        }
        if (scheduleId == null) {
            throw new BadRequestException("scheduleId is required");
        }

        BusSchedule schedule = busScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        if (driver.getDriverProfile() != null && driver.getDriverProfile().getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Driver account is inactive and cannot operate trips.");
        }

        Assignment assignment = schedule.getAssignment();
        if (assignment == null) {
            throw new BadRequestException("Schedule has no assignment");
        }

        Bus bus = assignment.getBus();
        BusRoute route = assignment.getRoute();
        List<RouteStop> stops = route.getRouteStops();
        if (stops == null || stops.isEmpty()) {
            throw new BadRequestException("Route has no stops");
        }

        List<RouteStop> sortedStops = new ArrayList<>(stops);
        sortedStops.sort(Comparator.comparingInt(rs -> rs.getStopOrder() != null ? rs.getStopOrder() : 0));

        BusStop finalStop = sortedStops.get(sortedStops.size() - 1).getStop();
        BusStop nextStop = sortedStops.size() >= 2 ? sortedStops.get(sortedStops.size() - 2).getStop() : null;

        BusLocation location = busLocationRepository.findByBusId(bus.getId()).orElse(new BusLocation());
        location.setBus(bus);
        location.setLatitude(finalStop.getLatitude());
        location.setLongitude(finalStop.getLongitude());
        location.setSpeed(0.0);
        location.setHeading(0.0);
        location.setIsMoving(false);
        location.setCurrentStopIndex(0);
        location.setCurrentStop(finalStop);
        location.setNextStop(nextStop);
        location.setRouteProgress(0.0);
        location.setRouteCompleted(false);
        BusLocation savedLocation = busLocationRepository.save(location);

        Map<String, Object> returnData = new HashMap<>();
        returnData.put("scheduleId", schedule.getId());
        returnData.put("direction", "RETURN");
        returnData.put("location", savedLocation);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Return trip prepared at the route terminal.");
        response.put("data", returnData);
        return response;
    }

    @Transactional
    public Map<String, Object> endTrip(User driver) {
        if (driver.getRole() != Role.DRIVER) {
            throw new BadRequestException("Only drivers can access trip lifecycle APIs");
        }

        Trip trip = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active trip to end"));

        trip.setStatus(TripStatus.COMPLETED);
        trip.setEndedAt(LocalDateTime.now());
        Trip savedTrip = tripRepository.save(trip);

        Bus bus = trip.getBus();
        BusLocation location = busLocationRepository.findByBusId(bus.getId()).orElse(null);
        if (location != null) {
            location.setIsMoving(false);
            location.setSpeed(0.0);
            location.setRouteProgress(100.0);
            location.setRouteCompleted(true);
            location.setNextStop(null);
            busLocationRepository.save(location);
        }

        String directionLabel = trip.getDirection() == Direction.RETURN ? "return" : "outbound";
        List<Long> studentIds = transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(
                trip.getSchedule().getAssignment().getId(), RequestStatus.APPROVED);

        for (Long sId : studentIds) {
            userRepository.findById(sId).ifPresent(studentUser -> {
                notificationService.createNotification(
                        studentUser,
                        NotificationType.TRIP_COMPLETED,
                        "Trip Completed",
                        "Bus " + bus.getBusNumber() + " has completed its " + directionLabel + " trip.",
                        savedTrip,
                        bus
                );
            });
        }

        notificationService.createNotification(
                driver,
                NotificationType.TRIP_COMPLETED,
                "Trip Completed",
                "Bus " + bus.getBusNumber() + " " + directionLabel + " trip has been completed.",
                savedTrip,
                bus
        );

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin,
                    NotificationType.TRIP_COMPLETED,
                    "Trip Completed",
                    "Bus " + bus.getBusNumber() + " " + directionLabel + " trip has been completed by the assigned driver.",
                    savedTrip,
                    bus
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Trip ended successfully");
        response.put("trip", savedTrip);
        response.put("data", savedTrip);
        return response;
    }

    public Map<String, Object> getTripHistory(User user, String status, String direction, Long busId,
                                             Long driverId, Long routeId, String date, Integer page, Integer limit) {
        Long targetDriverId = driverId;
        if (user.getRole() == Role.DRIVER) {
            targetDriverId = user.getId();
        }

        TripStatus statusEnum = (status != null && !status.trim().isEmpty()) ? TripStatus.fromValue(status.trim()) : null;
        Direction dirEnum = (direction != null && !direction.trim().isEmpty()) ? Direction.fromValue(direction.trim()) : null;

        LocalDateTime startOfDay = null;
        LocalDateTime endOfDay = null;
        if (date != null && !date.trim().isEmpty()) {
            LocalDate localDate = LocalDate.parse(date.trim());
            startOfDay = localDate.atStartOfDay();
            endOfDay = localDate.plusDays(1).atStartOfDay();
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("startedAt").descending());

        Page<Trip> tripPage = tripRepository.findTripHistory(
                targetDriverId, busId, routeId, dirEnum, statusEnum, startOfDay, endOfDay, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tripPage.getContent());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", tripPage.getTotalElements());
        pagination.put("totalPages", Math.max(1, tripPage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    public Map<String, Object> getTripDetails(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", trip);
        return response;
    }
}
