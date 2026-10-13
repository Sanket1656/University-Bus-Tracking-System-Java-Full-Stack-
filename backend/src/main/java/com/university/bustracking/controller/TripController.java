package com.university.bustracking.controller;

import com.university.bustracking.entity.User;
import com.university.bustracking.service.TripService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startTrip(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        Long scheduleId = parseId(payload.get("scheduleId"));
        return ResponseEntity.ok(tripService.startTrip(user, scheduleId));
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentTrip(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.getCurrentTrip(user));
    }

    @PostMapping("/end")
    public ResponseEntity<Map<String, Object>> endTrip(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.endTrip(user));
    }

    @PostMapping("/prepare-return")
    public ResponseEntity<Map<String, Object>> prepareReturn(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        Long scheduleId = parseId(payload.get("scheduleId"));
        return ResponseEntity.ok(tripService.prepareReturn(user, scheduleId));
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getTripHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) Long bus,
            @RequestParam(required = false) Long driver,
            @RequestParam(required = false) Long route,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(tripService.getTripHistory(user, status, direction, bus, driver, route, date, page, limit));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<Map<String, Object>> getTripDetails(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripService.getTripDetails(tripId));
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
}
