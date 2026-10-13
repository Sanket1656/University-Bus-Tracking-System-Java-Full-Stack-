package com.university.bustracking.repository;

import com.university.bustracking.entity.BusLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusLocationRepository extends JpaRepository<BusLocation, Long> {
    Optional<BusLocation> findByBusId(Long busId);
    List<BusLocation> findByBusIdIn(List<Long> busIds);
    List<BusLocation> findByIsMovingTrue();

    long countByBusId(Long busId);
    boolean existsByBusId(Long busId);
    long countByCurrentStop_IdOrNextStop_Id(Long currentStopId, Long nextStopId);
    void deleteByBusId(Long busId);

}
