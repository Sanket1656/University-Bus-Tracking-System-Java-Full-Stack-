package com.university.bustracking.controller;

import com.university.bustracking.service.BusService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/bus")
public class BusController {

    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @PostMapping(value = "/bus-create", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Map<String, Object>> createBus(
            @RequestParam(required = false) String busName,
            @RequestParam(required = false) String busNumber,
            @RequestParam(required = false) String busRegistrationNumber,
            @RequestParam(required = false) String busType,
            @RequestParam(required = false) Integer busCapacity,
            @RequestParam(required = false) String busStatus,
            @RequestPart(value = "busPhoto", required = false) MultipartFile busPhoto) {
        return ResponseEntity.status(201).body(busService.createBus(busName, busNumber, busRegistrationNumber, busType, busCapacity, busStatus, busPhoto));
    }

    @GetMapping("/get-all-buses")
    public ResponseEntity<Map<String, Object>> getAllBuses(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(busService.getAllBuses(page, limit, search, status, hasParams));
    }

    @PutMapping(value = "/update-bus/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Map<String, Object>> updateBus(
            @PathVariable Long id,
            @RequestParam(required = false) String busName,
            @RequestParam(required = false) String busNumber,
            @RequestParam(required = false) String busRegistrationNumber,
            @RequestParam(required = false) String busType,
            @RequestParam(required = false) Integer busCapacity,
            @RequestParam(required = false) String busStatus,
            @RequestPart(value = "busPhoto", required = false) MultipartFile busPhoto) {
        return ResponseEntity.ok(busService.updateBus(id, busName, busNumber, busRegistrationNumber, busType, busCapacity, busStatus, busPhoto));
    }

    @DeleteMapping("/delete-bus/{id}")
    public ResponseEntity<Map<String, Object>> deleteBus(@PathVariable Long id) {
        return ResponseEntity.ok(busService.deleteBus(id));
    }

    @GetMapping("/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getBusDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(busService.getBusDependencies(id));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateBus(@PathVariable Long id) {
        return ResponseEntity.ok(busService.deactivateBus(id));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateBus(@PathVariable Long id) {
        return ResponseEntity.ok(busService.reactivateBus(id));
    }
}
