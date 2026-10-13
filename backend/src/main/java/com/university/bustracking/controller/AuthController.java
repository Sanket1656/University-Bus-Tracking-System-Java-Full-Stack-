package com.university.bustracking.controller;

import com.university.bustracking.dto.LoginRequest;
import com.university.bustracking.dto.LoginResponse;
import com.university.bustracking.dto.RegisterRequest;
import com.university.bustracking.dto.UserSummaryDto;
import com.university.bustracking.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/get-all-users")
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/get-all-drivers")
    public ResponseEntity<Object> getAllDrivers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(authService.getAllDrivers(page, limit, search, status, hasParams));
    }

    @GetMapping("/get-all-students")
    public ResponseEntity<Object> getAllStudents(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String branch,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(authService.getAllStudents(page, limit, search, branch, hasParams));
    }

    @DeleteMapping("/delete-user/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(authService.deleteUser(id));
    }

    @GetMapping("/users/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getUserDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserDependencies(id));
    }

    @GetMapping("/drivers/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getDriverDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserDependencies(id));
    }

    @GetMapping("/students/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getStudentDependencies(@PathVariable Long id) {
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

    @PostMapping("/students/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateStudent(@PathVariable Long id) {
        return ResponseEntity.ok(authService.deactivateStudent(id));
    }

    @PostMapping("/students/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateStudent(@PathVariable Long id) {
        return ResponseEntity.ok(authService.reactivateStudent(id));
    }
}
