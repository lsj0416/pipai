CREATE TABLE company_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    business_type       VARCHAR(100),
    employee_count      INTEGER,
    annual_revenue      VARCHAR(50),
    personal_data_items TEXT,
    has_privacy_policy  BOOLEAN,
    sensitive_data_types TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
