package com.bgv.application.repository;

import com.bgv.application.entity.BgvRequestHistory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class BgvRequestHistoryRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<BgvRequestHistory> table;

    public BgvRequestHistoryRepository(DynamoDbEnhancedClient enhancedClient,
                                       @Value("${dynamodb.table.bgvRequestHistory}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(BgvRequestHistory.class));
    }

    public BgvRequestHistory save(BgvRequestHistory history) {
        if (history.getHistoryId() == null || history.getHistoryId().isEmpty()) {
            history.setHistoryId(UUID.randomUUID().toString());
        }
        table.putItem(history);
        return history;
    }

    public List<BgvRequestHistory> saveAll(List<BgvRequestHistory> histories) {
        for (BgvRequestHistory history : histories) {
            if (history.getHistoryId() == null || history.getHistoryId().isEmpty()) {
                history.setHistoryId(UUID.randomUUID().toString());
            }
            table.putItem(history);
        }
        return histories;
    }

    public Optional<BgvRequestHistory> findById(String historyId) {
        BgvRequestHistory item = table.getItem(Key.builder().partitionValue(historyId).build());
        return Optional.ofNullable(item);
    }

    public List<BgvRequestHistory> findAll() {
        return table.scan().items().stream().collect(Collectors.toList());
    }

    // Query by PS Number using GSI
    public List<BgvRequestHistory> findByPsNumberOrderBySnapshotAtDesc(String psNumber) {
        DynamoDbIndex<BgvRequestHistory> index = table.index("psNumber-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(psNumber).build()
        );
        List<BgvRequestHistory> results = index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
        
        // Sort by latest update timestamp descending
        results.sort((a, b) -> Long.compare(resolveSortTimestamp(b), resolveSortTimestamp(a)));
        return results;
    }

    // Query by resource PS number using GSI
    public List<BgvRequestHistory> findByResourcePsNoOrderBySnapshotAtDesc(String resourcePsNo) {
        DynamoDbIndex<BgvRequestHistory> index = table.index("resourcePsNo-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(resourcePsNo).build()
        );
        List<BgvRequestHistory> results = index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
        
        results.sort((a, b) -> Long.compare(resolveSortTimestamp(b), resolveSortTimestamp(a)));
        return results;
    }

    // Query by candidate ID using GSI
    public List<BgvRequestHistory> findByCandidateIdOrderBySnapshotAtDesc(String candidateId) {
        DynamoDbIndex<BgvRequestHistory> index = table.index("candidateId-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(candidateId).build()
        );
        List<BgvRequestHistory> results = index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
        
        results.sort((a, b) -> Long.compare(resolveSortTimestamp(b), resolveSortTimestamp(a)));
        return results;
    }

    // Query by BGV request ID using GSI
    public List<BgvRequestHistory> findByBgvRequestIdOrderBySnapshotAtDesc(String bgvRequestId) {
        DynamoDbIndex<BgvRequestHistory> index = table.index("bgvRequestId-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(bgvRequestId).build()
        );
        List<BgvRequestHistory> results = index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
        
        results.sort((a, b) -> Long.compare(resolveSortTimestamp(b), resolveSortTimestamp(a)));
        return results;
    }

    // Note: Complex searches like resourceName LIKE and universal search
    // should use OpenSearch service for better performance

    public List<BgvRequestHistory> searchHistory(String searchTerm) {
        // Basic search - scans all records and filters by searchTerm
        // For production, use OpenSearch service
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return new ArrayList<>();
        }
        String lowerSearchTerm = searchTerm.toLowerCase();
        return table.scan().items().stream()
            .filter(h -> 
                (h.getPsNumber() != null && h.getPsNumber().toLowerCase().contains(lowerSearchTerm)) ||
                (h.getResourceName() != null && h.getResourceName().toLowerCase().contains(lowerSearchTerm)) ||
                (h.getCandidateId() != null && h.getCandidateId().toLowerCase().contains(lowerSearchTerm)) ||
                (h.getStatus() != null && h.getStatus().toLowerCase().contains(lowerSearchTerm))
            )
            .sorted((a, b) -> Long.compare(resolveSortTimestamp(b), resolveSortTimestamp(a)))
            .collect(Collectors.toList());
    }

    private long resolveSortTimestamp(BgvRequestHistory history) {
        if (history == null) return 0L;
        if (history.getSnapshotAt() != null) return history.getSnapshotAt();
        if (history.getCreatedAt() != null) return history.getCreatedAt();
        return 0L;
    }
}