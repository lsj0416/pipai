# PIPAi — 개인정보보호 AI 법무 어시스턴트

> 제2회 법령데이터 활용 아이디어 공모전 출품작 · 팀명: 개보린 · 법제처 주최 (2026)

---

## 프로젝트 소개

개인정보보호법(PIPA)을 잘 모르는 **중소기업·소상공인**을 위한 대화형 AI 법무 어시스턴트입니다.

기업의 업종·규모·개인정보 수집 항목을 바탕으로 AI가 법적 리스크를 진단하고, 법제처 법령 코퍼스와 개인정보보호위원회 처분 사례를 근거로 구체적인 위반 가능성을 알려줍니다. 진단 결과는 전문가에게 제출할 수 있는 구조화된 문의글로 자동 생성됩니다.

**"법을 몰라서 걱정되는 사장님"이 AI와 대화만 해도 어디가 문제인지 파악할 수 있는 서비스**를 목표로 했습니다.

---

## 핵심 기능

### AI 대화형 리스크 진단
기업 프로필(업종, 직원 수, 매출, 수집 항목)을 기반으로 맥락화된 답변을 생성합니다. 대화 이력(최대 20턴)과 히든 메모(이전 대화 요약)를 LLM 컨텍스트에 누적 반영하여 세션 간 문맥을 유지합니다.

### RAG 파이프라인
법제처 API에서 수집한 법령 조문(368건)·행정규칙(123건)과 개인정보보호위원회 처분 사례(50건)를 pgvector로 임베딩 저장합니다. 질문마다 코사인 유사도 검색으로 관련 조문 5건·사례 3건을 추출한 뒤 LLM이 재검증하여 최종 답변을 생성합니다.

### 3단계 리스크 등급
| 등급 | 의미 |
|------|------|
| 🔴 즉시 조치 | 위반 가능성 높음, 즉각 대응 필요 |
| 🟡 확인 필요 | 전문가 확인 권장 |
| 🔵 양호 | 현재 준수 상태 |

대화 중 AI가 체크리스트를 실시간 갱신하며, SSE 스트리밍으로 대시보드에 즉시 반영됩니다.

### 전문가 문의글 자동 생성
대화 내용을 LLM이 법적 용어로 구조화하여 전문가 제출용 문서를 자동 생성합니다. 기업 정보(업종·직원수·수집 항목)는 프로필 API에서 자동으로 채워집니다.

---

## 기술 스택

| 구분 | 기술 | 선택 이유 |
|------|------|-----------|
| 프론트엔드 | Next.js 14 (TypeScript) | App Router SSE 스트리밍, Vercel 원클릭 배포 |
| 백엔드 | Spring Boot 3.x (Java 17) | LangChain4j RAG 생태계, 주력 스택 |
| DB | PostgreSQL 15 + pgvector | 별도 벡터 DB 없이 관계형 + 벡터 통합 관리 |
| LLM | OpenAI GPT-4o / text-embedding-3-small | 답변 생성과 임베딩 모델 분리로 비용 최적화 |
| 인프라 | AWS ECS Fargate + RDS | Docker 기반 무서버 컨테이너, 자동 백업 |
| CI/CD | GitHub Actions | ECS Rolling Deploy 자동화 |
| 외부 API | 법제처 DRF API, 개인정보보호위원회 API | 공공 법령 데이터 실시간 수집 |

---

## 시스템 아키텍처

```
사용자 (브라우저)
        │ HTTPS
        ▼
┌─────────────────────────┐
│  Vercel (CDN)           │
│  Next.js 14 Frontend    │
│  /chat /dashboard       │
│  /mypage /inquiry       │
└─────────┬───────────────┘
          │ REST API / SSE
          ▼
┌─────────────────────────────────────────┐
│  AWS ECS Fargate                        │
│  Spring Boot 3.x Backend               │
│                                         │
│  API Layer → Service Layer             │
│       ↓              ↓                  │
│  RAG Pipeline    External API Layer    │
│  (벡터검색+LLM)   (법제처·개보위)       │
└──────────┬──────────────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
AWS RDS       OpenAI API
PostgreSQL 15
+ pgvector
```

### RAG 파이프라인 흐름

```
질문 입력
    ↓ 의도 분석 (LLM)
    ↓ 임베딩 생성 (text-embedding-3-small)
    ↓ pgvector 코사인 유사도 검색
      ├─ law_embeddings  → 관련 법령 조문 Top 5
      └─ case_embeddings → 유사 처분 사례 Top 3
    ↓ AI 재검증 (관련성 2차 확인)
    ↓ 컨텍스트 조합
      ├─ 기업 프로필 (업종·규모·수집 항목)
      ├─ 대화 이력 (최근 20턴)
      ├─ 히든 메모 (이전 대화 요약 누적)
      ├─ 법령 조문 (원문)
      └─ 유사 처분 사례
    ↓ GPT-4o 답변 생성 (SSE 스트리밍)
    ↓ 리스크 체크리스트 자동 업데이트
```

---

## 데이터 파이프라인

앱 최초 실행 시 `DataInitializer`가 자동으로 법령 코퍼스를 구축합니다.

```
법제처 DRF API
├── target=law    → 개인정보보호 관련 법령 12종 (368개 조문)
└── target=admrul → 개인정보보호위원회 고시·지침 123건

개인정보보호위원회 API
└── 처분 결정문 50건 → LLM 파싱 (업종·규모·위반유형·과징금 추출) → 구조화 태깅

       ↓ (공통 파이프라인)
텍스트 청킹 (조문 단위)
       ↓
임베딩 생성 (OpenAI text-embedding-3-small)
       ↓
pgvector 저장 (1536차원)
```

---

## 프로젝트 구조

```
pipai/
├── frontend/                  # Next.js 14 (TypeScript)
│   └── src/
│       ├── app/
│       │   ├── (app)/         # 인증 후 페이지 (채팅·대시보드·마이페이지·문의글)
│       │   └── (auth)/        # 로그인·회원가입
│       ├── components/        # UI 컴포넌트 (ChatThread, RiskPanel, InquiryGen …)
│       └── lib/api/           # 백엔드 API 클라이언트
│
├── backend/                   # Spring Boot 3.x (Java 17)
│   └── src/main/java/com/
│       ├── api/               # REST Controller (Auth·Chat·Dashboard·Inquiry·Law)
│       ├── service/           # 비즈니스 로직 (Chat·Profile·Inquiry·Dashboard)
│       ├── rag/               # RAG 파이프라인 (LlmService·EmbeddingService·VectorSearchService)
│       ├── external/          # 법제처·개보위 API 클라이언트
│       └── repository/        # JPA (일반 데이터) + JDBC (pgvector 쿼리)
│
├── docs/                      # API 명세·ERD·아키텍처 문서
├── infra/                     # AWS·Docker 설정
└── docker-compose.yml         # 로컬 개발용 PostgreSQL + pgvector
```

---

## 주요 기술 결정

**pgvector를 별도 벡터 DB 대신 선택한 이유**
Pinecone·Weaviate 같은 전용 벡터 DB를 추가하면 운영 비용과 복잡도가 증가합니다. 법령 코퍼스 규모(~500건)에서는 PostgreSQL에 pgvector 확장만으로 충분한 검색 성능이 나오고, 관계형 데이터와 벡터 데이터를 단일 DB에서 관리할 수 있어 선택했습니다.

**임베딩과 답변 생성 모델 분리**
임베딩에는 `text-embedding-3-small`(저비용), 답변 생성에는 `GPT-4o`(고품질)를 사용합니다. 벡터 검색이 LLM 호출 대비 훨씬 저렴하므로, LLM은 최종 답변 생성 단계에서만 호출하여 토큰 비용을 최소화했습니다.

**SSE 스트리밍으로 UX 개선**
법령 해석 답변은 길어질 수 있어 HTTP 응답을 기다리면 체감 속도가 나쁩니다. Spring Boot의 `SseEmitter`와 Next.js의 `ReadableStream`을 연결하여 토큰 단위 스트리밍을 구현했고, 리스크 체크리스트 업데이트(`checklist_update` 이벤트)도 같은 SSE 연결로 전달합니다.

**히든 메모로 세션 간 문맥 유지**
대화가 끝나면 AI가 핵심 내용을 자동 요약하여 `company_profiles.hidden_memo`에 날짜 접두사로 누적 저장합니다. 다음 대화 시작 시 이 메모를 시스템 프롬프트에 포함하여, 이전에 어떤 주제를 다뤘는지 새 대화에서도 참조할 수 있습니다.

---

## 트러블슈팅

### WebClient → RestTemplate 교체 — 한글 URL 이중 인코딩 + DNS 문제

**증상**
법제처 DRF API에 한글 쿼리 파라미터(`query=개인정보`)를 포함해 호출하면 로컬 macOS 환경에서만 요청이 실패했습니다. 서버에서는 정상 동작해 원인 파악이 어려웠습니다.

**원인 파악**
Spring WebClient는 URI를 빌드할 때 파라미터를 한 번 인코딩하고, 내부 Netty HTTP 클라이언트가 전송 직전에 한 번 더 인코딩합니다. 결과적으로 `%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4`가 다시 인코딩되어 서버가 인식하지 못했습니다. 또한 macOS의 Netty DNS 리졸버가 `open.law.go.kr` 도메인을 간헐적으로 해석하지 못하는 문제도 겹쳤습니다.

**해결**
WebClient를 RestTemplate으로 교체하고 `UriComponentsBuilder`로 파라미터를 명시적으로 인코딩한 뒤, `URI` 객체를 직접 넘겨 이중 인코딩을 차단했습니다. macOS DNS 문제는 RestTemplate의 JDK 기본 DNS 리졸버로 전환하면서 자연히 해소되었습니다.

```java
// Before: WebClient (이중 인코딩 발생)
webClient.get()
    .uri(uriBuilder -> uriBuilder.queryParam("query", "개인정보").build())

// After: RestTemplate + 명시적 URI 생성
URI uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
    .queryParam("query", query)
    .build(false)   // 인코딩 스킵 (이미 인코딩됨)
    .toUri();
restTemplate.getForObject(uri, String.class);
```

---

### SSE 스트리밍 파싱 버그 — 토큰 앞 공백 유실

**증상**
GPT-4o 답변이 스트리밍될 때 단어 사이 공백이 간헐적으로 사라져 "개인정보보호법에따르면위반입니다"처럼 붙어서 표시되었습니다.

**원인 파악**
SSE 메시지 형식은 `data: {"token": " 따르면"}` 처럼 `data:` 뒤에 공백이 하나 붙습니다. 프론트엔드 파싱 코드에서 `line.replace("data:", "").trim()`을 사용했는데, `trim()`이 토큰 값 앞의 의미 있는 공백까지 제거했습니다.

**해결**
`trim()` 대신 `data:` 접두사만 정확히 제거하도록 수정했습니다.

```typescript
// Before: trim()이 토큰 앞 공백 제거
const json = line.replace("data:", "").trim();

// After: 접두사 7자("data: ")만 슬라이싱
const json = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
```

---

### 공공 API 문서-실제 응답 스펙 불일치 — 파싱 전면 실패

**증상**
개인정보보호위원회 처분 사례 수집 시 50건 전체가 빈 객체로 저장되어 벡터 검색 결과에 사례가 전혀 나오지 않았습니다.

**원인 파악**
법제처 DRF API 문서에는 처분 사례 응답 키가 `PrecSearch.prec`로 명시되어 있었지만, 실제 응답은 `Expc.expc` 구조로 내려왔습니다. 해당 API가 실제로는 판례가 아닌 **법령해석례** 엔드포인트(`target=expc`)였고, 문서와 실제 응답 구조가 달랐습니다. 필드명도 `사건명 → 안건명`, `사건번호 → 안건번호`로 달랐습니다.

**해결**
실제 API 응답을 직접 캡처하여 키 구조를 역산한 뒤 파서를 전면 수정했습니다. 이후 공공 API 연동 시 반드시 실제 응답을 먼저 확인하는 것을 원칙으로 삼았습니다.

```java
// Before: 문서 기준 파싱 (전부 null)
JsonNode cases = root.path("PrecSearch").path("prec");
String title = node.path("사건명").asText();

// After: 실제 응답 기준 파싱
JsonNode cases = root.path("Expc").path("expc");
String title = node.path("안건명").asText();
```

---

### LLM null 응답으로 인한 DB 제약 위반

**증상**
특정 조건에서 문의글 생성 API를 호출하면 `NOT NULL constraint violation`으로 500 에러가 발생했습니다.

**원인 파악**
두 가지 케이스가 있었습니다. 첫째, 대화 내용이 없는 상태에서 문의글 생성을 호출하면 LLM에 빈 컨텍스트가 전달되어 응답이 `null`로 반환되었습니다. 둘째, LLM 응답에서 JSON을 추출하는 정규식이 간헐적으로 매칭에 실패해 `null`을 반환했고, 그 값이 그대로 DB에 저장을 시도했습니다.

**해결**
서비스 레이어에 두 단계 방어 코드를 추가했습니다. 메시지가 0건인 대화는 문의글 생성 전에 early return하고, LLM 응답이 `null`이거나 파싱에 실패하면 의미 있는 예외를 던져 500이 아닌 400으로 응답하도록 처리했습니다.

```java
// 빈 대화 조기 차단
if (messages.isEmpty()) {
    throw new IllegalStateException("대화 내용이 없어 문의글을 생성할 수 없습니다.");
}

// LLM null 응답 방어
String generated = llmService.completeText(prompt);
if (generated == null || generated.isBlank()) {
    throw new IllegalStateException("LLM 응답이 비어 있습니다. 다시 시도해주세요.");
}
```

---

## 문서

| 문서 | 경로 |
|------|------|
| API 명세 | [`docs/API_SPEC.md`](docs/API_SPEC.md) |
| DB 스키마 | [`docs/ERD.md`](docs/ERD.md) |
| 시스템 아키텍처 | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| 개발 현황 | [`docs/DEV_STATUS.md`](docs/DEV_STATUS.md) |

---

## 팀

**개보린** · 제2회 법령데이터 활용 아이디어 공모전 · 법제처 주최 · 2026
