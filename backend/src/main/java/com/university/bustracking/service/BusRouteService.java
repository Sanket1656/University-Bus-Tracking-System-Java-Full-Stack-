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
public class BusRouteService {

    private final BusRouteRepository busRouteRepository;
    private final BusStopRepository busStopRepository;
    private final RouteStopRepository routeStopRepository;
    private final DependencyCheckService dependencyCheckService;
    private final AssignmentRepository assignmentRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;
    private final TransportRequestRepository transportRequestRepository;
    private final UserRepository userRepository;

    public BusRouteService(BusRouteRepository busRouteRepository,
                           BusStopRepository busStopRepository,
                           RouteStopRepository routeStopRepository,
                           DependencyCheckService dependencyCheckService,
                           AssignmentRepository assignmentRepository,
                           TripRepository tripRepository,
                           NotificationService notificationService,
                           TransportRequestRepository transportRequestRepository,
                           UserRepository userRepository) {
        this.busRouteRepository = busRouteRepository;
        this.busStopRepository = busStopRepository;
        this.routeStopRepository = routeStopRepository;
        this.dependencyCheckService = dependencyCheckService;
        this.assignmentRepository = assignmentRepository;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
        this.transportRequestRepository = transportRequestRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Object> createRoute(String routeName, String routeCode, List<Object> stopIds) {
        if (routeName == null || routeName.trim().isEmpty() ||
            routeCode == null || routeCode.trim().isEmpty() ||
            stopIds == null || stopIds.size() < 2) {
            throw new BadRequestException("Route Name, Route Code and minimum 2 stops are required.");
        }

        String normalizedCode = routeCode.trim().toUpperCase();
        if (busRouteRepository.existsByRouteCode(normalizedCode)) {
            throw new ConflictException("Route code already exists");
        }

        List<Long> parsedIds = parseStopIds(stopIds);
        if (new HashSet<>(parsedIds).size() != parsedIds.size()) {
            throw new BadRequestException("Duplicate stops are not allowed.");
        }

        List<BusStop> existingStops = busStopRepository.findAllById(parsedIds);
        if (existingStops.size() != parsedIds.size()) {
            throw new BadRequestException("One or more selected bus stops no longer exist.");
        }

        Map<Long, BusStop> stopLookup = existingStops.stream()
                .collect(Collectors.toMap(BusStop::getId, s -> s));

        BusRoute route = new BusRoute(routeName.trim(), normalizedCode);
        BusRoute savedRoute = busRouteRepository.save(route);

        List<RouteStop> routeStops = new ArrayList<>();
        for (int i = 0; i < parsedIds.size(); i++) {
            Long sId = parsedIds.get(i);
            RouteStop rs = new RouteStop(savedRoute, stopLookup.get(sId), i + 1);
            routeStops.add(rs);
        }
        routeStopRepository.saveAll(routeStops);
        savedRoute.setRouteStops(routeStops);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Route created successfully");
        response.put("route", savedRoute);
        return response;
    }

    public Map<String, Object> getAllRoutes(Integer page, Integer limit, String search, boolean hasParams) {
        long overallTotal = busRouteRepository.count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Routes Fetched successfully");
        response.put("summary", summary);

        if (!hasParams) {
            List<BusRoute> routes = busRouteRepository.findAll(Sort.by("createdAt").descending());
            response.put("count", routes.size());
            response.put("data", routes);
            return response;
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("createdAt").descending());

        Page<BusRoute> routePage = busRouteRepository.searchRoutes(search != null ? search.trim() : "", pageable);

        response.put("count", routePage.getContent().size());
        response.put("data", routePage.getContent());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", routePage.getTotalElements());
        pagination.put("totalPages", Math.max(1, routePage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    @Transactional
    public Map<String, Object> updateRoute(Long id, String routeName, String routeCode, List<Object> stopIds) {
        BusRoute route = busRouteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route Not Found"));

        if (routeName == null || routeName.trim().isEmpty() ||
            routeCode == null || routeCode.trim().isEmpty() ||
            stopIds == null || stopIds.size() < 2) {
            throw new BadRequestException("Route Name, Route Code and minimum 2 stops are required.");
        }

        String normalizedCode = routeCode.trim().toUpperCase();
        Optional<BusRoute> existingWithCode = busRouteRepository.findByRouteCode(normalizedCode);
        if (existingWithCode.isPresent() && !existingWithCode.get().getId().equals(id)) {
            throw new ConflictException("Route Code Already Exist");
        }

        List<Long> parsedIds = parseStopIds(stopIds);
        if (new HashSet<>(parsedIds).size() != parsedIds.size()) {
            throw new BadRequestException("Duplicate stops are not allowed.");
        }

        List<BusStop> existingStops = busStopRepository.findAllById(parsedIds);
        if (existingStops.size() != parsedIds.size()) {
            throw new BadRequestException("One or more selected bus stops no longer exist.");
        }

        Map<Long, BusStop> stopLookup = existingStops.stream()
                .collect(Collectors.toMap(BusStop::getId, s -> s));

        route.setRouteName(routeName.trim());
        route.setRouteCode(normalizedCode);

        route.getRouteStops().clear();
        busRouteRepository.saveAndFlush(route);

        for (int i = 0; i < parsedIds.size(); i++) {
            Long sId = parsedIds.get(i);
            RouteStop rs = new RouteStop(route, stopLookup.get(sId), i + 1);
            route.getRouteStops().add(rs);
        }

        BusRoute updated = busRouteRepository.save(route);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Route Updated successfully");
        response.put("data", updated);
        return response;
    }

    public ResourceDependencyResponse getRouteDependencies(Long id) {
        return dependencyCheckService.checkRouteDependencies(id);
    }

    @Transactional
    public Map<String, Object> deleteRoute(Long id) {
        BusRoute route = busRouteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found"));

        ResourceDependencyResponse dep = dependencyCheckService.checkRouteDependencies(id);
        if (!dep.isCanDelete()) {
            throw new ResourceInUseException(dep);
        }

        busRouteRepository.delete(route);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Route deleted successfully");
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateRoute(Long id) {
        BusRoute route = busRouteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found"));

        if (tripRepository.existsByRouteIdAndStatus(id, TripStatus.ACTIVE)) {
            ResourceDependencyResponse dep = dependencyCheckService.checkRouteDependencies(id);
            throw new ResourceInUseException(dep);
        }

        route.setStatus(ScheduleStatus.INACTIVE);
        BusRoute updated = busRouteRepository.save(route);

        List<Assignment> activeAssignments = assignmentRepository.findAllByRouteIdAndStatus(id, ScheduleStatus.ACTIVE);
        for (Assignment a : activeAssignments) {
            a.setStatus(ScheduleStatus.INACTIVE);
            assignmentRepository.save(a);

            if (a.getDriver() != null) {
                notificationService.createNotification(
                        a.getDriver(),
                        NotificationType.ROUTE_DEACTIVATED,
                        "Assigned Route Deactivated",
                        "Your assigned route " + route.getRouteName() + " (" + route.getRouteCode() + ") has been deactivated by administrator.",
                        null,
                        a.getBus()
                );
            }

            List<Long> studentIds = transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(a.getId(), RequestStatus.APPROVED);
            for (Long sId : studentIds) {
                userRepository.findById(sId).ifPresent(studentUser -> {
                    notificationService.createNotification(
                            studentUser,
                            NotificationType.ROUTE_DEACTIVATED,
                            "Bus Route Deactivated",
                            "The route " + route.getRouteName() + " (" + route.getRouteCode() + ") has been deactivated. Please contact the transport administrator for reassignment.",
                            null,
                            a.getBus()
                    );
                });
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Route deactivated successfully");
        response.put("data", updated);
        return response;
    }

    @Transactional
    public Map<String, Object> reactivateRoute(Long id) {
        BusRoute route = busRouteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found"));

        route.setStatus(ScheduleStatus.ACTIVE);
        BusRoute updated = busRouteRepository.save(route);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Route reactivated successfully");
        response.put("data", updated);
        return response;
    }

    private List<Long> parseStopIds(List<Object> rawStops) {
        List<Long> result = new ArrayList<>();
        for (Object item : rawStops) {
            if (item instanceof Map) {
                Object stopField = ((Map<?, ?>) item).get("stop");
                if (stopField instanceof Map) {
                    Object sId = ((Map<?, ?>) stopField).get("_id");
                    if (sId == null) sId = ((Map<?, ?>) stopField).get("id");
                    result.add(Long.parseLong(sId.toString()));
                } else if (stopField != null) {
                    result.add(Long.parseLong(stopField.toString()));
                }
            } else if (item != null) {
                result.add(Long.parseLong(item.toString()));
            }
        }
        return result;
    }
}
