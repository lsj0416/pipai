# 리스크진단 명세서 적용 플랜

> **기준 문서:** `docs/리스크진단_최종명세서.md`
> **최초 작성:** 2026-05-27 / **완료:** 2026-05-28

---

## 구현 상태 (완료)

| 구분 | 상태 | 커밋 |
|------|------|------|
| B-01 ~ B-11 (정밀 진단 11개) | ✅ 완료 | 기존 |
| A-02, A-04~A-09, A-11, A-13~A-14, A-16~A-17, A-19~A-22, A-25 (17개) | ✅ 완료 | `c22aac4` |
| RiskLevel EXEMPT (해당없음) | ✅ 완료 | `c22aac4` |
| 프론트엔드 연결 (mypage 저장/로드, dashboard stepMap) | ✅ 완료 | `c22aac4` |
| 진단 비교값 버그 수정 (A-04/06/21/25) | ✅ 완료 | `b57bbb3` |
| C-01 ~ C-04 (판단 불가 안내) | ⏸ 제외 (2차 과제) |
| A-01, A-03, A-10, A-12, A-15, A-18, A-23, A-24, A-26 | ⏸ 제외 (2차 과제) |

---

## 구현된 A 섹션 17개

| 코드 | 항목 | EXEMPT 조건 | 저장 필드 |
|------|------|------------|---------|
| A-02 | CPO 지정 의무 위반 | 소상공인(직원 ≤4명) | `cpoStatus`, `cpoTitle` |
| A-04 | CCTV 안내판 미설치 | CCTV 미운영(`cctv='no'`) | `cctvSignageStatus` |
| A-05 | 처리방침 게시 의무 위반 | — | `operatingChannels` |
| A-06 | 위탁계약 서면 미체결 | 위탁 없음(`delegation='no'`) | `contractPerType` (JSON) |
| A-07 | 마케팅 동의 절차 위반 | 마케팅 미발송(`marketing='no'`) | `marketingStatus`, `marketingConsentType` |
| A-08 | 접속기록 미보관 | 종이/엑셀 전용 시스템 | `accessLogStatus` |
| A-09 | 수집 항목 vs 이용 목적 | — | (기존 필드) |
| A-11 | 이용 목적 vs 마케팅 발송 | — | (기존 필드) |
| A-13 | 주민번호 처리 근거 | 주민번호 미수집 | `juminCollectionGround` |
| A-14 | 민감정보·고유식별정보 처리 | — | (기존 필드) |
| A-16 | 제3자 제공 동의 의무 | 제공 없음(`provision='no'`) | `provisionStatus`, `provisionConsentStatus` |
| A-17 | 국외 이전 vs 클라우드 모순 | — | (기존 필드) |
| A-19 | 내부관리계획 수립 의무 | 소상공인(직원 ≤4명) | `internalPlanStatus`, `internalPlanCycle` |
| A-20 | 암호화 처리 의무 위반 | 종이 문서만 | (기존 필드) |
| A-21 | CCTV 촬영 범위 위반 | CCTV 미운영(`cctv='no'`) | `cctvRange` |
| A-22 | 야간 마케팅 발송 | 마케팅 미발송(`marketing='no'`) | `marketingNightSend` |
| A-25 | 위탁 사실 공개 의무 | 위탁 없음(`delegation='no'`) | (기존 필드) |

---

## 주요 설계 결정 및 버그 이력

### 폼 저장값 vs 진단 비교값 (버그 수정 `b57bbb3`)

마이페이지 폼은 라벨 대신 코드값을 저장한다.

| 필드 | 폼 저장값 | 잘못된 비교값 (수정 전) | 올바른 비교값 |
|------|---------|-------------------|------------|
| `cctvOperationStatus` | `'yes'` / `'no'` | `'운영함'` | `'yes'` |
| `delegationStatus` | `'yes'` / `'no'` / `'unknown'` | `'위탁함'` | `'yes'` |

영향 진단: A-04, A-06, A-21, A-25 (수정 전 항상 EXEMPT 반환)

### CCTV 촬영 범위 코드값 (A-21)

`cctvRange`에 저장되는 값은 한글 레이블이 아닌 코드:
- `'private'` → 사적 공간 (화장실·탈의실 등) → IMMEDIATE
- `'adjacent'` → 인접 건물 → CHECK_NEEDED
- `'public'` → 외부 공개 영역 → GOOD

### contractPerType 직렬화

수탁자별 계약 형태는 `Record<string, string>` (수탁자명 → 계약코드)를 JSON 문자열로 저장.
진단 시 `countOccurrences(json, "\"verbal\"")` + `countOccurrences(json, "\"none\"")` 로 위반 건수 산출.

---

## DB 마이그레이션

| 버전 | 파일 | 내용 |
|------|------|------|
| V11 | `V11__add_a_section_diagnosis_fields.sql` | A 섹션 진단용 16개 컬럼 추가 |

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

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `backend/.../domain/RiskChecklistItem.java` | EXEMPT enum 추가 |
| `backend/.../service/ProfileDiagnosisService.java` | 17개 A 섹션 메서드 추가, A-04/06/21/25 비교값 버그 수정 |
| `backend/.../service/DashboardService.java` | EXEMPT 카운트 제외 + PROFILE_CODES 확장 |
| `backend/.../domain/CompanyProfile.java` | 16개 필드 추가 |
| `backend/.../api/dto/ProfileDto.java` | 9개 신규 record + from() 갱신 |
| `backend/.../api/ProfileController.java` | 9개 신규 섹션 매핑 |
| `backend/.../service/ProfileService.java` | ProfileData record 16개 필드 확장 |
| `backend/.../resources/db/migration/V11__add_a_section_diagnosis_fields.sql` | 신규 생성 |
| `backend/.../service/ProfileDiagnosisServiceTest.java` | update() 파라미터 + 검증 로직 업데이트 |
| `frontend/src/lib/api/profile.ts` | 9개 신규 인터페이스 + normalizeProfile 갱신 |
| `frontend/src/lib/types/index.ts` | Severity에 `'exempt'` 추가 |
| `frontend/src/lib/api/dashboard.ts` | RiskLevel에 `'EXEMPT'` 추가 |
| `frontend/src/app/(app)/mypage/page.tsx` | 저장/로드 신규 16개 필드 연결 |
| `frontend/src/app/(app)/dashboard/page.tsx` | LEVEL_MAP EXEMPT 추가, stepMap A 섹션 17개 추가 |
| `frontend/src/components/dashboard/Dashboard.tsx` | EXEMPT ⚪ 해당없음 UI, dim 처리 |
| `frontend/src/components/chat/RiskPanel.tsx` | EXEMPT severity 스타일 추가 |

---

## 진단 판정 로직 요약

### 폼 코드값 → 진단 결과 대응표

| 진단 | EXEMPT | IMMEDIATE | CHECK_NEEDED | GOOD |
|------|--------|-----------|-------------|------|
| A-02 | emp≤4 + cpoStatus=`'no'` | emp>4 + cpoStatus=`'no'` | cpoStatus=null/unknown | cpoStatus=`'yes'` + title있음 |
| A-04 | cctv=`'no'` | signage=`'no'` | signage=null | signage=`'yes'` |
| A-05 | — | 온라인채널있음 + policy=false | — | policy=true |
| A-06 | delegation≠`'yes'` | verbal/none 수탁자 있음 | unknown포함 or null | 전부 written |
| A-07 | marketing=`'no'` | consent=`'required'`/`'none'` | null/unknown | consent=`'separate'` |
| A-08 | 종이/엑셀 전용 | accessLog=`'no'` | null | accessLog=`'yes'` |
| A-13 | 주민번호 미수집 | ground=`'consent'`/`'unknown'` | ground=`'law'` | — |
| A-16 | provision=`'no'` | consentStatus=`'no'` | null | consentStatus=`'yes'` |
| A-19 | emp≤4 | system있음 + plan=`'no'` | plan=null | plan=`'yes'` + cycle있음 |
| A-21 | cctv=`'no'` | range에 `'private'` | range에 `'adjacent'` | 그 외 |
| A-22 | marketing=`'no'` | nightSend=`'yes'` | null | nightSend=`'no'` |
| A-25 | delegation≠`'yes'` | delegation=`'yes'` + policy=false | policy=null | policy=true |
