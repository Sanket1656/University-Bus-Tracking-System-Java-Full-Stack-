package com.university.bustracking.service;

import com.university.bustracking.entity.Bus;
import com.university.bustracking.entity.Notification;
import com.university.bustracking.entity.NotificationType;
import com.university.bustracking.entity.Trip;
import com.university.bustracking.entity.User;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> getNotifications(User user, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(0, safeLimit);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable);
    }

    @Transactional
    public Map<String, Object> markAllAsRead(User user) {
        int count = notificationRepository.markAllAsRead(user.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notifications marked as read");
        response.put("modifiedCount", count);
        return response;
    }

    @Transactional
    public Map<String, Object> markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findByIdAndRecipientId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Notification marked as read");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public void createNotification(User recipient, NotificationType type, String title, String message, Trip trip, Bus bus) {
        if (recipient == null) return;

        // Prevent duplicate trip notifications for same recipient, type, and trip
        if (trip != null && notificationRepository.existsByRecipientIdAndTypeAndRelatedTripId(recipient.getId(), type, trip.getId())) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedTrip(trip);
        notification.setRelatedBus(bus);
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }
}
