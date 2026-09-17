package com.bgv.application.service;

import com.bgv.application.dto.BgvRequestDTO;
import com.bgv.application.entity.BgvRequest;
import com.bgv.application.repository.BgvRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class BgvRequestService {

    @Autowired
    private BgvRequestRepository bgvRequestRepository;

    @Autowired
    private com.bgv.application.repository.BgvRequestHistoryRepository bgvRequestHistoryRepository;

    public BgvRequest createRequest(BgvRequestDTO dto) {
        if (dto.getCandidateId() != null && !dto.getCandidateId().trim().isEmpty()) {
            if (bgvRequestRepository.existsByCandidateId(dto.getCandidateId())) {
                throw new IllegalArgumentException("Candidate ID already exists: " + dto.getCandidateId());
            }
        }
        if (dto.getResourcePsNo() != null && !dto.getResourcePsNo().trim().isEmpty()) {
            if (bgvRequestRepository.existsByResourcePsNo(dto.getResourcePsNo())) {
                throw new IllegalArgumentException("Resource PS No already exists: " + dto.getResourcePsNo());
            }
        }

        BgvRequest request = new BgvRequest();
        mapDtoToEntity(dto, request);
        long now = Instant.now().getEpochSecond();
        request.setCreatedAt(now);
        request.setUpdatedAt(now);
        BgvRequest saved = bgvRequestRepository.save(request);

        saveHistorySnapshot(saved, "CREATE");
        return saved;
    }

    public BgvRequest updateRequest(String id, BgvRequestDTO dto) {
        Optional<BgvRequest> existingRequest = bgvRequestRepository.findById(id);
        if (existingRequest.isPresent()) {
            BgvRequest request = existingRequest.get();
            mapDtoToEntity(dto, request);
            request.setUpdatedAt(Instant.now().getEpochSecond());
            BgvRequest saved = bgvRequestRepository.save(request);
            saveHistorySnapshot(saved);
            return saved;
        }
        return null;
    }

    private void saveHistorySnapshot(BgvRequest request) {
        saveHistorySnapshot(request, "UPDATE");
    }

    private void saveHistorySnapshot(BgvRequest request, String action) {
        try {
            com.bgv.application.entity.BgvRequestHistory h = new com.bgv.application.entity.BgvRequestHistory();
            h.setBgvRequestId(request.getId());
            h.setAction(action);
            h.setPsNumber(request.getPsNumber());
            h.setRequestedByName(request.getRequestedByName());
            h.setRrNumber(request.getRrNumber());
            h.setEmployeeType(request.getEmployeeType());
            h.setCandidateId(request.getCandidateId());
            h.setResourceName(request.getResourceName());
            h.setResourcePsNo(request.getResourcePsNo());
            h.setResourceType(request.getResourceType());
            h.setGeoRegion(request.getGeoRegion());
            h.setCountry(request.getCountry());
            h.setStatus(request.getStatus());
            h.setBgvInitiatedBy(request.getBgvInitiatedBy());
            h.setCommentsFromPmo(request.getCommentsFromPmo());
            h.setBgvStoppedReason(request.getBgvStoppedReason());
            h.setOnboardingType(request.getOnboardingType());
            h.setPriority(request.getPriority());
            h.setRequestSubmittedOn(request.getRequestSubmittedOn());
            h.setUserRole(request.getUserRole());
            h.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : Instant.now().getEpochSecond());
            h.setSnapshotAt(Instant.now().getEpochSecond());
            bgvRequestHistoryRepository.save(h);
        } catch (Exception e) {
            System.err.println("Failed to save history snapshot: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public BgvRequest getRequest(String id) {
        return bgvRequestRepository.findById(id).orElse(null);
    }

    public List<BgvRequest> getAllRequests() {
        return bgvRequestRepository.findAll();
    }

    public List<BgvRequest> getRequestsByPsNumber(String psNumber) {
        return bgvRequestRepository.findByPsNumber(psNumber);
    }

    private void mapDtoToEntity(BgvRequestDTO dto, BgvRequest request) {
        request.setPsNumber(dto.getPsNumber());
        request.setRequestedByName(dto.getRequestedByName());
        request.setRrNumber(dto.getRrNumber());
        request.setEmployeeType(dto.getEmployeeType() != null ? dto.getEmployeeType().name() : null);
        request.setCandidateId(dto.getCandidateId());
        request.setResourceName(dto.getResourceName());
        request.setResourcePsNo(dto.getResourcePsNo());
        request.setResourceType(dto.getResourceType() != null ? dto.getResourceType().name() : null);
        request.setGeoRegion(dto.getGeoRegion() != null ? dto.getGeoRegion().name() : null);
        request.setCountry(dto.getCountry() != null ? dto.getCountry().name() : null);
        request.setStatus(dto.getStatus() != null ? dto.getStatus().name() : null);
        request.setBgvInitiatedBy(dto.getBgvInitiatedBy());
        if (dto.getCommentsFromPmo() != null) {
            request.setCommentsFromPmo(dto.getCommentsFromPmo().trim());
        }
        if (dto.getBgvStoppedReason() != null) {
            request.setBgvStoppedReason(dto.getBgvStoppedReason().trim());
        }
        request.setOnboardingType(dto.getOnboardingType() != null ? dto.getOnboardingType().name() : null);
        request.setPriority(dto.getPriority() != null ? dto.getPriority().name() : "NORMAL");
        request.setRequestSubmittedOn(dto.getRequestSubmittedOn() != null ? dto.getRequestSubmittedOn().toString() : null);
        request.setUserRole(dto.getUserRole() != null ? dto.getUserRole().name() : null);

        request.setInterimDate(dto.getInterimDate() != null && !dto.getInterimDate().trim().isEmpty() ? dto.getInterimDate().trim() : null);
        request.setInterimStatus(dto.getInterimStatus() != null && !dto.getInterimStatus().trim().isEmpty() ? dto.getInterimStatus().trim() : null);
        request.setFinalBgvDate(dto.getFinalBgvDate() != null && !dto.getFinalBgvDate().trim().isEmpty() ? dto.getFinalBgvDate().trim() : null);
        request.setFinalBgvStatus(dto.getFinalBgvStatus() != null && !dto.getFinalBgvStatus().trim().isEmpty() ? dto.getFinalBgvStatus().trim() : null);
    }

}
