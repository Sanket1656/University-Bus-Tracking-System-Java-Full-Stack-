package com.university.bustracking.repository;

import com.university.bustracking.entity.Bus;
import com.university.bustracking.entity.BusStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    Optional<Bus> findByBusNumber(String busNumber);
    Optional<Bus> findByBusRegistrationNumber(String busRegistrationNumber);
    boolean existsByBusNumber(String busNumber);
    boolean existsByBusRegistrationNumber(String busRegistrationNumber);
    long countByBusStatus(BusStatus busStatus);

    @Query("SELECT b FROM Bus b WHERE " +
           "(:status IS NULL OR b.busStatus = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(b.busName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.busNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.busRegistrationNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Bus> searchBuses(@Param("status") BusStatus status, @Param("search") String search, Pageable pageable);
}
