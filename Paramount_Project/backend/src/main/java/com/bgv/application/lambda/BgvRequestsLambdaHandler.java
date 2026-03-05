package com.bgv.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.bgv.application.dto.BgvRequestDTO;
import com.bgv.application.entity.BgvRequest;
import com.bgv.application.service.BgvRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight Lambda Handler for BGV Requests (CRUD + filters + priority).
 * Alternative to StreamLambdaHandler - doesn't use full Spring Boot, only Spring Context.
 * Use this for better cold start performance if needed.
 * 
 * Handler: com.bgv.application.lambda.BgvRequestsLambdaHandler::handleRequest
 */
public class BgvRequestsLambdaHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static AnnotationConfigApplicationContext springContext;
    private static BgvRequestService bgvRequestService;
    private static ObjectMapper objectMapper;
    
    static {
        // Initialize Spring context on cold start
        springContext = new AnnotationConfigApplicationContext(SpringConfig.class);
        bgvRequestService = springContext.getBean(BgvRequestService.class);
        
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }
    
    @Configuration
    @ComponentScan(basePackages = "com.bgv.application")
    static class SpringConfig {
    }
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Handling request: " + request.getHttpMethod() + " " + request.getPath());
        
        try {
            String method = request.getHttpMethod();
            String path = request.getPath();
            
            // Parse path segments after /api/bgv-requests
            String[] segments = path.replaceFirst(".*/api/bgv-requests/?", "").split("/");
            
            // Root: GET /api/bgv-requests (list all)
            if ("GET".equals(method) && (segments.length == 0 || segments[0].isEmpty())) {
                return handleListRequests();
            }
            
            // Root: POST /api/bgv-requests (create)
            if ("POST".equals(method) && (segments.length == 0 || segments[0].isEmpty())) {
                return handleCreateRequest(request);
            }
            
            // Single resource: GET /api/bgv-requests/{id}
            if ("GET".equals(method) && segments.length == 1) {
                return handleGetRequestById(segments[0]);
            }
            
            // Single resource: PUT /api/bgv-requests/{id}
            if ("PUT".equals(method) && segments.length == 1) {
                return handleUpdateRequest(segments[0], request);
            }
            
            // Single resource: DELETE /api/bgv-requests/{id}
            if ("DELETE".equals(method) && segments.length == 1) {
                return handleDeleteRequest(segments[0]);
            }
            
            // Filter by status: GET /api/bgv-requests/status/{status}
            if ("GET".equals(method) && segments.length == 2 && "status".equals(segments[0])) {
                return handleGetByStatus(segments[1]);
            }
            
            // Filter by psNumber: GET /api/bgv-requests/ps/{psNumber}
            if ("GET".equals(method) && segments.length == 2 && "ps".equals(segments[0])) {
                return handleGetByPsNumber(segments[1]);
            }
            
            // Filter by candidateId: GET /api/bgv-requests/candidate/{candidateId}
            if ("GET".equals(method) && segments.length == 2 && "candidate".equals(segments[0])) {
                return handleGetByCandidateId(segments[1]);
            }
            
            // Filter by resourcePsNo: GET /api/bgv-requests/resource/{resourcePsNo}
            if ("GET".equals(method) && segments.length == 2 && "resource".equals(segments[0])) {
                return handleGetByResourcePsNo(segments[1]);
            }
            
            // Priority update: PATCH /api/bgv-requests/{id}/priority
            if ("PATCH".equals(method) && segments.length == 2 && "priority".equals(segments[1])) {
                return handleUpdatePriority(segments[0], request);
            }
            
            return errorResponse(404, "Endpoint not found: " + method + " " + path);
            
        } catch (Exception e) {
            context.getLogger().log("Error handling request: " + e.getMessage());
            e.printStackTrace();
            return errorResponse(500, "Internal server error: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent handleListRequests() throws Exception {
        List<BgvRequest> requests = bgvRequestService.getAllRequests();
        return successResponse(Map.of(
            "success", true,
            "total", requests.size(),
            "data", requests
        ));
    }
    
    private APIGatewayProxyResponseEvent handleCreateRequest(APIGatewayProxyRequestEvent request) throws Exception {
        BgvRequestDTO dto = objectMapper.readValue(request.getBody(), BgvRequestDTO.class);
        BgvRequest created = bgvRequestService.createRequest(dto);
        return successResponse(Map.of(
            "success", true,
            "message", "BGV Request created successfully",
            "data", created
        ), 201);
    }
    
    private APIGatewayProxyResponseEvent handleGetRequestById(String id) throws Exception {
        BgvRequest bgvRequest = bgvRequestService.getRequest(id);
        if (bgvRequest == null) {
            return errorResponse(404, "BGV Request not found");
        }
        return successResponse(Map.of("success", true, "data", bgvRequest));
    }
    
    private APIGatewayProxyResponseEvent handleUpdateRequest(String id, APIGatewayProxyRequestEvent request) throws Exception {
        BgvRequestDTO dto = objectMapper.readValue(request.getBody(), BgvRequestDTO.class);
        BgvRequest updated = bgvRequestService.updateRequest(id, dto);
        if (updated == null) {
            return errorResponse(404, "BGV Request not found");
        }
        return successResponse(Map.of(
            "success", true,
            "message", "BGV Request updated successfully",
            "data", updated
        ));
    }
    
    private APIGatewayProxyResponseEvent handleDeleteRequest(String id) throws Exception {
        try {
            bgvRequestService.deleteRequest(id);
            return successResponse(Map.of("success", true, "message", "BGV Request deleted successfully"));
        } catch (Exception e) {
            return errorResponse(404, "BGV Request not found");
        }
    }
    
    private APIGatewayProxyResponseEvent handleGetByStatus(String status) throws Exception {
        List<BgvRequest> requests = bgvRequestService.getRequestsByStatus(status);
        return successResponse(Map.of("success", true, "total", requests.size(), "data", requests));
    }
    
    private APIGatewayProxyResponseEvent handleGetByPsNumber(String psNumber) throws Exception {
        List<BgvRequest> requests = bgvRequestService.getRequestsByPsNumber(psNumber);
        return successResponse(Map.of("success", true, "total", requests.size(), "data", requests));
    }
    
    private APIGatewayProxyResponseEvent handleGetByCandidateId(String candidateId) throws Exception {
        // Use repository directly since service doesn't have this method
        List<BgvRequest> requests = bgvRequestService.getAllRequests().stream()
            .filter(r -> candidateId.equals(r.getCandidateId()))
            .toList();
        return successResponse(Map.of("success", true, "total", requests.size(), "data", requests));
    }
    
    private APIGatewayProxyResponseEvent handleGetByResourcePsNo(String resourcePsNo) throws Exception {
        // Use repository directly since service doesn't have this method
        List<BgvRequest> requests = bgvRequestService.getAllRequests().stream()
            .filter(r -> resourcePsNo.equals(r.getResourcePsNo()))
            .toList();
        return successResponse(Map.of("success", true, "total", requests.size(), "data", requests));
    }
    
    private APIGatewayProxyResponseEvent handleUpdatePriority(String id, APIGatewayProxyRequestEvent request) throws Exception {
        @SuppressWarnings("unchecked")
        Map<String, String> body = objectMapper.readValue(request.getBody(), Map.class);
        String priority = body.get("priority");
        
        if (priority == null || priority.trim().isEmpty()) {
            return errorResponse(400, "priority is required");
        }
        
        // Get current request, update priority, and save
        BgvRequest current = bgvRequestService.getRequest(id);
        if (current == null) {
            return errorResponse(404, "BGV Request not found");
        }
        
        current.setPriority(priority.toUpperCase());
        BgvRequest updated = bgvRequestService.updateRequestDirect(current);
        
        return successResponse(Map.of(
            "success", true,
            "message", "Priority updated successfully",
            "data", updated
        ));
    }
    
    private APIGatewayProxyResponseEvent successResponse(Map<String, Object> body) throws Exception {
        return successResponse(body, 200);
    }
    
    private APIGatewayProxyResponseEvent successResponse(Map<String, Object> body, int statusCode) throws Exception {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);
        response.setHeaders(getCorsHeaders());
        response.setBody(objectMapper.writeValueAsString(body));
        return response;
    }
    
    private APIGatewayProxyResponseEvent errorResponse(int statusCode, String message) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(statusCode);
        response.setHeaders(getCorsHeaders());
        response.setBody("{\"success\":false,\"message\":\"" + message + "\"}");
        return response;
    }
    
    private Map<String, String> getCorsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
        headers.put("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        return headers;
    }
}
