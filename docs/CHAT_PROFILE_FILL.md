# 챗봇을 통한 마이페이지 작성 기능 기획서

## 1. 배경 및 목적

### 문제 정의

마이페이지는 8개 섹션, 100개 이상의 필드로 구성된 기업 프로필 폼이다. 개인정보보호법에 익숙하지 않은 소상공인·중소기업 대표가 이 폼을 스스로 채우기 어렵다는 핵심 페인 포인트가 존재한다.

예를 들어 "민감정보 처리 여부", "처리 위탁 계약 형태", "내부관리계획 수립 여부" 같은 항목은 법률적 맥락 없이는 의미 자체를 이해하기 어렵다.

### 해결 방향

챗봇과 자연스러운 한국어 대화를 통해 마이페이지 필드가 자동으로 채워지도록 한다.

| 기존 UX | 개선 UX |
|---------|---------|
| 폼 직접 입력 | 대화로 입력 |
| 법률 용어 이해 필요 | AI가 쉽게 설명 |
| 한 번에 전체 작성 | 대화하면서 점진적 저장 |

---

## 2. 기존 인프라 현황

이미 구현된 코드를 최대한 재활용한다.

| 기능 | 파일 | 현황 |
|------|------|------|
| 프로필 단일 필드 수정 | `PATCH /api/profile/field` | 4개 필드만 지원 |
| 프로필 제안 이벤트 | SSE `profile_suggestion` | regex 기반, 직원 수·업종만 추출 |
| 제안 UI | `ProfileSuggestion` 컴포넌트 | "적용" 버튼 클릭 시 저장 |
| 자동 재진단 | `ProfileDiagnosisService.rediagnose()` | `upsertProfile()` 이후에만 호출 |

---

## 3. 구현 방식: 하이브리드 접근

두 가지 모드를 구분하여 구현한다.

### 패시브 모드 (Passive Mode)
- 일반 법률 상담 중 자연어에서 프로필 정보를 자동 감지하여 저장
- 기존 `profile_suggestion` 이벤트 인프라를 LLM 기반으로 강화
- 사용자 별도 행동 없이 대화만 해도 프로필이 채워짐

### 액티브 모드 (Active Mode)
- 사용자가 "AI와 함께 마이페이지 작성하기"를 명시적으로 시작
- AI가 섹션별 안내 질문을 주도
- 각 답변마다 즉시 프로필 저장 + 진행률 표시

---

## 4. 데이터 흐름

```
사용자: "음식점 운영하는데 직원이 5명이에요"
    │
    ▼
ChatService.sendMessage()
    │
    ├─ conversationType == "PROFILE_FILL" (액티브 모드)?
    │   YES → streamProfileFillAnswer()    → SSE text 스트리밍 (안내 응답)
    │         doOnComplete()               → extractProfileFields() 비동기 호출
    │                                         → patchField("businessType", "음식점업")
    │                                         → patchField("employeeCount", "5")
    │                                         → rediagnose() 자동 호출
    │                                         → SSE: profile_fields_saved 이벤트
    │
    └─ GENERAL (일반 대화)?
        기존 RAG 파이프라인
        doOnComplete() → buildProfileSuggestions() (LLM 기반으로 교체)
                         → SSE: profile_suggestion 이벤트 (기존 방식 유지)
```

---

## 5. 백엔드 변경 사항

### Phase 1 — 패시브 모드 강화

#### 5-1. `CompanyProfile.patchField()` 지원 필드 확장
**파일:** `backend/src/main/java/com/pipai/domain/CompanyProfile.java`

현재 4개 필드만 지원하는 switch-case를 30개 이상으로 확장:
```
personalDataItems, sensitiveDataTypes, collectionMethods, collectionPurposes,
delegationStatus, delegateeTypes, overseasTransferStatus, cctvOperationStatus,
systemStatus, encryptionStatus, cpoStatus, cpoTitle, operatingChannels,
marketingStatus, marketingConsentType, marketingNightSend, provisionStatus,
provisionConsentStatus, internalPlanStatus, internalPlanCycle, accessLogStatus
```

#### 5-2. `ProfileService.patchField()` 후 자동 재진단
**파일:** `backend/src/main/java/com/pipai/service/ProfileService.java`

```java
// 변경 전: upsertProfile()에서만 호출
// 변경 후: patchField() 이후에도 호출
profile.patchField(field, value);
profileDiagnosisService.rediagnose(user, profile);  // 추가
```

#### 5-3. `LlmService.extractProfileFields()` 신규 추가
**파일:** `backend/src/main/java/com/pipai/rag/LlmService.java`

non-streaming LLM 호출로 JSON 반환. 기존 `appendHiddenMemoAsync()` 패턴 활용.

LLM 프롬프트 구조:
```
사용자 발화에서 기업 프로필 정보를 JSON으로 추출하세요.
불확실한 정보는 포함하지 마세요.

## 추출 가능한 필드와 허용값
- businessType: 음식점업, 소매업, 제조업, IT·소프트웨어, ...
- employeeCount: 정수
- annualRevenue: "0 ~ 10억원 미만", "10억원 이상 ~ 50억원 미만", ...
- collectionMethods: "홈페이지 회원가입", "오프라인 서면", ...
...

## 사용자 발화
"{userMessage}"

## 최근 대화 맥락
{history (최근 3개)}
```

#### 5-4. `ChatService.buildProfileSuggestions()` LLM 기반으로 교체
**파일:** `backend/src/main/java/com/pipai/service/ChatService.java`

기존 regex 방식 제거 → `extractProfileFields()` 비동기 호출로 교체.

---

### Phase 2 — 액티브 가이드 모드

#### 5-5. DB 마이그레이션
**신규 파일:** `backend/src/main/resources/db/migration/V12__add_conversation_type.sql`

```sql
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(30) DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS profile_fill_step INTEGER DEFAULT 0;
```

#### 5-6. `Conversation` 엔티티 타입 필드 추가
**파일:** `backend/src/main/java/com/pipai/domain/Conversation.java`

```java
@Column(length = 30)
private String conversationType = "GENERAL"; // "GENERAL" | "PROFILE_FILL"

@Column
private Integer profileFillStep = 0; // 현재 진행 섹션 인덱스 (0-7)
```

#### 5-7. 대화 생성 API 타입 파라미터 추가
**파일:** `backend/src/main/java/com/pipai/api/ChatController.java`

`CreateConversationRequest`에 `conversationType` 옵셔널 필드 추가.

#### 5-8. `ChatService.sendMessage()` 모드 분기
**파일:** `backend/src/main/java/com/pipai/service/ChatService.java`

```java
if ("PROFILE_FILL".equals(conv.getConversationType())) {
    return handleProfileFillMessage(conv, userId, userMessage);
}
// 기존 일반 대화 처리 유지
```

#### 5-9. `LlmService.streamProfileFillAnswer()` 추가
**파일:** `backend/src/main/java/com/pipai/rag/LlmService.java`

프로필 작성 전용 시스템 프롬프트:
- 현재 채워진 필드 vs 미입력 필드 주입
- 한 번에 하나의 질문만 하도록 지시
- 각 질문마다 "왜 필요한지" 쉬운 말로 설명
- 조건부 필드 처리 규칙 명시

**조건부 필드 skip 규칙 예시:**
```
- delegationStatus == "no" → 수탁자 관련 모든 필드 skip
- cctvOperationStatus == "no" → CCTV 관련 모든 필드 skip
- marketingStatus == "no" → 마케팅 하위 필드 skip
- provisionStatus == "no" → 제3자 제공 동의 관련 필드 skip
```

#### 5-10. 신규 SSE 이벤트: `profile_fields_saved`

PROFILE_FILL 모드에서는 자동 저장 후 확인 이벤트만 발행 (기존 `profile_suggestion`과 구분):

```json
{
  "type": "profile_fields_saved",
  "content": {
    "savedFields": [
      {"field": "businessType", "label": "업종", "value": "음식점업", "displayValue": "음식점업"},
      {"field": "employeeCount", "label": "직원 수", "value": "5", "displayValue": "5명"}
    ],
    "profileCompletionPercent": 35
  }
}
```

---

## 6. 프론트엔드 변경 사항

### Phase 3 — UI/UX

#### 6-1. 마이페이지 진입 버튼 추가
**파일:** `frontend/src/app/(app)/mypage/page.tsx`

마이페이지 상단 배너 또는 온보딩 모달에 버튼 추가:
```
[AI와 대화로 작성하기] → /chat?mode=profile
```

#### 6-2. 채팅 페이지 `mode=profile` 처리
**파일:** `frontend/src/app/(app)/chat/page.tsx`

변경 포인트:
- `searchParams.get('mode') === 'profile'` 감지
- PROFILE_FILL 타입 대화 자동 생성
- 웰컴 메시지를 프로필 작성 도우미용으로 분기
- `profile_fields_saved` 이벤트 핸들링 추가

```typescript
} else if (event.type === 'profile_fields_saved') {
  setProfileCompletion(event.content.profileCompletionPercent);
  setRecentlySavedFields(event.content.savedFields);
  window.dispatchEvent(new CustomEvent('riskUpdate')); // 대시보드 갱신
}
```

#### 6-3. `ProfileFillPanel` 컴포넌트 신규 생성
**신규 파일:** `frontend/src/components/chat/ProfileFillPanel.tsx`

채팅창 하단에 표시되는 진행 현황 패널:
```
[====>           ] 프로필 35% 완료
방금 저장됨: 업종 (음식점업) · 직원 수 (5명)
[마이페이지에서 전체 보기 →]
```

PROFILE_FILL 모드에서만 표시. `profile_fields_saved` 이벤트마다 업데이트.

#### 6-4. SSE 타입 추가
**파일:** `frontend/src/lib/types/index.ts`

```typescript
export interface SSEProfileFieldsSavedEvent {
  type: 'profile_fields_saved';
  content: {
    savedFields: { field: string; label: string; value: string; displayValue: string }[];
    profileCompletionPercent: number;
  };
}
```

#### 6-5. `createConversation()` 타입 파라미터 추가
**파일:** `frontend/src/lib/api/conversations.ts`

```typescript
createConversation(token: string, title: string, conversationType?: string)
```

---

## 7. 필드값 정규화 전략

허용값이 정해진 enum형 필드(annualRevenue, collectionMethods 등)는 LLM이 자유 형식 텍스트를 반환할 수 있으므로 다음 전략을 사용한다:

1. LLM 프롬프트에 허용값 목록을 명시
2. 백엔드 `patchField()` 진입 전 유효성 검증 레이어 추가
3. 검증 실패 시: 해당 필드는 `profile_suggestion` 이벤트로 사용자에게 선택 확인 요청 (자동 저장 대신 수동 확인)

---

## 8. 구현 우선순위

| 단계 | 내용 | 예상 효과 |
|------|------|-----------|
| Phase 1 | patchField 확장 + rediagnose 트리거 + LLM 추출 교체 | 일반 채팅에서 자동 프로필 채우기 |
| Phase 2 | 대화 타입 + ChatService 분기 + 안내 질문 LLM | 체계적 가이드 모드 |
| Phase 3 | 마이페이지 버튼 + ProfileFillPanel + 진행률 UI | UX 완성 |

Phase 1만 완료해도 사용자가 일반 법률 상담을 하면서 자연스럽게 프로필이 채워지는 효과를 볼 수 있다.

---

## 9. 검증 방법

1. 일반 채팅에서 "저는 음식점을 운영하고 직원이 3명이에요" 입력 → 마이페이지 업종·직원수 자동 반영 확인
2. `/chat?mode=profile` 접속 → AI가 섹션별 안내 질문 시작 확인
3. 각 답변 후 마이페이지 이동해서 필드 저장 확인
4. 대시보드 리스크 항목 자동 갱신 확인
5. 조건부 필드 (CCTV 없음 → 관련 질문 skip) 동작 확인
6. 이미 채워진 필드는 건너뜀 확인
