package com.university.bustracking.service;

import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ResourceInUseException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BusService {

    private final BusRepository busRepository;
    private final FileStorageService fileStorageService;
    private final DependencyCheckService dependencyCheckService;
    private final AssignmentRepository assignmentRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;
    private final TransportRequestRepository transportRequestRepository;
    private final UserRepository userRepository;
    private final BusLocationRepository busLocationRepository;

    private final NotificationRepository notificationRepository;

    public BusService(BusRepository busRepository,
                      FileStorageService fileStorageService,
                      DependencyCheckService dependencyCheckService,
                      AssignmentRepository assignmentRepository,
                      TripRepository tripRepository,
                      NotificationService notificationService,
                      TransportRequestRepository transportRequestRepository,
                      UserRepository userRepository,
                      BusLocationRepository busLocationRepository,
                      NotificationRepository notificationRepository) {
        this.busRepository = busRepository;
        this.fileStorageService = fileStorageService;
        this.dependencyCheckService = dependencyCheckService;
        this.assignmentRepository = assignmentRepository;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
        this.transportRequestRepository = transportRequestRepository;
        this.userRepository = userRepository;
        this.busLocationRepository = busLocationRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Map<String, Object> createBus(String busName,
                                         String busNumber,
                                         String busRegistrationNumber,
                                         String busType,
                                         Integer busCapacity,
                                         String busStatus,
                                         MultipartFile busPhoto) {
        if (busNumber == null || busNumber.trim().isEmpty() ||
            busRegistrationNumber == null || busRegistrationNumber.trim().isEmpty()) {
            throw new BadRequestException("Bus Number and Registration Number are required.");
        }

        if (busRepository.existsByBusNumber(busNumber.trim())) {
            throw new BadRequestException("Bus Number already exists");
        }
        if (busRepository.existsByBusRegistrationNumber(busRegistrationNumber.trim())) {
            throw new BadRequestException("Bus Registration Number already exists");
        }

        Bus bus = new Bus();
        bus.setBusName(busName != null ? busName.trim() : "");
        bus.setBusNumber(busNumber.trim());
        bus.setBusRegistrationNumber(busRegistrationNumber.trim());
        bus.setBusType(BusType.fromValue(busType));
        bus.setBusCapacity(busCapacity != null ? busCapacity : 40);
        bus.setBusStatus(BusStatus.fromValue(busStatus));

        if (busPhoto != null && !busPhoto.isEmpty()) {
            bus.setBusPhoto(fileStorageService.storeFile(busPhoto, "bus"));
        }

        Bus savedBus = busRepository.save(bus);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "true");
        response.put("message", "Bus created successfully");
        response.put("data", savedBus);
        return response;
    }

    public Map<String, Object> getAllBuses(Integer page, Integer limit, String search, String status, boolean hasParams) {
        BusStatus busStatusEnum = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            busStatusEnum = BusStatus.fromValue(status.trim());
        }

        long overallTotal = busRepository.count();
        long activeTotal = busRepository.countByBusStatus(BusStatus.ACTIVE);
        long inactiveTotal = busRepository.countByBusStatus(BusStatus.INACTIVE);
        long maintenanceTotal = busRepository.countByBusStatus(BusStatus.MAINTENANCE);

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);
        summary.put("active", activeTotal);
        summary.put("inactive", inactiveTotal);
        summary.put("maintenance", maintenanceTotal);

        List<String> statuses = Arrays.stream(BusStatus.values())
                .map(BusStatus::getValue)
                .sorted()
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("status", true);
        response.put("message", "Buses fetched successfully");
        response.put("summary", summary);

        Map<String, Object> filters = new HashMap<>();
        filters.put("statuses", statuses);
        response.put("filters", filters);

        if (!hasParams) {
            List<Bus> allBuses = busRepository.findAll(Sort.by("createdAt").descending());
            response.put("count", allBuses.size());
            response.put("data", allBuses);
            return response;
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("createdAt").descending());

        Page<Bus> busPage = busRepository.searchBuses(busStatusEnum, search != null ? search.trim() : "", pageable);

        response.put("count", busPage.getContent().size());
        response.put("data", busPage.getContent());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", busPage.getTotalElements());
        pagination.put("totalPages", Math.max(1, busPage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    @Transactional
    public Map<String, Object> updateBus(Long id,
                                         String busName,
                                         String busNumber,
                                         String busRegistrationNumber,
                                         String busType,
                                         Integer busCapacity,
                                         String busStatus,
                                         MultipartFile busPhoto) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        if (busName != null) bus.setBusName(busName.trim());
        if (busNumber != null) bus.setBusNumber(busNumber.trim());
        if (busRegistrationNumber != null) bus.setBusRegistrationNumber(busRegistrationNumber.trim());
        if (busType != null) bus.setBusType(BusType.fromValue(busType));
        if (busCapacity != null) bus.setBusCapacity(busCapacity);
        if (busStatus != null) bus.setBusStatus(BusStatus.fromValue(busStatus));

        if (busPhoto != null && !busPhoto.isEmpty()) {
            bus.setBusPhoto(fileStorageService.storeFile(busPhoto, "bus"));
        }

        Bus updated = busRepository.save(bus);

        Map<String, Object> response = new HashMap<>();
        response.put("status", true);
        response.put("message", "Bus updated successfully");
        response.put("data", updated);
        return response;
    }

    public ResourceDependencyResponse getBusDependencies(Long id) {
        return dependencyCheckService.checkBusDependencies(id);
    }

    @Transactional
    public Map<String, Object> deleteBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        ResourceDependencyResponse dep = dependencyCheckService.checkBusDependencies(id);
        if (!dep.isCanDelete()) {
            throw new ResourceInUseException(dep);
        }

        notificationRepository.deleteByRelatedBusId(id);
        busRepository.delete(bus);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus deleted successfully");
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        if (tripRepository.existsByBusIdAndStatus(id, TripStatus.ACTIVE)) {
            ResourceDependencyResponse dep = dependencyCheckService.checkBusDependencies(id);
            throw new ResourceInUseException(dep);
        }

        bus.setBusStatus(BusStatus.INACTIVE);
        Bus updated = busRepository.save(bus);

        List<Assignment> activeAssignments = assignmentRepository.findAllByBusIdAndStatus(id, ScheduleStatus.ACTIVE);
        for (Assignment a : activeAssignments) {
            a.setStatus(ScheduleStatus.INACTIVE);
            assignmentRepository.save(a);

            if (a.getDriver() != null) {
                notificationService.createNotification(
                        a.getDriver(),
                        NotificationType.BUS_DEACTIVATED,
                        "Bus Deactivated",
                        "Your assigned bus " + bus.getBusNumber() + " has been deactivated by the administrator.",
                        null,
                        bus
                );
            }

            List<Long> studentIds = transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(a.getId(), RequestStatus.APPROVED);
            for (Long sId : studentIds) {
                userRepository.findById(sId).ifPresent(studentUser -> {
                    notificationService.createNotification(
                            studentUser,
                            NotificationType.BUS_DEACTIVATED,
                            "Bus Deactivated",
                            "Your assigned bus " + bus.getBusNumber() + " has been deactivated. Please contact the transport administrator for reassignment.",
                            null,
                            bus
                    );
                });
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Bus deactivated successfully");
        response.put("data", updated);
        return response;
    }

    @Transactional
    public Map<String, Object> reactivateBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found"));

        bus.setBusStatus(BusStatus.ACTIVE);
        Bus updated = busRepository.save(bus);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Bus reactivated successfully");
        response.put("data", updated);
        return response;
    }
}

