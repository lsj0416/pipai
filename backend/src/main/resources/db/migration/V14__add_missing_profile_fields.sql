-- 기본정보 (s1)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS representative_name VARCHAR(100);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(20);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS founding_year VARCHAR(20);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS company_address VARCHAR(500);

-- 사업 개요 추가 (s3)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS industry_detail VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS large_assets VARCHAR(50);

-- 개인정보 수집 추가 (s4)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS subject_range VARCHAR(100);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS general_other VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS marketing_scope TEXT;

-- 처리 위탁 추가 (s5)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS provision_purpose TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS provision_recipients TEXT;

-- 운영 환경 추가 (s6)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS app_name VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS marketplace_source VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS cctv_loc TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS cctv_loc_other VARCHAR(200);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS cctv_retention VARCHAR(100);

-- 마케팅 추가 (s8)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS marketing_channels TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS marketing_consent_timing VARCHAR(100);

-- 미래 계획 (s9)
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS future_plans TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS future_employees VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS future_revenue VARCHAR(50);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS future_subject_scale VARCHAR(100);
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS new_biz VARCHAR(100);
