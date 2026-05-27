ALTER TABLE company_profiles
    ADD COLUMN IF NOT EXISTS collection_purposes TEXT,
    ADD COLUMN IF NOT EXISTS delegation_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS delegatee_types TEXT,
    ADD COLUMN IF NOT EXISTS overseas_transfer_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS overseas_transfer_country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cctv_operation_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS system_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS encryption_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS destruction_policy_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS destruction_methods TEXT,
    ADD COLUMN IF NOT EXISTS employment_document_retention VARCHAR(100),
    ADD COLUMN IF NOT EXISTS former_employee_destruction_timing VARCHAR(100),
    ADD COLUMN IF NOT EXISTS partner_contact_db_registration VARCHAR(100),
    ADD COLUMN IF NOT EXISTS partner_contact_retention VARCHAR(100),
    ADD COLUMN IF NOT EXISTS privacy_policy_included_items TEXT,
    ADD COLUMN IF NOT EXISTS delegatee_disclosure_status VARCHAR(150),
    ADD COLUMN IF NOT EXISTS delegatee_audit_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS delegatee_education_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cloud_server_location VARCHAR(100),
    ADD COLUMN IF NOT EXISTS overseas_server_country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cctv_external_provision VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cctv_access_control VARCHAR(100),
    ADD COLUMN IF NOT EXISTS encrypted_data_items TEXT,
    ADD COLUMN IF NOT EXISTS access_control_separation VARCHAR(100),
    ADD COLUMN IF NOT EXISTS retired_access_revocation VARCHAR(100),
    ADD COLUMN IF NOT EXISTS access_change_history_status VARCHAR(100);

ALTER TABLE risk_checklist_items
    ADD COLUMN IF NOT EXISTS diagnosis_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) NOT NULL DEFAULT 'CHAT',
    ADD COLUMN IF NOT EXISTS source_conversation_id UUID,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_risk_user_source_code
    ON risk_checklist_items (user_id, source_type, diagnosis_code);
