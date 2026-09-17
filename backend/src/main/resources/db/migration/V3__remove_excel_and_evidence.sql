-- Remove Excel upload feature tables and evidence columns (feature retired)
DROP TABLE IF EXISTS bgv_excel_upload_cells;
DROP TABLE IF EXISTS bgv_excel_upload_records;

ALTER TABLE bgv_requests DROP COLUMN IF EXISTS evidence_path;
ALTER TABLE bgv_request_history DROP COLUMN IF EXISTS evidence_path;
