# PIPAi Frontend — 개발 규칙

## 실행

```bash
npm install
npm run dev   # localhost:3000
npm run build
npx tsc --noEmit
```

## 구조

```
src/app/
  (app)/          ← 인증 필요 페이지 (Sidebar shell)
  (auth)/         ← 로그인 / 회원가입
src/components/   ← UI 컴포넌트
src/lib/types/    ← 공유 TypeScript 타입
src/lib/api/      ← 백엔드 API 함수
```

## 스타일

- **Tailwind 금지** — CSS 변수 + 인라인 스타일만 사용
- 색상·폰트 변수는 `globals.css` (원본: `colors_and_type.css`)에서 정의
- 새 색상 추가 시 CSS 변수로 추가 (`--color-name: ...`)

## 컴포넌트

- `useState` 또는 이벤트 핸들러가 있을 때만 `'use client'`
- Server Component가 기본값
- `(window as any).X` 패턴 금지 — `export default`만 사용

## 타입

- `@/lib/types`에서 named import 사용
- `any` 금지 (`unknown` 또는 구체적 타입 사용)
- 새 타입은 `src/lib/types/index.ts`에 추가

## API

- 백엔드 호출은 반드시 `lib/api/` 함수 경유
- SSE 스트리밍은 `fetch + ReadableStream` 방식 (`EventSource` 금지 — JWT 헤더 전송 불가)
- 응답 타입: `ApiResponse<T>` (`success`, `data`, `error`, `timestamp`)
- 환경변수: `NEXT_PUBLIC_API_BASE_URL` (`.env.local` 참고)

## 인증

- `accessToken`은 httpOnly 쿠키에 저장 (Route Handler 경유)
- `middleware.ts`에서 보호 라우트 체크

## 참조

- `ui_kits/pipai-app/` — 원본 프로토타입 (수정 금지, 시각적 레퍼런스용)
- `../docs/API_SPEC.md` — 백엔드 API 스펙
