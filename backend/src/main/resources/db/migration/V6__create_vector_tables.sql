CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE law_embeddings (
    id             BIGSERIAL PRIMARY KEY,
    law_id         VARCHAR(100) NOT NULL,
    article_number VARCHAR(100) NOT NULL,
    law_name       VARCHAR(200) NOT NULL,
    content        TEXT         NOT NULL,
    embedding      VECTOR(1536) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (law_id, article_number)
);

CREATE INDEX idx_law_embedding_vector ON law_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE TABLE case_embeddings (
    id             BIGSERIAL PRIMARY KEY,
    case_id        VARCHAR(100) NOT NULL UNIQUE,
    title          VARCHAR(300) NOT NULL,
    summary        TEXT         NOT NULL,
    business_type  VARCHAR(100),
    violation_type VARCHAR(200),
    fine_amount    BIGINT,
    embedding      VECTOR(1536) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_embedding_vector ON case_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
CREATE INDEX idx_case_business_type ON case_embeddings (business_type);
