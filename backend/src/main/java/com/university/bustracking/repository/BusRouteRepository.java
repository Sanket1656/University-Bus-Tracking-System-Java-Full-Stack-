package com.university.bustracking.repository;

import com.university.bustracking.entity.BusRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRouteRepository extends JpaRepository<BusRoute, Long> {
    Optional<BusRoute> findByRouteCode(String routeCode);
    boolean existsByRouteCode(String routeCode);
    long countByStatus(com.university.bustracking.entity.ScheduleStatus status);
    java.util.List<BusRoute> findByStatus(com.university.bustracking.entity.ScheduleStatus status);


    @Query("SELECT r FROM BusRoute r WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(r.routeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.routeCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<BusRoute> searchRoutes(@Param("search") String search, Pageable pageable);
}
