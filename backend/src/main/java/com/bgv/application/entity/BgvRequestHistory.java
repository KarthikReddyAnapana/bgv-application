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
@Table(name = "bgv_request_history")
public class BgvRequestHistory {

    @Id
    @Column(name = "history_id", length = 36)
    private String historyId;

    @Column(name = "bgv_request_id", length = 36)
    private String bgvRequestId;

    @Column(name = "action", length = 50)
    private String action;

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

    @Column(name = "request_submitted_on", length = 10)
    private String requestSubmittedOn;

    @Column(name = "user_role", length = 20)
    private String userRole;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "snapshot_at")
    private Long snapshotAt;

    @PrePersist
    public void prePersist() {
        if (historyId == null || historyId.isEmpty()) {
            historyId = UUID.randomUUID().toString();
        }
    }
}
