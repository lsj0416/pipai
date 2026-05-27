# 리스크진단 명세서 적용 플랜

> **기준 문서:** `docs/리스크진단_최종명세서.md`
> **작성일:** 2026-05-27

---

## 현황 분석

### 현재 구현 상태

| 구분 | 상태 |
|------|------|
| B-01 ~ B-11 (정밀 진단 11개) | ✅ 구현 완료 (`ProfileDiagnosisService.java`) |
| A-01 ~ A-26 (정량 진단 26개) | ❌ 미구현 |
| C-01 ~ C-04 (판단 불가 안내) | ❌ 미구현 |
| RiskLevel EXEMPT (해당없음) | ❌ 없음 (현재 3단계) |

### 핵심 문제

마이페이지 프론트엔드에는 A 섹션 판정에 필요한 입력 UI가 이미 존재하지만,  
**백엔드에 저장 → 진단 로직 연결이 없는 상태**다.

| 마이페이지 UI 필드 | 진단 활용 | 백엔드 저장 |
|-------------------|---------|-----------|
| `s7_cpo`, `s7_cpoTitle` | A-02 CPO 지정 | ❌ 미저장 |
| `s6_cctvSignage` | A-04 CCTV 안내판 | ❌ 미저장 |
| `s6_channels` | A-05 처리방침 게시 | ❌ 미저장 |
| `s5_contractPerType` | A-06 위탁계약 서면 | ❌ 미저장 |
| `s8_marketing`, `s8_consent` | A-07 마케팅 동의 | ❌ 미저장 |
| `s7_accessLog` | A-08 접속기록 | ❌ 미저장 |
| `s5_provision`, `s5_provisionConsent` | A-16 제3자 제공 | ❌ 미저장 |
| `s7_internalPlan`, `s7_internalPlanCycle` | A-19 내부관리계획 | ❌ 미저장 |
| `s6_cctvRange` | A-21 CCTV 촬영 범위 | ❌ 미저장 |
| `s8_nightSend` | A-22 야간 마케팅 | ❌ 미저장 |

---

## 구현 대상 (17개 A 섹션)

| 코드 | 항목 | EXEMPT 조건 |
|------|------|------------|
| A-02 | CPO 지정 의무 위반 | 소상공인(직원 ≤4명) + 미지정 |
| A-04 | CCTV 안내판 미설치 | CCTV 미운영 |
| A-05 | 처리방침 게시 의무 위반 | 오프라인 + 정보주체 1천명 미만 |
| A-06 | 위탁계약 서면 미체결 | 위탁 없음 |
| A-07 | 마케팅 동의 절차 위반 | 마케팅 발송 안 함 |
| A-08 | 접속기록 미보관 | 시스템 없음 (종이/엑셀만) |
| A-09 | 수집 항목 vs 이용 목적 | — |
| A-11 | 이용 목적 vs 마케팅 발송 | — |
| A-13 | 주민번호 처리 근거 | 주민번호 미수집 |
| A-14 | 민감정보·고유식별정보 처리 | — |
| A-16 | 제3자 제공 동의 의무 | 제공 없음 |
| A-17 | 국외 이전 vs 클라우드 모순 | — |
| A-19 | 내부관리계획 수립 의무 | 소상공인 |
| A-20 | 암호화 처리 의무 위반 | 종이 문서만 |
| A-21 | CCTV 촬영 범위 위반 | CCTV 미운영 |
| A-22 | 야간 마케팅 발송 | 마케팅 발송 안 함 |
| A-25 | 위탁 사실 공개 의무 | 위탁 없음 |

**제외 항목 (2차 과제):**
- A-01: 사업자 유형 분류 → 내부 유틸 함수로만 처리
- A-03: 정보주체 규모 필드 마이페이지에 없음
- A-10, A-12: 마케팅 채널별 필드 저장 미구현
- A-15, A-18, A-23, A-24, A-26: 범위 초과

---

## Phase 1 — RiskLevel 확장 + 기반 준비

### 1-A: `RiskChecklistItem.java`

```java
// 변경 전
public enum RiskLevel { IMMEDIATE, CHECK_NEEDED, GOOD }
// 변경 후
public enum RiskLevel { IMMEDIATE, CHECK_NEEDED, GOOD, EXEMPT }
```

`upsertProfileRisk()` 내 `reopen()` 조건:  
`level != GOOD && level != EXEMPT` 로 수정

### 1-B: `DashboardService.java`

- `getSummary()`의 high/medium/safe 카운트에서 EXEMPT 제외
- `PROFILE_CODES` 리스트에 17개 A 섹션 코드 추가

### 1-C: 프론트엔드 타입

- `frontend/src/lib/types/index.ts`: `Severity`에 `'exempt'` 추가
- `frontend/src/lib/api/dashboard.ts`: `RiskLevel`에 `'EXEMPT'` 추가
- `frontend/src/components/dashboard/Dashboard.tsx`: EXEMPT 항목 dim 처리 (⚪ 해당없음)

---

## Phase 2 — 기존 필드만으로 가능한 A 섹션 6개 (DB 변경 없음)

`ProfileDiagnosisService.java`에 추가 후 `buildSpecs()`에 포함:

| 메서드 | 핵심 판정 로직 |
|--------|-------------|
| `diagnoseA09` | personalDataItems 중 '직업'·'소속'·'생년월일' + 마케팅 목적 없음 → CHECK_NEEDED |
| `diagnoseA11` | collectionPurposes에 마케팅 없음 + marketingStatus='yes' → IMMEDIATE |
| `diagnoseA14` | sensitiveDataTypes 있음 또는 personalDataItems에 고유식별 포함 → CHECK_NEEDED |
| `diagnoseA17` | delegateeTypes에 '클라우드' + overseasTransferStatus='no' → CHECK_NEEDED (모순) |
| `diagnoseA20` | encryptionStatus='암호화 안 함' + 주민번호/신용카드 수집 → IMMEDIATE |
| `diagnoseA25` | delegationStatus='위탁함' + hasPrivacyPolicy=false → IMMEDIATE |

---

## Phase 3 — DB 마이그레이션 + 백엔드 필드 추가

### 3-A: `V10__add_a_section_diagnosis_fields.sql` (신규 생성)

> V9까지 존재하므로 V10 파일 생성

```sql
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS cpo_status               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cpo_title                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS operating_channels       TEXT,
  ADD COLUMN IF NOT EXISTS privacy_policy_url       VARCHAR(500),
  ADD COLUMN IF NOT EXISTS contract_per_type        TEXT,
  ADD COLUMN IF NOT EXISTS marketing_status         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS marketing_consent_type   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS marketing_night_send     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cctv_signage_status      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cctv_range               TEXT,
  ADD COLUMN IF NOT EXISTS access_log_status        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS jumin_collection_ground  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS provision_status         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS provision_consent_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS internal_plan_status     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS internal_plan_cycle      VARCHAR(30);
```

### 3-B: `CompanyProfile.java`

16개 필드 추가:
```
cpoStatus, cpoTitle, operatingChannels, privacyPolicyUrl,
contractPerType, marketingStatus, marketingConsentType, marketingNightSend,
cctvSignageStatus, cctvRange, accessLogStatus, juminCollectionGround,
provisionStatus, provisionConsentStatus, internalPlanStatus, internalPlanCycle
```

`update()` 메서드 시그니처에 16개 파라미터 추가.

### 3-C: `ProfileDto.java`

9개 신규 nested record 추가:

```java
public record CpoInfo(String status, String title) {}
public record OperatingInfo(String channels, String privacyPolicyUrl) {}
public record DelegationContracts(String contractPerType) {}
public record MarketingInfo(String status, String consentType, String nightSend) {}
public record CctvAdditional(String signageStatus, String range) {}
public record AccessLogInfo(String status) {}
public record JuminInfo(String collectionGround) {}
public record ProvisionInfo(String status, String consentStatus) {}
public record InternalPlanInfo(String status, String cycle) {}
```

`ProfileRequest`, `from()` 메서드에 모두 반영.

### 3-D: `ProfileDiagnosisService.java` — 나머지 11개 A 섹션

**A-02 (CPO 지정):**
```
소상공인(emp ≤ 4) + cpoStatus='no'   → EXEMPT
소상공인 아님 + cpoStatus='no'         → IMMEDIATE ("CPO 지정 의무, 과태료 1천만원")
cpoStatus='yes' + cpoTitle 있음       → GOOD
else                                   → CHECK_NEEDED
```

**A-04 (CCTV 안내판):**
```
cctvOperationStatus ≠ '운영함'         → EXEMPT
cctvSignageStatus = 'no'               → IMMEDIATE
cctvSignageStatus = 'yes'              → GOOD
else                                   → CHECK_NEEDED
```

**A-05 (처리방침 게시):**
```
channels에 'website'/'app' 포함 + hasPrivacyPolicy=false → IMMEDIATE
hasPrivacyPolicy = true                → GOOD
else                                   → CHECK_NEEDED
```

**A-06 (위탁계약 서면):**
```
delegationStatus ≠ '위탁함'            → EXEMPT
contractPerType JSON 파싱 → 'verbal'/'none' 값 N개 → IMMEDIATE ("N개 수탁자 위반")
모두 'written'                         → GOOD
'unknown' 포함                         → CHECK_NEEDED
```

**A-07 (마케팅 동의):**
```
marketingStatus = 'no'                 → EXEMPT
consentType = 'required'/'none'        → IMMEDIATE
consentType = 'separate'               → GOOD
else                                   → CHECK_NEEDED
```

**A-08 (접속기록):**
```
systemStatus = '종이'/'엑셀' 또는 blank → EXEMPT
accessLogStatus = 'no'                 → IMMEDIATE
accessLogStatus = 'yes'               → GOOD (보관기간 안내 description에 포함)
else                                   → CHECK_NEEDED
```

**A-13 (주민번호 근거):**
```
personalDataItems에 '주민등록번호' 없음 → EXEMPT
juminCollectionGround = 'consent'/'unknown' → IMMEDIATE
juminCollectionGround = 'law'          → CHECK_NEEDED
```

**A-16 (제3자 제공):**
```
provisionStatus = 'no'                 → EXEMPT
provisionConsentStatus = 'no'          → IMMEDIATE
provisionConsentStatus = 'yes'        → GOOD
else                                   → CHECK_NEEDED
```

**A-19 (내부관리계획):**
```
소상공인(emp ≤ 4)                      → EXEMPT
systemStatus 있음 + internalPlanStatus = 'no' → IMMEDIATE
internalPlanStatus = 'yes' + cycle 있음 → GOOD
else                                   → CHECK_NEEDED
```

**A-21 (CCTV 촬영 범위):**
```
cctvOperationStatus ≠ '운영함'         → EXEMPT
cctvRange에 '화장실'/'탈의실'/'사적공간' 포함 → IMMEDIATE (형사처벌)
cctvRange에 '인접건물' 포함            → CHECK_NEEDED
else                                   → GOOD
```

**A-22 (야간 마케팅):**
```
marketingStatus = 'no'                 → EXEMPT
marketingNightSend = 'yes'             → IMMEDIATE
marketingNightSend = 'no'             → GOOD
else                                   → CHECK_NEEDED
```

---

## Phase 4 — 프론트엔드 연결

### 4-A: `frontend/src/lib/api/profile.ts`

9개 인터페이스 추가:
```typescript
export interface ProfileCpoInfo { status: string|null; title: string|null; }
export interface ProfileOperatingInfo { channels: string|null; privacyPolicyUrl: string|null; }
export interface ProfileDelegationContracts { contractPerType: string|null; }
export interface ProfileMarketingInfo { status: string|null; consentType: string|null; nightSend: string|null; }
export interface ProfileCctvAdditional { signageStatus: string|null; range: string|null; }
export interface ProfileAccessLogInfo { status: string|null; }
export interface ProfileJuminInfo { collectionGround: string|null; }
export interface ProfileProvisionInfo { status: string|null; consentStatus: string|null; }
export interface ProfileInternalPlanInfo { status: string|null; cycle: string|null; }
```

`Profile`, `ProfileUpsertRequest`, `EMPTY_PROFILE`, `normalizeProfile()` 에 모두 반영.

### 4-B: `frontend/src/app/(app)/mypage/page.tsx`

**저장 시 `upsertProfile()` 호출부에 추가:**
```typescript
cpoInfo: { status: form.s7_cpo || null, title: form.s7_cpoTitle || null },
operatingInfo: { channels: form.s6_channels.join(',') || null, privacyPolicyUrl: form.s7_policyUrl || null },
delegationContracts: { contractPerType: JSON.stringify(form.s5_contractPerType) || null },
marketingInfo: { status: form.s8_marketing || null, consentType: form.s8_consent || null, nightSend: form.s8_nightSend || null },
cctvAdditional: { signageStatus: form.s6_cctvSignage || null, range: form.s6_cctvRange.join(',') || null },
accessLogInfo: { status: form.s7_accessLog || null },
juminInfo: { collectionGround: form.s4_juminGround || null },
provisionInfo: { status: form.s5_provision || null, consentStatus: form.s5_provisionConsent || null },
internalPlanInfo: { status: form.s7_internalPlan || null, cycle: form.s7_internalPlanCycle || null },
```

**로드 시 `getProfile()` 응답 → setForm 역매핑 추가:**
```typescript
s7_cpo: p.cpoInfo?.status ?? prev.s7_cpo,
s7_cpoTitle: p.cpoInfo?.title ?? prev.s7_cpoTitle,
s6_channels: csvToArray(p.operatingInfo?.channels ?? '').length > 0
  ? csvToArray(p.operatingInfo!.channels!) : prev.s6_channels,
s8_marketing: p.marketingInfo?.status ?? prev.s8_marketing,
s8_consent: p.marketingInfo?.consentType ?? prev.s8_consent,
s8_nightSend: p.marketingInfo?.nightSend ?? prev.s8_nightSend,
s6_cctvSignage: p.cctvAdditional?.signageStatus ?? prev.s6_cctvSignage,
s6_cctvRange: csvToArray(p.cctvAdditional?.range ?? '').length > 0
  ? csvToArray(p.cctvAdditional!.range!) : prev.s6_cctvRange,
s7_accessLog: p.accessLogInfo?.status ?? prev.s7_accessLog,
s5_provision: p.provisionInfo?.status ?? prev.s5_provision,
s5_provisionConsent: p.provisionInfo?.consentStatus ?? prev.s5_provisionConsent,
s7_internalPlan: p.internalPlanInfo?.status ?? prev.s7_internalPlan,
s7_internalPlanCycle: p.internalPlanInfo?.cycle ?? prev.s7_internalPlanCycle,
```

### 4-C: `frontend/src/app/(app)/dashboard/page.tsx`

`stepMap`에 A 섹션 코드 추가:
```typescript
'A-02': 5, 'A-19': 5,              // 안전조치 섹션 (s7)
'A-04': 4, 'A-21': 4, 'A-05': 4, 'A-08': 4, // 처리환경 섹션 (s6)
'A-06': 3, 'A-16': 3, 'A-17': 3, 'A-25': 3, // 위탁·제공 섹션 (s5)
'A-07': 6, 'A-22': 6,              // 마케팅 섹션 (s8)
'A-09': 2, 'A-11': 2, 'A-13': 2, 'A-14': 2, 'A-20': 5, // 처리현황/안전조치
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `backend/.../domain/RiskChecklistItem.java` | EXEMPT enum 추가 |
| `backend/.../service/ProfileDiagnosisService.java` | 17개 A 섹션 메서드 추가 |
| `backend/.../service/DashboardService.java` | EXEMPT 제외 + PROFILE_CODES 확장 |
| `backend/.../domain/CompanyProfile.java` | 16개 필드 추가 |
| `backend/.../api/dto/ProfileDto.java` | 9개 신규 record + from() 갱신 |
| `backend/.../resources/db/migration/V10__add_a_section_diagnosis_fields.sql` | 신규 생성 |
| `frontend/src/lib/api/profile.ts` | 9개 신규 인터페이스 + normalizeProfile 갱신 |
| `frontend/src/lib/types/index.ts` | Severity에 'exempt' 추가 |
| `frontend/src/app/(app)/mypage/page.tsx` | 저장/로드 신규 필드 연결 |
| `frontend/src/app/(app)/dashboard/page.tsx` | stepMap 확장 + EXEMPT 표시 처리 |
| `frontend/src/components/dashboard/Dashboard.tsx` | EXEMPT severity ⚪ UI |

---

## 검증 시나리오

| 항목 | 테스트 조건 | 기대 결과 |
|------|-----------|---------|
| A-02 | emp=3, cpoStatus='no' | EXEMPT (소상공인 면제) |
| A-02 | emp=20, cpoStatus='no' | IMMEDIATE |
| A-04 | cctv='운영 안 함' | EXEMPT |
| A-04 | cctv='운영함', signage='no' | IMMEDIATE |
| A-07 | marketing='no' | EXEMPT |
| A-07 | marketing='yes', consent='required' | IMMEDIATE |
| A-13 | 주민번호 미수집 | EXEMPT |
| A-13 | 주민번호 수집, ground='consent' | IMMEDIATE |
| A-20 | 암호화 안 함 + 주민번호 수집 | IMMEDIATE |
| A-21 | cctv='운영함', range에 '화장실' 포함 | IMMEDIATE |
| A-22 | marketing='yes', nightSend='yes' | IMMEDIATE |
| EXEMPT 카운트 | summary | high/medium/safe에 미포함 확인 |

```bash
# 프론트엔드 타입 체크
cd frontend && npx tsc --noEmit
```
