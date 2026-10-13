package com.university.bustracking.repository;

import com.university.bustracking.entity.BusStop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusStopRepository extends JpaRepository<BusStop, Long> {
    Optional<BusStop> findByStopName(String stopName);

    @Query("SELECT bs FROM BusStop bs WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(bs.stopName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<BusStop> searchStops(@Param("search") String search, Pageable pageable);

    long countByLatitudeIsNotNullAndLongitudeIsNotNull();
    long countByStatus(com.university.bustracking.entity.ScheduleStatus status);
    java.util.List<BusStop> findByStatus(com.university.bustracking.entity.ScheduleStatus status);

}
