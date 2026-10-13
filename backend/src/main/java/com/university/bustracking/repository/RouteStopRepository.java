package com.university.bustracking.repository;

import com.university.bustracking.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {
    List<RouteStop> findByRouteIdOrderByStopOrderAsc(Long routeId);
    List<RouteStop> findByStopId(Long stopId);
    long countByStopId(Long stopId);
    void deleteByRouteId(Long routeId);
}
