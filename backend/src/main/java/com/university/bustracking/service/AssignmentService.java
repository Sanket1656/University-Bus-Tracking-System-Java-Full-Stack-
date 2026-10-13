package com.university.bustracking.service;

import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.exception.ResourceInUseException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final BusRepository busRepository;
    private final UserRepository userRepository;
    private final BusRouteRepository busRouteRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final DependencyCheckService dependencyCheckService;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;
    private final TransportRequestRepository transportRequestRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             BusRepository busRepository,
                             UserRepository userRepository,
                             BusRouteRepository busRouteRepository,
                             DriverProfileRepository driverProfileRepository,
                             DependencyCheckService dependencyCheckService,
                             TripRepository tripRepository,
                             NotificationService notificationService,
                             TransportRequestRepository transportRequestRepository) {
        this.assignmentRepository = assignmentRepository;
        this.busRepository = busRepository;
        this.userRepository = userRepository;
        this.busRouteRepository = busRouteRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.dependencyCheckService = dependencyCheckService;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
        this.transportRequestRepository = transportRequestRepository;
    }

    @Transactional
    public Map<String, Object> createAssignment(Long busId, Long driverId, Long routeId) {
        if (busId == null || driverId == null || routeId == null) {
            throw new BadRequestException("Bus, Driver and Route are required.");
        }

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Not Found"));

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver Not Found"));

        if (driver.getRole() != Role.DRIVER) {
            throw new BadRequestException("Selected user is not a driver.");
        }

        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route Not Found."));

        if (bus.getBusStatus() != BusStatus.ACTIVE) {
            throw new BadRequestException("Cannot assign an inactive bus (" + bus.getBusNumber() + "). Please activate the bus first.");
        }

        if (driver.getDriverProfile() != null && driver.getDriverProfile().getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Cannot assign an inactive driver. Please activate the driver profile first.");
        }

        if (route.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Cannot assign an inactive route (" + route.getRouteName() + "). Please activate the route first.");
        }

        if (assignmentRepository.existsByBusIdAndStatus(busId, ScheduleStatus.ACTIVE)) {
            throw new ConflictException("Bus is already assigned.");
        }

        if (assignmentRepository.existsByDriverIdAndStatus(driverId, ScheduleStatus.ACTIVE)) {
            throw new ConflictException("Driver is already assigned.");
        }

        Assignment assignment = new Assignment(bus, driver, route, ScheduleStatus.ACTIVE);
        Assignment saved = assignmentRepository.save(assignment);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Assignment created successfully.");
        response.put("data", attachDriverProfile(saved));
        return response;
    }

    public Map<String, Object> getAllAssignments(Integer page, Integer limit, String search, String status, boolean hasParams) {
        ScheduleStatus statusEnum = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            statusEnum = ScheduleStatus.fromValue(status.trim());
        }

        long overallTotal = assignmentRepository.count();
        long activeTotal = assignmentRepository.countByStatus(ScheduleStatus.ACTIVE);
        long inactiveTotal = assignmentRepository.countByStatus(ScheduleStatus.INACTIVE);

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);
        summary.put("active", activeTotal);
        summary.put("inactive", inactiveTotal);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Assignments fetched successfully.");
        response.put("summary", summary);

        if (!hasParams) {
            List<Assignment> assignments = assignmentRepository.findAll(Sort.by("createdAt").descending());
            List<Map<String, Object>> resultList = assignments.stream()
                    .map(this::attachDriverProfile)
                    .collect(Collectors.toList());
            response.put("count", resultList.size());
            response.put("data", resultList);
            return response;
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("createdAt").descending());

        Page<Assignment> assignmentPage = assignmentRepository.searchAssignments(statusEnum, search != null ? search.trim() : "", pageable);

        List<Map<String, Object>> resultList = assignmentPage.getContent().stream()
                .map(this::attachDriverProfile)
                .collect(Collectors.toList());

        response.put("count", resultList.size());
        response.put("data", resultList);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", assignmentPage.getTotalElements());
        pagination.put("totalPages", Math.max(1, assignmentPage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    @Transactional
    public Map<String, Object> updateAssignment(Long id, Long busId, Long driverId, Long routeId, String status) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assingment Not Found."));

        if (busId == null || driverId == null || routeId == null) {
            throw new BadRequestException("Bus, Driver and Route are required.");
        }

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Not Found."));

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver Not Found."));

        if (driver.getRole() != Role.DRIVER) {
            throw new BadRequestException("Selected user is not Driver.");
        }

        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route Not Found."));

        ScheduleStatus targetStatus = status != null ? ScheduleStatus.fromValue(status) : assignment.getStatus();

        if (targetStatus == ScheduleStatus.ACTIVE) {
            if (bus.getBusStatus() != BusStatus.ACTIVE) {
                throw new BadRequestException("Cannot activate assignment: Associated bus (" + bus.getBusNumber() + ") is inactive.");
            }
            if (driver.getDriverProfile() != null && driver.getDriverProfile().getStatus() == ScheduleStatus.INACTIVE) {
                throw new BadRequestException("Cannot activate assignment: Associated driver is inactive.");
            }
            if (route.getStatus() == ScheduleStatus.INACTIVE) {
                throw new BadRequestException("Cannot activate assignment: Associated route (" + route.getRouteName() + ") is inactive.");
            }
            if (assignmentRepository.existsByBusIdAndStatusAndIdNot(busId, ScheduleStatus.ACTIVE, id)) {
                throw new ConflictException("Bus is already assigned.");
            }
            if (assignmentRepository.existsByDriverIdAndStatusAndIdNot(driverId, ScheduleStatus.ACTIVE, id)) {
                throw new ConflictException("Driver is already assigned.");
            }
        }

        assignment.setBus(bus);
        assignment.setDriver(driver);
        assignment.setRoute(route);
        assignment.setStatus(targetStatus);

        Assignment updated = assignmentRepository.save(assignment);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Assignment updated Successfully.");
        response.put("data", attachDriverProfile(updated));
        return response;
    }

    public ResourceDependencyResponse getAssignmentDependencies(Long id) {
        return dependencyCheckService.checkAssignmentDependencies(id);
    }

    @Transactional
    public Map<String, Object> deleteAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        ResourceDependencyResponse dep = dependencyCheckService.checkAssignmentDependencies(id);
        if (!dep.isCanDelete()) {
            throw new ResourceInUseException(dep);
        }

        assignmentRepository.delete(assignment);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Assignment deleted successfully.");
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        if (tripRepository.existsByScheduleAssignmentIdAndStatus(id, TripStatus.ACTIVE)) {
            ResourceDependencyResponse dep = dependencyCheckService.checkAssignmentDependencies(id);
            throw new ResourceInUseException(dep);
        }

        assignment.setStatus(ScheduleStatus.INACTIVE);
        Assignment updated = assignmentRepository.save(assignment);

        if (assignment.getDriver() != null) {
            notificationService.createNotification(
                    assignment.getDriver(),
                    NotificationType.ASSIGNMENT_DEACTIVATED,
                    "Assignment Deactivated",
                    "Your assignment for bus " + assignment.getBus().getBusNumber() + " on route " + assignment.getRoute().getRouteName() + " has been deactivated.",
                    null,
                    assignment.getBus()
            );
        }

        List<Long> studentIds = transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(id, RequestStatus.APPROVED);
        for (Long sId : studentIds) {
            userRepository.findById(sId).ifPresent(studentUser -> {
                notificationService.createNotification(
                        studentUser,
                        NotificationType.ASSIGNMENT_DEACTIVATED,
                        "Bus Assignment Deactivated",
                        "Your bus assignment for " + assignment.getBus().getBusNumber() + " has been deactivated. Please contact the transport administrator.",
                        null,
                        assignment.getBus()
                );
            });
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Assignment deactivated successfully.");
        response.put("data", attachDriverProfile(updated));
        return response;
    }

    @Transactional
    public Map<String, Object> reactivateAssignment(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        Bus bus = assignment.getBus();
        User driver = assignment.getDriver();
        BusRoute route = assignment.getRoute();

        if (bus.getBusStatus() != BusStatus.ACTIVE) {
            throw new BadRequestException("Cannot reactivate assignment: Associated bus (" + bus.getBusNumber() + ") is inactive.");
        }
        if (driver.getDriverProfile() != null && driver.getDriverProfile().getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Cannot reactivate assignment: Associated driver is inactive.");
        }
        if (route.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Cannot reactivate assignment: Associated route (" + route.getRouteName() + ") is inactive.");
        }

        if (assignmentRepository.existsByBusIdAndStatusAndIdNot(bus.getId(), ScheduleStatus.ACTIVE, id)) {
            throw new ConflictException("Bus is already assigned to another active assignment.");
        }
        if (assignmentRepository.existsByDriverIdAndStatusAndIdNot(driver.getId(), ScheduleStatus.ACTIVE, id)) {
            throw new ConflictException("Driver is already assigned to another active assignment.");
        }

        assignment.setStatus(ScheduleStatus.ACTIVE);
        Assignment updated = assignmentRepository.save(assignment);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Assignment reactivated successfully.");
        response.put("data", attachDriverProfile(updated));
        return response;
    }

    private Map<String, Object> attachDriverProfile(Assignment assignment) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", assignment.getId());
        map.put("_id", String.valueOf(assignment.getId()));
        map.put("bus", assignment.getBus());
        map.put("route", assignment.getRoute());
        map.put("status", assignment.getStatus().getValue());
        map.put("createdAt", assignment.getCreatedAt());
        map.put("updatedAt", assignment.getUpdatedAt());

        User driver = assignment.getDriver();
        Map<String, Object> driverMap = new HashMap<>();
        if (driver != null) {
            driverMap.put("id", driver.getId());
            driverMap.put("_id", String.valueOf(driver.getId()));
            driverMap.put("username", driver.getUsername());
            driverMap.put("role", driver.getRole().getValue());

            Optional<DriverProfile> dpOpt = driverProfileRepository.findByUserId(driver.getId());
            if (dpOpt.isPresent()) {
                DriverProfile dp = dpOpt.get();
                driverMap.put("name", dp.getName() != null ? dp.getName() : driver.getUsername());
                driverMap.put("email", dp.getEmail());
                driverMap.put("phone", dp.getPhone());
                driverMap.put("licenseId", dp.getLicenseId());
                driverMap.put("photo", dp.getPhoto());
            } else {
                driverMap.put("name", driver.getUsername());
                driverMap.put("email", null);
                driverMap.put("phone", null);
                driverMap.put("licenseId", null);
                driverMap.put("photo", null);
            }
        }
        map.put("driver", driverMap);
        return map;
    }
}
