package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TrackingService {

    private final BusLocationRepository busLocationRepository;
    private final BusRepository busRepository;
    private final BusStopRepository busStopRepository;
    private final AssignmentRepository assignmentRepository;
    private final TripRepository tripRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final NotificationService notificationService;

    public TrackingService(BusLocationRepository busLocationRepository,
                           BusRepository busRepository,
                           BusStopRepository busStopRepository,
                           AssignmentRepository assignmentRepository,
                           TripRepository tripRepository,
                           TransportRequestRepository transportRequestRepository,
                           NotificationService notificationService) {
        this.busLocationRepository = busLocationRepository;
        this.busRepository = busRepository;
        this.busStopRepository = busStopRepository;
        this.assignmentRepository = assignmentRepository;
        this.tripRepository = tripRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Map<String, Object> updateLocation(User driver,
                                             Long busId,
                                             Double latitude,
                                             Double longitude,
                                             Double speed,
                                             Double heading,
                                             Boolean isMoving,
                                             Integer currentStopIndex,
                                             Long currentStopId,
                                             Long nextStopId,
                                             Double routeProgress,
                                             Boolean routeCompleted) {
        if (driver.getRole() != Role.DRIVER) {
            throw new BadRequestException("Only drivers can update bus locations");
        }

        if (driver.getDriverProfile() != null && driver.getDriverProfile().getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Driver account is inactive and cannot update bus location.");
        }

        if (busId == null || latitude == null || longitude == null) {
            throw new BadRequestException("busId, latitude, and longitude are required");
        }

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        assignmentRepository.findByDriverIdAndStatus(driver.getId(), ScheduleStatus.ACTIVE)
                .filter(a -> a.getBus().getId().equals(busId))
                .orElseThrow(() -> new BadRequestException("You are not authorized to update this bus location"));

        Trip activeTrip = tripRepository.findByDriverIdAndStatus(driver.getId(), TripStatus.ACTIVE)
                .filter(t -> t.getBus().getId().equals(busId))
                .orElseThrow(() -> new BadRequestException("Location update is allowed only during an active trip"));

        BusLocation location = busLocationRepository.findByBusId(busId).orElse(new BusLocation());
        location.setBus(bus);
        location.setLatitude(latitude);
        location.setLongitude(longitude);

        if (speed != null) location.setSpeed(speed);
        if (heading != null) location.setHeading(heading);
        if (isMoving != null) location.setIsMoving(isMoving);
        if (currentStopIndex != null) location.setCurrentStopIndex(currentStopIndex);

        if (currentStopId != null) {
            busStopRepository.findById(currentStopId).ifPresent(stop -> {
                location.setCurrentStop(stop);
                notifyStopReached(stop, activeTrip, bus);
            });
        }

        if (nextStopId != null) {
            busStopRepository.findById(nextStopId).ifPresent(location::setNextStop);
        } else if (Boolean.TRUE.equals(routeCompleted)) {
            location.setNextStop(null);
        }

        if (routeProgress != null) location.setRouteProgress(routeProgress);
        if (routeCompleted != null) location.setRouteCompleted(routeCompleted);

        BusLocation saved = busLocationRepository.save(location);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus location updated successfully");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> demoUpdateLocation(User admin,
                                                 Long busId,
                                                 Double latitude,
                                                 Double longitude,
                                                 Double speed,
                                                 Double heading,
                                                 Boolean isMoving,
                                                 Integer currentStopIndex,
                                                 Long currentStopId,
                                                 Long nextStopId,
                                                 Double routeProgress,
                                                 Boolean routeCompleted) {
        if (admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only admins can use the demo simulator");
        }

        if (busId == null || latitude == null || longitude == null) {
            throw new BadRequestException("busId, latitude, and longitude are required");
        }

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        Trip activeTrip = tripRepository.findByBusIdAndStatus(busId, TripStatus.ACTIVE).orElse(null);

        BusLocation location = busLocationRepository.findByBusId(busId).orElse(new BusLocation());
        location.setBus(bus);
        location.setLatitude(latitude);
        location.setLongitude(longitude);

        if (speed != null) location.setSpeed(speed);
        if (heading != null) location.setHeading(heading);
        if (isMoving != null) location.setIsMoving(isMoving);
        if (currentStopIndex != null) location.setCurrentStopIndex(currentStopIndex);

        if (currentStopId != null) {
            busStopRepository.findById(currentStopId).ifPresent(stop -> {
                location.setCurrentStop(stop);
                if (activeTrip != null) {
                    notifyStopReached(stop, activeTrip, bus);
                }
            });
        }

        if (nextStopId != null) {
            busStopRepository.findById(nextStopId).ifPresent(location::setNextStop);
        } else if (Boolean.TRUE.equals(routeCompleted)) {
            location.setNextStop(null);
        }

        if (routeProgress != null) location.setRouteProgress(routeProgress);
        if (routeCompleted != null) location.setRouteCompleted(routeCompleted);

        BusLocation saved = busLocationRepository.save(location);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Simulated bus location updated successfully");
        response.put("data", saved);
        return response;
    }

    public Map<String, Object> getBusLocation(Long busId) {
        BusLocation location = busLocationRepository.findByBusId(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found for this bus"));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus location fetched successfully");
        response.put("data", location);
        return response;
    }

    public Map<String, Object> getBusStatus(Long busId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        Trip activeTrip = tripRepository.findByBusIdAndStatus(busId, TripStatus.ACTIVE).orElse(null);
        Trip latestTrip = activeTrip != null ? activeTrip : tripRepository.findFirstByBusIdOrderByCreatedAtDesc(busId).orElse(null);

        BusLocation location = busLocationRepository.findByBusId(busId).orElse(null);

        Map<String, Object> busInfo = new HashMap<>();
        busInfo.put("id", bus.getId());
        busInfo.put("_id", String.valueOf(bus.getId()));
        busInfo.put("busNumber", bus.getBusNumber());
        busInfo.put("busName", bus.getBusName());

        Map<String, Object> tripInfo = null;
        if (latestTrip != null) {
            tripInfo = new HashMap<>();
            tripInfo.put("tripId", latestTrip.getId());
            tripInfo.put("_id", String.valueOf(latestTrip.getId()));
            tripInfo.put("status", latestTrip.getStatus().getValue());
            tripInfo.put("startedAt", latestTrip.getStartedAt());
            tripInfo.put("endedAt", latestTrip.getEndedAt());
            tripInfo.put("driver", latestTrip.getDriver());
            tripInfo.put("route", latestTrip.getRoute());
            tripInfo.put("direction", latestTrip.getDirection().getValue());
        }

        Map<String, Object> data = new HashMap<>();
        data.put("bus", busInfo);
        data.put("trip", tripInfo);
        data.put("location", location);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus tracking status fetched successfully");
        response.put("data", data);
        return response;
    }

    public List<Map<String, Object>> getActiveLocations() {
        List<BusLocation> locations = busLocationRepository.findAll();
        List<Trip> activeTrips = tripRepository.findByStatus(TripStatus.ACTIVE);
        Map<Long, Trip> activeTripByBusId = new HashMap<>();
        for (Trip t : activeTrips) {
            if (t.getBus() != null && t.getBus().getId() != null) {
                activeTripByBusId.put(t.getBus().getId(), t);
            }
        }

        List<Assignment> activeAssignments = assignmentRepository.findByStatus(ScheduleStatus.ACTIVE);
        Map<Long, Assignment> assignmentByBusId = new HashMap<>();
        for (Assignment a : activeAssignments) {
            if (a.getBus() != null && a.getBus().getId() != null) {
                assignmentByBusId.put(a.getBus().getId(), a);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (BusLocation loc : locations) {
            Bus bus = loc.getBus();
            if (bus == null || loc.getLatitude() == null || loc.getLongitude() == null) {
                continue;
            }

            Trip activeTrip = activeTripByBusId.get(bus.getId());
            Assignment assignment = assignmentByBusId.get(bus.getId());

            Map<String, Object> map = new HashMap<>();
            map.put("id", loc.getId());
            map.put("_id", String.valueOf(loc.getId()));
            map.put("busId", bus.getId());
            map.put("latitude", loc.getLatitude());
            map.put("longitude", loc.getLongitude());
            map.put("speed", loc.getSpeed() != null ? loc.getSpeed() : 0.0);
            map.put("heading", loc.getHeading() != null ? loc.getHeading() : 0.0);
            map.put("isMoving", loc.getIsMoving() != null ? loc.getIsMoving() : false);
            map.put("currentStopIndex", loc.getCurrentStopIndex());
            map.put("currentStop", loc.getCurrentStop());
            map.put("currentStopId", loc.getCurrentStopId());
            map.put("nextStop", loc.getNextStop());
            map.put("nextStopId", loc.getNextStopId());
            map.put("routeProgress", loc.getRouteProgress() != null ? loc.getRouteProgress() : 0.0);
            map.put("routeCompleted", loc.getRouteCompleted() != null ? loc.getRouteCompleted() : false);
            map.put("updatedAt", loc.getUpdatedAt());

            // Direct bus attributes for easy access
            map.put("busNumber", bus.getBusNumber());
            map.put("busName", bus.getBusName());
            map.put("busRegistrationNumber", bus.getBusRegistrationNumber());

            Map<String, Object> busInfo = new HashMap<>();
            busInfo.put("id", bus.getId());
            busInfo.put("_id", String.valueOf(bus.getId()));
            busInfo.put("busNumber", bus.getBusNumber());
            busInfo.put("busName", bus.getBusName());
            busInfo.put("busRegistrationNumber", bus.getBusRegistrationNumber());
            busInfo.put("busType", bus.getBusType() != null ? bus.getBusType().getValue() : null);
            busInfo.put("busCapacity", bus.getBusCapacity());
            busInfo.put("busStatus", bus.getBusStatus() != null ? bus.getBusStatus().getValue() : null);
            busInfo.put("busPhoto", bus.getBusPhoto());
            map.put("bus", busInfo);

            User driver = activeTrip != null ? activeTrip.getDriver() : (assignment != null ? assignment.getDriver() : null);
            if (driver != null) {
                Map<String, Object> driverInfo = new HashMap<>();
                driverInfo.put("id", driver.getId());
                driverInfo.put("_id", String.valueOf(driver.getId()));
                String driverName = driver.getUsername();
                if (driver.getDriverProfile() != null && driver.getDriverProfile().getName() != null) {
                    driverName = driver.getDriverProfile().getName();
                }
                driverInfo.put("name", driverName);
                if (driver.getDriverProfile() != null) {
                    driverInfo.put("phone", driver.getDriverProfile().getPhone());
                    driverInfo.put("licenseId", driver.getDriverProfile().getLicenseId());
                }
                map.put("driver", driverInfo);
            } else {
                map.put("driver", null);
            }

            BusRoute route = activeTrip != null ? activeTrip.getRoute() : (assignment != null ? assignment.getRoute() : null);
            if (route != null) {
                Map<String, Object> routeInfo = new HashMap<>();
                routeInfo.put("id", route.getId());
                routeInfo.put("_id", String.valueOf(route.getId()));
                routeInfo.put("routeName", route.getRouteName());
                routeInfo.put("routeCode", route.getRouteCode());
                map.put("route", routeInfo);
            } else {
                map.put("route", null);
            }

            if (activeTrip != null) {
                Map<String, Object> tripInfo = new HashMap<>();
                tripInfo.put("id", activeTrip.getId());
                tripInfo.put("_id", String.valueOf(activeTrip.getId()));
                tripInfo.put("tripId", activeTrip.getId());
                tripInfo.put("status", activeTrip.getStatus().getValue());
                tripInfo.put("direction", activeTrip.getDirection().getValue());
                tripInfo.put("startedAt", activeTrip.getStartedAt());
                map.put("trip", tripInfo);
            } else {
                map.put("trip", null);
            }

            result.add(map);
        }
        return result;
    }

    private void notifyStopReached(BusStop stop, Trip trip, Bus bus) {
        if (trip == null || trip.getSchedule() == null || trip.getSchedule().getAssignment() == null) return;

        Long assignmentId = trip.getSchedule().getAssignment().getId();
        List<TransportRequest> studentsAtStop = transportRequestRepository.findStudentsForStopAndAssignment(
                stop.getId(), assignmentId, RequestStatus.APPROVED);

        for (TransportRequest tr : studentsAtStop) {
            notificationService.createNotification(
                    tr.getStudent(),
                    NotificationType.PICKUP_STOP_REACHED,
                    "Stop Reached",
                    "Bus " + bus.getBusNumber() + " has reached your stop: " + stop.getStopName(),
                    trip,
                    bus
            );
        }
    }
}
