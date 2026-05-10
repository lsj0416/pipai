# PIPAi 개발 현황 문서

> 작성일: 2025-05-10 | 최종 업데이트: 2025-05-11 | 마감: 2025-05-29 (18일 남음)  
> 전체 완성도: **약 99%** (P0·P1·P2 완료 + QA 버그 수정 + E2E 테스트 완료)

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
[진행 예정] 5/12~5/20  → 배포 안정화 (ECS Fargate 재배포 + 환경변수 확인)
[진행 예정] 5/21~5/29  → 최종 QA (프로덕션) + 발표 자료 준비
```

---

## 목차

1. [완성도 요약](#1-완성도-요약)
2. [백엔드 상세](#2-백엔드-상세)
3. [프론트엔드 상세](#3-프론트엔드-상세)
4. [데이터베이스](#4-데이터베이스)
5. [미완성 항목 목록](#5-미완성-항목-목록)
6. [환경변수 체크리스트](#6-환경변수-체크리스트)

---

## 1. 완성도 요약

| 영역 | 완성도 | 비고 |
|------|--------|------|
| 백엔드 API (Controller) | 97% | `POST /conversations/{id}/messages` SSE 완성 |
| 백엔드 Service | 97% | InquiryService 완성, 리스크 자동 생성만 P2 잔여 |
| RAG 파이프라인 | 95% | LLM 파싱·저장·문의글 생성 모두 완성 |
| 외부 API 연동 | 90% | 파싱 완성, LawDataSyncService 변경이력 감지 미완 |
| 벡터 DB | 90% | 초기 데이터 자동 로드 완성 (DataInitializer) |
| 프론트엔드 페이지 | 100% | SSE 파싱·리스크 패널 실시간 업데이트 완료 |
| 프론트엔드 API 함수 | 100% | 전 엔드포인트 연동 완성 |
| DB 마이그레이션 | 100% | V1~V6 완성 |
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
| `ChatService` | ✅ 완성 | SSE 스트리밍 + AI 응답 DB 저장 완성 |
| `DashboardService` | ✅ 완성 | — |
| `InquiryService` | ✅ 완성 | `generate()` — 대화 이력 → LLM → InquiryDraft 저장. 빈 대화·null 응답 예외 처리 포함 |
| `LawDataSyncService` | ⚠️ 부분 | 스케줄러 구조 완성, 변경이력 감지 미구현 (P2 범위 밖) |

### 2-3. RAG 파이프라인

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| `RagPipeline` | ✅ 완성 | 전체 흐름 구현 완료 |
| `EmbeddingService` | ✅ 완성 | OpenAI text-embedding-3-small 연동 완료 |
| `VectorSearchService` | ✅ 완성 | pgvector 쿼리 완료 |
| `LlmService` | ✅ 완성 | `extractContent()` Jackson JSON 파싱, `completeText()` JsonNode 직접 역직렬화 |

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
| `fetchDecisions(int page, int perPage)` | ✅ 완성 | API 호출 + 응답 파싱 완료 |
| `parseCaseData(Map response)` | ✅ 완성 | `PrecSearch.prec` 파싱, 판시사항+판결요지 합산 |

> ⚠️ 참고: `PipcApiClient`는 현재 법제처 DRF API(`lawSearch.do?target=expc`)를 사용 중.  
> 실제 개보위 데이터 API(`api.odcloud.kr`)와 엔드포인트가 다름 — 데모 전 확인 필요.

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
| 채팅 | `/chat` | ✅ 완성 | SSE 파싱 버그 수정, `checklist_update` → 사이드바 실시간 반영 |
| 대시보드 | `/dashboard` | ✅ 완성 | 성장 시나리오 백엔드 연동 완료 |
| 마이페이지 | `/mypage` | ✅ 완성 | 10단계 폼 완성 |
| 문의글 | `/inquiry` | ✅ 완성 | InquiryService 완성으로 정상 동작 |

### 3-2. 컴포넌트

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| `ChatThread` | ✅ 완성 | SSE 스트리밍 수신, 법령·사례 카드 렌더링 |
| `Composer` | ✅ 완성 | 메시지 입력 |
| `Dashboard` | ✅ 완성 | 요약 카드 + 체크리스트 |
| `InquiryGen` | ✅ 완성 | 문의글 조회·편집 UI |
| `Sidebar` | ✅ 완성 | 최근 대화 목록, 실제 프로필·리스크 표시, 로그아웃 |
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

## 참고 문서

- [API 명세](./API_SPEC.md)
- [DB 스키마](./ERD.md)
- [시스템 아키텍처](./ARCHITECTURE.md)
- [E2E 테스트 가이드](./E2E_TEST.md)
- [백엔드 개발 규칙](../backend/CLAUDE.md)
- [프론트엔드 개발 규칙](../frontend/CLAUDE.md)
