package com.bgv.application.repository;

import com.bgv.application.entity.BgvRequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BgvRequestHistoryRepository extends JpaRepository<BgvRequestHistory, String> {

    List<BgvRequestHistory> findByPsNumberOrderBySnapshotAtDesc(String psNumber);

    List<BgvRequestHistory> findByResourcePsNoOrderBySnapshotAtDesc(String resourcePsNo);

    List<BgvRequestHistory> findByCandidateIdOrderBySnapshotAtDesc(String candidateId);

    @Query("""
        SELECT h FROM BgvRequestHistory h WHERE
        LOWER(h.psNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR
        LOWER(h.resourceName) LIKE LOWER(CONCAT('%', :term, '%')) OR
        LOWER(h.candidateId) LIKE LOWER(CONCAT('%', :term, '%')) OR
        LOWER(h.status) LIKE LOWER(CONCAT('%', :term, '%'))
        ORDER BY COALESCE(h.snapshotAt, h.createdAt) DESC
        """)
    List<BgvRequestHistory> searchHistory(@Param("term") String searchTerm);
}
