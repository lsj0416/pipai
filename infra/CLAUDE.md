# CLAUDE.md — Infra

> 상위 문서: 루트 `CLAUDE.md`

## 개요

| 구분 | 기술 |
|------|------|
| 컨테이너 | Docker |
| 프론트 배포 | Vercel |
| 백엔드 배포 | AWS ECS Fargate |
| DB | AWS RDS PostgreSQL 15 |
| 이미지 저장소 | AWS ECR |
| CI/CD | GitHub Actions |

---

## AWS 리소스 구성

```
VPC
├── Public Subnet
│   └── (ALB 추후 필요 시)
└── Private Subnet
    ├── ECS Fargate (Spring Boot)
    └── RDS PostgreSQL
```

### 리소스 스펙

| 리소스 | 스펙 | 비고 |
|--------|------|------|
| ECS Fargate | 0.5 vCPU / 1GB RAM | 트래픽 따라 조정 |
| RDS PostgreSQL | db.t3.micro | 프리티어 12개월 |
| ECR | - | Docker 이미지 저장 |

---

## 보안 그룹

### ECS Fargate 보안 그룹
```
Inbound:
  - 8080 (백엔드 API, Vercel IP 또는 0.0.0.0/0)

Outbound:
  - ALL (법제처·개보위 API, LLM API 호출용)
```

### RDS 보안 그룹
```
Inbound:
  - 5432 (ECS Fargate 보안 그룹에서만)

Outbound:
  - 없음
```

---

## Docker

### Dockerfile (백엔드)

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY build/libs/pipai-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml (로컬 개발용)

```yaml
version: '3.8'
services:
  db:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: pipai
      POSTGRES_USER: pipai
      POSTGRES_PASSWORD: pipai
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## CI/CD 파이프라인

```
GitHub Push (main 브랜치)
        ↓
GitHub Actions 트리거
        │
        ├── [frontend.yml]
        │   └── Vercel 자동 배포 (GitHub 연동으로 별도 설정 불필요)
        │
        └── [backend.yml]
            ├── 1. 테스트 실행 (./gradlew test)
            ├── 2. 빌드 (./gradlew build)
            ├── 3. Docker 이미지 빌드
            ├── 4. ECR 푸시
            └── 5. ECS 서비스 업데이트 (Rolling Deploy)
```

### backend.yml

```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build
        run: |
          cd backend
          ./gradlew build -x test

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & Push Docker image
        run: |
          IMAGE_URI=${{ secrets.ECR_REGISTRY }}/pipai-backend:${{ github.sha }}
          docker build -t $IMAGE_URI ./backend
          docker push $IMAGE_URI

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster pipai-cluster \
            --service pipai-backend \
            --force-new-deployment
```

---

## GitHub Actions Secrets 목록

| 시크릿 | 설명 |
|--------|------|
| `AWS_ACCESS_KEY_ID` | AWS IAM 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM 시크릿 키 |
| `ECR_REGISTRY` | ECR 레지스트리 URI |

---

## RDS 설정 체크리스트

- [ ] PostgreSQL 15 이상 선택
- [ ] `pgvector` 익스텐션 활성화
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- [ ] ECS와 동일 VPC 내 배치
- [ ] 자동 백업 활성화 (보존 기간 7일)
- [ ] 퍼블릭 접근 비활성화

---

## 배포 환경변수 (ECS Task Definition)

ECS Task Definition의 환경변수로 주입. AWS Secrets Manager 연동 권장.

```json
[
  { "name": "SPRING_PROFILES_ACTIVE", "value": "prod" },
  { "name": "DB_URL", "value": "jdbc:postgresql://{rds-endpoint}:5432/pipai" },
  { "name": "DB_USERNAME", "valueFrom": "arn:aws:secretsmanager:..." },
  { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..." },
  { "name": "LAW_API_KEY", "valueFrom": "arn:aws:secretsmanager:..." },
  { "name": "PIPC_API_KEY", "valueFrom": "arn:aws:secretsmanager:..." },
  { "name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:..." }
]
```

---

## 로컬 개발 시작

```bash
# DB만 Docker로 띄우기
docker-compose up -d db

# 백엔드 실행
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'

# 프론트엔드 실행
cd frontend
npm run dev
```

---

## 주의 사항

- RDS는 ECS와 동일 VPC 내에서만 접근 가능하도록 설정
- 민감 환경변수는 반드시 AWS Secrets Manager로 관리 (하드코딩 금지)
- ECR 이미지는 태그 대신 SHA로 관리하여 롤백 가능하게 유지
- ECS 배포는 Rolling Update 방식 사용 (무중단 배포)
