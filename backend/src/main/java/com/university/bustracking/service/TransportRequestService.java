package com.university.bustracking.service;

import com.university.bustracking.entity.*;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransportRequestService {

    private final TransportRequestRepository transportRequestRepository;
    private final BusStopRepository busStopRepository;
    private final AssignmentRepository assignmentRepository;
    private final RouteStopRepository routeStopRepository;

    public TransportRequestService(TransportRequestRepository transportRequestRepository,
                                  BusStopRepository busStopRepository,
                                  AssignmentRepository assignmentRepository,
                                  RouteStopRepository routeStopRepository) {
        this.transportRequestRepository = transportRequestRepository;
        this.busStopRepository = busStopRepository;
        this.assignmentRepository = assignmentRepository;
        this.routeStopRepository = routeStopRepository;
    }

    @Transactional
    public Map<String, Object> createTransportRequest(User student, Long preferredStopId) {
        if (student.getStudentProfile() != null && student.getStudentProfile().getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Student account is inactive and cannot submit transport requests.");
        }

        if (preferredStopId == null) {
            throw new BadRequestException("preferredStop is required");
        }

        BusStop stop = busStopRepository.findById(preferredStopId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Stop not found"));

        if (stop.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Selected bus stop is inactive. Please choose an active stop.");
        }

        Optional<TransportRequest> existingOpt = transportRequestRepository.findByStudentId(student.getId());
        TransportRequest request;
        if (existingOpt.isPresent()) {
            request = existingOpt.get();
            if (request.getStatus() == RequestStatus.APPROVED) {
                throw new ConflictException("You already have an approved transport assignment.");
            }
            request.setPreferredStop(stop);
            request.setStatus(RequestStatus.PENDING);
            request.setCancellationStatus(CancellationStatus.NONE);
            request.setCancellationReason(null);
            request.setCancellationRemarks(null);
            request.setRemarks("");
        } else {
            request = new TransportRequest();
            request.setStudent(student);
            request.setPreferredStop(stop);
            request.setStatus(RequestStatus.PENDING);
        }

        TransportRequest saved = transportRequestRepository.save(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Transport request submitted successfully.");
        response.put("data", saved);
        return response;
    }

    public Map<String, Object> getMyTransportRequest(User student) {
        Optional<TransportRequest> reqOpt = transportRequestRepository.findByStudentId(student.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        if (reqOpt.isEmpty()) {
            response.put("exists", false);
            response.put("data", null);
            return response;
        }

        response.put("exists", true);
        response.put("data", reqOpt.get());
        return response;
    }

    @Transactional
    public Map<String, Object> cancelMyTransportRequest(User student, String reason) {
        TransportRequest request = transportRequestRepository.findByStudentId(student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        if (request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.CANCELLED);
            request.setCancellationStatus(CancellationStatus.APPROVED);
        } else if (request.getStatus() == RequestStatus.APPROVED) {
            request.setCancellationStatus(CancellationStatus.PENDING);
            request.setCancellationReason(reason != null ? reason.trim() : "Student requested cancellation");
        } else {
            throw new BadRequestException("Cannot cancel request with status " + request.getStatus());
        }

        TransportRequest saved = transportRequestRepository.save(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cancellation request submitted.");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> updatePreferredStop(User student, Long preferredStopId) {
        if (preferredStopId == null) {
            throw new BadRequestException("preferredStop is required");
        }

        TransportRequest request = transportRequestRepository.findByStudentId(student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Preferred stop can only be updated while request is Pending.");
        }

        BusStop stop = busStopRepository.findById(preferredStopId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Stop not found"));

        if (stop.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("Selected bus stop is inactive. Please choose an active stop.");
        }

        request.setPreferredStop(stop);
        TransportRequest saved = transportRequestRepository.save(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Preferred stop updated.");
        response.put("data", saved);
        return response;
    }

    public Map<String, Object> getBusSeatMap(User student) {
        TransportRequest request = transportRequestRepository.findByStudentIdAndStatus(student.getId(), RequestStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException("No approved transport request found."));

        Assignment assignment = request.getAssignment();
        if (assignment == null || assignment.getBus() == null) {
            throw new ResourceNotFoundException("No bus assigned yet.");
        }

        Bus bus = assignment.getBus();
        int busCapacity = bus.getBusCapacity() != null ? bus.getBusCapacity() : 0;

        List<TransportRequest> allocatedList = transportRequestRepository.findByAssignmentIdAndStatusOrderBySeatNumberAsc(
                assignment.getId(), RequestStatus.APPROVED);

        List<Integer> occupiedSeats = allocatedList.stream()
                .map(TransportRequest::getSeatNumber)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        boolean isAuthorizedForDetails = (student.getRole() == Role.ADMIN);

        List<Map<String, Object>> passengerList = new ArrayList<>();
        for (TransportRequest allocated : allocatedList) {
            if (allocated.getSeatNumber() == null) continue;

            Map<String, Object> seatInfo = new HashMap<>();
            seatInfo.put("seatNumber", allocated.getSeatNumber());
            seatInfo.put("occupied", true);

            boolean isCurrentStudent = allocated.getStudent() != null
                    && Objects.equals(allocated.getStudent().getId(), student.getId());
            seatInfo.put("isMine", isCurrentStudent);

            // Privacy protection: Expose personal details ONLY for the student's own seat or when authorized as ADMIN
            if (isCurrentStudent || isAuthorizedForDetails) {
                User allocatedUser = allocated.getStudent();
                StudentProfile profile = allocatedUser != null ? allocatedUser.getStudentProfile() : null;
                String displayName = "Student";
                if (profile != null && profile.getName() != null && !profile.getName().isBlank()) {
                    displayName = profile.getName();
                } else if (allocatedUser != null && allocatedUser.getUsername() != null) {
                    displayName = allocatedUser.getUsername();
                }
                seatInfo.put("name", displayName);

                if (profile != null) {
                    seatInfo.put("enrollmentNumber", profile.getEnrollmentNumber());
                    seatInfo.put("branch", profile.getBranch());
                    seatInfo.put("photo", profile.getPhoto());
                }
            } else {
                seatInfo.put("name", "Occupied");
            }

            passengerList.add(seatInfo);
        }

        int totalOccupied = occupiedSeats.size();
        int availableSeats = Math.max(0, busCapacity - totalOccupied);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("busCapacity", busCapacity);
        response.put("totalOccupied", totalOccupied);
        response.put("availableSeats", availableSeats);
        response.put("mySeat", request.getSeatNumber());
        response.put("occupiedSeats", occupiedSeats);
        response.put("data", passengerList);
        response.put("bus", bus);
        return response;
    }

    public List<TransportRequest> getPendingRequests() {
        return transportRequestRepository.findByStatus(RequestStatus.PENDING);
    }

    public List<TransportRequest> getApprovedRequests() {
        return transportRequestRepository.findByStatus(RequestStatus.APPROVED);
    }

    public List<TransportRequest> getPendingCancellationRequests() {
        return transportRequestRepository.findByCancellationStatus(CancellationStatus.PENDING);
    }

    @Transactional
    public Map<String, Object> approveCancellation(Long id) {
        TransportRequest request = transportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        request.setStatus(RequestStatus.CANCELLED);
        request.setCancellationStatus(CancellationStatus.APPROVED);
        request.setAssignment(null);
        request.setSeatNumber(null);
        TransportRequest saved = transportRequestRepository.save(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cancellation approved.");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> rejectCancellation(Long id, String remarks) {
        TransportRequest request = transportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        request.setCancellationStatus(CancellationStatus.REJECTED);
        request.setCancellationRemarks(remarks != null ? remarks.trim() : "Rejected by admin");
        TransportRequest saved = transportRequestRepository.save(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cancellation rejected.");
        response.put("data", saved);
        return response;
    }

    public List<TransportRequest> getPendingStudentsForAssignment(Long assignmentId) {
        if (assignmentId == null) {
            throw new BadRequestException("Assignment ID is required.", "ASSIGNMENT_REQUIRED");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment Not Found."));

        if (assignment.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("This assignment is inactive and cannot accept new students.", "ASSIGNMENT_INACTIVE");
        }

        Bus bus = assignment.getBus();
        if (bus != null && bus.getBusStatus() != BusStatus.ACTIVE) {
            String statusStr = bus.getBusStatus().getValue().toLowerCase();
            throw new BadRequestException("This assignment cannot accept students because its bus (" + 
                    bus.getBusNumber() + ") is " + statusStr + ".", "BUS_UNAVAILABLE");
        }

        BusRoute route = assignment.getRoute();
        if (route == null || route.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("This assignment cannot accept students because its route is inactive.", "ROUTE_INACTIVE");
        }

        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrderAsc(route.getId());
        if (routeStops.isEmpty()) {
            throw new BadRequestException("This assignment's route has no configured stops.", "ROUTE_HAS_NO_STOPS");
        }

        List<Long> stopIds = routeStops.stream().map(rs -> rs.getStop().getId()).collect(Collectors.toList());
        List<TransportRequest> pending = transportRequestRepository.findPendingStudentsForStopIds(RequestStatus.PENDING, stopIds);

        // Filter out any student who already has an APPROVED active assignment elsewhere
        return pending.stream().filter(tr -> {
            if (tr.getStudent() == null) return false;
            Optional<TransportRequest> approvedOpt = transportRequestRepository.findByStudentIdAndStatus(
                    tr.getStudent().getId(), RequestStatus.APPROVED);
            if (approvedOpt.isPresent()) {
                Assignment existingAsgn = approvedOpt.get().getAssignment();
                return existingAsgn == null || existingAsgn.getStatus() != ScheduleStatus.ACTIVE;
            }
            return true;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> assignStudents(Long assignmentId, List<Map<String, Object>> studentsPayload) {
        if (assignmentId == null) {
            throw new BadRequestException("Assignment ID is required.", "ASSIGNMENT_REQUIRED");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment Not Found."));

        if (assignment.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("This assignment is inactive and cannot accept new students.", "ASSIGNMENT_INACTIVE");
        }

        Bus bus = assignment.getBus();
        if (bus == null || bus.getBusStatus() != BusStatus.ACTIVE) {
            String statusStr = bus != null ? bus.getBusStatus().getValue().toLowerCase() : "unavailable";
            throw new BadRequestException("This assignment cannot accept students because its bus is " + statusStr + ".", "BUS_UNAVAILABLE");
        }

        BusRoute route = assignment.getRoute();
        if (route == null || route.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("This assignment cannot accept students because its route is inactive.", "ROUTE_INACTIVE");
        }

        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrderAsc(route.getId());
        if (routeStops.isEmpty()) {
            throw new BadRequestException("This assignment's route has no configured stops.", "ROUTE_HAS_NO_STOPS");
        }
        Set<Long> routeStopIds = routeStops.stream()
                .map(rs -> rs.getStop().getId())
                .collect(Collectors.toSet());

        if (studentsPayload == null || studentsPayload.isEmpty()) {
            throw new BadRequestException("At least one student must be selected for assignment.", "EMPTY_STUDENT_LIST");
        }

        int capacity = bus.getBusCapacity();
        long currentApprovedCount = transportRequestRepository.countByAssignmentIdAndStatus(assignmentId, RequestStatus.APPROVED);
        if (currentApprovedCount + studentsPayload.size() > capacity) {
            throw new BadRequestException("Cannot assign " + studentsPayload.size() + " student(s). Bus capacity is " + capacity + 
                    " with " + currentApprovedCount + " seats already occupied (" + (capacity - currentApprovedCount) + " available).", "CAPACITY_EXCEEDED");
        }

        Set<Long> seenRequestIds = new HashSet<>();
        Set<Integer> seenSeatNumbers = new HashSet<>();
        List<TransportRequest> toSave = new ArrayList<>();

        for (Map<String, Object> item : studentsPayload) {
            Object reqIdObj = item.get("requestId");
            if (reqIdObj == null) reqIdObj = item.get("id");
            if (reqIdObj == null) reqIdObj = item.get("_id");
            if (reqIdObj == null) {
                throw new BadRequestException("Request ID is required for student assignment.", "REQUEST_ID_REQUIRED");
            }
            Long reqId = Long.parseLong(reqIdObj.toString());

            if (!seenRequestIds.add(reqId)) {
                throw new ConflictException("Duplicate student in assignment request.", "DUPLICATE_STUDENT_IN_REQUEST");
            }

            TransportRequest tr = transportRequestRepository.findById(reqId)
                    .orElseThrow(() -> new ResourceNotFoundException("Transport Request " + reqId + " not found"));

            User student = tr.getStudent();
            if (student == null) {
                throw new BadRequestException("Student record not found for transport request " + reqId + ".", "STUDENT_NOT_FOUND");
            }

            if (tr.getStatus() != RequestStatus.PENDING) {
                throw new BadRequestException("This transport request is no longer pending and cannot be assigned.", "INVALID_REQUEST_STATUS");
            }

            BusStop preferredStop = tr.getPreferredStop();
            if (preferredStop == null) {
                throw new BadRequestException("Student must select a preferred pickup stop before assignment.", "PREFERRED_STOP_REQUIRED");
            }

            if (!routeStopIds.contains(preferredStop.getId())) {
                throw new BadRequestException("Cannot assign this student to this assignment. The student's preferred pickup stop (" + 
                        preferredStop.getStopName() + ") is not included in the selected assignment's route (" + 
                        route.getRouteName() + ").", "PREFERRED_STOP_NOT_ON_ROUTE");
            }

            // Check duplicate assignment to SAME assignment
            if (tr.getAssignment() != null && tr.getAssignment().getId().equals(assignmentId)) {
                throw new ConflictException("Student is already assigned to this assignment.", "STUDENT_ALREADY_ASSIGNED");
            }
            if (transportRequestRepository.existsByAssignmentIdAndStudentIdAndStatus(assignmentId, student.getId(), RequestStatus.APPROVED)) {
                throw new ConflictException("Student is already assigned to this assignment.", "STUDENT_ALREADY_ASSIGNED");
            }

            // Check if student is already assigned elsewhere to another active assignment
            Optional<TransportRequest> otherApproved = transportRequestRepository.findByStudentIdAndStatusAndIdNot(
                    student.getId(), RequestStatus.APPROVED, tr.getId());
            if (otherApproved.isPresent()) {
                Assignment existingAsgn = otherApproved.get().getAssignment();
                if (existingAsgn != null && existingAsgn.getStatus() == ScheduleStatus.ACTIVE) {
                    throw new ConflictException("Student is already assigned to another active assignment. Remove/change the existing assignment before assigning a new one.", "STUDENT_ALREADY_ASSIGNED_ELSEWHERE");
                }
            }

            Integer seatNumber = item.get("seatNumber") != null && !item.get("seatNumber").toString().trim().isEmpty()
                    ? Integer.parseInt(item.get("seatNumber").toString().trim())
                    : null;

            if (seatNumber != null) {
                if (seatNumber <= 0 || seatNumber > capacity) {
                    throw new BadRequestException("Seat number " + seatNumber + " is invalid. Must be between 1 and " + capacity + ".", "INVALID_SEAT_NUMBER");
                }
                if (!seenSeatNumbers.add(seatNumber)) {
                    throw new ConflictException("Seat number " + seatNumber + " is duplicated in the assignment request.", "DUPLICATE_SEAT_IN_REQUEST");
                }
                if (transportRequestRepository.existsByAssignmentIdAndSeatNumberAndStatus(
                        assignmentId, seatNumber, RequestStatus.APPROVED)) {
                    throw new ConflictException("Seat number " + seatNumber + " is already occupied on this bus.", "SEAT_ALREADY_OCCUPIED");
                }
            }

            tr.setAssignment(assignment);
            tr.setSeatNumber(seatNumber);
            tr.setStatus(RequestStatus.APPROVED);
            toSave.add(tr);
        }

        transportRequestRepository.saveAll(toSave);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Students assigned successfully.");
        return response;
    }

    public List<TransportRequest> getAssignmentStudents(Long assignmentId) {
        return transportRequestRepository.findByAssignmentIdAndStatusOrderBySeatNumberAsc(assignmentId, RequestStatus.APPROVED);
    }

    @Transactional
    public Map<String, Object> rejectRequest(Long id, String remarks) {
        TransportRequest tr = transportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        tr.setStatus(RequestStatus.REJECTED);
        tr.setRemarks(remarks != null ? remarks.trim() : "Rejected by admin");
        TransportRequest saved = transportRequestRepository.save(tr);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Request rejected.");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> changeAssignment(Long id, Long newAssignmentId) {
        if (id == null || newAssignmentId == null) {
            throw new BadRequestException("Request ID and Target Assignment ID are required.", "INVALID_INPUT");
        }

        TransportRequest tr = transportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        Assignment newAssignment = assignmentRepository.findById(newAssignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        if (newAssignment.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("This assignment is inactive and cannot accept new students.", "ASSIGNMENT_INACTIVE");
        }

        Bus bus = newAssignment.getBus();
        if (bus == null || bus.getBusStatus() != BusStatus.ACTIVE) {
            String statusStr = bus != null ? bus.getBusStatus().getValue().toLowerCase() : "unavailable";
            throw new BadRequestException("This assignment cannot accept students because its bus is " + statusStr + ".", "BUS_UNAVAILABLE");
        }

        BusRoute route = newAssignment.getRoute();
        if (route == null || route.getStatus() == ScheduleStatus.INACTIVE) {
            throw new BadRequestException("This assignment cannot accept students because its route is inactive.", "ROUTE_INACTIVE");
        }

        List<RouteStop> routeStops = routeStopRepository.findByRouteIdOrderByStopOrderAsc(route.getId());
        if (routeStops.isEmpty()) {
            throw new BadRequestException("This assignment's route has no configured stops.", "ROUTE_HAS_NO_STOPS");
        }
        Set<Long> routeStopIds = routeStops.stream()
                .map(rs -> rs.getStop().getId())
                .collect(Collectors.toSet());

        // Check if student is already assigned to the SAME assignment
        if (tr.getAssignment() != null && tr.getAssignment().getId().equals(newAssignmentId)) {
            throw new ConflictException("Student is already assigned to this assignment.", "STUDENT_ALREADY_ASSIGNED");
        }

        BusStop preferredStop = tr.getPreferredStop();
        if (preferredStop == null) {
            throw new BadRequestException("Student must select a preferred pickup stop before assignment.", "PREFERRED_STOP_REQUIRED");
        }

        if (!routeStopIds.contains(preferredStop.getId())) {
            throw new BadRequestException("Cannot assign this student to this assignment. The student's preferred pickup stop (" + 
                    preferredStop.getStopName() + ") is not included in the selected assignment's route (" + 
                    route.getRouteName() + ").", "PREFERRED_STOP_NOT_ON_ROUTE");
        }

        int capacity = bus.getBusCapacity();
        long currentApprovedCount = transportRequestRepository.countByAssignmentIdAndStatus(newAssignmentId, RequestStatus.APPROVED);
        if (currentApprovedCount >= capacity) {
            throw new BadRequestException("Cannot reassign student: Bus capacity is full (" + capacity + " seats).", "CAPACITY_EXCEEDED");
        }

        tr.setAssignment(newAssignment);
        tr.setSeatNumber(null);
        TransportRequest saved = transportRequestRepository.save(tr);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Assignment changed.");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> changeSeat(Long id, Integer seatNumber) {
        TransportRequest tr = transportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transport request not found."));

        if (tr.getAssignment() == null) {
            throw new BadRequestException("Student has no assigned bus.");
        }

        if (seatNumber == null || seatNumber <= 0) {
            throw new BadRequestException("Seat number must be a positive integer.", "INVALID_SEAT_NUMBER");
        }

        int capacity = tr.getAssignment().getBus().getBusCapacity();
        if (seatNumber > capacity) {
            throw new BadRequestException("Seat number " + seatNumber + " exceeds bus capacity " + capacity, "INVALID_SEAT_NUMBER");
        }

        if (seatNumber.equals(tr.getSeatNumber())) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Seat changed successfully.");
            response.put("data", tr);
            return response;
        }

        if (transportRequestRepository.existsByAssignmentIdAndSeatNumberAndStatus(
                tr.getAssignment().getId(), seatNumber, RequestStatus.APPROVED)) {
            throw new ConflictException("Seat number " + seatNumber + " is already occupied.", "SEAT_ALREADY_OCCUPIED");
        }

        tr.setSeatNumber(seatNumber);
        TransportRequest saved = transportRequestRepository.save(tr);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Seat changed successfully.");
        response.put("data", saved);
        return response;
    }
}
