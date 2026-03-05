package com.bgv.application.dto;

import com.bgv.application.entity.BgvRequest;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BgvRequestDTO {

    // PM Fields
    @NotNull(message = "PS Number is required")
    @Pattern(regexp = "^[0-9]+$", message = "PS Number must be numeric")
    private String psNumber;

    @NotBlank(message = "Requested by name is required")
    private String requestedByName;

    @NotNull(message = "RR Number is required")
    @DecimalMin(value = "0.0", message = "RR Number must be positive")
    private Double rrNumber;

    @NotNull(message = "Employee Type is required")
    private BgvRequest.EmployeeType employeeType;

    // Optional: Required only for YET_TO_JOIN employees
    private String candidateId;

    @NotBlank(message = "Resource Name is required")
    private String resourceName;

    // Optional: Required only for LTIM_ASSOCIATES employees
    private String resourcePsNo;

    @NotNull(message = "Resource Type is required")
    private BgvRequest.ResourceType resourceType;

    @NotNull(message = "Geo Region is required")
    private BgvRequest.GeoRegion geoRegion;

    @NotNull(message = "Country is required")
    private BgvRequest.Country country;

    // Admin Fields
    @NotNull(message = "Status is required")
    private BgvRequest.RequestStatus status;

    @NotBlank(message = "BGV Initiated By is required")
    private String bgvInitiatedBy;

    private String commentsFromPmo;

    private String bgvStoppedReason;

    @NotNull(message = "Onboarding Type is required")
    private BgvRequest.OnboardingType onboardingType;

    // URL to evidence document stored in Teams/SharePoint/OneDrive (required for EXPRESS_REQUEST)
    private String evidencePath;

    // Priority level for the request
    private BgvRequest.Priority priority;

    // Interim and Final BGV fields
    private String interimDate; // LocalDate as string (yyyy-MM-dd)
    private String interimStatus; // Interim Completed, In Progress, Pending
    private String finalBgvDate; // LocalDate as string (yyyy-MM-dd)
    private String finalBgvStatus; // Final Completed, In Progress, Pending

    @NotNull(message = "Request Submitted on date is required")
    @PastOrPresent(message = "Request submitted date cannot be in future")
    private LocalDate requestSubmittedOn;

    @NotNull(message = "User Role is required")
    private BgvRequest.UserRole userRole;

}
