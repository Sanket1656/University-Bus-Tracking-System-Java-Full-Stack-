package com.university.bustracking.service;

import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.exception.ResourceInUseException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.BusStopRepository;
import com.university.bustracking.repository.RouteStopRepository;
import com.university.bustracking.repository.TransportRequestRepository;
import com.university.bustracking.repository.TripRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BusStopService {

    private final BusStopRepository busStopRepository;
    private final RouteStopRepository routeStopRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final DependencyCheckService dependencyCheckService;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;

    public BusStopService(BusStopRepository busStopRepository,
                          RouteStopRepository routeStopRepository,
                          TransportRequestRepository transportRequestRepository,
                          DependencyCheckService dependencyCheckService,
                          TripRepository tripRepository,
                          NotificationService notificationService) {
        this.busStopRepository = busStopRepository;
        this.routeStopRepository = routeStopRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.dependencyCheckService = dependencyCheckService;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
    }

    public Map<String, Object> createStop(String stopName, Double latitude, Double longitude) {
        if (stopName == null || stopName.trim().isEmpty() || latitude == null || longitude == null) {
            throw new BadRequestException("stopName, latitude and longitude are required.");
        }

        BusStop stop = new BusStop(stopName.trim(), latitude, longitude);
        BusStop savedStop = busStopRepository.save(stop);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus Stop created Successfully");
        response.put("data", savedStop);
        return response;
    }

    public Map<String, Object> getAllStops(Integer page, Integer limit, String search, boolean hasParams) {
        long overallTotal = busStopRepository.count();
        long locatedTotal = busStopRepository.countByLatitudeIsNotNullAndLongitudeIsNotNull();

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);
        summary.put("located", locatedTotal);

        Map<String, Object> response = new HashMap<>();
        response.put("status", true);
        response.put("message", "Bus Stop fetched successfully");
        response.put("summary", summary);

        List<BusStop> stops;
        if (!hasParams) {
            stops = busStopRepository.findAll(Sort.by("createdAt").descending());
            response.put("count", stops.size());
            response.put("data", enrichStops(stops));
            return response;
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("createdAt").descending());

        Page<BusStop> stopPage = busStopRepository.searchStops(search != null ? search.trim() : "", pageable);

        response.put("count", stopPage.getContent().size());
        response.put("data", enrichStops(stopPage.getContent()));

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", stopPage.getTotalElements());
        pagination.put("totalPages", Math.max(1, stopPage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    @Transactional
    public Map<String, Object> updateStop(Long id, String stopName, Double latitude, Double longitude) {
        BusStop stop = busStopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop Not Found"));

        if (stopName != null) stop.setStopName(stopName.trim());
        if (latitude != null) stop.setLatitude(latitude);
        if (longitude != null) stop.setLongitude(longitude);

        BusStop updated = busStopRepository.save(stop);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Stop Updated successfully");
        response.put("data", updated);
        return response;
    }

    public ResourceDependencyResponse getStopResourceDependencies(Long id) {
        return dependencyCheckService.checkStopDependencies(id);
    }

    @Transactional
    public Map<String, Object> deleteStop(Long id) {
        BusStop stop = busStopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found"));

        ResourceDependencyResponse dep = dependencyCheckService.checkStopDependencies(id);
        if (!dep.isCanDelete()) {
            throw new ResourceInUseException(dep);
        }

        busStopRepository.delete(stop);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Stop deleted successfully");
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateStop(Long id) {
        BusStop stop = busStopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found"));

        List<RouteStop> routeStops = routeStopRepository.findByStopId(id);
        for (RouteStop rs : routeStops) {
            if (tripRepository.existsByRouteIdAndStatus(rs.getRoute().getId(), TripStatus.ACTIVE)) {
                ResourceDependencyResponse dep = dependencyCheckService.checkStopDependencies(id);
                throw new ResourceInUseException(dep);
            }
        }

        stop.setStatus(ScheduleStatus.INACTIVE);
        BusStop updated = busStopRepository.save(stop);

        List<TransportRequest> requests = transportRequestRepository.findAllByPreferredStopId(id);
        for (TransportRequest req : requests) {
            if (req.getStudent() != null) {
                notificationService.createNotification(
                        req.getStudent(),
                        NotificationType.STOP_DEACTIVATED,
                        "Bus Stop Deactivated",
                        "Your preferred pickup stop '" + stop.getStopName() + "' has been deactivated. Please update your preferred stop in your profile.",
                        null,
                        null
                );
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Stop deactivated successfully");
        response.put("data", updated);
        return response;
    }

    @Transactional
    public Map<String, Object> reactivateStop(Long id) {
        BusStop stop = busStopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found"));

        stop.setStatus(ScheduleStatus.ACTIVE);
        BusStop updated = busStopRepository.save(stop);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Stop reactivated successfully");
        response.put("data", updated);
        return response;
    }

    public Map<String, Object> getStopDependencies(Long stopId) {
        List<RouteStop> routeStops = routeStopRepository.findByStopId(stopId);
        List<Map<String, Object>> routeList = routeStops.stream().map(rs -> {
            BusRoute route = rs.getRoute();
            Map<String, Object> rMap = new HashMap<>();
            rMap.put("id", route.getId());
            rMap.put("_id", String.valueOf(route.getId()));
            rMap.put("routeName", route.getRouteName());
            rMap.put("routeCode", route.getRouteCode());
            return rMap;
        }).collect(Collectors.toList());

        long studentsUsingStop = transportRequestRepository.countByPreferredStopId(stopId);

        Map<String, Object> result = new HashMap<>();
        result.put("routes", routeList);
        result.put("studentsUsingStop", studentsUsingStop);
        return result;
    }

    private List<Map<String, Object>> enrichStops(List<BusStop> stops) {
        return stops.stream().map(stop -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", stop.getId());
            map.put("_id", String.valueOf(stop.getId()));
            map.put("stopName", stop.getStopName());
            map.put("name", stop.getStopName());
            map.put("latitude", stop.getLatitude());
            map.put("longitude", stop.getLongitude());
            map.put("longtitude", stop.getLongitude());
            map.put("createdAt", stop.getCreatedAt());
            map.put("updatedAt", stop.getUpdatedAt());

            Map<String, Object> dependencies = getStopDependencies(stop.getId());
            List<?> routes = (List<?>) dependencies.get("routes");
            long studentsUsingStop = (Long) dependencies.get("studentsUsingStop");
            boolean canDelete = routes.isEmpty() && studentsUsingStop == 0;

            map.put("dependencies", dependencies);
            map.put("canDelete", canDelete);
            return map;
        }).collect(Collectors.toList());
    }
}
