ALTER TABLE users
  ADD COLUMN title           VARCHAR(50),
  ADD COLUMN contact_phone   VARCHAR(20),
  ADD COLUMN terms_service   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN terms_privacy   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN terms_marketing BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN terms_ai_usage  BOOLEAN NOT NULL DEFAULT false;
