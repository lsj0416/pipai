CREATE TABLE risk_checklist_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    level       VARCHAR(20)  NOT NULL CHECK (level IN ('IMMEDIATE', 'CHECK_NEEDED', 'GOOD')),
    related_law VARCHAR(200),
    resolved    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_user_level ON risk_checklist_items (user_id, level, created_at DESC);
