CREATE TABLE organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id VARCHAR(36),
    candidate_id VARCHAR(36),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_users_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_users_org ON users (organization_id);
CREATE INDEX idx_users_role ON users (role);

CREATE TABLE candidates (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    date_of_birth DATE,
    address VARCHAR(1000),
    employment_history VARCHAR(5000),
    education_history VARCHAR(5000),
    id_document_metadata VARCHAR(2000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_candidates_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_candidates_org ON candidates (organization_id);
CREATE INDEX idx_candidates_email ON candidates (email);

CREATE TABLE verification_requests (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    candidate_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    overall_result VARCHAR(50),
    initiated_by_user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_vr_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_vr_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    CONSTRAINT fk_vr_initiator FOREIGN KEY (initiated_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_vr_org ON verification_requests (organization_id);
CREATE INDEX idx_vr_candidate ON verification_requests (candidate_id);
CREATE INDEX idx_vr_status ON verification_requests (status);
CREATE INDEX idx_vr_created ON verification_requests (created_at);

CREATE TABLE verification_checks (
    id VARCHAR(36) PRIMARY KEY,
    verification_request_id VARCHAR(36) NOT NULL,
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_agent_id VARCHAR(36),
    result VARCHAR(50),
    notes VARCHAR(5000),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_vc_request FOREIGN KEY (verification_request_id) REFERENCES verification_requests(id),
    CONSTRAINT fk_vc_agent FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

CREATE INDEX idx_vc_request ON verification_checks (verification_request_id);
CREATE INDEX idx_vc_agent ON verification_checks (assigned_agent_id);
CREATE INDEX idx_vc_status ON verification_checks (status);

CREATE TABLE verification_assignments (
    id VARCHAR(36) PRIMARY KEY,
    verification_check_id VARCHAR(36) NOT NULL,
    agent_user_id VARCHAR(36) NOT NULL,
    assigned_by_user_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_va_check FOREIGN KEY (verification_check_id) REFERENCES verification_checks(id),
    CONSTRAINT fk_va_agent FOREIGN KEY (agent_user_id) REFERENCES users(id),
    CONSTRAINT fk_va_assigner FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_va_agent ON verification_assignments (agent_user_id);
CREATE INDEX idx_va_check ON verification_assignments (verification_check_id);

CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY,
    candidate_id VARCHAR(36),
    verification_check_id VARCHAR(36),
    file_name VARCHAR(512) NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    uploaded_by_user_id VARCHAR(36) NOT NULL,
    file_size_bytes BIGINT,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_doc_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    CONSTRAINT fk_doc_check FOREIGN KEY (verification_check_id) REFERENCES verification_checks(id),
    CONSTRAINT fk_doc_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_doc_candidate ON documents (candidate_id);
CREATE INDEX idx_doc_check ON documents (verification_check_id);

CREATE TABLE verification_notes (
    id VARCHAR(36) PRIMARY KEY,
    verification_request_id VARCHAR(36),
    verification_check_id VARCHAR(36),
    content VARCHAR(5000) NOT NULL,
    author_user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_vn_request FOREIGN KEY (verification_request_id) REFERENCES verification_requests(id),
    CONSTRAINT fk_vn_check FOREIGN KEY (verification_check_id) REFERENCES verification_checks(id),
    CONSTRAINT fk_vn_author FOREIGN KEY (author_user_id) REFERENCES users(id)
);

CREATE INDEX idx_vn_request ON verification_notes (verification_request_id);
CREATE INDEX idx_vn_check ON verification_notes (verification_check_id);

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    previous_value VARCHAR(5000),
    new_value VARCHAR(5000),
    performed_by_user_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at);
