# CLAUDE.md — Backend

> 상위 문서: 루트 `CLAUDE.md`

## 개요

- **Framework**: Spring Boot 3.x (Java 17)
- **ORM**: JPA / Hibernate
- **벡터 검색**: JDBC Template (pgvector 직접 쿼리)
- **RAG**: LangChain4j
- **배포**: AWS ECS Fargate (Docker)

---

## 디렉토리 구조

```
backend/
├── src/main/java/com/pipai/
│   ├── api/
│   │   ├── AuthController.java
│   │   ├── ProfileController.java
│   │   ├── ChatController.java
│   │   ├── DashboardController.java
│   │   ├── InquiryController.java
│   │   └── LawController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── ProfileService.java
│   │   ├── ChatService.java
│   │   ├── DashboardService.java
│   │   ├── InquiryService.java
│   │   └── LawDataSyncService.java     # 법령 데이터 주기적 갱신
│   ├── rag/
│   │   ├── RagPipeline.java            # RAG 메인 파이프라인
│   │   ├── EmbeddingService.java       # 임베딩 생성
│   │   ├── VectorSearchService.java    # pgvector 검색
│   │   └── LlmService.java             # LLM API 호출
│   ├── external/
│   │   ├── LawApiClient.java           # 법제처 API 연동
│   │   ├── PipcApiClient.java          # 개보위 API 연동
│   │   └── dto/                        # 외부 API 응답 DTO
│   ├── domain/
│   │   ├── User.java
│   │   ├── CompanyProfile.java
│   │   ├── Conversation.java
│   │   ├── Message.java
│   │   ├── RiskChecklistItem.java
│   │   └── InquiryDraft.java
│   ├── repository/
│   │   ├── UserRepository.java         # JPA
│   │   ├── ProfileRepository.java      # JPA
│   │   ├── ConversationRepository.java # JPA
│   │   ├── MessageRepository.java      # JPA
│   │   ├── RiskRepository.java         # JPA
│   │   ├── LawEmbeddingRepository.java # JDBC (pgvector)
│   │   └── CaseEmbeddingRepository.java# JDBC (pgvector)
│   ├── common/
│   │   ├── ApiResponse.java            # 공통 응답 래퍼
│   │   ├── GlobalExceptionHandler.java
│   │   └── SecurityConfig.java
│   └── PipaiApplication.java
├── src/main/resources/
│   ├── application.yml                 # 공통 설정
│   ├── application-local.yml           # 로컬 설정 (커밋 금지)
│   └── db/migration/                   # Flyway 마이그레이션
│       ├── V1__create_users.sql
│       ├── V2__create_company_profiles.sql
│       ├── V3__create_conversations_messages.sql
│       ├── V4__create_risk_checklist_items.sql
│       ├── V5__create_inquiry_drafts.sql
│       └── V6__create_vector_tables.sql
├── Dockerfile
└── build.gradle
```

---

## 환경변수

```yaml
# application-local.yml (커밋 금지)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/pipai
    username: pipai
    password: pipai
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate

law-api:
  key: ${LAW_API_KEY}           # 법제처 OC 인증값 (법령 + 개보위 처분 결정문 공통 사용)
  base-url: https://www.law.go.kr/DRF

openai:
  api-key: ${OPENAI_API_KEY}
  embedding-model: text-embedding-3-small
  chat-model: gpt-4o
```

---

## 레이어 의존 규칙

```
api → service → rag / repository / external
```

- `api`는 `service`만 호출
- `service`는 `rag`, `repository`, `external` 호출 가능
- `rag`는 `repository`(벡터), `external`(LLM) 호출 가능
- 역방향 의존 금지

---

## 공통 응답 래퍼

모든 API 응답은 `ApiResponse<T>`로 통일한다.

```java
// ApiResponse.java
public record ApiResponse<T>(
    boolean success,
    T data,
    ErrorDetail error,
    Instant timestamp
) {
    public static <T> ApiResponse<T> ok(T data) { ... }
    public static <T> ApiResponse<T> fail(String code, String message) { ... }
}
```

---

## RAG 파이프라인

```java
// RagPipeline.java 흐름
public Flux<String> generateAnswer(String userMessage, String userId) {
    // 1. 기업 프로필 로드
    CompanyProfile profile = profileRepository.findByUserId(userId);

    // 2. 임베딩 생성
    float[] queryVector = embeddingService.embed(userMessage);

    // 3. 벡터 검색
    List<LawChunk> lawRefs = vectorSearchService.searchLaws(queryVector, 5);
    List<CaseChunk> caseRefs = vectorSearchService.searchCases(queryVector, profile.getBusinessType(), 3);

    // 4. 컨텍스트 조합 후 LLM 호출 (스트리밍)
    return llmService.streamAnswer(userMessage, profile, lawRefs, caseRefs);
}
```

---

## 외부 API 연동

### 법제처 API

```java
// LawApiClient.java
// Base URL: https://www.law.go.kr/DRF/
// 인증: OC 파라미터

// 법령 검색
GET /lawSearch.do?OC={key}&target=law&query=개인정보&type=JSON

// 법령 본문
GET /lawService.do?OC={key}&target=law&ID={lawId}&type=JSON

// 법령해석례
GET /lawSearch.do?OC={key}&target=expc&type=JSON
```

- JSON 응답을 백엔드에서 정형화 후 프론트 전달
- 조문 단위로 청킹하여 임베딩 저장

### 개인정보보호위원회 API

```java
// PipcApiClient.java
// Base URL: https://api.odcloud.kr/api/
// 인증: serviceKey 파라미터

// 처분 결정문 목록
GET /15121023/v1/uddi:...?serviceKey={key}&page=1&perPage=100
```

- 비정형 텍스트 → LLM으로 업종·규모·위반유형·과징금 파싱
- 파싱 결과를 `case_embeddings`에 구조화 저장

---

## 데이터 수집 스케줄러

```java
// LawDataSyncService.java
@Scheduled(cron = "0 0 2 1 * *")  // 매월 1일 새벽 2시
public void syncLawData() {
    // 1. 법령 변경이력 API로 개정 감지
    // 2. 변경된 조문만 재임베딩
    // 3. law_embeddings 업데이트
}
```

---

## 개발 규칙

### 네이밍
- 클래스: `PascalCase`
- 메서드·변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- 테이블·컬럼: `snake_case`

### 예외 처리
- 모든 예외는 `GlobalExceptionHandler`에서 처리
- 외부 API 오류: `ExternalApiException` 사용
- LLM 오류: `LlmException` 사용

### 트랜잭션
- 서비스 레이어에서 `@Transactional` 관리
- 벡터 DB(JDBC) 작업은 트랜잭션 분리

### 토큰 비용 최적화
- 임베딩: `text-embedding-3-small` 사용
- LLM 호출은 최종 답변 생성 단계에서만
- 자주 조회되는 법령 조문은 캐싱 처리 (`@Cacheable`)

---

## 주의 사항

- `application-local.yml` 절대 커밋 금지
- LLM이 법령을 직접 생성하지 않도록 반드시 RAG 구조 유지
- 모든 법령 조항 답변에 조문 번호·출처 명시 필수
- AI 면책 문구를 응답 메타데이터에 포함
