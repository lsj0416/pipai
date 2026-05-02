# API 명세서

## 기본 정보

- Base URL: `https://api.pipai.kr` (프로덕션) / `http://localhost:8080` (로컬)
- 인증 방식: JWT Bearer Token
- 응답 형식: JSON

## 공통 응답 형식

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2025-05-01T12:00:00Z"
}
```

## 오류 응답 형식

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다."
  },
  "timestamp": "2025-05-01T12:00:00Z"
}
```

---

## 1. 인증 (Auth)

### POST /api/auth/signup
회원가입

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

---

### POST /api/auth/login
로그인

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
  }
}
```

---

### POST /api/auth/refresh
토큰 갱신

**Request Body**
```json
{
  "refreshToken": "refresh_token"
}
```

---

## 2. 기업 프로필 (Profile)

### GET /api/profile
기업 프로필 조회

**Headers**: `Authorization: Bearer {token}`

**Response**
```json
{
  "success": true,
  "data": {
    "profileId": "uuid",
    "businessType": "요식업",
    "employeeCount": 3,
    "annualRevenue": 200000000,
    "personalDataItems": ["고객 연락처", "결제 정보"],
    "subcontractorCount": 0,
    "growthPlan": {
      "targetEmployeeCount": 10,
      "targetRevenue": 500000000,
      "plannedExpansion": "배달 서비스 추가"
    },
    "createdAt": "2025-05-01T12:00:00Z",
    "updatedAt": "2025-05-01T12:00:00Z"
  }
}
```

---

### POST /api/profile
기업 프로필 생성·수정 (upsert)

**Headers**: `Authorization: Bearer {token}`

**Request Body**
```json
{
  "businessType": "요식업",
  "employeeCount": 3,
  "annualRevenue": 200000000,
  "personalDataItems": ["고객 연락처", "결제 정보"],
  "subcontractorCount": 0,
  "growthPlan": {
    "targetEmployeeCount": 10,
    "targetRevenue": 500000000,
    "plannedExpansion": "배달 서비스 추가"
  }
}
```

---

## 3. 대화 (Chat)

### GET /api/conversations
대화 목록 조회

**Headers**: `Authorization: Bearer {token}`

**Response**
```json
{
  "success": true,
  "data": [
    {
      "conversationId": "uuid",
      "title": "손님 전화번호 수집 관련",
      "lastMessage": "과태료 처분 가능성이 있어요.",
      "createdAt": "2025-05-01T12:00:00Z"
    }
  ]
}
```

---

### POST /api/conversations
새 대화 시작

**Headers**: `Authorization: Bearer {token}`

**Response**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "createdAt": "2025-05-01T12:00:00Z"
  }
}
```

---

### POST /api/conversations/{conversationId}/messages
메시지 전송 및 AI 응답 (스트리밍)

**Headers**: `Authorization: Bearer {token}`

**Request Body**
```json
{
  "message": "카페 하는데 손님 전화번호 받아도 되나요?"
}
```

**Response** (Server-Sent Events)
```
data: {"type":"text","content":"전화번호는 개인정보에 해당해요."}
data: {"type":"text","content":" 수집 전 동의를 받아야 합니다."}
data: {"type":"law_ref","content":{"articleNo":"제15조","title":"개인정보의 수집·이용","summary":"정보주체의 동의를 받은 경우에만 수집 가능"}}
data: {"type":"case_ref","content":{"businessType":"요식업","employeeCount":5,"violation":"동의 없이 고객 연락처 수집","penalty":500,"year":2023}}
data: {"type":"checklist_update","content":{"itemId":"consent_procedure","status":"danger"}}
data: {"type":"done"}
```

---

### GET /api/conversations/{conversationId}/messages
대화 이력 조회

**Headers**: `Authorization: Bearer {token}`

**Response**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "messages": [
      {
        "messageId": "uuid",
        "role": "user",
        "content": "카페 하는데 손님 전화번호 받아도 되나요?",
        "createdAt": "2025-05-01T12:00:00Z"
      },
      {
        "messageId": "uuid",
        "role": "assistant",
        "content": "전화번호는 개인정보에 해당해요...",
        "lawRefs": [
          {
            "articleNo": "제15조",
            "title": "개인정보의 수집·이용",
            "summary": "정보주체의 동의를 받은 경우에만 수집 가능"
          }
        ],
        "caseRefs": [
          {
            "businessType": "요식업",
            "employeeCount": 5,
            "violation": "동의 없이 고객 연락처 수집",
            "penaltyAmount": 500,
            "year": 2023
          }
        ],
        "createdAt": "2025-05-01T12:00:00Z"
      }
    ]
  }
}
```

---

## 4. 리스크 대시보드 (Dashboard)

### GET /api/dashboard
리스크 체크리스트 조회

**Headers**: `Authorization: Bearer {token}`

**Response**
```json
{
  "success": true,
  "data": {
    "summary": {
      "danger": 1,
      "warning": 2,
      "safe": 3
    },
    "currentRisks": [
      {
        "itemId": "consent_procedure",
        "title": "수집 동의 절차",
        "status": "danger",
        "relatedArticle": "개인정보보호법 제15조",
        "resolvedAt": null,
        "updatedAt": "2025-05-01T12:00:00Z"
      },
      {
        "itemId": "privacy_policy",
        "title": "처리방침 공개",
        "status": "warning",
        "relatedArticle": "개인정보보호법 제30조",
        "resolvedAt": null,
        "updatedAt": "2025-05-01T12:00:00Z"
      }
    ],
    "growthScenarios": [
      {
        "trigger": "직원 10명 초과 시",
        "items": [
          {
            "itemId": "cpo_designation",
            "title": "개인정보보호책임자(CPO) 지정",
            "relatedArticle": "개인정보보호법 제31조",
            "status": "pending"
          }
        ]
      }
    ]
  }
}
```

---

### PATCH /api/dashboard/risks/{itemId}
리스크 항목 상태 수동 변경

**Headers**: `Authorization: Bearer {token}`

**Request Body**
```json
{
  "status": "safe"
}
```

---

## 5. 문의글 생성 (Inquiry)

### POST /api/inquiry/generate
문의글 자동 생성

**Headers**: `Authorization: Bearer {token}`

**Request Body**
```json
{
  "conversationId": "uuid",
  "targetChannel": "tech_support"
}
```

> `targetChannel`: `law_interpretation` (법령해석지원센터) / `tech_support` (기술지원 컨설팅) / `self_diagnosis` (자가진단)

**Response**
```json
{
  "success": true,
  "data": {
    "inquiryId": "uuid",
    "title": "개인정보 수집 동의 절차 관련 문의",
    "body": "■ 사업자 정보\n- 업종: 요식업 (카페)\n- 규모: 직원 3명 / 연매출 2억원\n...",
    "targetChannel": "tech_support",
    "targetUrl": "https://www.pipc.go.kr/np/cop/bbs/...",
    "createdAt": "2025-05-01T12:00:00Z"
  }
}
```

---

### GET /api/inquiry/{inquiryId}
생성된 문의글 조회

**Headers**: `Authorization: Bearer {token}`

---

## 6. 법령 검색 (Law)

### GET /api/law/search
법령 의미 검색 (내부 벡터 DB)

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| q | string | ✅ | 검색 쿼리 |
| limit | number | ❌ | 결과 수 (기본값: 5) |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "lawId": "law_001",
      "lawName": "개인정보 보호법",
      "articleNo": "제15조",
      "articleTitle": "개인정보의 수집·이용",
      "content": "① 개인정보처리자는 다음 각 호의 어느 하나에 해당하는 경우에는 개인정보를 수집할 수 있으며...",
      "enforcementDate": "2026-09-11",
      "similarity": 0.92
    }
  ]
}
```

---

## 오류 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 요청 값 오류 |
| `EXTERNAL_API_ERROR` | 502 | 법제처·개보위 API 오류 |
| `LLM_ERROR` | 503 | LLM API 오류 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |
