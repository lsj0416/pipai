# PIPAi 개발 현황 문서

> 작성일: 2025-05-10 | 최종 업데이트: 2025-05-10 | 마감: 2025-05-29 (19일 남음)  
> 전체 완성도: **약 75%** (P0 완료)

---

## 🎯 개발 우선순위 (한눈에 보기)

마감까지 19일, **"심사위원에게 보여줄 수 있는 완성도"** 기준으로 정렬

### 🔴 P0 — 안 하면 데모 자체가 불가 ✅ **완료 (2025-05-10)**

| 순위 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 1 | `LlmService.extractContent()` 정식 JSON 파싱으로 교체 | `rag/LlmService.java` | ✅ 완료 |
| 2 | `ChatService.sendMessage()` AI 응답 DB 저장 | `service/ChatService.java` | ✅ 완료 |
| 3 | `LawApiClient.parseLawChunks()` 응답 파싱 구현 | `external/LawApiClient.java` | ✅ 완료 |
| 4 | `PipcApiClient.parseCaseData()` 응답 파싱 구현 | `external/PipcApiClient.java` | ✅ 완료 |
| 5 | 벡터 DB 초기 데이터 로드 (`DataInitializer`) | `service/DataInitializer.java` | ✅ 완료 |

> 단위 테스트 17개 전체 통과 확인 (LlmServiceTest 7개, LawApiClientTest 5개, PipcApiClientTest 5개)

### 🟠 P1 — 완성도·신뢰도에 직접 영향

| 순위 | 작업 | 파일 | 예상 소요 |
|------|------|------|----------|
| 6 | `InquiryService.generate()` LLM 문의글 생성 | `service/InquiryService.java:28` | 반나절 |
| 7 | `layout.tsx` MOCK_USER → 실제 프로필 API 호출 | `(app)/layout.tsx:4` | 1~2시간 |
| 8 | 채팅 이력 초기 로드 (기존 대화 재열기) | `chat/page.tsx` | 2~3시간 |

### 🟡 P2 — 있으면 좋지만 없어도 데모 가능

| 순위 | 작업 | 파일 | 예상 소요 |
|------|------|------|----------|
| 9 | 성장 시나리오 백엔드 동적 생성 | `DashboardService.java` | 반나절 |
| 10 | 신규 가입자 기본 리스크 체크리스트 자동 생성 | `AuthService.java` | 2~3시간 |
| 11 | 대화 중 리스크 실시간 대시보드 반영 | `dashboard/page.tsx` | 반나절 |
| 12 | `Message.lawReferences` 법령 출처 저장 | `ChatService.java` | 2~3시간 |

### 📅 추천 일정

```
5/11~5/14  → P0: LLM 파싱 + ChatService 저장 + 외부 API 파싱 구현
5/15~5/17  → P0: 벡터 DB 데이터 로드 + RAG end-to-end 검증
5/18~5/21  → P1: 문의글 생성 + MOCK 제거 + 채팅 이력
5/22~5/24  → P2: 성장 시나리오 + 리스크 자동 생성
5/25~5/29  → QA + 배포 안정화 + 발표 자료
```

---

## 목차

1. [완성도 요약](#1-완성도-요약)
2. [백엔드 상세](#2-백엔드-상세)
3. [프론트엔드 상세](#3-프론트엔드-상세)
4. [데이터베이스](#4-데이터베이스)
5. [미완성 항목 목록](#5-미완성-항목-목록)
6. [개발 우선순위](#6-개발-우선순위)
7. [환경변수 체크리스트](#7-환경변수-체크리스트)

---

## 1. 완성도 요약

| 영역 | 완성도 | 비고 |
|------|--------|------|
| 백엔드 API (Controller) | 95% | 기본 CRUD 완성 |
| 백엔드 Service | 83% | InquiryService 미완성 |
| RAG 파이프라인 | 70% | LLM 응답 파싱·저장 미흡 |
| 외부 API 연동 | 20% | 응답 파싱 미구현 |
| 벡터 DB | 30% | 쿼리 구조만 완성, 초기 데이터 없음 |
| 프론트엔드 페이지 | 95% | 전 페이지 UI 완성 |
| 프론트엔드 API 함수 | 100% | 전 엔드포인트 연동 완성 |
| DB 마이그레이션 | 100% | V1~V6 완성 |
| 초기 데이터 | 0% | 법령·사례 데이터 미로드 |

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
| `POST /api/conversations/{id}/messages` | ⚠️ 부분 | SSE 구조 완성, AI 응답 저장 미흡 |
| `GET /api/dashboard/summary` | ✅ 완성 | `DashboardController.java` |
| `GET /api/dashboard/risks` | ✅ 완성 | `DashboardController.java` |
| `PATCH /api/dashboard/risks/{id}/resolve` | ✅ 완성 | `DashboardController.java` |
| `POST /api/inquiry/generate/{conversationId}` | ❌ 미완성 | `InquiryController.java` |
| `GET /api/laws/search` | ⚠️ 부분 | 응답 파싱 미구현 |

### 2-2. Service Layer

| 서비스 | 상태 | 미완성 내용 |
|--------|------|------------|
| `AuthService` | ✅ 완성 | — |
| `ProfileService` | ✅ 완성 | — |
| `ChatService` | ⚠️ 부분 | `sendMessage()` 스트리밍 완료 후 AI 응답 저장 미구현 (`doOnComplete` 주석만 존재, line 61) |
| `DashboardService` | ✅ 완성 | — |
| `InquiryService` | ❌ 미완성 | `generate()` 메서드가 더미 데이터만 반환 (line 28~29에 TODO 주석) |
| `LawDataSyncService` | ⚠️ 부분 | 스케줄러 구조 완성, 실제 데이터 동기화 미작동 |

### 2-3. RAG 파이프라인

| 컴포넌트 | 상태 | 미완성 내용 |
|---------|------|------------|
| `RagPipeline` | ✅ 완성 | 전체 흐름 구현 완료 |
| `EmbeddingService` | ✅ 완성 | OpenAI text-embedding-3-small 연동 완료 |
| `VectorSearchService` | ✅ 완성 | pgvector 쿼리 완료 (단, DB에 데이터 없음) |
| `LlmService` | ⚠️ 부분 | `extractContent()` 메서드(line 94~101)가 단순 문자열 매칭으로 OpenAI SSE 형식 미지원, 이스케이프 문자 처리 안 됨 |

**`LlmService.extractContent()` 현재 코드 (line 94~101):**
```java
private String extractContent(String sseChunk) {
    // SSE 데이터에서 content 추출 (간단 파싱)
    int idx = sseChunk.indexOf("\"content\":\"");
    if (idx < 0) return "";
    int start = idx + 11;
    int end = sseChunk.indexOf("\"", start);
    return end > start ? sseChunk.substring(start, end) : "";
}
```
→ OpenAI SSE는 `data: {...}` 형식이므로 실제 파싱 로직 필요 (JSON 파싱 미적용)

### 2-4. 외부 API 연동

#### LawApiClient (`external/LawApiClient.java`)

| 메서드 | 상태 | 문제 |
|--------|------|------|
| `searchLaws(String query)` | ✅ 완성 | `LawSearch.law` 배열/단건 객체 모두 파싱 |
| `fetchRecentlyAmended()` | ⚠️ 부분 | 고정 쿼리 사용, 변경이력 감지 미구현 |
| `parseLawChunks(Map response)` | ✅ 완성 | 법령 ID·법령명 파싱, 필터링 처리 |
| `fetchLawArticles(String lawId)` | ✅ 완성 | 조문 단위 파싱 신규 추가 |

#### PipcApiClient (`external/PipcApiClient.java`)

| 메서드 | 상태 | 비고 |
|--------|------|------|
| `fetchDecisions(int page, int perPage)` | ✅ 완성 | API 호출 + 응답 파싱 완료 |
| `parseCaseData(Map response)` | ✅ 완성 | `PrecSearch.prec` 파싱, 판시사항+판결요지 합산 |

> ⚠️ 참고: `PipcApiClient`는 현재 법제처 DRF API(`lawSearch.do?target=expc`)를 사용 중.  
> 실제 개보위 데이터 API(`api.odcloud.kr`)와 엔드포인트가 다름 — `CLAUDE.md`에 두 URL이 혼재함.

### 2-5. Repository Layer

| 리포지토리 | 상태 | 미완성 내용 |
|-----------|------|------------|
| `UserRepository` | ✅ 완성 | JPA |
| `ProfileRepository` | ✅ 완성 | JPA |
| `ConversationRepository` | ✅ 완성 | JPA |
| `MessageRepository` | ✅ 완성 | JPA |
| `RiskRepository` | ✅ 완성 | JPA |
| `LawEmbeddingRepository` | ✅ 완성 | JDBC 구조 완성, 앱 시작 시 DataInitializer가 데이터 로드 |
| `CaseEmbeddingRepository` | ✅ 완성 | JDBC 구조 완성, 앱 시작 시 DataInitializer가 데이터 로드 |

---

## 3. 프론트엔드 상세

### 3-1. 페이지

| 페이지 | 경로 | 상태 | 미완성 내용 |
|--------|------|------|------------|
| 로그인 | `/login` | ✅ 완성 | — |
| 회원가입 | `/signup` | ✅ 완성 | — |
| 채팅 | `/chat` | ✅ 완성 | — |
| 대시보드 | `/dashboard` | ⚠️ 부분 | 성장 시나리오 하드코딩 (line 16~32) |
| 마이페이지 | `/mypage` | ✅ 완성 | 10단계 폼 완성 |
| 문의글 | `/inquiry` | ⚠️ 부분 | 백엔드 InquiryService 미완성으로 기능 미동작 |

### 3-2. 컴포넌트

| 컴포넌트 | 상태 | 비고 |
|---------|------|------|
| `ChatThread` | ✅ 완성 | SSE 스트리밍 수신, 법령·사례 카드 렌더링 |
| `Composer` | ✅ 완성 | 메시지 입력 |
| `Dashboard` | ✅ 완성 | 요약 카드 + 체크리스트 |
| `InquiryGen` | ✅ 완성 | 문의글 조회·편집 UI |
| `Sidebar` | ✅ 완성 | 네비게이션, 로그아웃 |
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

### 3-4. 주요 하드코딩 항목

**`frontend/src/app/(app)/layout.tsx` (line 4~10)**
```typescript
// TODO: 실제 구현에서는 서버사이드 auth + profile fetch로 교체
const MOCK_USER: UserData = {
  name: '사용자',
  business: { name: '내 사업체', meta: '프로필을 등록해 주세요' },
};
const MOCK_RISK_ITEMS: RiskMiniItem[] = [];
```

**`frontend/src/app/(app)/dashboard/page.tsx` (line 16~32)**
```typescript
// 성장 시나리오는 마이페이지 프로필 기반으로 생성되는 항목 (백엔드 미구현)
const GROWTH_SCENARIOS: GrowthScenario[] = [
  { id: 'emp10', label: '직원 10명 초과 시', rows: [...] },
  { id: 'rev1b', label: '매출 10억 초과 시', rows: [...] },
];
```

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
| 기본 리스크 체크리스트 | ❌ 없음 | 신규 사용자 가입 시 자동 생성 로직 미구현 (P2) |

---

## 5. 미완성 항목 목록

### 🔴 Critical — 핵심 기능 미동작 ✅ **전체 해결 (2025-05-10)**

| # | 위치 | 내용 | 상태 |
|---|------|------|------|
| C-1 | `external/LawApiClient.java` | `parseLawChunks()` 응답 파싱 | ✅ 완료 |
| C-2 | `external/PipcApiClient.java` | `parseCaseData()` 응답 파싱 | ✅ 완료 |
| C-3 | `service/DataInitializer.java` | 벡터 DB 초기 데이터 로드 | ✅ 완료 (신규 파일) |
| C-4 | `service/InquiryService.java:28` | `generate()` LLM 문의글 생성 | ⏳ P1 진행 예정 |

### 🟡 High — 불완전한 동작

| # | 위치 | 내용 | 상태 |
|---|------|------|------|
| H-1 | `rag/LlmService.java` | `extractContent()` SSE JSON 파싱 | ✅ 완료 |
| H-2 | `service/ChatService.java` | AI 응답 스트리밍 완료 후 DB 저장 | ✅ 완료 |
| H-3 | `frontend/(app)/layout.tsx:4` | 사이드바 MOCK_USER 하드코딩 | ⏳ P1 진행 예정 |
| H-4 | `frontend/dashboard/page.tsx:16` | 성장 시나리오 하드코딩 | ⏳ P2 진행 예정 |

### 🟢 Medium — UX 개선 필요

| # | 위치 | 내용 |
|---|------|------|
| M-1 | 채팅 페이지 | 기존 대화 클릭 시 메시지 이력 불러오기 미구현 |
| M-2 | 대시보드 | 대화 중 SSE `checklist_update` 이벤트 수신 → 리스크 실시간 갱신 미구현 |
| M-3 | 회원가입 flow | 가입 완료 시 기본 리스크 체크리스트 자동 생성 미구현 |
| M-4 | `Message.lawReferences` 필드 | AI 응답에서 참조 법령·사례 저장 로직 없음 |

---

## 6. 개발 우선순위

마감까지 19일 남은 상황에서의 권장 순서:

### 1주차 (5/11~5/17) — 데이터 파이프라인

```
1. LawApiClient.parseLawChunks() 구현
   → 법제처 DRF JSON 응답 스키마 파악 후 조문 단위 파싱

2. PipcApiClient.parseCaseData() 구현
   → expc(법령해석례) 응답 파싱

3. 벡터 DB 초기화 배치 구현
   → 애플리케이션 시작 시 (또는 별도 CLI) 법령·사례 일괄 임베딩

4. LlmService.extractContent() 개선
   → Jackson ObjectMapper로 OpenAI SSE JSON 정식 파싱
```

### 2주차 (5/18~5/24) — 핵심 기능 완성

```
5. InquiryService.generate() 구현
   → 대화 이력 조회 → LLM 프롬프트 → InquiryDraft 저장

6. ChatService.sendMessage() AI 응답 저장
   → doOnComplete 콜백에서 누적된 응답 문자열 Message로 저장

7. layout.tsx MOCK_USER 제거
   → 서버사이드에서 /api/profile 호출로 교체

8. 성장 시나리오 백엔드 생성 로직
   → 프로필 저장 시 직원수·매출 기반 자동 리스크 항목 생성
```

### 3주차 (5/25~5/29) — QA·마무리

```
9. 채팅 이력 초기 로드 (기존 대화 재열기)
10. 신규 가입자 기본 리스크 체크리스트 자동 생성
11. E2E 시나리오 테스트 (회원가입 → 프로필 → 대화 → 문의글)
12. 배포 환경 환경변수 확인 및 연기
```

---

## 7. 환경변수 체크리스트

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
- [백엔드 개발 규칙](../backend/CLAUDE.md)
- [프론트엔드 개발 규칙](../frontend/CLAUDE.md)
