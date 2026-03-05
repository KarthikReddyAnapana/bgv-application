package com.bgv.application.repository;

import com.bgv.application.entity.BgvExcelUploadRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class BgvExcelUploadRecordRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<BgvExcelUploadRecord> table;

    public BgvExcelUploadRecordRepository(DynamoDbEnhancedClient enhancedClient,
                                          @Value("${dynamodb.table.bgvExcelUploadRecords}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(BgvExcelUploadRecord.class));
    }

    public BgvExcelUploadRecord save(BgvExcelUploadRecord record) {
        if (record.getId() == null || record.getId().isEmpty()) {
            record.setId(UUID.randomUUID().toString());
        }
        table.putItem(record);
        return record;
    }

    public Optional<BgvExcelUploadRecord> findById(String id) {
        BgvExcelUploadRecord item = table.getItem(Key.builder().partitionValue(id).build());
        return Optional.ofNullable(item);
    }

    public List<BgvExcelUploadRecord> findAll() {
        return table.scan().items().stream().collect(Collectors.toList());
    }

    // Query by upload batch ID using GSI
    public List<BgvExcelUploadRecord> findByUploadBatchIdOrderBySourceRowNumberAsc(String uploadBatchId) {
        DynamoDbIndex<BgvExcelUploadRecord> index = table.index("uploadBatchId-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(uploadBatchId).build()
        );
        List<BgvExcelUploadRecord> results = index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
        
        // Sort by source row number ascending
        results.sort(Comparator.comparing(BgvExcelUploadRecord::getSourceRowNumber));
        return results;
    }

    // Find records uploaded between timestamps
    public List<BgvExcelUploadRecord> findByUploadedAtBetweenOrderByUploadedAtAsc(Long start, Long end) {
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        expressionValues.put(":start", AttributeValue.builder().n(String.valueOf(start)).build());
        expressionValues.put(":end", AttributeValue.builder().n(String.valueOf(end)).build());
        
        List<BgvExcelUploadRecord> results = table.scan(ScanEnhancedRequest.builder()
                .filterExpression(Expression.builder()
                    .expression("uploadedAt BETWEEN :start AND :end")
                    .expressionValues(expressionValues)
                    .build())
                .build())
            .items().stream()
            .collect(Collectors.toList());
        
        results.sort(Comparator.comparing(BgvExcelUploadRecord::getUploadedAt));
        return results;
    }

    // Find most recent upload
    public Optional<BgvExcelUploadRecord> findTopByOrderByUploadedAtDesc() {
        return table.scan().items().stream()
            .max(Comparator.comparing(BgvExcelUploadRecord::getUploadedAt));
    }

    public void deleteById(String id) {
        table.deleteItem(Key.builder().partitionValue(id).build());
    }
}

