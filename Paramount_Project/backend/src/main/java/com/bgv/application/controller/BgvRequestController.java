package com.bgv.application.controller;

import com.bgv.application.dto.BgvRequestDTO;
import com.bgv.application.entity.BgvRequest;
import com.bgv.application.service.BgvRequestService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.core.io.PathResource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.http.HttpHeaders;

@CrossOrigin(
    origins = "https://d9wsu3rsp7svw.cloudfront.net",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/bgv-requests")
public class BgvRequestController {

    @Autowired
    private BgvRequestService bgvRequestService;

    @Autowired
    private com.bgv.application.service.ExcelUploadService excelUploadService;

    @Autowired
    private com.bgv.application.repository.BgvRequestHistoryRepository bgvRequestHistoryRepository;

    @Autowired
    private com.bgv.application.service.ConfigurationService configurationService;

    @Autowired
    private com.bgv.application.service.SharePointUploadService sharePointUploadService;

    @PostMapping
    public ResponseEntity<?> createRequest(@Valid @RequestBody BgvRequestDTO dto) {
        try {
            BgvRequest request = bgvRequestService.createRequest(dto);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "BGV Request created successfully");
            response.put("data", request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error creating BGV Request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createRequestMultipart(@RequestParam Map<String, String> params,
                                                    @RequestPart(required = false) MultipartFile evidence) {
        try {
            // Debug logging
            System.out.println("=== Multipart POST Request Received ===");
            System.out.println("Parameters received: " + params);
            System.out.println("employeeType param: " + params.get("employeeType"));
            System.out.println("Evidence file: " + (evidence != null ? evidence.getOriginalFilename() : "null"));
            
            BgvRequestDTO dto = new BgvRequestDTO();
            dto.setPsNumber(params.get("psNumber"));
            dto.setRequestedByName(params.get("requestedByName"));
            dto.setRrNumber(params.get("rrNumber") == null || params.get("rrNumber").isEmpty() ? null : Double.valueOf(params.get("rrNumber")));
            String employeeTypeStr = params.get("employeeType");
            System.out.println("employeeTypeStr before parsing: '" + employeeTypeStr + "'");
            try { 
                dto.setEmployeeType(employeeTypeStr != null && !employeeTypeStr.isEmpty() ? BgvRequest.EmployeeType.valueOf(employeeTypeStr) : null); 
            } catch (Exception ex) { 
                System.out.println("Failed to parse employeeType: " + ex.getMessage());
                dto.setEmployeeType(null); 
            }
            System.out.println("DTO employeeType after setting: " + dto.getEmployeeType());
            dto.setCandidateId(params.get("candidateId"));
            dto.setResourceName(params.get("resourceName"));
            dto.setResourcePsNo(params.get("resourcePsNo"));
            try { dto.setResourceType(BgvRequest.ResourceType.valueOf(params.get("resourceType"))); } catch (Exception ex) { dto.setResourceType(null); }
            try { dto.setGeoRegion(BgvRequest.GeoRegion.valueOf(params.get("geoRegion"))); } catch (Exception ex) { dto.setGeoRegion(null); }
            try { dto.setCountry(BgvRequest.Country.valueOf(params.get("country"))); } catch (Exception ex) { dto.setCountry(null); }
            try { dto.setStatus(BgvRequest.RequestStatus.valueOf(params.getOrDefault("status","PENDING"))); } catch (Exception ex) { dto.setStatus(BgvRequest.RequestStatus.PENDING); }
            dto.setBgvInitiatedBy(params.get("bgvInitiatedBy"));
            dto.setCommentsFromPmo(params.get("commentsFromPmo"));
            dto.setBgvStoppedReason(params.get("bgvStoppedReason"));
            try { dto.setOnboardingType(BgvRequest.OnboardingType.valueOf(params.get("onboardingType"))); } catch (Exception ex) { dto.setOnboardingType(null); }
            try { dto.setPriority(params.get("priority") != null ? BgvRequest.Priority.valueOf(params.get("priority")) : BgvRequest.Priority.NORMAL); } catch (Exception ex) { dto.setPriority(BgvRequest.Priority.NORMAL); }
            try { dto.setRequestSubmittedOn(params.get("requestSubmittedOn") == null || params.get("requestSubmittedOn").isEmpty() ? null : LocalDate.parse(params.get("requestSubmittedOn"))); } catch (Exception ex) { dto.setRequestSubmittedOn(null); }
            try { dto.setUserRole(BgvRequest.UserRole.valueOf(params.getOrDefault("userRole","PM"))); } catch (Exception ex) { dto.setUserRole(BgvRequest.UserRole.PM); }

            BgvRequest request = bgvRequestService.createRequest(dto, evidence);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "BGV Request created successfully");
            response.put("data", request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error creating BGV Request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequest(@PathVariable String id, @Valid @RequestBody BgvRequestDTO dto) {
        try {
            BgvRequest request = bgvRequestService.updateRequest(id, dto);
            if (request != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "BGV Request updated successfully");
                response.put("data", request);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "BGV Request not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating BGV Request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateRequestMultipart(@PathVariable String id,
                                                    @RequestParam Map<String, String> params,
                                                    @RequestPart(required = false) MultipartFile evidence) {
        try {
            BgvRequestDTO dto = new BgvRequestDTO();
            dto.setPsNumber(params.get("psNumber"));
            dto.setRequestedByName(params.get("requestedByName"));
            dto.setRrNumber(params.get("rrNumber") == null || params.get("rrNumber").isEmpty() ? null : Double.valueOf(params.get("rrNumber")));
            String employeeTypeStr = params.get("employeeType");
            try { 
                dto.setEmployeeType(employeeTypeStr != null && !employeeTypeStr.isEmpty() ? BgvRequest.EmployeeType.valueOf(employeeTypeStr) : null); 
            } catch (Exception ex) { 
                dto.setEmployeeType(null); 
            }
            dto.setCandidateId(params.get("candidateId"));
            dto.setResourceName(params.get("resourceName"));
            dto.setResourcePsNo(params.get("resourcePsNo"));
            try { dto.setResourceType(BgvRequest.ResourceType.valueOf(params.get("resourceType"))); } catch (Exception ex) { dto.setResourceType(null); }
            try { dto.setGeoRegion(BgvRequest.GeoRegion.valueOf(params.get("geoRegion"))); } catch (Exception ex) { dto.setGeoRegion(null); }
            try { dto.setCountry(BgvRequest.Country.valueOf(params.get("country"))); } catch (Exception ex) { dto.setCountry(null); }
            try { dto.setStatus(BgvRequest.RequestStatus.valueOf(params.getOrDefault("status","PENDING"))); } catch (Exception ex) { dto.setStatus(BgvRequest.RequestStatus.PENDING); }
            dto.setBgvInitiatedBy(params.get("bgvInitiatedBy"));
            dto.setCommentsFromPmo(params.get("commentsFromPmo"));
            try { dto.setOnboardingType(BgvRequest.OnboardingType.valueOf(params.get("onboardingType"))); } catch (Exception ex) { dto.setOnboardingType(null); }
            try { dto.setPriority(params.get("priority") != null ? BgvRequest.Priority.valueOf(params.get("priority")) : BgvRequest.Priority.NORMAL); } catch (Exception ex) { dto.setPriority(BgvRequest.Priority.NORMAL); }
            try { dto.setRequestSubmittedOn(params.get("requestSubmittedOn") == null || params.get("requestSubmittedOn").isEmpty() ? null : LocalDate.parse(params.get("requestSubmittedOn"))); } catch (Exception ex) { dto.setRequestSubmittedOn(null); }
            try { dto.setUserRole(BgvRequest.UserRole.valueOf(params.getOrDefault("userRole","PM"))); } catch (Exception ex) { dto.setUserRole(BgvRequest.UserRole.PM); }

            BgvRequest request = bgvRequestService.updateRequest(id, dto, evidence);
            if (request != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "BGV Request updated successfully");
                response.put("data", request);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "BGV Request not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating BGV Request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@PathVariable String id) {
        BgvRequest request = bgvRequestService.getRequest(id);
        if (request != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", request);
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "BGV Request not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllRequests() {
        List<BgvRequest> requests = bgvRequestService.getAllRequests();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", requests);
        response.put("total", requests.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<?> getRequestsByRole(@PathVariable String role) {
        List<BgvRequest> requests = bgvRequestService.getRequestsByRole(role);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", requests);
        response.put("total", requests.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getRequestsByStatus(@PathVariable String status) {
        List<BgvRequest> requests = bgvRequestService.getRequestsByStatus(status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", requests);
        response.put("total", requests.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ps/{psNumber}")
    public ResponseEntity<?> getRequestsByPsNumber(@PathVariable String psNumber) {
        try {
            List<BgvRequest> requests = bgvRequestService.getRequestsByPsNumber(psNumber);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", requests);
            response.put("total", requests.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching BGV Requests: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/employee-type/{employeeType}")
    public ResponseEntity<?> getRequestsByEmployeeType(@PathVariable String employeeType) {
        try {
            List<BgvRequest> requests = bgvRequestService.getRequestsByEmployeeType(employeeType);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", requests);
            response.put("total", requests.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching BGV Requests: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/history/ps/{psNumber}")
    public ResponseEntity<?> getHistoryByPsNumber(@PathVariable String psNumber) {
        try {
            List<com.bgv.application.entity.BgvRequestHistory> history = bgvRequestHistoryRepository
                .findByPsNumberOrderBySnapshotAtDesc(psNumber);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("total", history.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/history/resource-ps/{resourcePsNo}")
    public ResponseEntity<?> getHistoryByResourcePsNo(@PathVariable String resourcePsNo) {
        try {
            List<com.bgv.application.entity.BgvRequestHistory> history = bgvRequestHistoryRepository
                .findByResourcePsNoOrderBySnapshotAtDesc(resourcePsNo);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("total", history.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/history/candidate/{candidateId}")
    public ResponseEntity<?> getHistoryByCandidateId(@PathVariable String candidateId) {
        try {
            List<com.bgv.application.entity.BgvRequestHistory> history = bgvRequestHistoryRepository
                .findByCandidateIdOrderBySnapshotAtDesc(candidateId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("total", history.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/history/request/{requestId}")
    public ResponseEntity<?> getHistoryByRequestId(@PathVariable String requestId) {
        try {
            List<com.bgv.application.entity.BgvRequestHistory> history = bgvRequestHistoryRepository
                .findByBgvRequestIdOrderBySnapshotAtDesc(requestId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("total", history.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/history/search/{searchTerm}")
    public ResponseEntity<?> searchHistory(@PathVariable String searchTerm) {
        try {
            List<com.bgv.application.entity.BgvRequestHistory> history = bgvRequestHistoryRepository
                .searchHistory(searchTerm);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("total", history.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error searching history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping(path = "/excel-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadExcel(@RequestPart("file") MultipartFile file) {
        try {
            com.bgv.application.service.ExcelUploadService.UploadResult r = excelUploadService.importExcel(file);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Excel uploaded successfully");
            response.put("imported", r.imported);
            response.put("skipped", r.skipped);
            response.put("warnings", r.warnings);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error uploading Excel: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping(path = "/upload-evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadEvidence(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String psNumber,
            @RequestParam(required = false) String pmName,
            @RequestParam(required = false) String candidateName) {
        try {
            // Validate file
            if (file == null || file.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No file provided");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validate file type
            String filename = file.getOriginalFilename();
            if (filename == null || !isValidEvidenceFile(filename)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid file type. Allowed: png, jpg, jpeg, pdf, doc, docx, eml, msg");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Upload to SharePoint
            String sharepointUrl = sharePointUploadService.uploadToSharePoint(file, psNumber, pmName, candidateName);
            String generatedFilename = sharePointUploadService.buildEvidenceFilename(file.getOriginalFilename(), pmName, candidateName, psNumber);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Evidence uploaded successfully");
            response.put("evidencePath", sharepointUrl);
            response.put("filename", filename);
            response.put("generatedFilename", generatedFilename);
            response.put("configured", sharePointUploadService.isConfigured());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error uploading evidence: " + e.getMessage());
            response.put("configured", sharePointUploadService.isConfigured());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Validate evidence file extension
     */
    private boolean isValidEvidenceFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
               lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx") ||
               lower.endsWith(".eml") || lower.endsWith(".msg");
    }

    @GetMapping("/excel-upload")
    public ResponseEntity<?> getExcelRecordsByMonth(@RequestParam int year, @RequestParam int month) {
        try {
            List<com.bgv.application.entity.BgvExcelUploadRecord> rows = excelUploadService.getByMonth(year, month);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", rows);
            response.put("total", rows.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching Excel records: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/excel-upload/table")
    public ResponseEntity<?> getExcelTableByMonth(@RequestParam int year, @RequestParam int month) {
        try {
            com.bgv.application.service.ExcelUploadService.ExcelTable table = excelUploadService.getExcelTableByMonth(year, month);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("headers", table.headers);
            response.put("rows", table.rows);
            response.put("total", table.rows.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching Excel table: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/excel-upload/table/latest")
    public ResponseEntity<?> getLatestExcelTable() {
        try {
            com.bgv.application.service.ExcelUploadService.ExcelTableWithMeta latest = excelUploadService.getLatestExcelTable();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sourceFilename", latest.sourceFilename);
            response.put("uploadedAt", latest.uploadedAt);
            response.put("headers", latest.table.headers);
            response.put("rows", latest.table.rows);
            response.put("total", latest.table.rows.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching latest Excel table: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/config/country-georegion-mapping")
    public ResponseEntity<?> getCountryGeoRegionMapping() {
        try {
            Map<String, String> mapping = configurationService.getCountryToGeoRegionMapping();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", mapping);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error fetching country-georegion mapping: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PatchMapping("/{id}/priority")
    public ResponseEntity<?> updateRequestPriority(@PathVariable String id, @RequestBody Map<String, String> payload) {
        try {
            String priorityValue = payload.get("priority");
            if (priorityValue == null || priorityValue.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Priority value is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            BgvRequest request = bgvRequestService.getRequest(id);
            if (request == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "BGV Request not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Validate priority value
            try {
                BgvRequest.Priority.valueOf(priorityValue.toUpperCase());
            } catch (IllegalArgumentException e) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Invalid priority value. Must be HIGH, NORMAL, or LOW");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Update priority
            request.setPriority(priorityValue.toUpperCase());
            request.setUpdatedAt(java.time.Instant.now().getEpochSecond());
            BgvRequest updatedRequest = bgvRequestService.updateRequestDirect(request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Priority updated successfully");
            response.put("data", updatedRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating priority: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable String id) {
        bgvRequestService.deleteRequest(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "BGV Request deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<?> getEvidence(@PathVariable String id) {
        try {
            BgvRequest request = bgvRequestService.getRequest(id);
            if (request == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "BGV Request not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            String evidencePath = request.getEvidencePath();
            if (evidencePath == null || evidencePath.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "No evidence path found for this request");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            // For SharePoint or external URLs, redirect the user
            if (evidencePath.startsWith("http://") || evidencePath.startsWith("https://")) {
                return ResponseEntity.status(HttpStatus.FOUND)
                        .header(HttpHeaders.LOCATION, evidencePath)
                        .build();
            }
            
            // For local file paths (legacy/deprecated)
            Path filePath = Paths.get(evidencePath);
            if (!filePath.isAbsolute()) {
                // Resolve relative paths from uploads directory
                if (evidencePath.startsWith("uploads") || evidencePath.startsWith("./uploads") || evidencePath.startsWith("/uploads")) {
                    filePath = filePath.toAbsolutePath();
                } else {
                    filePath = Paths.get("uploads").resolve(filePath).toAbsolutePath();
                }
            }
            
            if (!Files.exists(filePath)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Evidence file not found at path: " + filePath.toString());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Resource resource = new PathResource(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            String filename = filePath.getFileName() != null ? filePath.getFileName().toString() : "evidence";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to retrieve evidence: " + e.getMessage());
            error.put("details", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

}
