# AWS 리소스 초기 셋업 (1회)

> 리전: ap-northeast-2 (서울)  
> 모든 명령은 AWS CLI v2 기준

---

## 1. ECR 레포지토리 생성

```bash
aws ecr create-repository \
  --repository-name pipai-backend \
  --region ap-northeast-2
# 출력에서 repositoryUri 복사 → GitHub Secret ECR_REGISTRY 에 설정
```

---

## 2. VPC / 서브넷 확인

기존 Default VPC 사용 가능. Private Subnet이 없으면 생성:

```bash
# 사용할 VPC ID 확인
aws ec2 describe-vpcs --query 'Vpcs[?IsDefault].VpcId' --output text
```

---

## 3. 보안 그룹 생성

```bash
# ECS 보안 그룹
aws ec2 create-security-group \
  --group-name pipai-ecs-sg \
  --description "PIPAi ECS Fargate" \
  --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <ECS_SG_ID> \
  --protocol tcp --port 8080 --cidr 0.0.0.0/0

# RDS 보안 그룹
aws ec2 create-security-group \
  --group-name pipai-rds-sg \
  --description "PIPAi RDS PostgreSQL" \
  --vpc-id <VPC_ID>

aws ec2 authorize-security-group-ingress \
  --group-id <RDS_SG_ID> \
  --protocol tcp --port 5432 \
  --source-group <ECS_SG_ID>
```

---

## 4. RDS PostgreSQL 생성

```bash
aws rds create-db-instance \
  --db-instance-identifier pipai-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username pipai \
  --master-user-password <STRONG_PASSWORD> \
  --db-name pipai \
  --vpc-security-group-ids <RDS_SG_ID> \
  --no-publicly-accessible \
  --backup-retention-period 0 \
  --storage-type gp2 \
  --allocated-storage 20
```

RDS 엔드포인트 확인 (생성에 ~5분 소요):
```bash
aws rds describe-db-instances \
  --db-instance-identifier pipai-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

pgvector 익스텐션 활성화:
psql 접속: psql -h pipai-db.cxoqk0s645a1.ap-northeast-2.rds.amazonaws.com -U pipai -d pipai
```sql
-- RDS 접속 후
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 5. Secrets Manager 등록

```bash
aws secretsmanager create-secret \
  --name pipai/prod \
  --region ap-northeast-2 \
  --secret-string '{
    "DB_URL":       "jdbc:postgresql://<RDS_ENDPOINT>:5432/pipai",
    "DB_USERNAME":  "pipai",
    "DB_PASSWORD":  "<STRONG_PASSWORD>",
    "JWT_SECRET":   "<RANDOM_32CHAR+>",
    "LAW_API_KEY":  "<법제처_OC>",
    "OPENAI_API_KEY": "<openai_키>"
  }'
```

---

## 6. IAM 역할 생성

> 먼저 Account ID를 확인하세요:
> ```bash
> aws sts get-caller-identity --query Account --output text
> ```

### ECS Execution Role (ECR 풀 + CloudWatch 로그)

```bash
# Trust policy
cat > /tmp/ecs-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws iam create-role \
  --role-name pipai-ecs-execution-role \
  --assume-role-policy-document file:///tmp/ecs-trust.json

# AWS 관리형 정책 연결
aws iam attach-role-policy \
  --role-name pipai-ecs-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Secrets Manager 읽기 권한 추가 — <ACCOUNT_ID>를 실제 값으로 교체
cat > /tmp/secrets-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:ap-northeast-2:<ACCOUNT_ID>:secret:pipai/prod*"
  }]
}
EOF

aws iam put-role-policy \
  --role-name pipai-ecs-execution-role \
  --policy-name secrets-access \
  --policy-document file:///tmp/secrets-policy.json
```

### ECS Task Role (앱이 AWS 서비스 호출 시 필요)

```bash
aws iam create-role \
  --role-name pipai-ecs-task-role \
  --assume-role-policy-document file:///tmp/ecs-trust.json
# 현재 추가 권한 불필요 (외부 API는 직접 HTTP 호출)
```

### GitHub Actions 배포 전용 IAM User

`iam-github-actions-policy.json` 안의 `ACCOUNT_ID`를 먼저 치환한 뒤 실행합니다.
(프로젝트 루트에서 실행)

```bash
# ACCOUNT_ID 치환
sed -i '' 's/ACCOUNT_ID/<실제_ACCOUNT_ID>/g' infra/iam-github-actions-policy.json

# IAM User 생성 및 정책 연결
aws iam create-user --user-name pipai-github-actions

aws iam put-user-policy \
  --user-name pipai-github-actions \
  --policy-name deploy-policy \
  --policy-document file://infra/iam-github-actions-policy.json

# 출력된 AccessKeyId, SecretAccessKey → GitHub Secrets 에 등록
aws iam create-access-key --user-name pipai-github-actions
```

---

## 7. CloudWatch 로그 그룹 생성

```bash
aws logs create-log-group \
  --log-group-name /ecs/pipai-backend \
  --region ap-northeast-2

aws logs put-retention-policy \
  --log-group-name /ecs/pipai-backend \
  --retention-in-days 30
```

---

## 8. ECS 클러스터 & 서비스 생성

```bash
# 클러스터
aws ecs create-cluster --cluster-name pipai-cluster

# ecs-task-definition.json 내 ACCOUNT_ID 치환 후 Task Definition 등록
sed 's/ACCOUNT_ID/<실제_ACCOUNT_ID>/g' infra/ecs-task-definition.json > /tmp/td.json
aws ecs register-task-definition --cli-input-json file:///tmp/td.json

# 서비스 생성 (Public Subnet + 공인 IP 할당 — NAT Gateway 불필요)
aws ecs create-service \
  --cluster pipai-cluster \
  --service-name pipai-backend \
  --task-definition pipai-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[<PUBLIC_SUBNET_ID>],
    securityGroups=[<ECS_SG_ID>],
    assignPublicIp=ENABLED
  }"
```

---

## 9. GitHub Secrets 등록 목록

| Secret | 값 |
|--------|-----|
| `AWS_ACCESS_KEY_ID` | pipai-github-actions IAM User 키 |
| `AWS_SECRET_ACCESS_KEY` | pipai-github-actions IAM User 시크릿 |
| `ECR_REGISTRY` | `<ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com` |
