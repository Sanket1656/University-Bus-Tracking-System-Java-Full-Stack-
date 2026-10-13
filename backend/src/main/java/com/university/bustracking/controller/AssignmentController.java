package com.university.bustracking.controller;

import com.university.bustracking.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assignment")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/assignment-create")
    public ResponseEntity<Map<String, Object>> createAssignment(@RequestBody Map<String, Object> payload) {
        Long busId = parseId(payload.get("bus"));
        Long driverId = parseId(payload.get("driver"));
        Long routeId = parseId(payload.get("route"));

        return ResponseEntity.status(201).body(assignmentService.createAssignment(busId, driverId, routeId));
    }

    @GetMapping("/get-all-assignments")
    public ResponseEntity<Map<String, Object>> getAllAssignments(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(assignmentService.getAllAssignments(page, limit, search, status, hasParams));
    }

    @PutMapping("/update-assignment/{id}")
    public ResponseEntity<Map<String, Object>> updateAssignment(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Long busId = parseId(payload.get("bus"));
        Long driverId = parseId(payload.get("driver"));
        Long routeId = parseId(payload.get("route"));
        String status = (String) payload.get("status");

        return ResponseEntity.ok(assignmentService.updateAssignment(id, busId, driverId, routeId, status));
    }

    @DeleteMapping("/delete-assignment/{id}")
    public ResponseEntity<Map<String, Object>> deleteAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.deleteAssignment(id));
    }

    @GetMapping("/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getAssignmentDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentDependencies(id));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.deactivateAssignment(id));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.reactivateAssignment(id));
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
