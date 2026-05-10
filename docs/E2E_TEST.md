# E2E 테스트 가이드

## 개요

Playwright 기반 E2E 테스트. 백엔드 없이 `page.route` 모킹으로 실행 가능하며, `BACKEND_URL` 환경변수 설정 시 실제 SSE 스트리밍 테스트까지 수행한다.

---

## 실행 방법

```bash
cd frontend

# 전체 실행 (모킹 기반, 백엔드 불필요)
npm run test:e2e

# auth 플로우만 (회원가입/로그인/로그아웃)
npm run test:e2e:auth

# UI 모드 (브라우저 열고 디버깅)
npm run test:e2e:ui

# 특정 파일만
npx playwright test e2e/specs/chat.spec.ts

# 실제 백엔드 포함 (SSE 스트리밍 포함)
BACKEND_URL=http://localhost:8080 npm run test:e2e

# 결과 리포트 열기
npm run test:e2e:report
```

---

## 구조

```
frontend/
├── playwright.config.ts
└── e2e/
    ├── .auth/
    │   └── user.json          ← storageState (auth setup 자동 생성, gitignore)
    ├── fixtures/
    │   ├── auth.setup.ts      ← 테스트 사용자 생성 + storageState 저장
    │   └── helpers.ts         ← generateTestEmail() 등 공통 헬퍼
    ├── pages/
    │   ├── LoginPage.ts
    │   ├── ChatPage.ts
    │   └── DashboardPage.ts
    └── specs/
        ├── auth.spec.ts       ← 회원가입 / 로그인 / 보호 라우트 / 로그아웃
        ├── chat.spec.ts       ← SSE 스트리밍 / 법령카드 / 사례카드
        ├── dashboard.spec.ts  ← 리스크 목록 / 완료 처리
        ├── inquiry.spec.ts    ← 문의글 생성 / 안내 화면
        └── mypage.spec.ts     ← 프로필 섹션 이동 / 입력
```

---

## 테스트 시나리오

### auth.spec.ts (5개)
| 테스트 | 설명 |
|--------|------|
| 회원가입 성공 → /login 리다이렉트 | 폼 입력 후 로그인 페이지 이동 확인 |
| 로그인 성공 → /chat 이동 + localStorage token 저장 | JWT 저장 및 라우팅 확인 |
| 잘못된 비밀번호 → 에러 메시지 표시 | 로그인 실패 UX 확인 |
| 미인증 상태 /chat 접근 → /login 리다이렉트 | 보호 라우트 동작 확인 |
| 로그아웃 → localStorage null + /login 이동 | 로그아웃 후 상태 초기화 확인 |

### chat.spec.ts (4개 + 1 skip)
| 테스트 | 설명 |
|--------|------|
| 웰컴 메시지 표시 | 채팅 진입 시 초기 메시지 확인 |
| SSE text + law_ref → 텍스트 + 법령카드 렌더링 | 모킹 SSE로 법령카드 UI 확인 |
| SSE case_ref → 사례카드 렌더링 | 모킹 SSE로 사례카드 UI 확인 |
| 메시지 전송 후 "문의글 자동 생성" 버튼 표시 | hasUserMessage 조건 확인 |
| *(skip)* 실제 백엔드 스트리밍 응답 수신 | `BACKEND_URL` 환경변수 필요 |

### dashboard.spec.ts (3개)
| 테스트 | 설명 |
|--------|------|
| 리스크 목록 표시 | 모킹 데이터로 항목 렌더링 확인 |
| 리스크 카운트 표시 | riskCounts 숫자 표시 확인 |
| "완료 처리" 클릭 → done 상태로 변경 | PATCH resolve API + UI 전환 확인 |

### inquiry.spec.ts (3개)
| 테스트 | 설명 |
|--------|------|
| conversationId 없이 접근 → 안내 화면 | "대화가 필요해요" + 버튼 표시 확인 |
| "대화 시작하기 →" 클릭 → /chat 이동 | 버튼 클릭 라우팅 확인 |
| conversationId로 접근 + API 모킹 → 문의글 렌더링 | subject/relatedLaws 렌더링 확인 |

### mypage.spec.ts (2개)
| 테스트 | 설명 |
|--------|------|
| 섹션 탭 클릭으로 섹션 3 이동 | 탭 네비게이션 확인 |
| 섹션 1 입력 후 다음 → 섹션 2 이동 | 폼 유효성 + 섹션 전환 확인 |

---

## 프로젝트 구성

`playwright.config.ts`에 3개 프로젝트가 정의되어 있다.

| 프로젝트 | storageState | 대상 |
|----------|-------------|------|
| `setup` | 없음 | `auth.setup.ts` 1회 실행, `e2e/.auth/user.json` 생성 |
| `chromium` | `e2e/.auth/user.json` | `auth.spec.ts` 제외 나머지 spec |
| `auth-flows` | 없음 | `auth.spec.ts` |

`chromium` 프로젝트는 `setup`에 의존(`dependencies: ['setup']`)하므로 항상 `setup`이 먼저 실행된다.

---

## SSE 모킹 방식

백엔드 없이 SSE 스트리밍을 테스트하는 방법:

```typescript
// 대화 생성 모킹
await page.route('**/api/conversations', async (route) => {
  if (route.request().method() !== 'POST') { await route.continue(); return; }
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { id: 'test-id', ... }, ... }),
  });
});

// SSE 응답 모킹
await page.route('**/api/conversations/*/messages', async (route) => {
  if (route.request().method() !== 'POST') { await route.continue(); return; }
  await route.fulfill({
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    body: [
      'data:{"type":"text","content":"답변 내용"}',
      'data:{"type":"law_ref","content":{"articleNo":"제25조",...}}',
      'data:[DONE]',
      '',
    ].join('\n'),
  });
});
```

SSE 완료 감지는 Topbar의 status 텍스트 변화(`'응답 중...'` → `'진행 중'`)로 판단한다.

---

## 인증 처리

테스트 사용자는 `auth.setup.ts`에서 1회 생성되며, `storageState`로 httpOnly 쿠키 + localStorage를 함께 저장한다. 이후 `chromium` 프로젝트의 모든 테스트는 이 상태를 재사용한다.

```
POST /api/auth/signup  →  로그인 UI  →  storageState 저장
                           ↓
                  e2e/.auth/user.json
                  (httpOnly 쿠키 + localStorage 포함)
```
