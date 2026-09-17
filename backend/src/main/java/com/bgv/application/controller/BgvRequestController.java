package com.bgv.application.controller;

import com.bgv.application.dto.BgvRequestDTO;
import com.bgv.application.entity.BgvRequest;
import com.bgv.application.service.BgvRequestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bgv-requests")
public class BgvRequestController {

    @Autowired
    private BgvRequestService bgvRequestService;

    @Autowired
    private com.bgv.application.repository.BgvRequestHistoryRepository bgvRequestHistoryRepository;

    @Autowired
    private com.bgv.application.service.ConfigurationService configurationService;

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

}
