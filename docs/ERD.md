# ERD / DB 스키마

## 개요

- **DB**: AWS RDS PostgreSQL 15+
- **Extension**: pgvector
- **마이그레이션**: Flyway

---

## ERD (텍스트 표현)

```
users
 ├── id (PK)
 ├── email
 ├── name
 └── ...
      │
      │ 1:1
      ▼
company_profiles
 ├── id (PK)
 ├── user_id (FK → users.id)
 ├── business_type
 ├── employee_count
 └── ...
      │
      │ 1:N
      ▼
conversations
 ├── id (PK)
 ├── user_id (FK → users.id)
 ├── title
 └── ...
      │
      │ 1:N
      ▼
messages
 ├── id (PK)
 ├── conversation_id (FK → conversations.id)
 ├── role (user / assistant)
 ├── content
 └── ...

users ─── 1:N ──► risk_checklist_items
                    ├── id (PK)
                    ├── user_id (FK)
                    ├── item_key
                    └── status

users ─── 1:N ──► inquiry_drafts
                    ├── id (PK)
                    ├── user_id (FK)
                    ├── conversation_id (FK)
                    └── body

[벡터 테이블 — JPA 외부, JDBC로 직접 관리]
law_embeddings
 ├── id (PK)
 ├── law_id
 ├── article_no
 ├── content
 └── embedding (vector(1536))

case_embeddings
 ├── id (PK)
 ├── case_id
 ├── business_type
 ├── violation_type
 ├── penalty_amount
 ├── content
 └── embedding (vector(1536))
```

---

## 테이블 상세

### users

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 사용자 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 |
| name | VARCHAR(100) | NOT NULL | 이름 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 가입일 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 수정일 |

---

### company_profiles

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 프로필 ID |
| user_id | UUID | FK → users.id, UNIQUE | 사용자 ID (1:1) |
| business_type | VARCHAR(100) | NOT NULL | 업종 |
| employee_count | INTEGER | NOT NULL | 직원 수 |
| annual_revenue | BIGINT | | 연매출 (원) |
| personal_data_items | TEXT[] | | 수집 개인정보 항목 |
| subcontractor_count | INTEGER | DEFAULT 0 | 수탁업체 수 |
| growth_plan | JSONB | | 성장 계획 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

```json
// growth_plan JSONB 예시
{
  "targetEmployeeCount": 10,
  "targetRevenue": 500000000,
  "plannedExpansion": "배달 서비스 추가"
}
```

---

### conversations

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 대화 ID |
| user_id | UUID | FK → users.id, NOT NULL | 사용자 ID |
| title | VARCHAR(255) | | 대화 제목 (AI 자동 생성) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### messages

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 메시지 ID |
| conversation_id | UUID | FK → conversations.id, NOT NULL | 대화 ID |
| role | VARCHAR(20) | NOT NULL | `user` / `assistant` |
| content | TEXT | NOT NULL | 메시지 본문 |
| law_refs | JSONB | | 관련 법령 조항 목록 |
| case_refs | JSONB | | 관련 사례 목록 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

```json
// law_refs JSONB 예시
[
  {
    "lawId": "law_001",
    "articleNo": "제15조",
    "title": "개인정보의 수집·이용",
    "summary": "정보주체 동의 시에만 수집 가능"
  }
]

// case_refs JSONB 예시
[
  {
    "caseId": "case_001",
    "businessType": "요식업",
    "employeeCount": 5,
    "violation": "동의 없이 고객 연락처 수집",
    "penaltyAmount": 500,
    "year": 2023
  }
]
```

---

### risk_checklist_items

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 항목 ID |
| user_id | UUID | FK → users.id, NOT NULL | 사용자 ID |
| item_key | VARCHAR(100) | NOT NULL | 항목 식별자 |
| title | VARCHAR(255) | NOT NULL | 항목명 |
| status | VARCHAR(20) | NOT NULL | `danger` / `warning` / `safe` / `pending` |
| related_article | VARCHAR(255) | | 관련 법령 조항 |
| scenario_trigger | VARCHAR(255) | | 성장 시나리오 트리거 |
| resolved_at | TIMESTAMPTZ | | 해결 일시 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**item_key 목록**

| item_key | 제목 | 관련 조항 |
|----------|------|-----------|
| `consent_procedure` | 수집 동의 절차 | 제15조 |
| `privacy_policy` | 처리방침 공개 | 제30조 |
| `retention_period` | 보관 기간 설정 | 제21조 |
| `destruction_procedure` | 파기 절차 | 제21조 |
| `cpo_designation` | CPO 지정 (직원 10명+) | 제31조 |
| `safety_measures` | 안전조치 의무 | 제29조 |

---

### inquiry_drafts

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 문의글 ID |
| user_id | UUID | FK → users.id, NOT NULL | 사용자 ID |
| conversation_id | UUID | FK → conversations.id | 원본 대화 ID |
| title | VARCHAR(255) | NOT NULL | 문의글 제목 |
| body | TEXT | NOT NULL | 문의글 본문 |
| target_channel | VARCHAR(50) | NOT NULL | 연결 채널 |
| target_url | VARCHAR(500) | | 채널 URL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### law_embeddings (벡터 테이블 — JDBC 관리)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | |
| law_id | VARCHAR(100) | NOT NULL | 법제처 법령 ID |
| law_name | VARCHAR(255) | NOT NULL | 법령명 |
| article_no | VARCHAR(50) | | 조문 번호 |
| article_title | VARCHAR(255) | | 조문 제목 |
| content | TEXT | NOT NULL | 조문 본문 |
| enforcement_date | DATE | | 시행일 |
| source_type | VARCHAR(50) | | `law` / `expc` (해석례) |
| embedding | vector(1536) | NOT NULL | 임베딩 벡터 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

```sql
-- 벡터 유사도 검색 쿼리
SELECT id, law_name, article_no, content,
       1 - (embedding <=> $1::vector) AS similarity
FROM law_embeddings
ORDER BY embedding <=> $1::vector
LIMIT 5;

-- 인덱스 (검색 성능)
CREATE INDEX ON law_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

### case_embeddings (벡터 테이블 — JDBC 관리)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | |
| case_id | VARCHAR(100) | NOT NULL | 결정문 ID |
| business_type | VARCHAR(100) | | 업종 |
| employee_count | INTEGER | | 직원 수 |
| violation_type | VARCHAR(255) | | 위반 유형 |
| penalty_amount | INTEGER | | 과징금액 (만원) |
| decision_year | INTEGER | | 처분 연도 |
| content | TEXT | NOT NULL | 결정문 요약 본문 |
| embedding | vector(1536) | NOT NULL | 임베딩 벡터 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

```sql
-- 유사 사례 검색 (업종 필터 포함)
SELECT id, business_type, employee_count, violation_type, penalty_amount, decision_year,
       1 - (embedding <=> $1::vector) AS similarity
FROM case_embeddings
WHERE business_type = $2
ORDER BY embedding <=> $1::vector
LIMIT 3;

-- 인덱스
CREATE INDEX ON case_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 마이그레이션 파일 구조 (Flyway)

```
backend/src/main/resources/db/migration/
├── V1__create_users.sql
├── V2__create_company_profiles.sql
├── V3__create_conversations_messages.sql
├── V4__create_risk_checklist_items.sql
├── V5__create_inquiry_drafts.sql
└── V6__create_vector_tables.sql
```
