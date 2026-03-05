package com.bgv.application.repository;

import com.bgv.application.entity.BgvRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class BgvRequestRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<BgvRequest> table;

    public BgvRequestRepository(DynamoDbEnhancedClient enhancedClient,
                                @Value("${dynamodb.table.bgvRequests}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(BgvRequest.class));
    }

    public BgvRequest save(BgvRequest request) {
        if (request.getId() == null || request.getId().isEmpty()) {
            request.setId(UUID.randomUUID().toString());
        }
        table.putItem(request);
        return request;
    }

    public Optional<BgvRequest> findById(String id) {
        BgvRequest item = table.getItem(Key.builder().partitionValue(id).build());
        return Optional.ofNullable(item);
    }

    public List<BgvRequest> findAll() {
        return table.scan().items().stream().collect(Collectors.toList());
    }

    public void deleteById(String id) {
        table.deleteItem(Key.builder().partitionValue(id).build());
    }

    // Query by PS Number using GSI
    public List<BgvRequest> findByPsNumber(String psNumber) {
        DynamoDbIndex<BgvRequest> index = table.index("psNumber-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(psNumber).build()
        );
        return index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
    }

    // Query by status using GSI
    public List<BgvRequest> findByStatus(String status) {
        DynamoDbIndex<BgvRequest> index = table.index("status-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(status).build()
        );
        return index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
    }

    // Query by user role using GSI
    public List<BgvRequest> findByUserRole(String userRole) {
        DynamoDbIndex<BgvRequest> index = table.index("userRole-status-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(userRole).build()
        );
        return index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
    }

    // Query by employee type (scan-based - consider GSI if frequent)
    public List<BgvRequest> findByEmployeeType(String employeeType) {
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":employeeType", AttributeValue.builder().s(employeeType).build());
        
        return table.scan(ScanEnhancedRequest.builder()
                .filterExpression(Expression.builder()
                    .expression("employeeType = :employeeType")
                    .expressionValues(expressionValues)
                    .build())
                .build())
            .items().stream()
            .collect(Collectors.toList());
    }

    // Check if candidate ID exists
    public boolean existsByCandidateId(String candidateId) {
        if (candidateId == null || candidateId.isEmpty()) {
            return false;
        }
        DynamoDbIndex<BgvRequest> index = table.index("candidateId-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(candidateId).build()
        );
        return index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .findFirst()
            .isPresent();
    }

    // Check if resource PS number exists
    public boolean existsByResourcePsNo(String resourcePsNo) {
        if (resourcePsNo == null || resourcePsNo.isEmpty()) {
            return false;
        }
        DynamoDbIndex<BgvRequest> index = table.index("resourcePsNo-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(resourcePsNo).build()
        );
        return index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .findFirst()
            .isPresent();
    }

    // Note: For complex filtering like resourceName LIKE, use OpenSearch service
}

