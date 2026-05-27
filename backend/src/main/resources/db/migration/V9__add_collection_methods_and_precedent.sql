ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS collection_methods TEXT;
ALTER TABLE inquiry_drafts   ADD COLUMN IF NOT EXISTS precedent TEXT;
