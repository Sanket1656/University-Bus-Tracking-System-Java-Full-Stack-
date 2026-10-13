package com.university.bustracking.repository;

import com.university.bustracking.entity.Assignment;
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
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    Optional<Assignment> findByDriverIdAndStatus(Long driverId, ScheduleStatus status);
    Optional<Assignment> findByBusIdAndStatus(Long busId, ScheduleStatus status);
    boolean existsByBusIdAndStatus(Long busId, ScheduleStatus status);
    boolean existsByDriverIdAndStatus(Long driverId, ScheduleStatus status);
    boolean existsByBusIdAndStatusAndIdNot(Long busId, ScheduleStatus status, Long id);
    boolean existsByDriverIdAndStatusAndIdNot(Long driverId, ScheduleStatus status, Long id);
    long countByStatus(ScheduleStatus status);
    List<Assignment> findByStatus(ScheduleStatus status);

    long countByBusId(Long busId);
    long countByBusIdAndStatus(Long busId, ScheduleStatus status);
    long countByDriverId(Long driverId);
    long countByDriverIdAndStatus(Long driverId, ScheduleStatus status);
    long countByRouteId(Long routeId);
    long countByRouteIdAndStatus(Long routeId, ScheduleStatus status);

    List<Assignment> findAllByBusId(Long busId);
    List<Assignment> findAllByDriverId(Long driverId);
    List<Assignment> findAllByRouteId(Long routeId);
    List<Assignment> findAllByBusIdAndStatus(Long busId, ScheduleStatus status);
    List<Assignment> findAllByDriverIdAndStatus(Long driverId, ScheduleStatus status);
    List<Assignment> findAllByRouteIdAndStatus(Long routeId, ScheduleStatus status);


    @Query("SELECT a FROM Assignment a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(a.bus.busName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.bus.busNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.driver.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(a.driver.driverProfile IS NOT NULL AND LOWER(a.driver.driverProfile.name) LIKE LOWER(CONCAT('%', :search, '%'))) OR " +
           "LOWER(a.route.routeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.route.routeCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Assignment> searchAssignments(@Param("status") ScheduleStatus status, @Param("search") String search, Pageable pageable);
}
