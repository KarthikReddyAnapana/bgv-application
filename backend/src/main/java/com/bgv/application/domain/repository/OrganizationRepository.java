package com.bgv.application.domain.repository;

import com.bgv.application.domain.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, String> {
}
