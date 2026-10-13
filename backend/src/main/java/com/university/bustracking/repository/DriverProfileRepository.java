package com.university.bustracking.repository;

import com.university.bustracking.entity.DriverProfile;
import com.university.bustracking.entity.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {
    Optional<DriverProfile> findByUserId(Long userId);
    void deleteByUserId(Long userId);
    Optional<DriverProfile> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByStatus(ScheduleStatus status);
}
