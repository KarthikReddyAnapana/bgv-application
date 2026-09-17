package com.bgv.application.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bgv_requests")
public class BgvRequest {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "ps_number", length = 50)
    private String psNumber;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "rr_number")
    private Double rrNumber;

    @Column(name = "employee_type", length = 50)
    private String employeeType;

    @Column(name = "candidate_id", length = 100)
    private String candidateId;

    @Column(name = "resource_name")
    private String resourceName;

    @Column(name = "resource_ps_no", length = 50)
    private String resourcePsNo;

    @Column(name = "resource_type", length = 50)
    private String resourceType;

    @Column(name = "geo_region", length = 50)
    private String geoRegion;

    @Column(name = "country", length = 50)
    private String country;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "bgv_initiated_by")
    private String bgvInitiatedBy;

    @Column(name = "comments_from_pmo", length = 10000)
    private String commentsFromPmo;

    @Column(name = "bgv_stopped_reason", length = 10000)
    private String bgvStoppedReason;

    @Column(name = "onboarding_type", length = 50)
    private String onboardingType;

    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "interim_date", length = 10)
    private String interimDate;

    @Column(name = "interim_status", length = 100)
    private String interimStatus;

    @Column(name = "final_bgv_date", length = 10)
    private String finalBgvDate;

    @Column(name = "final_bgv_status", length = 100)
    private String finalBgvStatus;

    @Column(name = "request_submitted_on", length = 10)
    private String requestSubmittedOn;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;

    @Column(name = "user_role", length = 20)
    private String userRole;

    @PrePersist
    public void prePersist() {
        if (id == null || id.isEmpty()) {
            id = UUID.randomUUID().toString();
        }
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
        INDIA, USA, CANADA, UK, AUSTRALIA, MEXICO, BRAZIL, GERMANY, FRANCE,
        POLAND, NETHERLANDS, UNITED_KINGDOM, COSTA_RICA, COLOMBIA, BOLIVIA,
        ARGENTINA, ECUADOR, UAE, MALAYSIA, JAPAN, SINGAPORE
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
