CREATE TABLE bgv_requests (
    id VARCHAR(36) PRIMARY KEY,
    ps_number VARCHAR(50),
    requested_by_name VARCHAR(255),
    rr_number DOUBLE,
    employee_type VARCHAR(50),
    candidate_id VARCHAR(100),
    resource_name VARCHAR(255),
    resource_ps_no VARCHAR(50),
    resource_type VARCHAR(50),
    geo_region VARCHAR(50),
    country VARCHAR(50),
    status VARCHAR(50),
    bgv_initiated_by VARCHAR(255),
    comments_from_pmo VARCHAR(10000),
    bgv_stopped_reason VARCHAR(10000),
    onboarding_type VARCHAR(50),
    evidence_path VARCHAR(1024),
    priority VARCHAR(20),
    interim_date VARCHAR(10),
    interim_status VARCHAR(100),
    final_bgv_date VARCHAR(10),
    final_bgv_status VARCHAR(100),
    request_submitted_on VARCHAR(10),
    created_at BIGINT,
    updated_at BIGINT,
    user_role VARCHAR(20)
);

CREATE INDEX idx_bgv_requests_ps_number ON bgv_requests (ps_number);
CREATE INDEX idx_bgv_requests_candidate_id ON bgv_requests (candidate_id);
CREATE INDEX idx_bgv_requests_resource_ps_no ON bgv_requests (resource_ps_no);
CREATE INDEX idx_bgv_requests_status_created ON bgv_requests (status, created_at);
CREATE INDEX idx_bgv_requests_user_role_status ON bgv_requests (user_role, status);
CREATE INDEX idx_bgv_requests_employee_type ON bgv_requests (employee_type);
CREATE INDEX idx_bgv_requests_resource_name ON bgv_requests (resource_name);

CREATE TABLE bgv_request_history (
    history_id VARCHAR(36) PRIMARY KEY,
    bgv_request_id VARCHAR(36),
    action VARCHAR(50),
    ps_number VARCHAR(50),
    requested_by_name VARCHAR(255),
    rr_number DOUBLE,
    employee_type VARCHAR(50),
    candidate_id VARCHAR(100),
    resource_name VARCHAR(255),
    resource_ps_no VARCHAR(50),
    resource_type VARCHAR(50),
    geo_region VARCHAR(50),
    country VARCHAR(50),
    status VARCHAR(50),
    bgv_initiated_by VARCHAR(255),
    comments_from_pmo VARCHAR(10000),
    bgv_stopped_reason VARCHAR(10000),
    onboarding_type VARCHAR(50),
    evidence_path VARCHAR(1024),
    priority VARCHAR(20),
    request_submitted_on VARCHAR(10),
    user_role VARCHAR(20),
    created_at BIGINT,
    snapshot_at BIGINT
);

CREATE INDEX idx_bgv_history_request_snapshot ON bgv_request_history (bgv_request_id, snapshot_at);
CREATE INDEX idx_bgv_history_ps_snapshot ON bgv_request_history (ps_number, snapshot_at);
CREATE INDEX idx_bgv_history_resource_ps_snapshot ON bgv_request_history (resource_ps_no, snapshot_at);
CREATE INDEX idx_bgv_history_candidate_snapshot ON bgv_request_history (candidate_id, snapshot_at);

CREATE TABLE bgv_excel_upload_records (
    id VARCHAR(36) PRIMARY KEY,
    source_filename VARCHAR(512),
    source_row_number INT,
    uploaded_at BIGINT,
    upload_batch_id VARCHAR(36),
    ps_number VARCHAR(50),
    requested_by_name VARCHAR(255),
    rr_number DOUBLE,
    candidate_id VARCHAR(100),
    resource_name VARCHAR(255),
    resource_ps_no VARCHAR(50),
    resource_type VARCHAR(50),
    geo_region VARCHAR(50),
    country VARCHAR(50),
    status VARCHAR(50),
    bgv_initiated_by VARCHAR(255),
    comments_from_pmo VARCHAR(10000),
    onboarding_type VARCHAR(50),
    request_submitted_on VARCHAR(10)
);

CREATE INDEX idx_excel_records_batch_row ON bgv_excel_upload_records (upload_batch_id, source_row_number);
CREATE INDEX idx_excel_records_uploaded_at ON bgv_excel_upload_records (uploaded_at);

CREATE TABLE bgv_excel_upload_cells (
    id VARCHAR(36) PRIMARY KEY,
    upload_batch_id VARCHAR(36),
    source_row_number INT,
    column_index INT,
    header VARCHAR(512),
    cell_value VARCHAR(10000),
    uploaded_at BIGINT
);

CREATE INDEX idx_excel_cells_batch_row_col ON bgv_excel_upload_cells (upload_batch_id, source_row_number, column_index);
