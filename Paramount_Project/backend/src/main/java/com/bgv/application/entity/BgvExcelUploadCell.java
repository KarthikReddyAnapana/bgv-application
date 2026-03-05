package com.bgv.application.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class BgvExcelUploadCell {

    private String id; // UUID as partition key
    private String uploadBatchId;
    private Integer sourceRowNumber;
    private Integer columnIndex;
    private String header;
    private String value;
    private Long uploadedAt; // Epoch seconds

    @DynamoDbPartitionKey
    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "uploadBatchId-index")
    @DynamoDbAttribute("uploadBatchId")
    public String getUploadBatchId() {
        return uploadBatchId;
    }

    @DynamoDbSecondarySortKey(indexNames = "uploadBatchId-index")
    @DynamoDbAttribute("sourceRowNumber")
    public Integer getSourceRowNumber() {
        return sourceRowNumber;
    }

    @DynamoDbAttribute("columnIndex")
    public Integer getColumnIndex() {
        return columnIndex;
    }

    @DynamoDbAttribute("header")
    public String getHeader() {
        return header;
    }

    @DynamoDbAttribute("value")
    public String getValue() {
        return value;
    }

    @DynamoDbAttribute("uploadedAt")
    public Long getUploadedAt() {
        return uploadedAt;
    }
}
