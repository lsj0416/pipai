# 아키텍처 문서

## 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (CDN)                            │
│                   Next.js 14 Frontend                        │
│    /chat  /mypage  /dashboard  /inquiry                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API / SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS ECS Fargate                             │
│               Spring Boot 3.x Backend                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   API    │  │ Service  │  │   RAG    │  │  External  │  │
│  │ Layer    │→ │  Layer   │→ │Pipeline  │  │  API Layer │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└──────────┬───────────────────────┬──────────────┬───────────┘
           │                       │              │
           ▼                       ▼              ▼
┌─────────────────┐   ┌────────────────────┐  ┌──────────────┐
│  AWS RDS        │   │    LLM API         │  │  법제처 API  │
│  PostgreSQL 15  │   │  OpenAI / Claude   │  │  개보위 API  │
│  + pgvector     │   └────────────────────┘  └──────────────┘
└─────────────────┘
```

---

## 백엔드 레이어 구조

```
HTTP Request
    ↓
[API Layer] — REST Controller
    ↓
[Service Layer] — 비즈니스 로직
    ↓
[RAG Pipeline] ←→ [External API Layer]
    ↓                      ↓
[Repository]         법제처 / 개보위
    ↓
[DB] JPA + JDBC(pgvector)
```

### 각 레이어 역할

| 레이어 | 패키지 | 역할 |
|--------|--------|------|
| API | `api/` | HTTP 요청 수신, 응답 직렬화, 인증 처리 |
| Service | `service/` | 비즈니스 로직, 트랜잭션 관리 |
| RAG | `rag/` | 벡터 검색, LLM 호출, 컨텍스트 조합 |
| External | `external/` | 법제처·개보위 API 호출, JSON 정형화 |
| Repository | `repository/` | JPA (일반 데이터), JDBC (벡터 데이터) |

---

## RAG 파이프라인 상세

```
사용자 질문 입력
        ↓
1. 의도 분석 (LLM)
   "카페 손님 전화번호 받아도 되나요?"
        ↓
2. 임베딩 생성
   질문 텍스트 → 1536차원 벡터
        ↓
3. 벡터 DB 검색 (pgvector)
   ├── law_embeddings → 관련 법령 조항 Top 5
   └── case_embeddings → 유사 사례 Top 3
        ↓
4. AI 재검증 (LLM)
   검색된 조문의 질문과의 관련성 2차 확인
        ↓
5. 컨텍스트 조합
   ├── 기업 프로필 (업종·규모 등)
   ├── 대화 이력
   ├── 관련 법령 조항 (원문)
   └── 유사 사례
        ↓
6. 최종 답변 생성 (LLM)
   스트리밍 응답 → SSE로 프론트 전달
        ↓
7. 체크리스트 업데이트
   진단 결과 → risk_checklist_items 갱신
```

---

## 데이터 수집 파이프라인

```
[초기 1회 + 주기적 갱신]

법제처 API
├── 현행법령 본문 (JSON)
│       ↓
│   XML→JSON 정형화 (백엔드)
│       ↓
│   텍스트 청킹 (조문 단위)
│       ↓
│   임베딩 생성 (OpenAI)
│       ↓
│   law_embeddings 저장
│
├── 법령 변경이력 API (스케줄러: 월 1회)
│       ↓
│   변경된 조문만 재임베딩
│
└── 법령해석례 → 동일 파이프라인

개인정보보호위원회 API
└── 처분 결정문 (비정형 텍스트)
        ↓
    LLM 파싱 (업종·규모·위반유형·과징금 추출)
        ↓
    구조화 태깅
        ↓
    임베딩 생성
        ↓
    case_embeddings 저장
```

---

## 인프라 구성

### AWS 리소스

| 리소스 | 스펙 | 용도 |
|--------|------|------|
| ECS Fargate | 0.5 vCPU / 1GB RAM | Spring Boot 실행 |
| RDS PostgreSQL | db.t3.micro (프리티어) | 메인 DB |
| ECR | - | Docker 이미지 저장소 |
| VPC | - | ECS ↔ RDS 내부 통신 |

### 보안 그룹 설정

```
ECS Fargate 보안그룹
├── Inbound:  443 (HTTPS, 0.0.0.0/0)
└── Outbound: ALL

RDS 보안그룹
├── Inbound:  5432 (ECS 보안그룹에서만)
└── Outbound: 없음
```

---

## CI/CD 파이프라인

```
GitHub Push (main 브랜치)
        ↓
GitHub Actions 트리거
        │
        ├── [Frontend Job]
        │   └── Vercel 자동 배포 (GitHub 연동)
        │
        └── [Backend Job]
            ├── ./gradlew test
            ├── ./gradlew build
            ├── Docker Build
            ├── ECR Push
            └── ECS Service Update (Rolling Deploy)
```

### GitHub Actions 워크플로우 파일 위치

```
.github/workflows/
├── frontend.yml   # Vercel 배포
└── backend.yml    # ECS 배포
```

---

## 로컬 개발 환경

```
docker-compose.yml
├── db (PostgreSQL 15 + pgvector)
└── [옵션] localstack (AWS 서비스 로컬 에뮬레이션)

로컬 실행
├── Frontend: npm run dev (port 3000)
└── Backend:  ./gradlew bootRun (port 8080)
             --spring.profiles.active=local
```

---

## 토큰 비용 최적화 전략

| 전략 | 내용 |
|------|------|
| 캐싱 | 자주 조회되는 법령 조문은 Redis 또는 인메모리 캐싱 |
| 모델 분리 | 임베딩 생성 → `text-embedding-3-small` (저렴), 답변 생성 → GPT-4o |
| 벡터 우선 | 단순 조문 검색은 벡터 DB로 처리, LLM은 최종 답변 생성에서만 호출 |
| 청킹 최적화 | 조문 단위로 청킹하여 불필요한 컨텍스트 포함 최소화 |

---

## 주요 기술 결정 사유 (ADR 요약)

| 결정 | 선택 | 이유 |
|------|------|------|
| 프론트엔드 | Next.js 14 | 기존 사용 경험, Vercel 원클릭 배포, SSE 스트리밍 지원 |
| 백엔드 | Spring Boot | 주력 스택, Java RAG 생태계(LangChain4j), 포트폴리오 차별화 |
| DB 호스팅 | AWS RDS | pgvector 지원, 자동 백업, 프리티어 12개월, 포트폴리오 키워드 |
| 벡터 DB | pgvector | 별도 벡터 DB 없이 PostgreSQL 통합 관리 가능 |
| 배포 | ECS Fargate | Docker 경험 활용, 서버 관리 불필요, 포트폴리오 AWS 키워드 |
| CI/CD | GitHub Actions | 무료, ECS 배포 공식 액션 지원 |
