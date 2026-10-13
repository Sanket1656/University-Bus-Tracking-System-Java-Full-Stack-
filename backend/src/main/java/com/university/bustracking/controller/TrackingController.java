package com.university.bustracking.controller;

import com.university.bustracking.entity.BusLocation;
import com.university.bustracking.entity.User;
import com.university.bustracking.service.TrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping("/update-location")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        Long busId = parseId(payload.get("busId"));
        Double latitude = parseDouble(payload.get("latitude"));
        Double longitude = parseDouble(payload.get("longitude"));
        Double speed = parseDouble(payload.get("speed"));
        Double heading = parseDouble(payload.get("heading"));
        Boolean isMoving = (Boolean) payload.get("isMoving");
        Integer currentStopIndex = payload.get("currentStopIndex") != null ? Integer.parseInt(payload.get("currentStopIndex").toString()) : null;
        Long currentStopId = parseId(payload.get("currentStopId"));
        Long nextStopId = parseId(payload.get("nextStopId"));
        Double routeProgress = parseDouble(payload.get("routeProgress"));
        Boolean routeCompleted = (Boolean) payload.get("routeCompleted");

        return ResponseEntity.ok(trackingService.updateLocation(user, busId, latitude, longitude, speed, heading, isMoving, currentStopIndex, currentStopId, nextStopId, routeProgress, routeCompleted));
    }

    @PostMapping("/demo/update-location")
    public ResponseEntity<Map<String, Object>> demoUpdateLocation(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        Long busId = parseId(payload.get("busId"));
        Double latitude = parseDouble(payload.get("latitude"));
        Double longitude = parseDouble(payload.get("longitude"));
        Double speed = parseDouble(payload.get("speed"));
        Double heading = parseDouble(payload.get("heading"));
        Boolean isMoving = (Boolean) payload.get("isMoving");
        Integer currentStopIndex = payload.get("currentStopIndex") != null ? Integer.parseInt(payload.get("currentStopIndex").toString()) : null;
        Long currentStopId = parseId(payload.get("currentStopId"));
        Long nextStopId = parseId(payload.get("nextStopId"));
        Double routeProgress = parseDouble(payload.get("routeProgress"));
        Boolean routeCompleted = (Boolean) payload.get("routeCompleted");

        return ResponseEntity.ok(trackingService.demoUpdateLocation(user, busId, latitude, longitude, speed, heading, isMoving, currentStopIndex, currentStopId, nextStopId, routeProgress, routeCompleted));
    }

    @GetMapping("/bus/{busId}/location")
    public ResponseEntity<Map<String, Object>> getBusLocation(@PathVariable Long busId) {
        return ResponseEntity.ok(trackingService.getBusLocation(busId));
    }

    @GetMapping("/bus/{busId}/status")
    public ResponseEntity<Map<String, Object>> getBusStatus(@PathVariable Long busId) {
        return ResponseEntity.ok(trackingService.getBusStatus(busId));
    }

    @GetMapping("/active-locations")
    public ResponseEntity<Map<String, Object>> getActiveLocations() {
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Active locations fetched successfully");
        response.put("data", trackingService.getActiveLocations());
        return ResponseEntity.ok(response);
    }

    private Long parseId(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Map) {
            Object id = ((Map<?, ?>) obj).get("_id");
            if (id == null) id = ((Map<?, ?>) obj).get("id");
            return id != null ? Long.parseLong(id.toString()) : null;
        }
        return Long.parseLong(obj.toString());
    }

    private Double parseDouble(Object obj) {
        if (obj == null) return null;
        return Double.parseDouble(obj.toString());
    }
}
