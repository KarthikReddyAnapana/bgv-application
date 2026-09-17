package com.bgv.application.dto.auth;

import com.bgv.application.domain.enums.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String fullName;
    private UserRole role;
    private String organizationId;
    private String candidateId;
}
