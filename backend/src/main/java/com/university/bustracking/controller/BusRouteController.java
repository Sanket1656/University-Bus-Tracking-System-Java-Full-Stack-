package com.university.bustracking.controller;

import com.university.bustracking.service.BusRouteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class BusRouteController {

    private final BusRouteService busRouteService;

    public BusRouteController(BusRouteService busRouteService) {
        this.busRouteService = busRouteService;
    }

    @PostMapping("/route-create")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> createRoute(@RequestBody Map<String, Object> payload) {
        String routeName = (String) payload.get("routeName");
        String routeCode = (String) payload.get("routeCode");
        List<Object> stops = (List<Object>) payload.get("stops");

        return ResponseEntity.status(201).body(busRouteService.createRoute(routeName, routeCode, stops));
    }

    @GetMapping("/get-all-routes")
    public ResponseEntity<Map<String, Object>> getAllRoutes(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search,
            @RequestParam Map<String, String> allParams) {
        boolean hasParams = !allParams.isEmpty();
        return ResponseEntity.ok(busRouteService.getAllRoutes(page, limit, search, hasParams));
    }

    @PutMapping("/update-route/{id}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> updateRoute(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String routeName = (String) payload.get("routeName");
        String routeCode = (String) payload.get("routeCode");
        List<Object> stops = (List<Object>) payload.get("stops");

        return ResponseEntity.ok(busRouteService.updateRoute(id, routeName, routeCode, stops));
    }

    @DeleteMapping("/delete-route/{id}")
    public ResponseEntity<Map<String, Object>> deleteRoute(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.deleteRoute(id));
    }

    @GetMapping("/{id}/dependencies")
    public ResponseEntity<com.university.bustracking.dto.ResourceDependencyResponse> getRouteDependencies(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.getRouteDependencies(id));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateRoute(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.deactivateRoute(id));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateRoute(@PathVariable Long id) {
        return ResponseEntity.ok(busRouteService.reactivateRoute(id));
    }
}
