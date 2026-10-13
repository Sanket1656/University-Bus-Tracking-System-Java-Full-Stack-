package com.university.bustracking.controller;

import com.university.bustracking.entity.TransportRequest;
import com.university.bustracking.entity.User;
import com.university.bustracking.service.TransportRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transport")
public class TransportRequestController {

    private final TransportRequestService transportRequestService;

    public TransportRequestController(TransportRequestService transportRequestService) {
        this.transportRequestService = transportRequestService;
    }

    @PostMapping("/transport-request")
    public ResponseEntity<Map<String, Object>> createTransportRequest(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        Long preferredStopId = parseId(payload.get("preferredStop"));
        return ResponseEntity.ok(transportRequestService.createTransportRequest(user, preferredStopId));
    }

    @GetMapping("/my-transport-request")
    public ResponseEntity<Map<String, Object>> getMyTransportRequest(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transportRequestService.getMyTransportRequest(user));
    }

    @PutMapping("/transport-request/my-cancel-request")
    public ResponseEntity<Map<String, Object>> cancelMyTransportRequest(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) Map<String, Object> payload) {
        String reason = payload != null ? (String) payload.get("reason") : null;
        return ResponseEntity.ok(transportRequestService.cancelMyTransportRequest(user, reason));
    }

    @PutMapping("/transport-request/update-preferred-stop")
    public ResponseEntity<Map<String, Object>> updatePreferredStop(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> payload) {
        Long preferredStopId = parseId(payload.get("preferredStop"));
        return ResponseEntity.ok(transportRequestService.updatePreferredStop(user, preferredStopId));
    }

    @GetMapping("/my-bus/seat-map")
    public ResponseEntity<Map<String, Object>> getBusSeatMap(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transportRequestService.getBusSeatMap(user));
    }

    @GetMapping("/pending-transport-requests")
    public ResponseEntity<List<TransportRequest>> getPendingRequests() {
        return ResponseEntity.ok(transportRequestService.getPendingRequests());
    }

    @GetMapping("/approved-transport-requests")
    public ResponseEntity<List<TransportRequest>> getApprovedRequests() {
        return ResponseEntity.ok(transportRequestService.getApprovedRequests());
    }

    @GetMapping("/pending-cancellation-requests")
    public ResponseEntity<List<TransportRequest>> getPendingCancellationRequests() {
        return ResponseEntity.ok(transportRequestService.getPendingCancellationRequests());
    }

    @PutMapping("/transport-request/{id}/approve-cancellation")
    public ResponseEntity<Map<String, Object>> approveCancellation(@PathVariable Long id) {
        return ResponseEntity.ok(transportRequestService.approveCancellation(id));
    }

    @PutMapping("/transport-request/{id}/reject-cancellation")
    public ResponseEntity<Map<String, Object>> rejectCancellation(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload) {
        String remarks = payload != null ? (String) payload.get("remarks") : null;
        return ResponseEntity.ok(transportRequestService.rejectCancellation(id, remarks));
    }

    @GetMapping("/assignment/{assignmentId}/pending-students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TransportRequest>> getPendingStudentsForAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(transportRequestService.getPendingStudentsForAssignment(assignmentId));
    }

    @PutMapping("/assignment/{assignmentId}/assign-students")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> assignStudents(
            @PathVariable Long assignmentId,
            @RequestBody Map<String, Object> payload) {
        List<Map<String, Object>> students = (List<Map<String, Object>>) payload.get("students");
        return ResponseEntity.ok(transportRequestService.assignStudents(assignmentId, students));
    }

    @GetMapping("/assignment/{assignmentId}/students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TransportRequest>> getAssignmentStudents(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(transportRequestService.getAssignmentStudents(assignmentId));
    }

    @PutMapping("/transport-request/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload) {
        String remarks = payload != null ? (String) payload.get("remarks") : null;
        return ResponseEntity.ok(transportRequestService.rejectRequest(id, remarks));
    }

    @PutMapping("/transport-request/{id}/change-assignment")
    public ResponseEntity<Map<String, Object>> changeAssignment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        Long assignmentId = parseId(payload.get("assignmentId"));
        return ResponseEntity.ok(transportRequestService.changeAssignment(id, assignmentId));
    }

    @PutMapping("/transport-request/{id}/change-seat")
    public ResponseEntity<Map<String, Object>> changeSeat(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        Integer seatNumber = payload.get("seatNumber") != null ? Integer.parseInt(payload.get("seatNumber").toString()) : null;
        return ResponseEntity.ok(transportRequestService.changeSeat(id, seatNumber));
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
