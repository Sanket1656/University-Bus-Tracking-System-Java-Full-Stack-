package com.university.bustracking.controller;

import com.university.bustracking.dto.CreateDriverRequest;
import com.university.bustracking.dto.ResourceDependencyResponse;
import com.university.bustracking.dto.UpdateDriverRequest;
import com.university.bustracking.service.*;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BusService busService;
    private final BusRouteService busRouteService;
    private final BusStopService busStopService;
    private final AssignmentService assignmentService;
    private final AuthService authService;

    public AdminController(BusService busService,
                           BusRouteService busRouteService,
                           BusStopService busStopService,
                           AssignmentService assignmentService,
                           AuthService authService) {
        this.busService = busService;
        this.busRouteService = busRouteService;
        this.busStopService = busStopService;
        this.assignmentService = assignmentService;
        this.authService = authService;
    }

    // Bus
    @GetMapping("/buses/{id}/dependencies")
    public ResponseEntity<ResourceDependencyResponse> getBusDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(busService.getBusDependencies(id));
    }

    @PostMapping("/buses/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateBus(@PathVariable Long id) {
        return ResponseEntity.ok(busService.deactivateBus(id));
    }

    @PostMapping("/buses/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateBus(@PathVariable Long id) {
        return ResponseEntity.ok(busService.reactivateBus(id));
    }

    // Route
    @GetMapping("/routes/{id}/dependencies")
    public ResponseEntity<ResourceDependencyResponse> getRouteDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.getRouteDependencies(id));
    }

    @PostMapping("/routes/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateRoute(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.deactivateRoute(id));
    }

    @PostMapping("/routes/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateRoute(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.reactivateRoute(id));
    }

    // Stop
    @GetMapping("/stops/{id}/dependencies")
    public ResponseEntity<ResourceDependencyResponse> getStopDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.getStopResourceDependencies(id));
    }

    @PostMapping("/stops/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateStop(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.deactivateStop(id));
    }

    @PostMapping("/stops/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateStop(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.reactivateStop(id));
    }

    // Assignment
    @GetMapping("/assignments/{id}/dependencies")
    public ResponseEntity<ResourceDependencyResponse> getAssignmentDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentDependencies(id));
    }

    @PostMapping("/assignments/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.deactivateAssignment(id));
    }

    @PostMapping("/assignments/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.reactivateAssignment(id));
    }

    // Driver
    @GetMapping("/drivers")
    public ResponseEntity<Object> getAllDrivers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(authService.getAllDrivers(page, limit, search, status, hasParams));
    }

    @PostMapping(value = "/drivers", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Map<String, Object>> createDriver(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String licenseId,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String landmark,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "licensePhoto", required = false) MultipartFile licensePhoto) {
        return ResponseEntity.status(201).body(authService.createDriver(
                username, password, name, email, phone, age, licenseId, address, area, landmark, photo, licensePhoto));
    }

    @PostMapping(value = "/drivers", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> createDriverJson(@Valid @RequestBody CreateDriverRequest request) {
        return ResponseEntity.status(201).body(authService.createDriver(
                request.getUsername(), request.getPassword(), request.getName(), request.getEmail(),
                request.getPhone(), request.getAge(), request.getLicenseId(), request.getAddress(),
                request.getArea(), request.getLandmark(), null, null));
    }

    @PutMapping(value = "/drivers/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Map<String, Object>> updateDriver(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String licenseId,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String landmark,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String password,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "licensePhoto", required = false) MultipartFile licensePhoto) {
        return ResponseEntity.ok(authService.updateDriverByAdmin(
                id, name, email, phone, age, licenseId, address, area, landmark, status, password, photo, licensePhoto));
    }

    @PutMapping(value = "/drivers/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> updateDriverJson(
            @PathVariable Long id,
            @RequestBody UpdateDriverRequest request) {
        return ResponseEntity.ok(authService.updateDriverByAdmin(
                id, request.getName(), request.getEmail(), request.getPhone(), request.getAge(),
                request.getLicenseId(), request.getAddress(), request.getArea(), request.getLandmark(),
                request.getStatus(), request.getPassword(), null, null));
    }

    @GetMapping("/drivers/{id}/dependencies")
    public ResponseEntity<ResourceDependencyResponse> getDriverDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserDependencies(id));
    }

    @PostMapping("/drivers/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateDriver(@PathVariable Long id) {
        return ResponseEntity.ok(authService.deactivateDriver(id));
    }

    @PostMapping("/drivers/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateDriver(@PathVariable Long id) {
        return ResponseEntity.ok(authService.reactivateDriver(id));
    }

    // Student
    @GetMapping("/students/{id}/dependencies")
    public ResponseEntity<ResourceDependencyResponse> getStudentDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserDependencies(id));
    }

    @PostMapping("/students/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateStudent(@PathVariable Long id) {
        return ResponseEntity.ok(authService.deactivateStudent(id));
    }

    @PostMapping("/students/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateStudent(@PathVariable Long id) {
        return ResponseEntity.ok(authService.reactivateStudent(id));
    }
}
