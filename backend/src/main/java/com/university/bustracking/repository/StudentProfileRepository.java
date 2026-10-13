package com.university.bustracking.repository;

import com.university.bustracking.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByUserId(Long userId);
    void deleteByUserId(Long userId);

    @Query("SELECT DISTINCT sp.branch FROM StudentProfile sp WHERE sp.branch IS NOT NULL AND sp.branch != '' ORDER BY sp.branch ASC")
    List<String> findDistinctBranches();
}
