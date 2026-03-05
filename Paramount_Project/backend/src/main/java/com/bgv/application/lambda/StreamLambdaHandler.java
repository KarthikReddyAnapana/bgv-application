package com.bgv.application.lambda;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.bgv.application.BgvApplication;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Main Lambda Handler using AWS Serverless Java Container for Spring Boot 3.
 * This handler wraps the entire Spring Boot application and routes API Gateway requests
 * to the appropriate Spring MVC controllers.
 * 
 * Usage in CDK:
 * - handler: com.bgv.application.lambda.StreamLambdaHandler::handleRequest
 * - runtime: Java 21 (or Java 17)
 * - timeout: 30s (for cold start)
 * - memory: 1024MB minimum
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    
    static {
        try {
            handler = SpringBootLambdaContainerHandler.getAwsProxyHandler(BgvApplication.class);
            
            // Enable request and response logging for debugging
            // handler.setLogFormatter(new AccessLogFormatter());
            
        } catch (ContainerInitializationException e) {
            // If we fail to initialize the Spring container, rethrow as runtime
            e.printStackTrace();
            throw new RuntimeException("Could not initialize Spring Boot application", e);
        }
    }
    
    @Override
    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context)
            throws IOException {
        handler.proxyStream(inputStream, outputStream, context);
    }
}
