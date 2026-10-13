package com.university.bustracking.repository;

import com.university.bustracking.entity.BusSchedule;
import com.university.bustracking.entity.Direction;
import com.university.bustracking.entity.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusScheduleRepository extends JpaRepository<BusSchedule, Long> {
    List<BusSchedule> findByAssignmentIdAndStatus(Long assignmentId, ScheduleStatus status);
    List<BusSchedule> findByAssignmentIdInAndDayOfWeekAndStatus(List<Long> assignmentIds, String dayOfWeek, ScheduleStatus status);
    List<BusSchedule> findByAssignmentIdInAndDayOfWeekAndStatusOrderByStartTimeAsc(List<Long> assignmentIds, String dayOfWeek, ScheduleStatus status);
    List<BusSchedule> findByAssignmentIdAndStatusOrderByDayOfWeekAscStartTimeAsc(Long assignmentId, ScheduleStatus status);

    @Query("SELECT s FROM BusSchedule s WHERE s.assignment.id IN :assignmentIds " +
           "AND LOWER(s.dayOfWeek) = LOWER(:dayOfWeek) AND s.status = :status ORDER BY s.startTime ASC")
    List<BusSchedule> findTodayActiveSchedules(
        @Param("assignmentIds") List<Long> assignmentIds,
        @Param("dayOfWeek") String dayOfWeek,
        @Param("status") ScheduleStatus status
    );

    boolean existsByAssignmentIdAndDayOfWeekAndStartTimeAndDirection(Long assignmentId, String dayOfWeek, String startTime, Direction direction);
    boolean existsByAssignmentIdAndDayOfWeekAndStartTimeAndDirectionAndIdNot(Long assignmentId, String dayOfWeek, String startTime, Direction direction, Long id);

    long countByStatus(ScheduleStatus status);
    long countByStatusAndDirection(ScheduleStatus status, Direction direction);

    long countByAssignmentId(Long assignmentId);
    long countByAssignmentIdAndStatus(Long assignmentId, ScheduleStatus status);
    long countByAssignmentBusId(Long busId);
    long countByAssignmentBusIdAndStatus(Long busId, ScheduleStatus status);
    long countByAssignmentRouteId(Long routeId);
    long countByAssignmentRouteIdAndStatus(Long routeId, ScheduleStatus status);
    long countByAssignmentDriverId(Long driverId);
    long countByAssignmentDriverIdAndStatus(Long driverId, ScheduleStatus status);

    List<BusSchedule> findAllByAssignmentId(Long assignmentId);
    List<BusSchedule> findAllByAssignmentIdAndStatus(Long assignmentId, ScheduleStatus status);
    List<BusSchedule> findAllByAssignmentBusId(Long busId);
    List<BusSchedule> findAllByAssignmentRouteId(Long routeId);
    List<BusSchedule> findAllByAssignmentDriverId(Long driverId);


    @Query("SELECT s FROM BusSchedule s WHERE " +
           "(:dayOfWeek IS NULL OR :dayOfWeek = '' OR s.dayOfWeek = :dayOfWeek) AND " +
           "(:direction IS NULL OR s.direction = :direction) AND " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:assignmentId IS NULL OR s.assignment.id = :assignmentId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(s.dayOfWeek) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.startTime) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.assignment.bus.busNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.assignment.bus.busName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.assignment.driver.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(s.assignment.driver.driverProfile IS NOT NULL AND LOWER(s.assignment.driver.driverProfile.name) LIKE LOWER(CONCAT('%', :search, '%'))) OR " +
           "LOWER(s.assignment.route.routeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.assignment.route.routeCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<BusSchedule> searchSchedules(
        @Param("dayOfWeek") String dayOfWeek,
        @Param("direction") Direction direction,
        @Param("status") ScheduleStatus status,
        @Param("assignmentId") Long assignmentId,
        @Param("search") String search,
        Pageable pageable
    );
}
