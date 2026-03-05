package com.bgv.application.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class BgvRequestHistory {

    private String historyId; // Primary Key (partition key)
    private String bgvRequestId; // Reference to original request
    private String action; // CREATE, UPDATE, DELETE, STATUS_CHANGE
    
    // Snapshot of BGV Request at time of history capture
    private String psNumber;
    private String requestedByName;
    private Double rrNumber;
    private String employeeType;
    private String candidateId;
    private String resourceName;
    private String resourcePsNo;
    private String resourceType;
    private String geoRegion;
    private String country;
    private String status;
    private String bgvInitiatedBy;
    private String commentsFromPmo;
    private String bgvStoppedReason;
    private String onboardingType;
    private String evidencePath;
    private String priority;
    private String requestSubmittedOn;
    private String userRole;
    
    // Timestamps
    private Long createdAt; // Original request creation time
    private Long snapshotAt; // When this history snapshot was taken

    @DynamoDbPartitionKey
    @DynamoDbAttribute("historyId")
    public String getHistoryId() {
        return historyId;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "bgvRequestId-index")
    @DynamoDbAttribute("bgvRequestId")
    public String getBgvRequestId() {
        return bgvRequestId;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "psNumber-index")
    @DynamoDbAttribute("psNumber")
    public String getPsNumber() {
        return psNumber;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "resourcePsNo-index")
    @DynamoDbAttribute("resourcePsNo")
    public String getResourcePsNo() {
        return resourcePsNo;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "candidateId-index")
    @DynamoDbAttribute("candidateId")
    public String getCandidateId() {
        return candidateId;
    }

    @DynamoDbSecondarySortKey(indexNames = {"bgvRequestId-index", "psNumber-index", "resourcePsNo-index", "candidateId-index"})
    @DynamoDbAttribute("snapshotAt")
    public Long getSnapshotAt() {
        return snapshotAt;
    }

    @DynamoDbAttribute("action")
    public String getAction() {
        return action;
    }

    @DynamoDbAttribute("requestedByName")
    public String getRequestedByName() {
        return requestedByName;
    }

    @DynamoDbAttribute("rrNumber")
    public Double getRrNumber() {
        return rrNumber;
    }

    @DynamoDbAttribute("employeeType")
    public String getEmployeeType() {
        return employeeType;
    }

    @DynamoDbAttribute("resourceName")
    public String getResourceName() {
        return resourceName;
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

    @DynamoDbAttribute("bgvStoppedReason")
    public String getBgvStoppedReason() {
        return bgvStoppedReason;
    }

    @DynamoDbAttribute("onboardingType")
    public String getOnboardingType() {
        return onboardingType;
    }

    @DynamoDbAttribute("evidencePath")
    public String getEvidencePath() {
        return evidencePath;
    }

    @DynamoDbAttribute("priority")
    public String getPriority() {
        return priority;
    }

    @DynamoDbAttribute("requestSubmittedOn")
    public String getRequestSubmittedOn() {
        return requestSubmittedOn;
    }

    @DynamoDbAttribute("userRole")
    public String getUserRole() {
        return userRole;
    }

    @DynamoDbAttribute("createdAt")
    public Long getCreatedAt() {
        return createdAt;
    }
}
