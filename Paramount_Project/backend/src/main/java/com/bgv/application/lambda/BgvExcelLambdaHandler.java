package com.bgv.application.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.bgv.application.service.ExcelUploadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Lambda Handler for Excel import/export operations.
 * Handler: com.bgv.application.lambda.BgvExcelLambdaHandler::handleRequest
 */
public class BgvExcelLambdaHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    private static AnnotationConfigApplicationContext springContext;
    private static ExcelUploadService excelUploadService;
    private static ObjectMapper objectMapper;
    
    static {
        springContext = new AnnotationConfigApplicationContext(SpringConfig.class);
        excelUploadService = springContext.getBean(ExcelUploadService.class);
        
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }
    
    @Configuration
    @ComponentScan(basePackages = "com.bgv.application")
    static class SpringConfig {
    }
    
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Excel Handler - Method: " + request.getHttpMethod() + ", Path: " + request.getPath());
        
        try {
            String method = request.getHttpMethod();
            String path = request.getPath();
            
            // Parse path segments after /api/bgv-requests/excel-upload
            String[] segments = path.replaceFirst(".*/api/bgv-requests/excel-upload/?", "").split("/");
            
            // POST /api/bgv-requests/excel-upload (upload Excel file)
            if ("POST".equals(method) && (segments.length == 0 || segments[0].isEmpty())) {
                return handleExcelUpload(request, context);
            }
            
            // GET /api/bgv-requests/excel-upload?year=2024&month=12 (list uploads)
            if ("GET".equals(method) && (segments.length == 0 || segments[0].isEmpty())) {
                return handleListUploads(request);
            }
            
            // GET /api/bgv-requests/excel-upload/table (get latest table view)
            if ("GET".equals(method) && segments.length == 1 && "table".equals(segments[0])) {
                return handleGetLatestTable();
            }
            
            // GET /api/bgv-requests/excel-upload/latest (get latest upload metadata)
            if ("GET".equals(method) && segments.length == 1 && "latest".equals(segments[0])) {
                return handleGetLatestUpload();
            }
            
            return errorResponse(404, "Endpoint not found: " + method + " " + path);
            
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            e.printStackTrace();
            return errorResponse(500, "Internal server error: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent handleExcelUpload(APIGatewayProxyRequestEvent request, Context context) {
        try {
            // Note: For Lambda, multipart parsing is more complex
            // This is a simplified version - in production, use a multipart parser library
            context.getLogger().log("Excel upload - body is base64: " + request.getIsBase64Encoded());
            
            // For now, return a placeholder response
            // Full implementation would parse multipart/form-data from base64-encoded body
            return errorResponse(501, "Excel upload via Lambda requires multipart parser. Use StreamLambdaHandler or implement custom parser.");
            
        } catch (Exception e) {
            context.getLogger().log("Error uploading Excel: " + e.getMessage());
            return errorResponse(500, "Error uploading Excel: " + e.getMessage());
        }
    }
    
    private APIGatewayProxyResponseEvent handleListUploads(APIGatewayProxyRequestEvent request) throws Exception {
        Map<String, String> queryParams = request.getQueryStringParameters();
        if (queryParams == null) queryParams = new HashMap<>();
        
        int year = queryParams.containsKey("year") ? Integer.parseInt(queryParams.get("year")) : 0;
        int month = queryParams.containsKey("month") ? Integer.parseInt(queryParams.get("month")) : 0;
        
        var uploads = excelUploadService.getByMonth(year, month);
        return successResponse(Map.of("success", true, "total", uploads.size(), "data", uploads));
    }
    
    private APIGatewayProxyResponseEvent handleGetLatestTable() throws Exception {
        var tableData = excelUploadService.getLatestExcelTable();
        return successResponse(Map.of(
            "success", true,
            "sourceFilename", tableData.sourceFilename,
            "uploadedAt", tableData.uploadedAt,
            "headers", tableData.table.headers,
            "rows", tableData.table.rows,
            "total", tableData.table.rows.size()
        ));
    }
    
    private APIGatewayProxyResponseEvent handleGetLatestUpload() throws Exception {
        var latest = excelUploadService.getLatestExcelTable();
        if (latest == null) {
            return errorResponse(404, "No uploads found");
        }
        return successResponse(Map.of(
            "success", true,
            "data", Map.of(
                "sourceFilename", latest.sourceFilename,
                "uploadedAt", latest.uploadedAt
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
