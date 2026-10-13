package com.university.bustracking.service;

import com.university.bustracking.entity.Assignment;
import com.university.bustracking.entity.BusSchedule;
import com.university.bustracking.entity.Direction;
import com.university.bustracking.entity.ScheduleStatus;
import com.university.bustracking.exception.BadRequestException;
import com.university.bustracking.exception.ConflictException;
import com.university.bustracking.exception.ResourceNotFoundException;
import com.university.bustracking.repository.AssignmentRepository;
import com.university.bustracking.repository.BusScheduleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class BusScheduleService {

    private final BusScheduleRepository busScheduleRepository;
    private final AssignmentRepository assignmentRepository;

    public BusScheduleService(BusScheduleRepository busScheduleRepository, AssignmentRepository assignmentRepository) {
        this.busScheduleRepository = busScheduleRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Transactional
    public Map<String, Object> createSchedule(Long assignmentId, String dayOfWeek, String startTime, String direction, String status) {
        if (assignmentId == null || dayOfWeek == null || startTime == null || direction == null) {
            throw new BadRequestException("Assignment, dayOfWeek, startTime and direction are required.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment Not Found."));

        if (assignment.getStatus() != ScheduleStatus.ACTIVE) {
            throw new BadRequestException("Assignment is not Active.");
        }

        Direction dirEnum = Direction.fromValue(direction);
        ScheduleStatus statEnum = status != null ? ScheduleStatus.fromValue(status) : ScheduleStatus.ACTIVE;

        if (busScheduleRepository.existsByAssignmentIdAndDayOfWeekAndStartTimeAndDirection(
                assignmentId, dayOfWeek.trim(), startTime.trim(), dirEnum)) {
            throw new ConflictException("A schedule already exists for this assignment, day, time and direction.");
        }

        BusSchedule schedule = new BusSchedule();
        schedule.setAssignment(assignment);
        schedule.setDayOfWeek(dayOfWeek.trim());
        schedule.setStartTime(startTime.trim());
        schedule.setDirection(dirEnum);
        schedule.setStatus(statEnum);

        BusSchedule saved = busScheduleRepository.save(schedule);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus schedule created successfully.");
        response.put("data", saved);
        return response;
    }

    public Map<String, Object> getAllSchedules(String dayOfWeek, String direction, String status, Long assignmentId,
                                              String search, Integer page, Integer limit, boolean shouldPaginate) {
        Direction dirEnum = (direction != null && !direction.trim().isEmpty()) ? Direction.fromValue(direction.trim()) : null;
        ScheduleStatus statEnum = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all"))
                ? ScheduleStatus.fromValue(status.trim()) : null;

        long overallTotal = busScheduleRepository.count();
        long activeTotal = busScheduleRepository.countByStatus(ScheduleStatus.ACTIVE);
        long outboundTotal = busScheduleRepository.countByStatusAndDirection(ScheduleStatus.ACTIVE, Direction.OUTBOUND);
        long returnTotal = busScheduleRepository.countByStatusAndDirection(ScheduleStatus.ACTIVE, Direction.RETURN);

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", overallTotal);
        summary.put("active", activeTotal);
        summary.put("outbound", outboundTotal);
        summary.put("returnTrips", returnTotal);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus schedules fetched successfully.");
        response.put("summary", summary);

        if (!shouldPaginate) {
            List<BusSchedule> list = busScheduleRepository.findAll(Sort.by("dayOfWeek").ascending().and(Sort.by("startTime").ascending()));
            response.put("count", list.size());
            response.put("data", list);
            return response;
        }

        int pageNum = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (limit != null && limit > 0) ? limit : 10;
        Pageable pageable = PageRequest.of(pageNum, pageSize);

        Page<BusSchedule> schedulePage = busScheduleRepository.searchSchedules(
                dayOfWeek != null ? dayOfWeek.trim() : null,
                dirEnum,
                statEnum,
                assignmentId,
                search != null ? search.trim() : "",
                pageable
        );

        response.put("count", schedulePage.getContent().size());
        response.put("data", schedulePage.getContent());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageNum + 1);
        pagination.put("limit", pageSize);
        pagination.put("total", schedulePage.getTotalElements());
        pagination.put("totalPages", Math.max(1, schedulePage.getTotalPages()));
        response.put("pagination", pagination);

        return response;
    }

    public Map<String, Object> getScheduleById(Long id) {
        BusSchedule schedule = busScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Schedule Not Found."));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus schedule fetched successfully.");
        response.put("data", schedule);
        return response;
    }

    @Transactional
    public Map<String, Object> updateSchedule(Long id, Long assignmentId, String dayOfWeek, String startTime, String direction, String status) {
        BusSchedule schedule = busScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Schedule Not Found."));

        Long targetAssignmentId = assignmentId != null ? assignmentId : schedule.getAssignment().getId();
        String targetDay = dayOfWeek != null ? dayOfWeek.trim() : schedule.getDayOfWeek();
        String targetTime = startTime != null ? startTime.trim() : schedule.getStartTime();
        Direction targetDir = direction != null ? Direction.fromValue(direction.trim()) : schedule.getDirection();

        if (assignmentId != null) {
            Assignment assignment = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Assignment Not Found."));
            if (assignment.getStatus() != ScheduleStatus.ACTIVE) {
                throw new BadRequestException("Assignment is not Active.");
            }
            schedule.setAssignment(assignment);
        }

        if (busScheduleRepository.existsByAssignmentIdAndDayOfWeekAndStartTimeAndDirectionAndIdNot(
                targetAssignmentId, targetDay, targetTime, targetDir, id)) {
            throw new ConflictException("A schedule already exists for this assignment, day, time and direction.");
        }

        if (dayOfWeek != null) schedule.setDayOfWeek(targetDay);
        if (startTime != null) schedule.setStartTime(targetTime);
        if (direction != null) schedule.setDirection(targetDir);
        if (status != null) schedule.setStatus(ScheduleStatus.fromValue(status.trim()));

        BusSchedule updated = busScheduleRepository.save(schedule);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus schedule updated successfully.");
        response.put("data", updated);
        return response;
    }

    @Transactional
    public Map<String, Object> deactivateSchedule(Long id) {
        BusSchedule schedule = busScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus Schedule Not Found."));

        schedule.setStatus(ScheduleStatus.INACTIVE);
        BusSchedule updated = busScheduleRepository.save(schedule);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Bus schedule deactivated successfully.");
        response.put("data", updated);
        return response;
    }
}
