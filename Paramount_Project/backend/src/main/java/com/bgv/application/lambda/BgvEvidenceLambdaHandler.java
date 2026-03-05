package com.bgv.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.bgv.application.service.ConfigurationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lambda Handler for Evidence upload and configuration endpoints.
 * Handler: com.bgv.application.lambda.BgvEvidenceLambdaHandler::handleRequest
 */
public class BgvEvidenceLambdaHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static AnnotationConfigApplicationContext springContext;
    private static ConfigurationService configurationService;
    private static ObjectMapper objectMapper;
    
    static {
        springContext = new AnnotationConfigApplicationContext(SpringConfig.class);
        configurationService = springContext.getBean(ConfigurationService.class);
        
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }
    
    @Configuration
    @ComponentScan(basePackages = "com.bgv.application")
    static class SpringConfig {
    }
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Evidence Handler - Method: " + request.getHttpMethod() + ", Path: " + request.getPath());
        
        try {
            String method = request.getHttpMethod();
            String path = request.getPath();
            
            // Parse path segments
            String[] segments = path.replaceFirst(".*/api/bgv-requests/?", "").split("/");
            
            // POST /api/bgv-requests/upload-evidence
            if ("POST".equals(method) && segments.length >= 1 && "upload-evidence".equals(segments[0])) {
                return handleUploadEvidence(request, context);
            }
            
            // GET /api/bgv-requests/{id}/evidence
            if ("GET".equals(method) && segments.length == 2 && "evidence".equals(segments[1])) {
                return handleGetEvidence(segments[0]);
            }
            
            // GET /api/bgv-requests/config/countries
            if ("GET".equals(method) && segments.length >= 2 && "config".equals(segments[0]) && "countries".equals(segments[1])) {
                return handleGetCountries();
            }
            
            // GET /api/bgv-requests/config/sharepoint
            if ("GET".equals(method) && segments.length >= 2 && "config".equals(segments[0]) && "sharepoint".equals(segments[1])) {
                return handleGetSharePointConfig();
            }
            
            return errorResponse(404, "Endpoint not found: " + method + " " + path);
            
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            e.printStackTrace();
            return errorResponse(500, "Internal server error: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent handleUploadEvidence(APIGatewayProxyRequestEvent request, Context context) {
        try {
            // Note: Multipart parsing in Lambda is complex
            // This is a placeholder - real implementation needs multipart parser
            context.getLogger().log("Evidence upload request received");
            
            return errorResponse(501, "Evidence upload via Lambda requires multipart parser. Use StreamLambdaHandler or implement custom parser.");
            
        } catch (Exception e) {
            context.getLogger().log("Error uploading evidence: " + e.getMessage());
            return errorResponse(500, "Error uploading evidence: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent handleGetEvidence(String requestId) throws Exception {
        // Placeholder - would query evidence records for the given BGV request ID
        return successResponse(Map.of(
            "success", true,
            "data", new java.util.ArrayList<>(),
            "total", 0,
            "message", "Evidence retrieval not yet implemented"
        ));
    }
    
    private APIGatewayProxyResponseEvent handleGetCountries() throws Exception {
        var countries = configurationService.getCountryToGeoRegionMapping();
        // Convert map to list of country-region objects
        List<Map<String, String>> countryList = new ArrayList<>();
        countries.forEach((country, region) -> {
            countryList.add(Map.of("country", country, "region", region));
        });
        return successResponse(Map.of(
            "success", true,
            "data", countryList,
            "total", countryList.size()
        ));
    }
    
    private APIGatewayProxyResponseEvent handleGetSharePointConfig() throws Exception {
        // Return SharePoint configuration - placeholder for now
        String sharePointUrl = System.getenv("SHAREPOINT_FOLDER_URL");
        String sharePointEnabled = System.getenv("SHAREPOINT_ENABLED");
        
        return successResponse(Map.of(
            "success", true,
            "data", Map.of(
                "sharePointUrl", sharePointUrl != null ? sharePointUrl : "",
                "enabled", "true".equals(sharePointEnabled)
            )
        ));
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
