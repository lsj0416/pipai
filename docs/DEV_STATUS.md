# PIPAi 개발 현황 문서

> 작성일: 2025-05-10 | 최종 업데이트: 2026-05-20 | 마감: 2025-05-29 (9일 남음)  
> 전체 완성도: **약 99%** (P0·P1·P2·P4 완료 + 벡터 DB 실데이터 확인 + 행정규칙 미추가)

---

## 🎯 개발 우선순위 (한눈에 보기)

마감까지 18일, **"심사위원에게 보여줄 수 있는 완성도"** 기준으로 정렬

### 🔴 P0 — 안 하면 데모 자체가 불가 ✅ **완료 (2025-05-10)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 1 | `LlmService.extractContent()` 정식 JSON 파싱으로 교체 | `rag/LlmService.java` | ✅ 완료 |
| 2 | `ChatService.sendMessage()` AI 응답 DB 저장 | `service/ChatService.java` | ✅ 완료 |
| 3 | `LawApiClient.parseLawChunks()` 응답 파싱 구현 | `external/LawApiClient.java` | ✅ 완료 |
| 4 | `PipcApiClient.parseCaseData()` 응답 파싱 구현 | `external/PipcApiClient.java` | ✅ 완료 |
| 5 | 벡터 DB 초기 데이터 로드 (`DataInitializer`) | `service/DataInitializer.java` | ✅ 완료 |

> 단위 테스트 17개 전체 통과 확인 (LlmServiceTest 7개, LawApiClientTest 5개, PipcApiClientTest 5개)

### 🟠 P1 — 완성도·신뢰도에 직접 영향 ✅ **완료 (2025-05-10~11)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 6 | `InquiryService.generate()` LLM 문의글 생성 | `service/InquiryService.java` | ✅ 완료 |
| 7 | `layout.tsx` MOCK_USER → 실제 프로필 API 호출 | `(app)/layout.tsx` | ✅ 완료 |
| 8 | 채팅 이력 초기 로드 (기존 대화 재열기) | `chat/page.tsx`, `Sidebar.tsx` | ✅ 완료 |

> P1 검증(2025-05-11)에서 버그 2건 발견·수정:
> - `LlmService.completeText()` — `bodyToMono(JsonNode.class)` 교체 (디코더 불명확 문제)
> - `InquiryService.generate()` — LLM null 응답 시 DB 제약 위반, 빈 대화 호출 방지

### 🟢 P3 — QA 버그 수정 + E2E 테스트 ✅ **완료 (2025-05-11)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 13 | SSE 파싱 버그: `data:` 뒤 공백 포함 토큰 앞 공백 유실 수정 | `frontend/src/lib/api/conversations.ts` | ✅ 완료 |
| 14 | 리스크 패널 실시간 업데이트: `checklist_update` SSE → `riskUpdate` CustomEvent | `Sidebar.tsx`, `chat/page.tsx` | ✅ 완료 |
| 15 | 백엔드 재빌드·재시작 (`growth-scenarios` 엔드포인트 반영) | — | ✅ 완료 |
| 16 | Playwright E2E 테스트 18개 구축 (모킹 기반, 백엔드 불필요) | `frontend/e2e/` | ✅ 완료 |
| 17 | E2E 테스트 가이드 문서 작성 | `docs/E2E_TEST.md` | ✅ 완료 |

### 🟣 P5 — 벡터 DB 실데이터 적재 + 배포 안정화 🔄 **진행 중 (2026-05-20)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 28 | WebClient → RestTemplate 교체 (한글 URL 인코딩 + macOS DNS 문제 해결) | `LawApiClient.java`, `PipcApiClient.java` | ✅ 완료 |
| 29 | `PipcApiClient.parseCaseData()` 파싱 키 수정 (`PrecSearch→Expc`, `prec→expc`, 필드명 수정) | `PipcApiClient.java` | ✅ 완료 |
| 30 | `parseLawArticles()` 법령명 파싱 수정 (`법령명.한글법령명 → 법령명_한글`) | `LawApiClient.java` | ✅ 완료 |
| 31 | `DataInitializer` 전체 데이터 적재 (단일 쿼리 12개 법령 전체 + totalCnt 기반 전체 판례) | `DataInitializer.java` | ✅ 완료 |
| 32 | `application-local.yml` 플레이스홀더 → 실제 키 값 수정 | `application-local.yml` | ✅ 완료 |
| 33 | 로컬 벡터 DB 실데이터 적재 확인 (법령 368건 + 판례 50건) | — | ✅ 완료 |
| 34 | **행정규칙(고시·지침) 123건 RAG 코퍼스 추가** | `LawApiClient.java`, `DataInitializer.java` | ⬜ 예정 |
| 35 | 배포 환경 법제처 IP 등록 (ECS IP `43.203.143.34`) | open.law.go.kr | ⬜ 예정 |
| 36 | 프로덕션 ECS 재배포 → RDS 실데이터 적재 확인 | — | ⬜ 예정 |

### 🔵 P4 — LLM 컨텍스트 개선 + QA 버그 수정 ✅ **완료 (2026-05-14)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 18 | LLM 시스템 프롬프트에 마이페이지 전체 6개 필드 반영 | `rag/LlmService.java` | ✅ 완료 |
| 19 | 현재 대화 이력(최대 20개) LLM 컨텍스트에 포함 — 문맥 유지 | `service/ChatService.java`, `rag/LlmService.java` | ✅ 완료 |
| 20 | 히든 메모: 대화 완료 후 AI가 자동 요약 → `hidden_memo` 누적 저장 | `CompanyProfile.java`, `ProfileService.java`, `ChatService.java` | ✅ 완료 |
| 21 | 히든 메모 시스템 프롬프트 포함 — 다른 대화창 내용 간접 참조 | `rag/LlmService.java` | ✅ 완료 |
| 22 | LLM 강제 답변 형식 (리스크 수준·근거 조문·실무 권장사항) | `rag/LlmService.java` | ✅ 완료 |
| 23 | Flyway V7: `company_profiles.hidden_memo` 컬럼 추가 | `V7__add_hidden_memo.sql` | ✅ 완료 |
| 24 | 마크다운 렌더링 개선: 스트리밍 경로 `mdToHtml()` 5개 규칙 확장 | `chat/page.tsx` | ✅ 완료 |
| 25 | 마크다운 렌더링 개선: DB 로드 경로에 `mdToHtml()` 적용 | `chat/page.tsx` | ✅ 완료 |
| 26 | 사이드바 대화 미리보기 `**bold**` 마크다운 제거 (`stripMd`) | `Sidebar.tsx` | ✅ 완료 |
| 27 | 문의글 페이지 기업 정보 자동 채우기 (프로필 API 병렬 호출) | `inquiry/page.tsx` | ✅ 완료 |

### 🟡 P2 — 있으면 좋지만 없어도 데모 가능 ✅ **완료 (2025-05-11)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 9 | 신규 가입자 기본 리스크 체크리스트 자동 생성 | `AuthService.java` | ✅ 완료 |
| 10 | 성장 시나리오 백엔드 동적 생성 | `DashboardService.java` | ✅ 완료 |
| 11 | 대화 중 리스크 실시간 대시보드 반영 | `dashboard/page.tsx` | ✅ 완료 |
| 12 | `Message.lawReferences` 법령 출처 저장 | `ChatService.java` | ✅ 완료 |

### 📅 실제 진행 vs 추천 일정

```
[완료] 5/10       → P0 전체 완료 (예정보다 4일 단축)
[완료] 5/10~5/11  → P1 전체 완료 + 검증·버그 수정 (예정보다 7일 단축)
[완료] 5/11       → P2: 리스크 자동 생성 + 성장 시나리오
[완료] 5/11       → QA 버그 수정 3건 + E2E 테스트 18개 + 문서화
[완료] 5/14       → LLM 컨텍스트 개선 (대화 이력·히든 메모·6개 프로필 필드·답변 형식)
[완료] 5/14       → QA 버그 수정 5건 (마크다운 렌더링 4건 + 문의글 기업정보 자동 채우기)
[완료] 5/20       → 벡터 DB 실데이터 적재 확인 + API 클라이언트 버그 수정 3건
[예정] 5/20~5/21  → 행정규칙 123건 추가 + 프로덕션 IP 등록 + ECS 재배포
[예정] 5/22~5/29  → 최종 QA (프로덕션) + 발표 자료 준비
```

---

## 목차

1. [완성도 요약](#1-완성도-요약)
2. [백엔드 상세](#2-백엔드-상세)
3. [프론트엔드 상세](#3-프론트엔드-상세)
4. [데이터베이스](#4-데이터베이스)
5. [미완성 항목 목록](#5-미완성-항목-목록)
6. [환경변수 체크리스트](#6-환경변수-체크리스트)
7. [구현 계획 (5/20 기준 잔여)](#7-구현-계획)

---

## 1. 완성도 요약

| 영역 | 완성도 | 비고 |
|------|--------|------|
| 백엔드 API (Controller) | 97% | `POST /conversations/{id}/messages` SSE 완성 |
| 백엔드 Service | 99% | InquiryService·ChatService·ProfileService 완성 (히든 메모 포함) |
| RAG 파이프라인 | 99% | 대화 이력·6개 프로필 필드·히든 메모·답변 형식 시스템 프롬프트 완성 |
| 외부 API 연동 | 95% | 파싱 버그 3건 수정 완료, 행정규칙 미추가 |
| 벡터 DB | 95% | 로컬 법령 368건+판례 50건 적재 확인, 행정규칙 123건 미추가 |
| 프론트엔드 페이지 | 100% | 마크다운 렌더링·문의글 기업정보 자동 채우기 완료 |
| 프론트엔드 API 함수 | 100% | 전 엔드포인트 연동 완성 |
| DB 마이그레이션 | 100% | V1~V7 완성 (V7: hidden_memo 컬럼) |
| 초기 데이터 | 90% | 법령·사례 자동 로드, 기본 리스크 체크리스트만 P2 잔여 |

---

## 2. 백엔드 상세

### 2-1. API Layer (Controllers)

| 엔드포인트 | 상태 | 파일 |
|-----------|------|------|
| `POST /api/auth/signup` | ✅ 완성 | `AuthController.java` |
| `POST /api/auth/login` | ✅ 완성 | `AuthController.java` |
| `POST /api/auth/refresh` | ✅ 완성 | `AuthController.java` |
| `GET /api/profile` | ✅ 완성 | `ProfileController.java` |
| `PUT /api/profile` | ✅ 완성 | `ProfileController.java` |
| `GET /api/conversations` | ✅ 완성 | `ChatController.java` |
| `POST /api/conversations` | ✅ 완성 | `ChatController.java` |
| `GET /api/conversations/{id}/messages` | ✅ 완성 | `ChatController.java` |
| `POST /api/conversations/{id}/messages` | ✅ 완성 | SSE 스트리밍 + AI 응답 DB 저장 완성 |
| `GET /api/dashboard/summary` | ✅ 완성 | `DashboardController.java` |
| `GET /api/dashboard/risks` | ✅ 완성 | `DashboardController.java` |
| `PATCH /api/dashboard/risks/{id}/resolve` | ✅ 완성 | `DashboardController.java` |
| `POST /api/inquiry/generate/{conversationId}` | ✅ 완성 | LLM 문의글 생성·저장 완성 |
| `GET /api/laws/search` | ✅ 완성 | `LawController.java` |

### 2-2. Service Layer

| 서비스 | 상태 | 비고 |
|--------|------|------|
| `AuthService` | ✅ 완성 | — |
| `ProfileService` | ✅ 완성 | — |
| `ChatService` | ✅ 완성 | SSE 스트리밍 + 대화 이력(최대 20개) LLM 전달 + 완료 후 히든 메모 비동기 저장 |
| `DashboardService` | ✅ 완성 | — |
| `InquiryService` | ✅ 완성 | `generate()` — 대화 이력 → LLM → InquiryDraft 저장. 빈 대화·null 응답 예외 처리 포함 |
| `ProfileService` | ✅ 완성 | `appendHiddenMemo()` — 날짜 접두사 붙여 누적 저장 |
| `LawDataSyncService` | ⚠️ 부분 | 스케줄러 구조 완성, 변경이력 감지 미구현 (P2 범위 밖) |

### 2-3. RAG 파이프라인

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| `RagPipeline` | ✅ 완성 | `generateAnswer()` — 대화 이력 파라미터 추가 |
| `EmbeddingService` | ✅ 완성 | OpenAI text-embedding-3-small 연동 완료 |
| `VectorSearchService` | ✅ 완성 | pgvector 쿼리 완료 |
| `LlmService` | ✅ 완성 | 시스템 프롬프트 전면 개선(6개 프로필 필드·히든 메모·답변 형식), `streamAnswer()` 대화 이력 포함 |

### 2-4. 외부 API 연동

#### LawApiClient (`external/LawApiClient.java`)

| 메서드 | 상태 | 비고 |
|--------|------|------|
| `searchLaws(String query)` | ✅ 완성 | `LawSearch.law` 배열/단건 객체 모두 파싱 |
| `fetchRecentlyAmended()` | ⚠️ 부분 | 고정 쿼리 사용, 변경이력 감지 미구현 |
| `parseLawChunks(Map response)` | ✅ 완성 | 법령 ID·법령명 파싱, 필터링 처리 |
| `fetchLawArticles(String lawId)` | ✅ 완성 | 조문 단위 파싱 |

#### PipcApiClient (`external/PipcApiClient.java`)

| 메서드 | 상태 | 비고 |
|--------|------|------|
| `fetchTotalCount()` | ✅ 완성 | totalCnt 조회 (전체 페이지 순회용) |
| `fetchDecisions(int page, int perPage)` | ✅ 완성 | API 호출 + 응답 파싱 완료 |
| `parseCaseData(Map response)` | ✅ 완성 | `Expc.expc` 파싱, 안건명·안건번호·회신일자 합산 (2026-05-20 키 수정) |

> ℹ️ `PipcApiClient`는 법제처 DRF API(`lawSearch.do?target=expc` — 법령해석례)를 사용.  
> 실제 응답 구조: `Expc.expc[].{법령해석례일련번호, 안건명, 안건번호, 회신일자}` (판례가 아닌 법령해석례임)

### 2-5. Repository Layer

| 리포지토리 | 상태 | 비고 |
|-----------|------|------|
| `UserRepository` | ✅ 완성 | JPA |
| `ProfileRepository` | ✅ 완성 | JPA |
| `ConversationRepository` | ✅ 완성 | JPA |
| `MessageRepository` | ✅ 완성 | JPA |
| `RiskRepository` | ✅ 완성 | JPA |
| `InquiryDraftRepository` | ✅ 완성 | JPA — `findByConversationId` 포함 |
| `LawEmbeddingRepository` | ✅ 완성 | JDBC, 앱 시작 시 DataInitializer가 데이터 로드 |
| `CaseEmbeddingRepository` | ✅ 완성 | JDBC, 앱 시작 시 DataInitializer가 데이터 로드 |

---

## 3. 프론트엔드 상세

### 3-1. 페이지

| 페이지 | 경로 | 상태 | 비고 |
|--------|------|------|------|
| 로그인 | `/login` | ✅ 완성 | — |
| 회원가입 | `/signup` | ✅ 완성 | — |
| 채팅 | `/chat` | ✅ 완성 | 마크다운 렌더링 개선(`mdToHtml` 스트리밍·DB로드 양방향), `checklist_update` → 사이드바 실시간 반영 |
| 대시보드 | `/dashboard` | ✅ 완성 | 성장 시나리오 백엔드 연동 완료 |
| 마이페이지 | `/mypage` | ✅ 완성 | 10단계 폼 완성, 전체 6개 필드 LLM 컨텍스트 반영 |
| 문의글 | `/inquiry` | ✅ 완성 | 프로필 API 병렬 호출로 기업정보(업종·직원수·수집항목) 자동 채우기 |

### 3-2. 컴포넌트

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| `ChatThread` | ✅ 완성 | SSE 스트리밍 수신, 법령·사례 카드 렌더링 |
| `Composer` | ✅ 완성 | 메시지 입력 |
| `Dashboard` | ✅ 완성 | 요약 카드 + 체크리스트 |
| `InquiryGen` | ✅ 완성 | 문의글 조회·편집 UI |
| `Sidebar` | ✅ 완성 | 최근 대화 목록, `stripMd()`로 마크다운 제거, 실제 프로필·리스크 표시, 로그아웃 |
| `Topbar` | ✅ 완성 | 상단 바 |
| `LawCard` | ✅ 완성 | 법령 조항 카드 |
| `CaseCard` | ✅ 완성 | 사례 카드 |
| `RiskPanel` | ✅ 완성 | 리스크 패널 |

### 3-3. API 함수 (`lib/api/`)

| 파일 | 상태 | 비고 |
|------|------|------|
| `auth.ts` | ✅ 완성 | signup, login, refresh, logout |
| `profile.ts` | ✅ 완성 | getProfile, upsertProfile |
| `conversations.ts` | ✅ 완성 | list, create, getMessages, sendMessage (SSE) |
| `dashboard.ts` | ✅ 완성 | getSummary, getRisks, resolveRisk |
| `inquiry.ts` | ✅ 완성 | generateInquiry |
| `law.ts` | ✅ 완성 | searchLaws |
| `client.ts` | ✅ 완성 | apiRequest, getBaseUrl |

### 3-4. 잔여 하드코딩 항목

~~`frontend/src/app/(app)/dashboard/page.tsx` — 성장 시나리오 하드코딩~~ → 백엔드 `/api/dashboard/growth-scenarios` 연동 완료, API 오류 시 `FALLBACK_GROWTH`로 graceful fallback (2025-05-11)

> ~~`layout.tsx` MOCK_USER~~ → 실제 프로필·리스크 API 연동 완료 (2025-05-10)

**현재 하드코딩 없음**

---

## 4. 데이터베이스

### 4-1. 마이그레이션 파일

| 파일 | 내용 | 상태 |
|------|------|------|
| `V1__create_users.sql` | users 테이블 | ✅ 완성 |
| `V2__create_company_profiles.sql` | company_profiles 테이블 | ✅ 완성 |
| `V3__create_conversations_messages.sql` | conversations, messages 테이블 | ✅ 완성 |
| `V4__create_risk_checklist_items.sql` | risk_checklist_items 테이블 | ✅ 완성 |
| `V5__create_inquiry_drafts.sql` | inquiry_drafts 테이블 | ✅ 완성 |
| `V6__create_vector_tables.sql` | law_embeddings, case_embeddings 테이블 | ✅ 완성 |
| `V7__add_hidden_memo.sql` | company_profiles.hidden_memo 컬럼 추가 (2026-05-14) | ✅ 완성 — 프로덕션 미적용 (ECS 재배포 시 자동 실행 예정) |

### 4-2. 초기 데이터

| 데이터 | 상태 | 비고 |
|--------|------|------|
| 법령 임베딩 데이터 | ✅ 자동 로드 | `DataInitializer` — 앱 시작 시 비어있으면 자동 수집·임베딩 |
| 사례 임베딩 데이터 | ✅ 자동 로드 | `DataInitializer` — 앱 시작 시 비어있으면 자동 수집·임베딩 |
| 기본 리스크 체크리스트 | ❌ 없음 | 신규 사용자 가입 시 자동 생성 로직 미구현 — P2 |

---

## 5. 미완성 항목 목록

### 🔴 Critical ✅ **전체 해결 (2025-05-10)**

| # | 위치 | 내용 | 상태 |
|---|------|------|------|
| C-1 | `external/LawApiClient.java` | `parseLawChunks()` 응답 파싱 | ✅ 완료 |
| C-2 | `external/PipcApiClient.java` | `parseCaseData()` 응답 파싱 | ✅ 완료 |
| C-3 | `service/DataInitializer.java` | 벡터 DB 초기 데이터 로드 | ✅ 완료 |
| C-4 | `service/InquiryService.java` | `generate()` LLM 문의글 생성 | ✅ 완료 |

### 🟡 High ✅ **전체 해결 (2025-05-10~11)**

| # | 위치 | 내용 | 상태 |
|---|------|------|------|
| H-1 | `rag/LlmService.java` | SSE JSON 파싱 + `completeText()` 버그 수정 | ✅ 완료 |
| H-2 | `service/ChatService.java` | AI 응답 스트리밍 완료 후 DB 저장 | ✅ 완료 |
| H-3 | `frontend/(app)/layout.tsx` | 사이드바 MOCK_USER 제거 + 실제 API 연동 | ✅ 완료 |
| H-4 | `chat/page.tsx`, `Sidebar.tsx` | 기존 대화 이력 로드, 최근 대화 목록 | ✅ 완료 |

### 🟢 P2 — 전체 해결 (2025-05-11)

| # | 위치 | 내용 | 상태 |
|---|------|------|------|
| P2-1 | `AuthService.java` | 신규 가입자 기본 리스크 체크리스트 자동 생성 | ✅ 완료 |
| P2-2 | `DashboardService.java` + `DashboardController.java` | 성장 시나리오 백엔드 동적 생성 + `/api/dashboard/growth-scenarios` 엔드포인트 | ✅ 완료 |
| P2-3 | `ChatService.java` + `dashboard/page.tsx` + `chat/page.tsx` | SSE `checklist_update` 이벤트 emit + 탭 복귀 시 대시보드 자동 갱신 | ✅ 완료 |
| P2-4 | `ChatService.java` + `RagPipeline.java` | `Message.lawReferences` 법령 JSON 저장, `RagResult` record로 lawRefs 노출 | ✅ 완료 |

---

## 6. 환경변수 체크리스트

### 백엔드 필수 환경변수

| 변수명 | 용도 | 상태 |
|--------|------|------|
| `OPENAI_API_KEY` | GPT-4o API, 임베딩 | 확인 필요 |
| `LAW_API_KEY` | 법제처 DRF OC 인증값 | 확인 필요 |
| `JWT_SECRET` | JWT 토큰 서명 | 확인 필요 |
| `SPRING_DATASOURCE_URL` | RDS PostgreSQL 연결 | 확인 필요 |
| `SPRING_DATASOURCE_USERNAME` | DB 사용자명 | 확인 필요 |
| `SPRING_DATASOURCE_PASSWORD` | DB 비밀번호 | 확인 필요 |

### 프론트엔드 필수 환경변수

| 변수명 | 용도 | 상태 |
|--------|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API 베이스 URL | ✅ Vercel 설정됨 (ALB DNS 사용) |

### 현재 API 프록시 설정 (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/api/auth/token", "destination": "/api/auth/token" },
    {
      "source": "/api/:path*",
      "destination": "http://pipai-alb-856110834.ap-northeast-2.elb.amazonaws.com/api/:path*"
    }
  ]
}
```

---

---

## 7. 구현 계획

> 기준일: 2026-05-20 | 마감: 2026-05-29

### 7-1. 행정규칙 RAG 코퍼스 추가 ⬜ (우선순위 최상)

**목적**: 개인정보보호위원회 고시·지침(123건)을 RAG 컨텍스트에 포함 → 법률보다 구체적인 실무 기준 제공으로 답변 정확도 향상

**현재**: `target=law` (법령 12개, 368조문)만 저장. 고시·지침 없음  
**목표**: `target=admrul` (행정규칙 123건) 추가 적재 → 총 RAG 코퍼스 약 500건 이상

**구현 범위**:

| 파일 | 변경 내용 |
|------|-----------|
| `external/LawApiClient.java` | `searchAdmruls(String query)`, `fetchAdmrulArticles(String admrulId)` 메서드 추가 |
| `service/DataInitializer.java` | `initAdmrulData()` 메서드 추가 — `law_embeddings` 테이블 공용 (law_id 구분) |
| `service/LawDataSyncService.java` | 행정규칙 갱신 스케줄러 확장 |

**법제처 API**:
```
GET /lawSearch.do?OC={key}&target=admrul&query=개인정보&type=JSON   # 목록 (totalCnt=123)
GET /lawService.do?OC={key}&target=admrul&ID={admrulId}&type=JSON  # 본문 조문
```

**응답 구조**: `AdmRulSearch.admrul[].행정규칙ID`, `행정규칙명`, `행정규칙일련번호`  
조문 파싱은 `법령` 구조와 동일하므로 `parseLawArticles()` 재사용 가능

---

### 7-2. 배포 환경 실데이터 적재 ⬜

**순서**:
1. open.law.go.kr → 시스템정보에서 ECS IP `43.203.143.34` 등록
2. ECS 태스크 재배포 (`aws ecs update-service --force-new-deployment`)
3. CloudWatch 로그에서 `법령 임베딩 초기화 완료: N건` 확인
4. 배포 후 IP가 바뀌어도 RDS에 데이터가 있으므로 이후 재배포 시 스킵됨

**주의**: ECS 메모리 1GB — 행정규칙 추가 시 임베딩 호출 약 600회 → OOM 가능성 낮지만 모니터링 필요

---

### 7-3. 계획 대비 미구현 항목 (공모전 기간 내 보류)

| 항목 | 이유 |
|------|------|
| 현행법령(공포일 기준) 별도 조회 | 시행일 기준과 동일 데이터 — 실질적 차이 없음 |
| 법령 변경이력 감지 (조문 단위) | 현재 upsert 방식으로 갱신 효과 동일, 구현 복잡도 대비 효과 낮음 |
| 일자별 조문 개정 이력 조회 | 복잡도 높음 + 데모 임팩트 낮음 |
| LawDataSyncService 행정규칙 갱신 | 초기 적재 완료 후 월 1회 갱신, 공모전 기간 내 변경 없음 |

---

## 참고 문서

- [API 명세](./API_SPEC.md)
- [DB 스키마](./ERD.md)
- [시스템 아키텍처](./ARCHITECTURE.md)
- [E2E 테스트 가이드](./E2E_TEST.md)
- [백엔드 개발 규칙](../backend/CLAUDE.md)
- [프론트엔드 개발 규칙](../frontend/CLAUDE.md)
