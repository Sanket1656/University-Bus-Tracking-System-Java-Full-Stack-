package com.university.bustracking.repository;

import com.university.bustracking.entity.CancellationStatus;
import com.university.bustracking.entity.RequestStatus;
import com.university.bustracking.entity.TransportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransportRequestRepository extends JpaRepository<TransportRequest, Long> {
    Optional<TransportRequest> findByStudentId(Long studentId);
    Optional<TransportRequest> findByStudentIdAndStatus(Long studentId, RequestStatus status);
    List<TransportRequest> findByStatus(RequestStatus status);
    List<TransportRequest> findByCancellationStatus(CancellationStatus cancellationStatus);
    List<TransportRequest> findByAssignmentIdAndStatus(Long assignmentId, RequestStatus status);
    List<TransportRequest> findByAssignmentIdAndStatusOrderBySeatNumberAsc(Long assignmentId, RequestStatus status);

    long countByPreferredStopId(Long preferredStopId);
    long countByPreferredStopIdAndStatus(Long preferredStopId, RequestStatus status);
    long countByAssignmentId(Long assignmentId);
    long countByAssignmentIdAndStatus(Long assignmentId, RequestStatus status);
    long countByStudentId(Long studentId);
    long countByAssignmentBusId(Long busId);
    long countByAssignmentRouteId(Long routeId);
    long countByAssignmentDriverId(Long driverId);
    boolean existsByAssignmentIdAndSeatNumberAndStatus(Long assignmentId, Integer seatNumber, RequestStatus status);
    boolean existsByAssignmentIdAndStudentIdAndStatus(Long assignmentId, Long studentId, RequestStatus status);
    Optional<TransportRequest> findByStudentIdAndStatusAndIdNot(Long studentId, RequestStatus status, Long id);

    List<TransportRequest> findAllByStudentId(Long studentId);
    List<TransportRequest> findAllByAssignmentId(Long assignmentId);
    List<TransportRequest> findAllByPreferredStopId(Long preferredStopId);


    @Query("SELECT tr FROM TransportRequest tr WHERE tr.status = :status AND tr.preferredStop.id IN :stopIds")
    List<TransportRequest> findPendingStudentsForStopIds(@Param("status") RequestStatus status, @Param("stopIds") List<Long> stopIds);

    @Query("SELECT DISTINCT tr.student.id FROM TransportRequest tr WHERE tr.assignment.id = :assignmentId AND tr.status = :status")
    List<Long> findStudentIdsByAssignmentIdAndStatus(@Param("assignmentId") Long assignmentId, @Param("status") RequestStatus status);

    @Query("SELECT tr FROM TransportRequest tr WHERE tr.preferredStop.id = :stopId AND tr.assignment.id = :assignmentId AND tr.status = :status")
    List<TransportRequest> findStudentsForStopAndAssignment(@Param("stopId") Long stopId, @Param("assignmentId") Long assignmentId, @Param("status") RequestStatus status);
}
