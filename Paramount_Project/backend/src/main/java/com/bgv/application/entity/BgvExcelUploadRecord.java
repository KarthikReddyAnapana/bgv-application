package com.bgv.application.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class BgvExcelUploadRecord {

    private String id; // UUID as partition key
    private String sourceFilename;
    private Integer sourceRowNumber;
    private Long uploadedAt; // Epoch seconds
    private String uploadBatchId;

    // Common fields from Excel (stored as strings for flexibility)
    private String psNumber;
    private String requestedByName;
    private Double rrNumber;
    private String candidateId;
    private String resourceName;
    private String resourcePsNo;
    private String resourceType;
    private String geoRegion;
    private String country;
    private String status;
    private String bgvInitiatedBy;
    private String commentsFromPmo;
    private String onboardingType;
    private String requestSubmittedOn; // ISO-8601 date string

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

    @DynamoDbAttribute("sourceFilename")
    public String getSourceFilename() {
        return sourceFilename;
    }

    @DynamoDbAttribute("uploadedAt")
    public Long getUploadedAt() {
        return uploadedAt;
    }

    @DynamoDbAttribute("psNumber")
    public String getPsNumber() {
        return psNumber;
    }

    @DynamoDbAttribute("requestedByName")
    public String getRequestedByName() {
        return requestedByName;
    }

    @DynamoDbAttribute("rrNumber")
    public Double getRrNumber() {
        return rrNumber;
    }

    @DynamoDbAttribute("candidateId")
    public String getCandidateId() {
        return candidateId;
    }

    @DynamoDbAttribute("resourceName")
    public String getResourceName() {
        return resourceName;
    }

    @DynamoDbAttribute("resourcePsNo")
    public String getResourcePsNo() {
        return resourcePsNo;
    }

    @DynamoDbAttribute("resourceType")
    public String getResourceType() {
        return resourceType;
    }

    @DynamoDbAttribute("geoRegion")
    public String getGeoRegion() {
        return geoRegion;
    }

    @DynamoDbAttribute("country")
    public String getCountry() {
        return country;
    }

    @DynamoDbAttribute("status")
    public String getStatus() {
        return status;
    }

    @DynamoDbAttribute("bgvInitiatedBy")
    public String getBgvInitiatedBy() {
        return bgvInitiatedBy;
    }

    @DynamoDbAttribute("commentsFromPmo")
    public String getCommentsFromPmo() {
        return commentsFromPmo;
    }

    @DynamoDbAttribute("onboardingType")
    public String getOnboardingType() {
        return onboardingType;
    }

    @DynamoDbAttribute("requestSubmittedOn")
    public String getRequestSubmittedOn() {
        return requestSubmittedOn;
    }
}
