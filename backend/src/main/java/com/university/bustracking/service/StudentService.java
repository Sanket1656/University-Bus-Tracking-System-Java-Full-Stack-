package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final StudentProfileRepository studentProfileRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final BusScheduleRepository busScheduleRepository;
    private final TripRepository tripRepository;
    private final BusLocationRepository busLocationRepository;
    private final FileStorageService fileStorageService;

    public StudentService(StudentProfileRepository studentProfileRepository,
                          TransportRequestRepository transportRequestRepository,
                          BusScheduleRepository busScheduleRepository,
                          TripRepository tripRepository,
                          BusLocationRepository busLocationRepository,
                          FileStorageService fileStorageService) {
        this.studentProfileRepository = studentProfileRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.busScheduleRepository = busScheduleRepository;
        this.tripRepository = tripRepository;
        this.busLocationRepository = busLocationRepository;
        this.fileStorageService = fileStorageService;
    }

    public Map<String, Object> getProfile(User user) {
        Map<String, Object> result = new HashMap<>();
        Optional<StudentProfile> profileOpt = studentProfileRepository.findByUserId(user.getId());
        if (profileOpt.isEmpty()) {
            result.put("exists", false);
            return result;
        }

        result.put("exists", true);
        result.put("data", profileOpt.get());
        return result;
    }

    @Transactional
    public StudentProfile createProfile(User user,
                                        String name,
                                        String branch,
                                        String enrollmentNumber,
                                        String email,
                                        String phone,
                                        String address,
                                        String area,
                                        String landmark,
                                        MultipartFile photo) {
        Optional<StudentProfile> existing = studentProfileRepository.findByUserId(user.getId());
        if (existing.isPresent()) {
            return updateProfile(user, name, branch, enrollmentNumber, email, phone, address, area, landmark, photo);
        }

        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setName(name);
        profile.setBranch(branch);
        profile.setEnrollmentNumber(enrollmentNumber);
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setAddress(address);
        profile.setArea(area);
        profile.setLandmark(landmark);

        if (photo != null && !photo.isEmpty()) {
            validateImageFile(photo);
            profile.setPhoto(fileStorageService.storeFile(photo, "student/profile"));
        }

        return studentProfileRepository.save(profile);
    }

    @Transactional
    public StudentProfile updateProfile(User user,
                                        String name,
                                        String branch,
                                        String enrollmentNumber,
                                        String email,
                                        String phone,
                                        String address,
                                        String area,
                                        String landmark,
                                        MultipartFile photo) {
        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElse(null);

        if (profile == null) {
            return createProfile(user, name, branch, enrollmentNumber, email, phone, address, area, landmark, photo);
        }

        if (name != null) profile.setName(name);
        if (branch != null) profile.setBranch(branch);
        if (enrollmentNumber != null) profile.setEnrollmentNumber(enrollmentNumber);
        if (email != null) profile.setEmail(email);
        if (phone != null) profile.setPhone(phone);
        if (address != null) profile.setAddress(address);
        if (area != null) profile.setArea(area);
        if (landmark != null) profile.setLandmark(landmark);

        if (photo != null && !photo.isEmpty()) {
            validateImageFile(photo);
            profile.setPhoto(fileStorageService.storeFile(photo, "student/profile"));
        }

        return studentProfileRepository.save(profile);
    }

    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String ct = contentType.toLowerCase();
            if (!ct.equals("image/jpeg") && !ct.equals("image/jpg") && !ct.equals("image/png") && !ct.equals("image/webp")) {
                throw new BadRequestException("Please upload a valid JPG, PNG, or WEBP image.");
            }
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            if (!ext.equals(".jpg") && !ext.equals(".jpeg") && !ext.equals(".png") && !ext.equals(".webp")) {
                throw new BadRequestException("Please upload a valid JPG, PNG, or WEBP image.");
            }
        }
    }

    public Map<String, Object> getMySchedules(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        Optional<TransportRequest> approvedRequestOpt = transportRequestRepository.findByStudentIdAndStatus(
                user.getId(), RequestStatus.APPROVED);

        if (approvedRequestOpt.isEmpty() || approvedRequestOpt.get().getAssignment() == null) {
            response.put("message", "No approved bus assignment found for this student.");
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("assignment", null);
            emptyData.put("bus", null);
            emptyData.put("driver", null);
            emptyData.put("route", null);
            emptyData.put("pickupStop", approvedRequestOpt.map(TransportRequest::getPreferredStop).orElse(null));
            emptyData.put("seatNumber", approvedRequestOpt.map(TransportRequest::getSeatNumber).orElse(null));
            emptyData.put("requestStatus", approvedRequestOpt.map(tr -> tr.getStatus().getValue()).orElse("Not applied"));
            emptyData.put("schedules", Collections.emptyList());
            emptyData.put("today", Collections.emptyList());
            emptyData.put("todaySchedules", Collections.emptyList());
            emptyData.put("upcoming", Collections.emptyList());
            emptyData.put("activeTrip", null);
            emptyData.put("nextTrip", null);
            emptyData.put("allTripsCompletedToday", false);
            response.put("data", emptyData);
            return response;
        }

        TransportRequest request = approvedRequestOpt.get();
        Assignment assignment = request.getAssignment();
        Bus bus = assignment.getBus();
        User driver = assignment.getDriver();
        BusRoute route = assignment.getRoute();
        BusStop preferredStop = request.getPreferredStop();
        Integer seatNumber = request.getSeatNumber();

        // Canonical route stops sorted by stopOrder
        List<RouteStop> canonicalStops = new ArrayList<>(route != null && route.getRouteStops() != null ? route.getRouteStops() : Collections.emptyList());
        canonicalStops.sort(Comparator.comparingInt(rs -> rs.getStopOrder() != null ? rs.getStopOrder() : 0));
        int stopsCount = canonicalStops.size();

        // Real-time active trip on this bus
        Trip activeTrip = (bus != null)
                ? tripRepository.findByBusIdAndStatus(bus.getId(), TripStatus.ACTIVE).orElse(null)
                : null;

        BusLocation busLocation = (bus != null)
                ? busLocationRepository.findByBusId(bus.getId()).orElse(null)
                : null;

        String todayName = LocalDate.now().getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().plusDays(1).atStartOfDay();

        // Retrieve today's active schedules for this assignment chronologically
        List<BusSchedule> todaySchedules = busScheduleRepository.findTodayActiveSchedules(
                Collections.singletonList(assignment.getId()), todayName, ScheduleStatus.ACTIVE);

        // Retrieve all active schedules for this assignment
        List<BusSchedule> allSchedules = busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(
                assignment.getId(), ScheduleStatus.ACTIVE);

        List<Long> todayScheduleIds = todaySchedules.stream().map(BusSchedule::getId).collect(Collectors.toList());
        List<Trip> todayTrips = todayScheduleIds.isEmpty() ? Collections.emptyList()
                : tripRepository.findTodayTripsByScheduleIds(todayScheduleIds, startOfDay, endOfDay);

        Map<Long, Trip> tripsByScheduleId = new HashMap<>();
        for (Trip t : todayTrips) {
            if (t.getSchedule() != null) {
                tripsByScheduleId.put(t.getSchedule().getId(), t);
            }
        }

        // Build today's enriched schedules list
        List<Map<String, Object>> todayEnriched = new ArrayList<>();
        boolean foundNext = false;
        Map<String, Object> nextTripSchedule = null;
        Map<String, Object> upcomingAfterActiveSchedule = null;

        for (BusSchedule schedule : todaySchedules) {
            Map<String, Object> sMap = new HashMap<>();
            sMap.put("_id", String.valueOf(schedule.getId()));
            sMap.put("id", schedule.getId());
            sMap.put("assignment", assignment);
            sMap.put("bus", bus);
            sMap.put("driver", driver);
            sMap.put("route", route);
            sMap.put("dayOfWeek", schedule.getDayOfWeek());
            sMap.put("startTime", schedule.getStartTime());
            sMap.put("direction", schedule.getDirection().getValue());
            sMap.put("status", schedule.getStatus().getValue());

            Trip tripForSchedule = tripsByScheduleId.get(schedule.getId());
            boolean isScheduleActive = (activeTrip != null && activeTrip.getSchedule() != null
                    && activeTrip.getSchedule().getId().equals(schedule.getId()));
            boolean isCompleted = (tripForSchedule != null && tripForSchedule.getStatus() == TripStatus.COMPLETED);

            String tripState;
            if (isScheduleActive) {
                tripState = "ACTIVE";
            } else if (isCompleted) {
                tripState = "COMPLETED";
            } else if (!foundNext && activeTrip == null) {
                tripState = "NEXT";
                foundNext = true;
            } else {
                tripState = "UPCOMING";
                if (activeTrip != null && upcomingAfterActiveSchedule == null) {
                    upcomingAfterActiveSchedule = sMap;
                }
            }
            sMap.put("tripState", tripState);
            sMap.put("tripStatus", tripState);

            // Compute direction-aware start & end stops
            Direction dir = schedule.getDirection();
            BusStop originStop = null;
            BusStop destStop = null;
            BusStop initialCurrent = null;
            BusStop initialNext = null;

            if (stopsCount > 0) {
                if (dir == Direction.RETURN) {
                    originStop = canonicalStops.get(stopsCount - 1).getStop();
                    destStop = canonicalStops.get(0).getStop();
                    initialCurrent = originStop;
                    initialNext = (stopsCount > 1) ? canonicalStops.get(stopsCount - 2).getStop() : null;
                } else {
                    originStop = canonicalStops.get(0).getStop();
                    destStop = canonicalStops.get(stopsCount - 1).getStop();
                    initialCurrent = originStop;
                    initialNext = (stopsCount > 1) ? canonicalStops.get(1).getStop() : null;
                }
            }

            sMap.put("startStop", originStop);
            sMap.put("endStop", destStop);

            // Direction-aware trip snapshot
            Map<String, Object> snapshot = new HashMap<>();
            if (isScheduleActive) {
                snapshot.put("_id", String.valueOf(activeTrip.getId()));
                snapshot.put("status", "Active");
                snapshot.put("direction", activeTrip.getDirection().getValue());
                snapshot.put("startedAt", activeTrip.getStartedAt());
                snapshot.put("currentStop", busLocation != null && busLocation.getCurrentStop() != null
                        ? busLocation.getCurrentStop().getStopName()
                        : (originStop != null ? originStop.getStopName() : null));
                snapshot.put("nextStop", busLocation != null && busLocation.getNextStop() != null
                        ? busLocation.getNextStop().getStopName()
                        : (busLocation != null && Boolean.TRUE.equals(busLocation.getRouteCompleted())
                                ? "Trip Completed"
                                : (initialNext != null ? initialNext.getStopName() : null)));
                snapshot.put("progress", busLocation != null && busLocation.getRouteProgress() != null ? busLocation.getRouteProgress() : 0.0);
                snapshot.put("speed", busLocation != null && busLocation.getSpeed() != null ? busLocation.getSpeed() : 0.0);
                snapshot.put("isMoving", busLocation != null && Boolean.TRUE.equals(busLocation.getIsMoving()));
                snapshot.put("updatedAt", busLocation != null ? busLocation.getUpdatedAt() : null);
            } else if (isCompleted) {
                snapshot.put("_id", String.valueOf(tripForSchedule.getId()));
                snapshot.put("status", "Completed");
                snapshot.put("direction", tripForSchedule.getDirection().getValue());
                snapshot.put("startedAt", tripForSchedule.getStartedAt());
                snapshot.put("endedAt", tripForSchedule.getEndedAt());
                snapshot.put("currentStop", destStop != null ? destStop.getStopName() : null);
                snapshot.put("nextStop", "Trip Completed");
                snapshot.put("progress", 100.0);
                snapshot.put("speed", 0.0);
                snapshot.put("isMoving", false);
            } else {
                snapshot.put("status", "Scheduled");
                snapshot.put("direction", dir != null ? dir.getValue() : "OUTBOUND");
                snapshot.put("currentStop", initialCurrent != null ? initialCurrent.getStopName() : null);
                snapshot.put("nextStop", initialNext != null ? initialNext.getStopName() : null);
                snapshot.put("progress", 0.0);
                snapshot.put("speed", 0.0);
                snapshot.put("isMoving", false);
            }

            sMap.put("trip", snapshot);

            if ("NEXT".equals(tripState)) {
                nextTripSchedule = sMap;
            }

            todayEnriched.add(sMap);
        }

        // Active Trip Data
        Map<String, Object> activeTripData = null;
        if (activeTrip != null) {
            activeTripData = new HashMap<>();
            activeTripData.put("_id", String.valueOf(activeTrip.getId()));
            activeTripData.put("id", activeTrip.getId());
            activeTripData.put("status", activeTrip.getStatus().getValue());
            activeTripData.put("direction", activeTrip.getDirection().getValue());
            activeTripData.put("startedAt", activeTrip.getStartedAt());
            activeTripData.put("bus", bus);
            activeTripData.put("driver", driver);
            activeTripData.put("route", route);
            activeTripData.put("schedule", activeTrip.getSchedule());
            activeTripData.put("location", busLocation);
            activeTripData.put("currentStop", busLocation != null && busLocation.getCurrentStop() != null
                    ? busLocation.getCurrentStop().getStopName() : null);
            activeTripData.put("nextStop", busLocation != null && busLocation.getNextStop() != null
                    ? busLocation.getNextStop().getStopName()
                    : (busLocation != null && Boolean.TRUE.equals(busLocation.getRouteCompleted()) ? "Trip Completed" : null));
            activeTripData.put("progress", busLocation != null && busLocation.getRouteProgress() != null ? busLocation.getRouteProgress() : 0.0);
            activeTripData.put("speed", busLocation != null && busLocation.getSpeed() != null ? busLocation.getSpeed() : 0.0);
            activeTripData.put("isMoving", busLocation != null && Boolean.TRUE.equals(busLocation.getIsMoving()));
            activeTripData.put("updatedAt", busLocation != null ? busLocation.getUpdatedAt() : null);

            Direction dir = activeTrip.getDirection();
            if (stopsCount > 0) {
                if (dir == Direction.RETURN) {
                    activeTripData.put("startStop", canonicalStops.get(stopsCount - 1).getStop());
                    activeTripData.put("endStop", canonicalStops.get(0).getStop());
                } else {
                    activeTripData.put("startStop", canonicalStops.get(0).getStop());
                    activeTripData.put("endStop", canonicalStops.get(stopsCount - 1).getStop());
                }
            }
        }

        // Target next trip
        Map<String, Object> selectedNextTrip = (activeTrip != null) ? upcomingAfterActiveSchedule : nextTripSchedule;

        // All schedules for the week
        List<Map<String, Object>> allEnriched = new ArrayList<>();
        List<Map<String, Object>> upcomingSchedules = new ArrayList<>();
        int nowMinutes = LocalTime.now().getHour() * 60 + LocalTime.now().getMinute();

        for (BusSchedule schedule : allSchedules) {
            Map<String, Object> sMap = new HashMap<>();
            sMap.put("_id", String.valueOf(schedule.getId()));
            sMap.put("id", schedule.getId());
            sMap.put("assignment", assignment);
            sMap.put("bus", bus);
            sMap.put("driver", driver);
            sMap.put("route", route);
            sMap.put("dayOfWeek", schedule.getDayOfWeek());
            sMap.put("startTime", schedule.getStartTime());
            sMap.put("direction", schedule.getDirection().getValue());
            sMap.put("status", schedule.getStatus().getValue());

            // If it is today, check if it is already in todayEnriched
            todayEnriched.stream()
                    .filter(t -> t.get("_id").equals(String.valueOf(schedule.getId())))
                    .findFirst()
                    .ifPresent(matched -> {
                        sMap.put("trip", matched.get("trip"));
                        sMap.put("tripState", matched.get("tripState"));
                    });

            allEnriched.add(sMap);

            if (!todayName.equalsIgnoreCase(schedule.getDayOfWeek())
                    || parseMinutes(schedule.getStartTime()) > nowMinutes) {
                upcomingSchedules.add(sMap);
            }
        }

        boolean allTripsCompletedToday = !todaySchedules.isEmpty() && activeTrip == null && nextTripSchedule == null;

        Map<String, Object> data = new HashMap<>();
        data.put("assignment", assignment);
        data.put("bus", bus);
        data.put("driver", driver);
        data.put("route", route);
        data.put("pickupStop", preferredStop);
        data.put("seatNumber", seatNumber);
        data.put("requestStatus", request.getStatus().getValue());
        data.put("activeTrip", activeTripData);
        data.put("nextTrip", selectedNextTrip);
        data.put("todaySchedules", todayEnriched);
        data.put("today", todayEnriched); // Backwards compatibility for existing UI
        data.put("upcoming", upcomingSchedules);
        data.put("schedules", allEnriched);
        data.put("todayName", todayName);
        data.put("allTripsCompletedToday", allTripsCompletedToday);

        response.put("message", "Student schedules fetched successfully.");
        response.put("data", data);
        return response;
    }

    private int parseMinutes(String time) {
        if (time == null || !time.contains(":")) return 0;
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
}
