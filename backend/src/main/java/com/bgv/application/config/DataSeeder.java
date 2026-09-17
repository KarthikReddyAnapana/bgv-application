package com.bgv.application.config;

import com.bgv.application.domain.entity.Organization;
import com.bgv.application.domain.entity.User;
import com.bgv.application.domain.enums.UserRole;
import com.bgv.application.domain.repository.OrganizationRepository;
import com.bgv.application.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        Organization org = Organization.builder().name("Demo Corp").build();
        organizationRepository.save(org);

        User admin = user("admin@demo.com", "System", "Admin", UserRole.SYSTEM_ADMIN, org.getId());
        User hr = user("hr@demo.com", "HR", "User", UserRole.CLIENT_USER, org.getId());
        userRepository.saveAll(List.of(admin, hr));
    }

    private User user(String email, String first, String last, UserRole role, String orgId) {
        return User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .firstName(first)
                .lastName(last)
                .role(role)
                .organizationId(orgId)
                .enabled(true)
                .build();
    }
}
