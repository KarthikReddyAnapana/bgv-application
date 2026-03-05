package com.bgv.application.repository;

import com.bgv.application.entity.BgvExcelUploadCell;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.*;

import java.util.*;
import java.util.stream.Collectors;

@Repository
public class BgvExcelUploadCellRepository {

    private final DynamoDbEnhancedClient enhancedClient;
    private final DynamoDbTable<BgvExcelUploadCell> table;

    public BgvExcelUploadCellRepository(DynamoDbEnhancedClient enhancedClient,
                                        @Value("${dynamodb.table.bgvExcelUploadCells}") String tableName) {
        this.enhancedClient = enhancedClient;
        this.table = enhancedClient.table(tableName, TableSchema.fromBean(BgvExcelUploadCell.class));
    }

    public BgvExcelUploadCell save(BgvExcelUploadCell cell) {
        if (cell.getId() == null || cell.getId().isEmpty()) {
            cell.setId(UUID.randomUUID().toString());
        }
        table.putItem(cell);
        return cell;
    }

    public List<BgvExcelUploadCell> saveAll(List<BgvExcelUploadCell> cells) {
        for (BgvExcelUploadCell cell : cells) {
            if (cell.getId() == null || cell.getId().isEmpty()) {
                cell.setId(UUID.randomUUID().toString());
            }
            table.putItem(cell);
        }
        return cells;
    }

    public Optional<BgvExcelUploadCell> findById(String id) {
        BgvExcelUploadCell item = table.getItem(Key.builder().partitionValue(id).build());
        return Optional.ofNullable(item);
    }

    public List<BgvExcelUploadCell> findAll() {
        return table.scan().items().stream().collect(Collectors.toList());
    }

    // Query by upload batch ID using GSI
    public List<BgvExcelUploadCell> findByUploadBatchIdOrderBySourceRowNumberAscColumnIndexAsc(String uploadBatchId) {
        DynamoDbIndex<BgvExcelUploadCell> index = table.index("uploadBatchId-index");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(
            Key.builder().partitionValue(uploadBatchId).build()
        );
        List<BgvExcelUploadCell> results = index.query(queryConditional).stream()
            .flatMap(page -> page.items().stream())
            .collect(Collectors.toList());
        
        // Sort by source row number, then column index
        results.sort(Comparator
            .comparing(BgvExcelUploadCell::getSourceRowNumber)
            .thenComparing(BgvExcelUploadCell::getColumnIndex));
        return results;
    }

    // Delete all cells for a batch
    public void deleteByUploadBatchId(String uploadBatchId) {
        List<BgvExcelUploadCell> cells = findByUploadBatchIdOrderBySourceRowNumberAscColumnIndexAsc(uploadBatchId);
        cells.forEach(cell -> table.deleteItem(Key.builder().partitionValue(cell.getId()).build()));
    }

    public void deleteById(String id) {
        table.deleteItem(Key.builder().partitionValue(id).build());
    }
}

