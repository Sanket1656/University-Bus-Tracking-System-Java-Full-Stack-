package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DriverService {

    private final DriverProfileRepository driverProfileRepository;
    private final AssignmentRepository assignmentRepository;
    private final BusScheduleRepository busScheduleRepository;
    private final TripRepository tripRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final FileStorageService fileStorageService;

    public DriverService(DriverProfileRepository driverProfileRepository,
                         AssignmentRepository assignmentRepository,
                         BusScheduleRepository busScheduleRepository,
                         TripRepository tripRepository,
                         TransportRequestRepository transportRequestRepository,
                         FileStorageService fileStorageService) {
        this.driverProfileRepository = driverProfileRepository;
        this.assignmentRepository = assignmentRepository;
        this.busScheduleRepository = busScheduleRepository;
        this.tripRepository = tripRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.fileStorageService = fileStorageService;
    }

    public Map<String, Object> getProfile(User user) {
        Map<String, Object> result = new HashMap<>();
        Optional<DriverProfile> profileOpt = driverProfileRepository.findByUserId(user.getId());
        if (profileOpt.isEmpty()) {
            result.put("exists", false);
            return result;
        }

        result.put("exists", true);
        result.put("data", profileOpt.get());
        return result;
    }

    @Transactional
    public DriverProfile createProfile(User user,
                                       String name,
                                       String email,
                                       String phone,
                                       String age,
                                       String licenseId,
                                       String address,
                                       String area,
                                       String landmark,
                                       MultipartFile photo,
                                       MultipartFile licensePhoto) {
        if (driverProfileRepository.findByUserId(user.getId()).isPresent()) {
            throw new BadRequestException("Profile Already exists");
        }

        DriverProfile profile = new DriverProfile();
        profile.setUser(user);
        profile.setName(name);
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setAge(age);
        profile.setLicenseId(licenseId);
        profile.setAddress(address);
        profile.setArea(area);
        profile.setLandmark(landmark);

        if (photo != null && !photo.isEmpty()) {
            profile.setPhoto(fileStorageService.storeFile(photo, "driver/profile"));
        }
        if (licensePhoto != null && !licensePhoto.isEmpty()) {
            profile.setLicensePhoto(fileStorageService.storeFile(licensePhoto, "driver/licensePhoto"));
        }

        return driverProfileRepository.save(profile);
    }

    @Transactional
    public Map<String, Object> updateProfile(User user,
                                             String name,
                                             String email,
                                             String phone,
                                             String age,
                                             String licenseId,
                                             String address,
                                             String area,
                                             String landmark,
                                             MultipartFile photo,
                                             MultipartFile licensePhoto) {
        DriverProfile profile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile Not Found"));

        if (name != null) profile.setName(name);
        if (email != null) profile.setEmail(email);
        if (phone != null) profile.setPhone(phone);
        if (age != null) profile.setAge(age);
        if (licenseId != null) profile.setLicenseId(licenseId);
        if (address != null) profile.setAddress(address);
        if (area != null) profile.setArea(area);
        if (landmark != null) profile.setLandmark(landmark);

        if (photo != null && !photo.isEmpty()) {
            profile.setPhoto(fileStorageService.storeFile(photo, "driver/profile"));
        }
        if (licensePhoto != null && !licensePhoto.isEmpty()) {
            profile.setLicensePhoto(fileStorageService.storeFile(licensePhoto, "driver/licensePhoto"));
        }

        driverProfileRepository.save(profile);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile Updated Successfully");
        response.put("data", profile);
        return response;
    }

    public Map<String, Object> getMyAssignment(User user) {
        Assignment assignment = assignmentRepository.findByDriverIdAndStatus(user.getId(), ScheduleStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active assignment found for this driver."));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Driver assignment fetched successfully.");
        response.put("data", assignment);
        return response;
    }

    public Map<String, Object> getTodaySchedule(User user) {
        LocalDate today = LocalDate.now();
        String dayOfWeek = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        List<Assignment> assignments = assignmentRepository.findAllByDriverIdAndStatus(user.getId(), ScheduleStatus.ACTIVE);

        List<Long> assignmentIds = assignments.stream().map(Assignment::getId).collect(Collectors.toList());

        List<BusSchedule> schedules = assignmentIds.isEmpty()
                ? Collections.emptyList()
                : busScheduleRepository.findTodayActiveSchedules(
                        assignmentIds, dayOfWeek, ScheduleStatus.ACTIVE);

        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        int currentMinutes = LocalTime.now().getHour() * 60 + LocalTime.now().getMinute();

        List<Map<String, Object>> scheduleList = new ArrayList<>();
        for (BusSchedule schedule : schedules) {
            Optional<Trip> activeTripOpt = tripRepository.findByScheduleIdAndDriverIdAndStatus(
                    schedule.getId(), user.getId(), TripStatus.ACTIVE);

            Trip trip = null;
            if (activeTripOpt.isPresent()) {
                trip = activeTripOpt.get();
            } else {
                List<Trip> pastTrips = tripRepository.findCompletedTodayTrips(
                        schedule.getId(), user.getId(), Arrays.asList(TripStatus.COMPLETED, TripStatus.CANCELLED),
                        startOfDay, endOfDay);
                if (!pastTrips.isEmpty()) {
                    trip = pastTrips.get(0);
                }
            }

            String displayStatus = "UPCOMING";
            if (trip != null) {
                if (trip.getStatus() == TripStatus.ACTIVE) {
                    displayStatus = "ACTIVE";
                } else if (trip.getStatus() == TripStatus.COMPLETED) {
                    displayStatus = "COMPLETED";
                } else if (trip.getStatus() == TripStatus.CANCELLED) {
                    displayStatus = "CANCELLED";
                }
            } else if (currentMinutes >= parseMinutes(schedule.getStartTime())) {
                displayStatus = "READY";
            }

            Map<String, Object> sMap = new HashMap<>();
            sMap.put("_id", String.valueOf(schedule.getId()));
            sMap.put("id", schedule.getId());
            sMap.put("assignment", schedule.getAssignment());
            sMap.put("bus", schedule.getAssignment() != null ? schedule.getAssignment().getBus() : null);
            sMap.put("route", schedule.getAssignment() != null ? schedule.getAssignment().getRoute() : null);
            sMap.put("dayOfWeek", schedule.getDayOfWeek());
            sMap.put("startTime", schedule.getStartTime());
            sMap.put("direction", schedule.getDirection().getValue());
            sMap.put("status", displayStatus);
            scheduleList.add(sMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("date", today.toString());
        response.put("dayOfWeek", dayOfWeek);
        response.put("data", scheduleList);
        return response;
    }

    public Map<String, Object> getMySchedules(User user) {
        Assignment assignment = assignmentRepository.findByDriverIdAndStatus(user.getId(), ScheduleStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active assignment found for this driver."));

        List<BusSchedule> schedules = busScheduleRepository.findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(
                assignment.getId(), ScheduleStatus.ACTIVE);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Driver schedules fetched successfully.");
        response.put("data", schedules);
        return response;
    }

    public Map<String, Object> getMyStudents(User user) {
        Assignment assignment = assignmentRepository.findByDriverIdAndStatus(user.getId(), ScheduleStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("No active assignment found for this driver."));

        List<TransportRequest> requests = transportRequestRepository.findByAssignmentIdAndStatusOrderBySeatNumberAsc(
                assignment.getId(), RequestStatus.APPROVED);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Assigned students fetched successfully.");
        response.put("count", requests.size());
        response.put("assignment", assignment);
        response.put("data", requests);
        return response;
    }

    private int parseMinutes(String time) {
        if (time == null || !time.contains(":")) return 0;
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
}
