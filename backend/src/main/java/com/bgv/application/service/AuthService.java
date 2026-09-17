package com.bgv.application.service;

import com.bgv.application.domain.entity.User;
import com.bgv.application.domain.repository.UserRepository;
import com.bgv.application.dto.auth.AuthResponse;
import com.bgv.application.dto.auth.LoginRequest;
import com.bgv.application.security.JwtService;
import com.bgv.application.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmailIgnoreCase(request.getEmail()).orElseThrow();
        SecurityUser securityUser = new SecurityUser(user);
        String token = jwtService.generateToken(securityUser);
        return toResponse(token, user);
    }

    private AuthResponse toResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .organizationId(user.getOrganizationId())
                .candidateId(user.getCandidateId())
                .build();
    }
}
