package com.university.bustracking.controller;

import com.university.bustracking.service.BusScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
public class BusScheduleController {

    private final BusScheduleService busScheduleService;

    public BusScheduleController(BusScheduleService busScheduleService) {
        this.busScheduleService = busScheduleService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSchedule(@RequestBody Map<String, Object> payload) {
        Long assignmentId = parseId(payload.get("assignment"));
        String dayOfWeek = (String) payload.get("dayOfWeek");
        String startTime = (String) payload.get("startTime");
        String direction = (String) payload.get("direction");
        String status = (String) payload.get("status");

        return ResponseEntity.status(201).body(busScheduleService.createSchedule(assignmentId, dayOfWeek, startTime, direction, status));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSchedules(
            @RequestParam(required = false) String dayOfWeek,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignment,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam Map<String, String> allParams) {
        boolean shouldPaginate = allParams.containsKey("page") || allParams.containsKey("limit");
        return ResponseEntity.ok(busScheduleService.getAllSchedules(dayOfWeek, direction, status, assignment, search, page, limit, shouldPaginate));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getScheduleById(@PathVariable Long id) {
        return ResponseEntity.ok(busScheduleService.getScheduleById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSchedule(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long assignmentId = parseId(payload.get("assignment"));
        String dayOfWeek = (String) payload.get("dayOfWeek");
        String startTime = (String) payload.get("startTime");
        String direction = (String) payload.get("direction");
        String status = (String) payload.get("status");

        return ResponseEntity.ok(busScheduleService.updateSchedule(id, assignmentId, dayOfWeek, startTime, direction, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(busScheduleService.deactivateSchedule(id));
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
