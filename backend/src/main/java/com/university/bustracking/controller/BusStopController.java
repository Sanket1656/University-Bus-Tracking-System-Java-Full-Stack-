package com.university.bustracking.controller;

import com.university.bustracking.service.BusStopService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stop")
public class BusStopController {

    private final BusStopService busStopService;

    public BusStopController(BusStopService busStopService) {
        this.busStopService = busStopService;
    }

    @PostMapping("/stop-create")
    public ResponseEntity<Map<String, Object>> createStop(@RequestBody Map<String, Object> payload) {
        String stopName = (String) payload.get("stopName");
        Double latitude = payload.get("latitude") != null ? Double.parseDouble(payload.get("latitude").toString()) : null;
        Object lonObj = payload.get("longitude") != null ? payload.get("longitude") : payload.get("longtitude");
        Double longitude = lonObj != null ? Double.parseDouble(lonObj.toString()) : null;

        return ResponseEntity.ok(busStopService.createStop(stopName, latitude, longitude));
    }

    @GetMapping("/get-all-stops")
    public ResponseEntity<Map<String, Object>> getAllStops(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(busStopService.getAllStops(page, limit, search, hasParams));
    }

    @PutMapping("/update-stop/{id}")
    public ResponseEntity<Map<String, Object>> updateStop(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String stopName = (String) payload.get("stopName");
        Double latitude = payload.get("latitude") != null ? Double.parseDouble(payload.get("latitude").toString()) : null;
        Object lonObj = payload.get("longitude") != null ? payload.get("longitude") : payload.get("longtitude");
        Double longitude = lonObj != null ? Double.parseDouble(lonObj.toString()) : null;

        return ResponseEntity.ok(busStopService.updateStop(id, stopName, latitude, longitude));
    }

    @DeleteMapping("/delete-stop/{id}")
    public ResponseEntity<Map<String, Object>> deleteStop(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.deleteStop(id));
    }

    @GetMapping("/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getStopDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.getStopResourceDependencies(id));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateStop(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.deactivateStop(id));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateStop(@PathVariable Long id) {
        return ResponseEntity.ok(busStopService.reactivateStop(id));
    }
}
