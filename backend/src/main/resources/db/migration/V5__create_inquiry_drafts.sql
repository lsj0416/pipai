CREATE TABLE inquiry_drafts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    conversation_id UUID         REFERENCES conversations (id) ON DELETE SET NULL,
    subject         VARCHAR(200) NOT NULL,
    content         TEXT         NOT NULL,
    related_laws    TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiry_user_id ON inquiry_drafts (user_id, created_at DESC);
