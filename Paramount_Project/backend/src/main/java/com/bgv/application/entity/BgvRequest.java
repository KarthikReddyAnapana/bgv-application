package com.bgv.application.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class BgvRequest {

    // Primary Key - using UUID string as partition key
    private String id;

    // PM Fields
    private String psNumber;
    private String requestedByName;
    private Double rrNumber;
    private String employeeType; // LTIM_ASSOCIATES, YET_TO_JOIN

    // Optional: Required only for YET_TO_JOIN employees
    private String candidateId;

    private String resourceName;

    // Optional: Required only for LTIM_ASSOCIATES employees
    private String resourcePsNo;

    private String resourceType; // EXTERNAL, INTERNAL
    private String geoRegion; // INDIA, LATAM, EUROPE, APAC, AUSTRALIA, USA_AND_CANADA
    private String country; // INDIA, USA, CANADA, UK, AUSTRALIA, MEXICO, BRAZIL, GERMANY, FRANCE

    // Admin Fields
    private String status; // PENDING, APPROVED, REJECTED, ON_HOLD
    private String bgvInitiatedBy;
    private String commentsFromPmo;
    private String bgvStoppedReason;
    private String onboardingType; // REGULAR_REQUEST, EXPRESS_REQUEST
    private String evidencePath; // URL to evidence document (Teams/SharePoint/OneDrive link)
    private String priority; // HIGH, NORMAL, LOW - for PM prioritization

    // Interim and Final BGV fields
    private String interimDate; // LocalDate as string (yyyy-MM-dd)
    private String interimStatus; // Interim Completed, In Progress, Pending
    private String finalBgvDate; // LocalDate as string (yyyy-MM-dd)
    private String finalBgvStatus; // Final Completed, In Progress, Pending

    // Date fields stored as ISO-8601 string for DynamoDB compatibility
    private String requestSubmittedOn; // LocalDate as string (yyyy-MM-dd)

    // Timestamps stored as Epoch seconds for DynamoDB
    private Long createdAt;
    private Long updatedAt;

    private String userRole; // PM, ADMIN

    // GSI attributes for querying
    private String statusUserRoleIndex; // "status#userRole" for compound queries

    @DynamoDbPartitionKey
    @DynamoDbAttribute("id")
    public String getId() {
        return id;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "psNumber-index")
    @DynamoDbAttribute("psNumber")
    public String getPsNumber() {
        return psNumber;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "candidateId-index")
    @DynamoDbAttribute("candidateId")
    public String getCandidateId() {
        return candidateId;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "resourcePsNo-index")
    @DynamoDbAttribute("resourcePsNo")
    public String getResourcePsNo() {
        return resourcePsNo;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "status-index")
    @DynamoDbSecondarySortKey(indexNames = "userRole-status-index")
    @DynamoDbAttribute("status")
    public String getStatus() {
        return status;
    }

    @DynamoDbSecondaryPartitionKey(indexNames = "userRole-status-index")
    @DynamoDbAttribute("userRole")
    public String getUserRole() {
        return userRole;
    }

    @DynamoDbSecondarySortKey(indexNames = "status-index")
    @DynamoDbAttribute("createdAt")
    public Long getCreatedAt() {
        return createdAt;
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

    @DynamoDbAttribute("interimDate")
    public String getInterimDate() {
        return interimDate;
    }

    @DynamoDbAttribute("interimStatus")
    public String getInterimStatus() {
        return interimStatus;
    }

    @DynamoDbAttribute("finalBgvDate")
    public String getFinalBgvDate() {
        return finalBgvDate;
    }

    @DynamoDbAttribute("finalBgvStatus")
    public String getFinalBgvStatus() {
        return finalBgvStatus;
    }

    @DynamoDbAttribute("updatedAt")
    public Long getUpdatedAt() {
        return updatedAt;
    }

    @DynamoDbAttribute("statusUserRoleIndex")
    public String getStatusUserRoleIndex() {
        return statusUserRoleIndex;
    }

    public enum ResourceType {
        EXTERNAL, INTERNAL
    }

    public enum EmployeeType {
        LTIM_ASSOCIATES, YET_TO_JOIN
    }

    public enum GeoRegion {
        INDIA, LATAM, EUROPE, APAC, AUSTRALIA, USA_AND_CANADA
    }

    public enum Country {
        INDIA,
        USA,
        CANADA,
        UK,
        AUSTRALIA,
        MEXICO,
        BRAZIL,
        GERMANY,
        FRANCE,
        POLAND,
        NETHERLANDS,
        UNITED_KINGDOM,
        COSTA_RICA,
        COLOMBIA,
        BOLIVIA,
        ARGENTINA,
        ECUADOR,
        UAE,
        MALAYSIA,
        JAPAN,
        SINGAPORE
    }

    public enum RequestStatus {
        PENDING, APPROVED, REJECTED, ON_HOLD
    }

    public enum OnboardingType {
        REGULAR_REQUEST, EXPRESS_REQUEST
    }

    public enum UserRole {
        PM, ADMIN
    }

    public enum Priority {
        HIGH, NORMAL, LOW
    }

}
