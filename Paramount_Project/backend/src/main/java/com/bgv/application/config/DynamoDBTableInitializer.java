package com.bgv.application.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.List;

@Component
public class DynamoDBTableInitializer implements CommandLineRunner {

    private final DynamoDbClient dynamoDbClient;

    public DynamoDBTableInitializer(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @Override
    public void run(String... args) {
        createBgvRequestsTable();
        createBgvRequestHistoryTable();
        createBgvExcelUploadRecordsTable();
        createBgvExcelUploadCellsTable();
    }

    private void createBgvRequestsTable() {
        String tableName = "LTM-mne-paramount-BgvRequests";
        
        if (tableExists(tableName)) {
            System.out.println("Table " + tableName + " already exists");
            return;
        }

        try {
            CreateTableRequest request = CreateTableRequest.builder()
                .tableName(tableName)
                .keySchema(
                    KeySchemaElement.builder().attributeName("id").keyType(KeyType.HASH).build()
                )
                .attributeDefinitions(
                    AttributeDefinition.builder().attributeName("id").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("psNumber").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("candidateId").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("resourcePsNo").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("status").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("userRole").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("createdAt").attributeType(ScalarAttributeType.N).build()
                )
                .globalSecondaryIndexes(
                    GlobalSecondaryIndex.builder()
                        .indexName("psNumber-index")
                        .keySchema(KeySchemaElement.builder().attributeName("psNumber").keyType(KeyType.HASH).build())
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("candidateId-index")
                        .keySchema(KeySchemaElement.builder().attributeName("candidateId").keyType(KeyType.HASH).build())
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("resourcePsNo-index")
                        .keySchema(KeySchemaElement.builder().attributeName("resourcePsNo").keyType(KeyType.HASH).build())
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("status-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("status").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("createdAt").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("userRole-status-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("userRole").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("status").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build()
                )
                .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                .build();

            dynamoDbClient.createTable(request);
            System.out.println("Created table: " + tableName);
        } catch (Exception e) {
            System.err.println("Failed to create table " + tableName + ": " + e.getMessage());
        }
    }

    private void createBgvRequestHistoryTable() {
        String tableName = "LTM-mne-paramount-BgvRequestHistory";
        
        if (tableExists(tableName)) {
            System.out.println("Table " + tableName + " already exists");
            return;
        }

        try {
            CreateTableRequest request = CreateTableRequest.builder()
                .tableName(tableName)
                .keySchema(
                    KeySchemaElement.builder().attributeName("historyId").keyType(KeyType.HASH).build()
                )
                .attributeDefinitions(
                    AttributeDefinition.builder().attributeName("historyId").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("bgvRequestId").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("psNumber").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("resourcePsNo").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("candidateId").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("snapshotAt").attributeType(ScalarAttributeType.N).build()
                )
                .globalSecondaryIndexes(
                    GlobalSecondaryIndex.builder()
                        .indexName("bgvRequestId-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("bgvRequestId").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("snapshotAt").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("psNumber-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("psNumber").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("snapshotAt").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("resourcePsNo-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("resourcePsNo").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("snapshotAt").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build(),
                    GlobalSecondaryIndex.builder()
                        .indexName("candidateId-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("candidateId").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("snapshotAt").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build()
                )
                .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                .build();

            dynamoDbClient.createTable(request);
            System.out.println("Created table: " + tableName);
        } catch (Exception e) {
            System.err.println("Failed to create table " + tableName + ": " + e.getMessage());
        }
    }

    private void createBgvExcelUploadRecordsTable() {
        String tableName = "LTM-mne-paramount-BgvExcelUploadRecords";
        
        if (tableExists(tableName)) {
            System.out.println("Table " + tableName + " already exists");
            return;
        }

        try {
            CreateTableRequest request = CreateTableRequest.builder()
                .tableName(tableName)
                .keySchema(
                    KeySchemaElement.builder().attributeName("id").keyType(KeyType.HASH).build()
                )
                .attributeDefinitions(
                    AttributeDefinition.builder().attributeName("id").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("uploadBatchId").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("sourceRowNumber").attributeType(ScalarAttributeType.N).build()
                )
                .globalSecondaryIndexes(
                    GlobalSecondaryIndex.builder()
                        .indexName("uploadBatchId-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("uploadBatchId").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("sourceRowNumber").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build()
                )
                .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                .build();

            dynamoDbClient.createTable(request);
            System.out.println("Created table: " + tableName);
        } catch (Exception e) {
            System.err.println("Failed to create table " + tableName + ": " + e.getMessage());
        }
    }

    private void createBgvExcelUploadCellsTable() {
        String tableName = "LTM-mne-paramount-BgvExcelUploadCells";
        
        if (tableExists(tableName)) {
            System.out.println("Table " + tableName + " already exists");
            return;
        }

        try {
            CreateTableRequest request = CreateTableRequest.builder()
                .tableName(tableName)
                .keySchema(
                    KeySchemaElement.builder().attributeName("id").keyType(KeyType.HASH).build()
                )
                .attributeDefinitions(
                    AttributeDefinition.builder().attributeName("id").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("uploadBatchId").attributeType(ScalarAttributeType.S).build(),
                    AttributeDefinition.builder().attributeName("sourceRowNumber").attributeType(ScalarAttributeType.N).build()
                )
                .globalSecondaryIndexes(
                    GlobalSecondaryIndex.builder()
                        .indexName("uploadBatchId-index")
                        .keySchema(
                            KeySchemaElement.builder().attributeName("uploadBatchId").keyType(KeyType.HASH).build(),
                            KeySchemaElement.builder().attributeName("sourceRowNumber").keyType(KeyType.RANGE).build()
                        )
                        .projection(Projection.builder().projectionType(ProjectionType.ALL).build())
                        .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                        .build()
                )
                .provisionedThroughput(ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build())
                .build();

            dynamoDbClient.createTable(request);
            System.out.println("Created table: " + tableName);
        } catch (Exception e) {
            System.err.println("Failed to create table " + tableName + ": " + e.getMessage());
        }
    }

    private boolean tableExists(String tableName) {
        try {
            DescribeTableRequest request = DescribeTableRequest.builder()
                .tableName(tableName)
                .build();
            dynamoDbClient.describeTable(request);
            return true;
        } catch (ResourceNotFoundException e) {
            return false;
        }
    }
}
