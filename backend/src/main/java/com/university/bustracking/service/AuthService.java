package com.university.bustracking.service;

import com.university.bustracking.dto.*;
import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ResourceInUseException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import com.university.bustracking.util.JwtUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final DependencyCheckService dependencyCheckService;
    private final AssignmentRepository assignmentRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final FileStorageService fileStorageService;

    public AuthService(UserRepository userRepository,
                       StudentProfileRepository studentProfileRepository,
                       DriverProfileRepository driverProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       DependencyCheckService dependencyCheckService,
                       AssignmentRepository assignmentRepository,
                       TripRepository tripRepository,
                       NotificationService notificationService,
                       NotificationRepository notificationRepository,
                       TransportRequestRepository transportRequestRepository,
                       FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.dependencyCheckService = dependencyCheckService;
        this.assignmentRepository = assignmentRepository;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
        this.transportRequestRepository = transportRequestRepository;
        this.fileStorageService = fileStorageService;
    }

    public Map<String, String> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("User already exists");
        }

        // Public registration always creates a STUDENT account.
        // Any client-supplied ADMIN or DRIVER role is strictly ignored.
        User user = new User(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()),
                Role.STUDENT
        );
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User Registred Successfully!! ");
        return response;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid Password");
        }

        // Prevent inactive drivers from logging in
        if (user.getRole() == Role.DRIVER) {
            Optional<DriverProfile> dpOpt = driverProfileRepository.findByUserId(user.getId());
            if (dpOpt.isPresent() && dpOpt.get().getStatus() == ScheduleStatus.INACTIVE) {
                throw new BadRequestException("Your driver account is inactive. Please contact the administrator.");
            }
        }

        String token = jwtUtil.generateToken(user);
        return new LoginResponse(token, new UserDto(user));
    }

    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToUserSummary).collect(Collectors.toList());
    }

    public Object getAllDrivers(Integer page, Integer limit, String search, boolean hasParams) {
        return getAllDrivers(page, limit, search, null, hasParams);
    }

    public Object getAllDrivers(Integer page, Integer limit, String search, String status, boolean hasParams) {
        if (!hasParams) {
            return userRepository.findByRole(Role.DRIVER).stream()
                    .map(this::mapToUserSummary)
                    .collect(Collectors.toList());
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("createdAt").descending());

        ScheduleStatus scheduleStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            scheduleStatus = ScheduleStatus.fromValue(status);
        }

        Page<User> driverPage = userRepository.searchDrivers(
                Role.DRIVER,
                search != null ? search.trim() : "",
                scheduleStatus,
                pageable
        );
        long overallTotal = userRepository.countByRole(Role.DRIVER);
        long activeCount = driverProfileRepository.countByStatus(ScheduleStatus.ACTIVE);
        long inactiveCount = driverProfileRepository.countByStatus(ScheduleStatus.INACTIVE);

        List<UserSummaryDto> driverList = driverPage.getContent().stream()
                .map(this::mapToUserSummary)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("data", driverList);

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);
        summary.put("active", activeCount);
        summary.put("inactive", inactiveCount);
        response.put("summary", summary);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", driverPage.getTotalElements());
        pagination.put("totalPages", Math.max(1, driverPage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    @Transactional
    public Map<String, Object> createDriver(
            String username,
            String password,
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

        if (username == null || username.trim().isEmpty()) {
            throw new BadRequestException("Username is required");
        }
        username = username.trim();

        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username already exists");
        }

        if (password == null || password.trim().length() < 6) {
            throw new BadRequestException("Password is required and must be at least 6 characters");
        }

        if (name == null || name.trim().isEmpty()) {
            throw new BadRequestException("Full legal name is required");
        }
        name = name.trim();

        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        email = email.trim();
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BadRequestException("Invalid email format");
        }

        if (driverProfileRepository.existsByEmail(email)) {
            throw new BadRequestException("A driver with this email already exists");
        }

        // Assign DRIVER role exclusively on the backend
        User user = new User(username, passwordEncoder.encode(password.trim()), Role.DRIVER);
        User savedUser = userRepository.save(user);

        DriverProfile profile = new DriverProfile();
        profile.setUser(savedUser);
        profile.setName(name);
        profile.setEmail(email);
        profile.setPhone(phone != null && !phone.trim().isEmpty() ? phone.trim() : null);
        profile.setAge(age != null && !age.trim().isEmpty() ? age.trim() : null);
        profile.setLicenseId(licenseId != null && !licenseId.trim().isEmpty() ? licenseId.trim() : null);
        profile.setAddress(address != null && !address.trim().isEmpty() ? address.trim() : null);
        profile.setArea(area != null && !area.trim().isEmpty() ? area.trim() : null);
        profile.setLandmark(landmark != null && !landmark.trim().isEmpty() ? landmark.trim() : null);
        profile.setStatus(ScheduleStatus.ACTIVE);

        if (photo != null && !photo.isEmpty()) {
            profile.setPhoto(fileStorageService.storeFile(photo, "driver/profile"));
        }
        if (licensePhoto != null && !licensePhoto.isEmpty()) {
            profile.setLicensePhoto(fileStorageService.storeFile(licensePhoto, "driver/licensePhoto"));
        }

        driverProfileRepository.save(profile);
        savedUser.setDriverProfile(profile);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Driver created successfully");
        response.put("data", mapToUserSummary(savedUser));
        return response;
    }

    @Transactional
    public Map<String, Object> updateDriverByAdmin(
            Long driverId,
            String name,
            String email,
            String phone,
            String age,
            String licenseId,
            String address,
            String area,
            String landmark,
            String status,
            String password,
            MultipartFile photo,
            MultipartFile licensePhoto) {

        User user = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver Not Found"));

        if (user.getRole() != Role.DRIVER) {
            throw new BadRequestException("User is not a driver");
        }

        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));

        if (email != null && !email.trim().isEmpty()) {
            email = email.trim();
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new BadRequestException("Invalid email format");
            }
            Optional<DriverProfile> existingByEmail = driverProfileRepository.findByEmail(email);
            if (existingByEmail.isPresent() && !existingByEmail.get().getId().equals(profile.getId())) {
                throw new BadRequestException("A driver with this email already exists");
            }
            profile.setEmail(email);
        }

        if (name != null && !name.trim().isEmpty()) profile.setName(name.trim());
        if (phone != null) profile.setPhone(phone.trim().isEmpty() ? null : phone.trim());
        if (age != null) profile.setAge(age.trim().isEmpty() ? null : age.trim());
        if (licenseId != null) profile.setLicenseId(licenseId.trim().isEmpty() ? null : licenseId.trim());
        if (address != null) profile.setAddress(address.trim().isEmpty() ? null : address.trim());
        if (area != null) profile.setArea(area.trim().isEmpty() ? null : area.trim());
        if (landmark != null) profile.setLandmark(landmark.trim().isEmpty() ? null : landmark.trim());

        if (status != null && !status.trim().isEmpty()) {
            profile.setStatus(ScheduleStatus.fromValue(status));
        }

        if (password != null && !password.trim().isEmpty()) {
            if (password.trim().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(password.trim()));
            userRepository.save(user);
        }

        if (photo != null && !photo.isEmpty()) {
            profile.setPhoto(fileStorageService.storeFile(photo, "driver/profile"));
        }
        if (licensePhoto != null && !licensePhoto.isEmpty()) {
            profile.setLicensePhoto(fileStorageService.storeFile(licensePhoto, "driver/licensePhoto"));
        }

        driverProfileRepository.save(profile);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Driver updated successfully");
        response.put("data", mapToUserSummary(user));
        return response;
    }

    public Object getAllStudents(Integer page, Integer limit, String search, String branch, boolean hasParams) {
        if (!hasParams) {
            return userRepository.findByRole(Role.STUDENT).stream()
                    .map(this::mapToUserSummary)
                    .collect(Collectors.toList());
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by("createdAt").descending());

        Page<User> studentPage = userRepository.searchStudents(
                Role.STUDENT,
                search != null ? search.trim() : "",
                branch != null ? branch.trim() : "",
                pageable
        );
        long overallTotal = userRepository.countByRole(Role.STUDENT);

        List<UserSummaryDto> studentList = studentPage.getContent().stream()
                .map(this::mapToUserSummary)
                .collect(Collectors.toList());

        List<String> branches = studentProfileRepository.findDistinctBranches();

        Map<String, Object> response = new HashMap<>();
        response.put("data", studentList);

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);
        response.put("summary", summary);

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", studentPage.getTotalElements());
        pagination.put("totalPages", Math.max(1, studentPage.getTotalPages()));
        response.put("pagination", pagination);

        Map<String, Object> filters = new HashMap<>();
        filters.put("branches", branches);
        response.put("filters", filters);

        return response;
    }

    public ResourceDependencyResponse getUserDependencies(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));

        if (user.getRole() == Role.DRIVER) {
            return dependencyCheckService.checkDriverDependencies(userId);
        } else if (user.getRole() == Role.STUDENT) {
            return dependencyCheckService.checkStudentDependencies(userId);
        } else {
            return new ResourceDependencyResponse(
                    true, "OK", "User can be safely deleted.",
                    "ADMIN", user.getId(), user.getUsername(),
                    true, false, Collections.emptyList()
            );
        }
    }

    @Transactional
    public Map<String, Object> deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));

        if (user.getRole() == Role.DRIVER) {
            ResourceDependencyResponse dep = dependencyCheckService.checkDriverDependencies(userId);
            if (!dep.isCanDelete()) {
                throw new ResourceInUseException(dep);
            }
            notificationRepository.deleteByRecipientId(userId);
        } else if (user.getRole() == Role.STUDENT) {
            ResourceDependencyResponse dep = dependencyCheckService.checkStudentDependencies(userId);
            if (!dep.isCanDelete()) {
                throw new ResourceInUseException(dep);
            }
            notificationRepository.deleteByRecipientId(userId);
        }

        userRepository.delete(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "User and profile deleted successfully");
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateDriver(Long driverId) {
        User user = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver Not Found"));

        if (user.getRole() != Role.DRIVER) {
            throw new BadRequestException("User is not a driver");
        }

        if (tripRepository.existsByDriverIdAndStatus(driverId, TripStatus.ACTIVE)) {
            ResourceDependencyResponse dep = dependencyCheckService.checkDriverDependencies(driverId);
            throw new ResourceInUseException(dep);
        }

        DriverProfile dp = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));
        dp.setStatus(ScheduleStatus.INACTIVE);
        driverProfileRepository.save(dp);

        List<Assignment> activeAssignments = assignmentRepository.findAllByDriverIdAndStatus(driverId, ScheduleStatus.ACTIVE);
        for (Assignment a : activeAssignments) {
            a.setStatus(ScheduleStatus.INACTIVE);
            assignmentRepository.save(a);

            List<Long> studentIds = transportRequestRepository.findStudentIdsByAssignmentIdAndStatus(a.getId(), RequestStatus.APPROVED);
            for (Long sId : studentIds) {
                userRepository.findById(sId).ifPresent(studentUser -> {
                    notificationService.createNotification(
                            studentUser,
                            NotificationType.DRIVER_DEACTIVATED,
                            "Assigned Driver Deactivated",
                            "The driver for your bus " + a.getBus().getBusNumber() + " has been deactivated. Please contact the transport administrator for reassignment.",
                            null,
                            a.getBus()
                    );
                });
            }
        }

        notificationService.createNotification(
                user,
                NotificationType.DRIVER_DEACTIVATED,
                "Driver Account Deactivated",
                "Your driver profile has been deactivated by the administrator.",
                null,
                null
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Driver deactivated successfully");
        response.put("data", mapToUserSummary(user));
        return response;
    }

    @Transactional
    public Map<String, Object> reactivateDriver(Long driverId) {
        User user = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver Not Found"));

        if (user.getRole() != Role.DRIVER) {
            throw new BadRequestException("User is not a driver");
        }

        DriverProfile dp = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));
        dp.setStatus(ScheduleStatus.ACTIVE);
        driverProfileRepository.save(dp);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Driver reactivated successfully");
        response.put("data", mapToUserSummary(user));
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateStudent(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student Not Found"));

        if (user.getRole() != Role.STUDENT) {
            throw new BadRequestException("User is not a student");
        }

        StudentProfile sp = studentProfileRepository.findByUserId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        sp.setStatus(ScheduleStatus.INACTIVE);
        studentProfileRepository.save(sp);

        notificationService.createNotification(
                user,
                NotificationType.PROFILE_DEACTIVATED,
                "Student Account Deactivated",
                "Your student transit profile has been deactivated by the administrator.",
                null,
                null
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Student deactivated successfully");
        response.put("data", mapToUserSummary(user));
        return response;
    }

    @Transactional
    public Map<String, Object> reactivateStudent(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student Not Found"));

        if (user.getRole() != Role.STUDENT) {
            throw new BadRequestException("User is not a student");
        }

        StudentProfile sp = studentProfileRepository.findByUserId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        sp.setStatus(ScheduleStatus.ACTIVE);
        studentProfileRepository.save(sp);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", true);
        response.put("message", "Student reactivated successfully");
        response.put("data", mapToUserSummary(user));
        return response;
    }

    private UserSummaryDto mapToUserSummary(User user) {
        UserSummaryDto dto = new UserSummaryDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole());

        if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.findByUserId(user.getId()).ifPresent(sp -> {
                dto.setName(sp.getName() != null ? sp.getName() : user.getUsername());
                dto.setEmail(sp.getEmail() != null ? sp.getEmail() : "N/A");
                dto.setPhone(sp.getPhone() != null ? sp.getPhone() : "N/A");
                dto.setBranch(sp.getBranch() != null ? sp.getBranch() : "N/A");
                dto.setEnrollmentNumber(sp.getEnrollmentNumber());
                dto.setStatus(sp.getStatus() != null ? sp.getStatus().getValue() : "Active");
                dto.setPhoto(sp.getPhoto());
            });
            if (dto.getName() == null) {
                dto.setName(user.getUsername());
                dto.setEmail("N/A");
                dto.setPhone("N/A");
                dto.setStatus("Active");
            }
        } else if (user.getRole() == Role.DRIVER) {
            driverProfileRepository.findByUserId(user.getId()).ifPresent(dp -> {
                dto.setName(dp.getName() != null ? dp.getName() : user.getUsername());
                dto.setEmail(dp.getEmail() != null ? dp.getEmail() : "N/A");
                dto.setPhone(dp.getPhone() != null ? dp.getPhone() : "N/A");
                dto.setLicenseId(dp.getLicenseId() != null ? dp.getLicenseId() : "N/A");
                dto.setStatus(dp.getStatus() != null ? dp.getStatus().getValue() : "Active");
                dto.setPhoto(dp.getPhoto());
            });
            if (dto.getName() == null) {
                dto.setName(user.getUsername());
                dto.setEmail("N/A");
                dto.setPhone("N/A");
                dto.setLicenseId("N/A");
                dto.setStatus("Active");
            }
        } else {
            dto.setName(user.getUsername());
            dto.setEmail("N/A");
            dto.setPhone("N/A");
            dto.setStatus("Active");
        }

        return dto;

    }
}
