package com.bgv.application.service;

import com.bgv.application.dto.BgvRequestDTO;
import com.bgv.application.entity.BgvRequest;
import com.bgv.application.repository.BgvRequestRepository;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class BgvRequestService {

    @Value("${sharepoint.folder.url:https://ltimindtree.sharepoint.com/:f:/r/sites/Paramount_Global/Shared%20Documents/Streaming/BGV%20Process%20Files}")
    private String approvedExpressEvidenceLinkPrefix;

    @Autowired
    private BgvRequestRepository bgvRequestRepository;
    
    @Autowired
    private com.bgv.application.repository.BgvRequestHistoryRepository bgvRequestHistoryRepository;

    @Autowired(required = false)
    private OpenSearchService openSearchService;

    public BgvRequest createRequest(BgvRequestDTO dto) {
        validateEvidenceStoragePolicy(dto);

        // Validate unique constraints
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
        
        // Index in OpenSearch for searchability
        if (openSearchService != null) {
            try {
                openSearchService.indexBgvRequest(saved);
            } catch (Exception e) {
                System.err.println("Failed to index request in OpenSearch: " + e.getMessage());
            }
        }
        
        // save history snapshot with CREATE action
        saveHistorySnapshot(saved, "CREATE");
        return saved;
    }

    /**
     * Create BGV request with optional file upload (DEPRECATED - use evidencePath URL instead)
     * 
     * @deprecated As of version 2.0, replaced by storing evidence URLs in evidencePath field.
     * Evidence should be uploaded to Teams/SharePoint and the link stored in evidencePath.
     * This method is kept for backward compatibility but file uploads are no longer stored.
     */
    @Deprecated
    public BgvRequest createRequest(BgvRequestDTO dto, MultipartFile evidence) throws IOException {
        // Storage Optimization: PM file submissions are not stored in backend to minimize cloud storage costs
        // Evidence files are only validated for existence, but not persisted
        // NEW: Evidence should be uploaded to Teams/SharePoint and URL stored in dto.evidencePath
        if (evidence != null && !evidence.isEmpty()) {
            throw new IllegalArgumentException(
                "Direct file upload is not allowed. Upload evidence only to the approved SharePoint folder and store its link in evidencePath."
            );
        }
        return createRequest(dto);
    }

    public BgvRequest updateRequest(String id, BgvRequestDTO dto) {
        validateEvidenceStoragePolicy(dto);

        Optional<BgvRequest> existingRequest = bgvRequestRepository.findById(id);
        if (existingRequest.isPresent()) {
            BgvRequest request = existingRequest.get();
            mapDtoToEntity(dto, request);
            request.setUpdatedAt(Instant.now().getEpochSecond());
            BgvRequest saved = bgvRequestRepository.save(request);
            
            // Update OpenSearch index
            if (openSearchService != null) {
                try {
                    openSearchService.indexBgvRequest(saved);
                } catch (Exception e) {
                    System.err.println("Failed to update request in OpenSearch: " + e.getMessage());
                }
            }
            
            // save history snapshot
            saveHistorySnapshot(saved);
            return saved;
        }
        return null;
    }

    /**
     * Update BGV request with optional file upload (DEPRECATED - use evidencePath URL instead)
     * 
     * @deprecated As of version 2.0, replaced by storing evidence URLs in evidencePath field.
     * Evidence should be uploaded to Teams/SharePoint and the link stored in evidencePath.
     * This method is kept for backward compatibility but file uploads are no longer stored.
     */
    @Deprecated
    public BgvRequest updateRequest(String id, BgvRequestDTO dto, MultipartFile evidence) throws IOException {
        // Storage Optimization: PM file submissions are not stored in backend to minimize cloud storage costs
        // Evidence files are only validated for existence, but not persisted
        // NEW: Evidence should be uploaded to Teams/SharePoint and URL stored in dto.evidencePath
        if (evidence != null && !evidence.isEmpty()) {
            throw new IllegalArgumentException(
                "Direct file upload is not allowed. Upload evidence only to the approved SharePoint folder and store its link in evidencePath."
            );
        }
        return updateRequest(id, dto);
    }

    // Direct update method for internal use (e.g., priority updates)
    public BgvRequest updateRequestDirect(BgvRequest request) {
        BgvRequest saved = bgvRequestRepository.save(request);
        
        // Update OpenSearch index
        if (openSearchService != null) {
            try {
                openSearchService.indexBgvRequest(saved);
            } catch (Exception e) {
                System.err.println("Failed to update request in OpenSearch: " + e.getMessage());
            }
        }
        
        // save history snapshot
        saveHistorySnapshot(saved);
        return saved;
    }

    private void saveHistorySnapshot(BgvRequest request) {
        saveHistorySnapshot(request, "UPDATE");
    }

    private void saveHistorySnapshot(BgvRequest request, String action) {
        try {
            com.bgv.application.entity.BgvRequestHistory h = new com.bgv.application.entity.BgvRequestHistory();
            h.setHistoryId(java.util.UUID.randomUUID().toString());
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
            h.setEvidencePath(request.getEvidencePath());
            h.setPriority(request.getPriority());
            h.setRequestSubmittedOn(request.getRequestSubmittedOn());
            h.setUserRole(request.getUserRole());
            // Store the original creation time for reference
            h.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : Instant.now().getEpochSecond());
            // Snapshot timestamp is ALWAYS now
            h.setSnapshotAt(Instant.now().getEpochSecond());
            bgvRequestHistoryRepository.save(h);
        } catch (Exception e) {
            // Log the error but don't block the main flow
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

    public List<BgvRequest> getRequestsByRole(String role) {
        return bgvRequestRepository.findByUserRole(role);
    }

    public List<BgvRequest> getRequestsByStatus(String status) {
        return bgvRequestRepository.findByStatus(status);
    }

    public List<BgvRequest> getRequestsByPsNumber(String psNumber) {
        return bgvRequestRepository.findByPsNumber(psNumber);
    }

    public List<BgvRequest> getRequestsByEmployeeType(String employeeType) {
        return bgvRequestRepository.findByEmployeeType(employeeType);
    }

    // Use OpenSearch for resource name search
    public List<BgvRequest> getRequestsByResourceName(String resourceName) {
        if (openSearchService != null) {
            try {
                return openSearchService.searchByResourceName(resourceName);
            } catch (Exception e) {
                System.err.println("OpenSearch query failed, falling back to scan: " + e.getMessage());
            }
        }
        return List.of();
    }

    public void deleteRequest(String id) {
        bgvRequestRepository.deleteById(id);
        if (openSearchService != null) {
            try {
                openSearchService.deleteBgvRequest(id);
            } catch (Exception e) {
                System.err.println("Failed to delete from OpenSearch: " + e.getMessage());
            }
        }
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
        // only overwrite evidencePath when DTO explicitly provides a value
        if (dto.getEvidencePath() != null) {
            request.setEvidencePath(dto.getEvidencePath());
        }
        request.setRequestSubmittedOn(dto.getRequestSubmittedOn() != null ? dto.getRequestSubmittedOn().toString() : null);
        request.setUserRole(dto.getUserRole() != null ? dto.getUserRole().name() : null);
        
        // Interim and Final BGV fields
        request.setInterimDate(dto.getInterimDate() != null && !dto.getInterimDate().trim().isEmpty() ? dto.getInterimDate().trim() : null);
        request.setInterimStatus(dto.getInterimStatus() != null && !dto.getInterimStatus().trim().isEmpty() ? dto.getInterimStatus().trim() : null);
        request.setFinalBgvDate(dto.getFinalBgvDate() != null && !dto.getFinalBgvDate().trim().isEmpty() ? dto.getFinalBgvDate().trim() : null);
        request.setFinalBgvStatus(dto.getFinalBgvStatus() != null && !dto.getFinalBgvStatus().trim().isEmpty() ? dto.getFinalBgvStatus().trim() : null);
    }

    private void validateEvidenceStoragePolicy(BgvRequestDTO dto) {
        if (dto == null) return;

        String evidencePath = dto.getEvidencePath() != null ? dto.getEvidencePath().trim() : null;

        if (evidencePath != null && !evidencePath.isEmpty()) {
            String lower = evidencePath.toLowerCase();
            if (lower.startsWith("uploads") || lower.startsWith("./uploads") || lower.startsWith("/uploads") || evidencePath.matches("^[A-Za-z]:\\\\.*")) {
                throw new IllegalArgumentException("Evidence must not be stored in local uploads path. Use approved SharePoint link only.");
            }
        }

        // For EXPRESS_REQUEST, evidence is optional but if provided, must be SharePoint link
        if (dto.getOnboardingType() == BgvRequest.OnboardingType.EXPRESS_REQUEST) {
            if (evidencePath != null && !evidencePath.isEmpty() && !evidencePath.startsWith(approvedExpressEvidenceLinkPrefix)) {
                throw new IllegalArgumentException("For EXPRESS_REQUEST, evidence must reference the approved SharePoint folder link only.");
            }
        }
    }

    private String storeEvidenceFile(MultipartFile file) throws IOException {
        Path uploads = Paths.get("uploads");
        if (!Files.exists(uploads)) {
            Files.createDirectories(uploads);
        }
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID().toString() + ext;
        Path dest = uploads.resolve(filename);
        Files.copy(file.getInputStream(), dest);
        // return only filename (controller will resolve under uploads/)
        return filename;
    }

}

