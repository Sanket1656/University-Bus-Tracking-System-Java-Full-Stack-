package com.university.bustracking.controller;

import com.university.bustracking.entity.Notification;
import com.university.bustracking.entity.User;
import com.university.bustracking.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "50") int limit) {
        List<Notification> list = notificationService.getNotifications(user, limit);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notifications fetched successfully");
        response.put("count", list.size());
        response.put("data", list);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.markAllAsRead(user));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.markAsRead(id, user));
    }
}
