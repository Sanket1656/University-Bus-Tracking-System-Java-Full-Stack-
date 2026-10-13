package com.university.bustracking.controller;

import com.university.bustracking.entity.StudentProfile;
import com.university.bustracking.entity.User;
import com.university.bustracking.service.StudentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studentService.getProfile(user));
    }

    @PostMapping(value = "/profile", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<StudentProfile> createProfile(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String enrollmentNumber,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String landmark,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return ResponseEntity.ok(studentService.createProfile(user, name, branch, enrollmentNumber, email, phone, address, area, landmark, photo));
    }

    @PutMapping(value = "/profile", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<StudentProfile> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String enrollmentNumber,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String landmark,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return ResponseEntity.ok(studentService.updateProfile(user, name, branch, enrollmentNumber, email, phone, address, area, landmark, photo));
    }

    @GetMapping("/my-schedules")
    public ResponseEntity<Map<String, Object>> getMySchedules(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studentService.getMySchedules(user));
    }
}
