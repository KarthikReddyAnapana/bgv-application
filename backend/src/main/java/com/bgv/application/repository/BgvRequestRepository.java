package com.bgv.application.repository;

import com.bgv.application.entity.BgvRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BgvRequestRepository extends JpaRepository<BgvRequest, String> {

    List<BgvRequest> findByPsNumber(String psNumber);

    boolean existsByCandidateId(String candidateId);

    boolean existsByResourcePsNo(String resourcePsNo);
}
