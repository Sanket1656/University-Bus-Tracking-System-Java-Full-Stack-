package com.university.bustracking.repository;

import com.university.bustracking.entity.Direction;
import com.university.bustracking.entity.Trip;
import com.university.bustracking.entity.TripStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    Optional<Trip> findByDriverIdAndStatus(Long driverId, TripStatus status);
    Optional<Trip> findByBusIdAndStatus(Long busId, TripStatus status);
    Optional<Trip> findFirstByBusIdOrderByCreatedAtDesc(Long busId);

    Optional<Trip> findByScheduleIdAndDriverIdAndStatus(Long scheduleId, Long driverId, TripStatus status);
    List<Trip> findByScheduleIdIn(List<Long> scheduleIds);
    List<Trip> findByStatus(TripStatus status);

    long countByBusId(Long busId);
    long countByBusIdAndStatus(Long busId, TripStatus status);
    long countByDriverId(Long driverId);
    long countByDriverIdAndStatus(Long driverId, TripStatus status);
    long countByRouteId(Long routeId);
    long countByRouteIdAndStatus(Long routeId, TripStatus status);
    long countByScheduleId(Long scheduleId);
    long countByScheduleIdAndStatus(Long scheduleId, TripStatus status);
    long countByScheduleAssignmentId(Long assignmentId);
    long countByScheduleAssignmentIdAndStatus(Long assignmentId, TripStatus status);

    boolean existsByBusIdAndStatus(Long busId, TripStatus status);
    boolean existsByDriverIdAndStatus(Long driverId, TripStatus status);
    boolean existsByRouteIdAndStatus(Long routeId, TripStatus status);
    boolean existsByScheduleIdAndStatus(Long scheduleId, TripStatus status);
    boolean existsByScheduleAssignmentIdAndStatus(Long assignmentId, TripStatus status);


    @Query("SELECT t FROM Trip t WHERE t.schedule.id = :scheduleId AND t.driver.id = :driverId " +
           "AND t.status IN :statuses AND t.endedAt >= :startOfDay AND t.endedAt < :endOfDay ORDER BY t.endedAt DESC")
    List<Trip> findCompletedTodayTrips(
        @Param("scheduleId") Long scheduleId,
        @Param("driverId") Long driverId,
        @Param("statuses") List<TripStatus> statuses,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("SELECT t FROM Trip t WHERE t.schedule.id IN :scheduleIds " +
           "AND t.startedAt >= :startOfDay AND t.startedAt < :endOfDay ORDER BY t.startedAt ASC")
    List<Trip> findTodayTripsByScheduleIds(
        @Param("scheduleIds") List<Long> scheduleIds,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("SELECT t FROM Trip t WHERE " +
           "(:driverId IS NULL OR t.driver.id = :driverId) AND " +
           "(:busId IS NULL OR t.bus.id = :busId) AND " +
           "(:routeId IS NULL OR t.route.id = :routeId) AND " +
           "(:direction IS NULL OR t.direction = :direction) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:startOfDay IS NULL OR t.startedAt >= :startOfDay) AND " +
           "(:endOfDay IS NULL OR t.startedAt < :endOfDay)")
    Page<Trip> findTripHistory(
        @Param("driverId") Long driverId,
        @Param("busId") Long busId,
        @Param("routeId") Long routeId,
        @Param("direction") Direction direction,
        @Param("status") TripStatus status,
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay,
        Pageable pageable
    );
}
