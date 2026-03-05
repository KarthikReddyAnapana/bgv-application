package com.bgv.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.bgv.application.entity.BgvRequestHistory;
import com.bgv.application.repository.BgvRequestHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lambda Handler for BGV History queries.
 * Handler: com.bgv.application.lambda.BgvHistoryLambdaHandler::handleRequest
 */
public class BgvHistoryLambdaHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static AnnotationConfigApplicationContext springContext;
    private static BgvRequestHistoryRepository historyRepository;
    private static ObjectMapper objectMapper;
    
    static {
        springContext = new AnnotationConfigApplicationContext(SpringConfig.class);
        historyRepository = springContext.getBean(BgvRequestHistoryRepository.class);
        
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }
    
    @Configuration
    @ComponentScan(basePackages = "com.bgv.application")
    static class SpringConfig {
    }
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("History Handler - Method: " + request.getHttpMethod() + ", Path: " + request.getPath());
        
        try {
            String method = request.getHttpMethod();
            String path = request.getPath();
            
            // Parse path segments after /api/bgv-requests/history
            String[] segments = path.replaceFirst(".*/api/bgv-requests/history/?", "").split("/");
            
            // GET /api/bgv-requests/history/ps/{psNumber}
            if ("GET".equals(method) && segments.length == 2 && "ps".equals(segments[0])) {
                return handleGetByPsNumber(segments[1]);
            }
            
            // GET /api/bgv-requests/history/resource/{resourcePsNo}
            if ("GET".equals(method) && segments.length == 2 && "resource".equals(segments[0])) {
                return handleGetByResourcePsNo(segments[1]);
            }
            
            // GET /api/bgv-requests/history/candidate/{candidateId}
            if ("GET".equals(method) && segments.length == 2 && "candidate".equals(segments[0])) {
                return handleGetByCandidateId(segments[1]);
            }
            
            // GET /api/bgv-requests/history/request/{bgvRequestId}
            if ("GET".equals(method) && segments.length == 2 && "request".equals(segments[0])) {
                return handleGetByBgvRequestId(segments[1]);
            }
            
            // GET /api/bgv-requests/history/search/{searchTerm}
            if ("GET".equals(method) && segments.length == 2 && "search".equals(segments[0])) {
                return handleSearch(segments[1]);
            }
            
            return errorResponse(404, "Endpoint not found: " + method + " " + path);
            
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            e.printStackTrace();
            return errorResponse(500, "Internal server error: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent handleGetByPsNumber(String psNumber) throws Exception {
        List<BgvRequestHistory> history = historyRepository.findByPsNumberOrderBySnapshotAtDesc(psNumber);
        return successResponse(Map.of("success", true, "total", history.size(), "data", history));
    }
    
    private APIGatewayProxyResponseEvent handleGetByResourcePsNo(String resourcePsNo) throws Exception {
        List<BgvRequestHistory> history = historyRepository.findByResourcePsNoOrderBySnapshotAtDesc(resourcePsNo);
        return successResponse(Map.of("success", true, "total", history.size(), "data", history));
    }
    
    private APIGatewayProxyResponseEvent handleGetByCandidateId(String candidateId) throws Exception {
        List<BgvRequestHistory> history = historyRepository.findByCandidateIdOrderBySnapshotAtDesc(candidateId);
        return successResponse(Map.of("success", true, "total", history.size(), "data", history));
    }
    
    private APIGatewayProxyResponseEvent handleGetByBgvRequestId(String bgvRequestId) throws Exception {
        List<BgvRequestHistory> history = historyRepository.findByBgvRequestIdOrderBySnapshotAtDesc(bgvRequestId);
        return successResponse(Map.of("success", true, "total", history.size(), "data", history));
    }
    
    private APIGatewayProxyResponseEvent handleSearch(String searchTerm) throws Exception {
        // Use repository search method
        List<BgvRequestHistory> filtered = historyRepository.searchHistory(searchTerm);
        return successResponse(Map.of("success", true, "total", filtered.size(), "data", filtered));
    }
    
    private APIGatewayProxyResponseEvent successResponse(Map<String, Object> body) throws Exception {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(200);
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
