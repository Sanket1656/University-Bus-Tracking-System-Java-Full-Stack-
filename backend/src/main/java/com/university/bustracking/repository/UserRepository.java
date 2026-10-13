package com.university.bustracking.repository;

import com.university.bustracking.entity.Role;
import com.university.bustracking.entity.ScheduleStatus;
import com.university.bustracking.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByRole(Role role);
    long countByRole(Role role);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(:status IS NULL OR (u.driverProfile IS NOT NULL AND u.driverProfile.status = :status)) AND (" +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(u.driverProfile IS NOT NULL AND (LOWER(u.driverProfile.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.driverProfile.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.driverProfile.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.driverProfile.licenseId) LIKE LOWER(CONCAT('%', :search, '%')))))")
    Page<User> searchDrivers(@Param("role") Role role, @Param("search") String search, @Param("status") ScheduleStatus status, Pageable pageable);

    default Page<User> searchDrivers(Role role, String search, Pageable pageable) {
        return searchDrivers(role, search, null, pageable);
    }

    @Query("SELECT u FROM User u WHERE u.role = :role AND (" +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(u.studentProfile IS NOT NULL AND (LOWER(u.studentProfile.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.studentProfile.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.studentProfile.phone) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.studentProfile.branch) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.studentProfile.enrollmentNumber) LIKE LOWER(CONCAT('%', :search, '%'))))) " +
           "AND (:branch IS NULL OR :branch = '' OR :branch = 'all' OR (u.studentProfile IS NOT NULL AND LOWER(u.studentProfile.branch) = LOWER(:branch)))")
    Page<User> searchStudents(@Param("role") Role role, @Param("search") String search, @Param("branch") String branch, Pageable pageable);
}
