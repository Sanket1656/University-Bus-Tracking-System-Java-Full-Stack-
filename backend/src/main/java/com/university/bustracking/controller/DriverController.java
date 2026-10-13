package com.university.bustracking.controller;

import com.university.bustracking.entity.DriverProfile;
import com.university.bustracking.entity.User;
import com.university.bustracking.service.DriverService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(driverService.getProfile(user));
    }

    @PostMapping(value = "/profile", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<DriverProfile> createProfile(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String licenseId,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String landmark,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "licensePhoto", required = false) MultipartFile licensePhoto) {
        return ResponseEntity.ok(driverService.createProfile(user, name, email, phone, age, licenseId, address, area, landmark, photo, licensePhoto));
    }

    @PutMapping(value = "/profile", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String licenseId,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String landmark,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "licensePhoto", required = false) MultipartFile licensePhoto) {
        return ResponseEntity.ok(driverService.updateProfile(user, name, email, phone, age, licenseId, address, area, landmark, photo, licensePhoto));
    }

    @GetMapping("/my-assignment")
    public ResponseEntity<Map<String, Object>> getMyAssignment(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(driverService.getMyAssignment(user));
    }

    @GetMapping("/today-schedule")
    public ResponseEntity<Map<String, Object>> getTodaySchedule(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(driverService.getTodaySchedule(user));
    }

    @GetMapping("/my-schedules")
    public ResponseEntity<Map<String, Object>> getMySchedules(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(driverService.getMySchedules(user));
    }

    @GetMapping("/my-students")
    public ResponseEntity<Map<String, Object>> getMyStudents(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(driverService.getMyStudents(user));
    }
}
