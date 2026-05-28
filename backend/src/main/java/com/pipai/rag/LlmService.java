package com.pipai.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipai.common.LocalEnvResolver;
import com.pipai.common.exception.LlmException;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.Message;
import com.pipai.service.DiagnosisFieldMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import reactor.core.publisher.Mono;

@Service
@Slf4j
public class LlmService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final WebClient webClient;
    private final String chatModel;

    public LlmService(
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.chat-model}") String chatModel,
            @Value("${spring.profiles.active:}") String activeProfile) {
        this.chatModel = chatModel;
        String resolvedApiKey = LocalEnvResolver.preferLocalFile(
                "OPENAI_API_KEY",
                apiKey,
                activeProfile.contains("local")
        );
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + resolvedApiKey)
                .build();
    }

    public Flux<String> streamAnswer(String userMessage, CompanyProfile profile,
                                     List<Map<String, Object>> lawRefs,
                                     List<Map<String, Object>> caseRefs,
                                     List<Message> history,
                                     List<DiagnosisFieldMapper.MissingField> missingFields) {
        String systemPrompt = buildSystemPrompt(userMessage, profile, lawRefs, caseRefs, missingFields);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        for (Message msg : history) {
            String role = msg.getRole() == Message.Role.USER ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", msg.getContent()));
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        var requestBody = Map.of(
                "model", chatModel,
                "stream", true,
                "messages", messages
        );

        return webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(chunk -> !chunk.isBlank() && !chunk.contains("[DONE]"))
                .map(this::extractContent)
                .filter(content -> !content.isEmpty())
                .onErrorMap(e -> new LlmException("LLM 스트리밍 실패", e));
    }

    private enum QuestionType { LAW_INTERPRETATION, RISK_DIAGNOSIS, PROCEDURE_GUIDE }

    private QuestionType classifyQuestion(String question) {
        String q = question;
        // 절차 안내 — "어떻게" + 실행 표현, 단계/방법/절차 키워드
        if (q.contains("절차") || q.contains("방법") || q.contains("단계") ||
                q.contains("어떻게 해야") || q.contains("어떻게 하나요") || q.contains("어떻게 하면") ||
                q.contains("어떻게 준비") || q.contains("어떻게 작성") || q.contains("어떻게 만들") ||
                q.contains("신고 방법") || q.contains("신고하는") || q.contains("준비해야") ||
                q.contains("해야 하나요") || q.contains("해야 하는지") || q.contains("해야할") ||
                q.contains("해야하나요") || q.contains("작성해야") || q.contains("수립해야")) {
            return QuestionType.PROCEDURE_GUIDE;
        }
        // 법령 해석 — 조문 번호·조항·해석 키워드
        if (q.contains("제") && q.contains("조") ||
                q.contains("몇 조") || q.contains("몇조") ||
                q.contains("조문") || q.contains("조항") ||
                q.contains("어떤 법") || q.contains("어떤 규정") ||
                q.contains("해석") || q.contains("의미하") || q.contains("뜻이") ||
                q.contains("뭔가요") || q.contains("무엇인가요") || q.contains("무엇인지") ||
                q.contains("법률") && q.contains("있나요") ||
                q.contains("규정이") || q.contains("규정은")) {
            return QuestionType.LAW_INTERPRETATION;
        }
        return QuestionType.RISK_DIAGNOSIS;
    }

    private String buildSystemPrompt(String userMessage, CompanyProfile profile,
                                     List<Map<String, Object>> lawRefs,
                                     List<Map<String, Object>> caseRefs,
                                     List<DiagnosisFieldMapper.MissingField> missingFields) {
        QuestionType type = classifyQuestion(userMessage);
        StringBuilder sb = new StringBuilder();

        sb.append("당신은 개인정보보호법(PIPA) 전문 AI 어시스턴트입니다.\n");
        sb.append("반드시 아래 법령 조문을 근거로 답변하고, 조문 번호와 출처를 명시하세요.\n");
        sb.append("기업의 구체적인 상황(업종·규모·수집 데이터·민감정보 유형)을 반영한 맞춤형 답변을 제공하세요.\n\n");
        sb.append("## 중요 지침\n");
        sb.append("아래 '기업 정보' 섹션은 현재 대화 중인 사용자가 직접 마이페이지에 등록한 자신의 기업 정보입니다.\n");
        sb.append("사용자가 '마이페이지', '내 기업 정보', '등록된 정보', '내 정보 보여줘' 등을 요청하면,\n");
        sb.append("이 섹션의 정보를 가공 없이 항목별로 깔끔하게 정리해서 응답하세요.\n");
        sb.append("절대로 '마이페이지에 접근할 수 없다'거나 '개인정보 접근 권한이 없다'는 응답을 하지 마세요.\n\n");

        // 미확인 진단 필드 → AI가 대화 흐름 안에서 1~2개만 자연스럽게 질문하도록 안내
        if (missingFields != null && !missingFields.isEmpty()) {
            sb.append("--- [진단 정확도 향상을 위한 미확인 항목] ---\n");
            sb.append("아래 정보가 아직 확인되지 않아 일부 진단이 불완전합니다.\n");
            sb.append("대화 흐름에서 현재 답변 내용과 관련 있는 항목만 자연스럽게 1~2개 질문하세요.\n");
            sb.append("절대 목록 형태로 한꺼번에 묻지 마세요.\n\n");
            sb.append("미확인 항목 (진단코드 → 필요 정보):\n");
            missingFields.forEach(mf ->
                sb.append("- ").append(mf.diagnosisCode()).append(" 판정 필요: ").append(mf.label()).append("\n")
            );
            sb.append("\n");
        }

        if (profile != null) {
            sb.append("## 기업 정보\n");
            if (str(profile.getBusinessType())) sb.append("업종: ").append(profile.getBusinessType()).append("\n");
            if (profile.getEmployeeCount() != null) sb.append("직원 수: ").append(profile.getEmployeeCount()).append("명\n");
            if (str(profile.getAnnualRevenue())) sb.append("매출 규모: ").append(profile.getAnnualRevenue()).append("\n");
            if (profile.getHasPrivacyPolicy() != null) sb.append("개인정보처리방침: ").append(profile.getHasPrivacyPolicy() ? "있음" : "없음").append("\n");
            if (str(profile.getPersonalDataItems())) sb.append("수집 개인정보 항목: ").append(profile.getPersonalDataItems()).append("\n");
            if (str(profile.getSensitiveDataTypes())) sb.append("처리하는 민감정보 유형: ").append(profile.getSensitiveDataTypes()).append("\n");
            if (str(profile.getCollectionMethods())) sb.append("수집 방법: ").append(profile.getCollectionMethods()).append("\n");
            if (str(profile.getCollectionPurposes())) sb.append("수집 목적: ").append(profile.getCollectionPurposes()).append("\n");
            if (str(profile.getDelegationStatus())) sb.append("처리 위탁 여부: ").append(profile.getDelegationStatus()).append("\n");
            if (str(profile.getOverseasTransferStatus())) sb.append("국외 이전 여부: ").append(profile.getOverseasTransferStatus()).append("\n");
            if (str(profile.getCctvOperationStatus())) sb.append("CCTV 운영 여부: ").append(profile.getCctvOperationStatus()).append("\n");
            if (str(profile.getSystemStatus())) sb.append("개인정보처리시스템: ").append(profile.getSystemStatus()).append("\n");
            if (str(profile.getEncryptionStatus())) sb.append("암호화 현황: ").append(profile.getEncryptionStatus()).append("\n");
            if (str(profile.getMarketingStatus())) sb.append("마케팅 발송 여부: ").append(profile.getMarketingStatus()).append("\n");
            if (str(profile.getProvisionStatus())) sb.append("제3자 제공 여부: ").append(profile.getProvisionStatus()).append("\n");
            if (str(profile.getHiddenMemo())) {
                sb.append("\n## 이전 상담 이력 요약\n").append(profile.getHiddenMemo()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("## 관련 법령 조문\n");
        for (var law : lawRefs) {
            sb.append("- [").append(law.get("law_name")).append(" ").append(law.get("article_number")).append("] ");
            sb.append(law.get("content")).append("\n");
        }

        if (!caseRefs.isEmpty()) {
            sb.append("\n## 관련 제재 사례\n");
            for (var c : caseRefs) {
                sb.append("- ").append(c.get("title")).append(": ").append(c.get("summary")).append("\n");
            }
        }

        sb.append("\n").append(answerFormatPrompt(type));
        return sb.toString();
    }

    private String answerFormatPrompt(QuestionType type) {
        return switch (type) {
            case LAW_INTERPRETATION -> """
                    ## 질문 유형: 법령 해석
                    아래 형식으로 답변하세요. 조문 원문 중심으로 정확한 출처를 강조하세요.

                    **조문 요지:** 해당 조문의 핵심 내용 한 문장 요약
                    **상세 해석:** 조문의 의미와 적용 범위 (기업 상황에 맞게)
                    **관련 조문:** 연관 조문이 있으면 함께 명시
                    **리스크 수준:** [즉시 조치 / 확인 필요 / 양호] 중 하나 — 해당 법령 위반 시 위험도
                    **실무 포인트:** 이 조문과 관련해 실무에서 주의할 점
                    """;
            case PROCEDURE_GUIDE -> """
                    ## 질문 유형: 절차 안내
                    아래 형식으로 답변하세요. 단계별 액션 아이템을 명확히 제시하세요.

                    **리스크 수준:** [즉시 조치 / 확인 필요 / 양호] 중 하나 — 미이행 시 위험도
                    **근거 조문:** 법령명 제X조
                    **단계별 절차:**
                    1. [첫 번째 단계]
                    2. [두 번째 단계]
                    (필요한 만큼 계속)
                    **주의사항:** 절차 이행 시 빠뜨리기 쉬운 점
                    """;
            case RISK_DIAGNOSIS -> """
                    ## 질문 유형: 리스크 진단
                    아래 형식으로 답변하세요. 기업 프로필 기반으로 위반 가능성을 명확히 판단하세요.

                    **리스크 수준:** [즉시 조치 / 확인 필요 / 양호] 중 하나 — 반드시 명시
                    **판단 근거:** 제시된 상황과 기업 프로필을 근거로 한 판단 이유
                    **근거 조문:** 법령명 제X조
                    **실무 권장사항:**
                    - 즉시 취해야 할 조치
                    - 장기적 개선 방향
                    """;
        };
    }

    private boolean str(String value) {
        return value != null && !value.isBlank();
    }

    public Mono<String> completeText(String systemPrompt, String userMessage) {
        var requestBody = Map.of(
                "model", chatModel,
                "stream", false,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                )
        );

        return webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(root -> root.path("choices").path(0).path("message").path("content").asText(""))
                .onErrorMap(e -> new LlmException("LLM 호출 실패", e));
    }

    public Flux<String> streamProfileFillAnswer(String userMessage, CompanyProfile profile, List<Message> history) {
        String systemPrompt = buildProfileFillSystemPrompt(profile);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        for (Message msg : history) {
            String role = msg.getRole() == Message.Role.USER ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", msg.getContent()));
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        var requestBody = Map.of("model", chatModel, "stream", true, "messages", messages);

        return webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(chunk -> !chunk.isBlank() && !chunk.contains("[DONE]"))
                .map(this::extractContent)
                .filter(content -> !content.isEmpty())
                .onErrorMap(e -> new LlmException("프로필 작성 도우미 스트리밍 실패", e));
    }

    private String buildProfileFillSystemPrompt(CompanyProfile profile) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 개인정보보호법 전문 상담사로서, 중소기업·소상공인 대표가 개인정보 처리 현황을 파악하도록 대화로 안내합니다.\n\n");

        sb.append("## 역할 및 원칙\n");
        sb.append("- 한 번에 하나의 질문만 합니다\n");
        sb.append("- 법률 용어 대신 쉬운 일상 언어를 사용합니다\n");
        sb.append("- 각 질문마다 '왜 필요한지' 한 문장으로 설명합니다\n");
        sb.append("- 이미 답변된 정보는 다시 묻지 않습니다\n");
        sb.append("- 조건부 항목은 선행 답변에 따라 자동 판단합니다 (예: CCTV 없다고 하면 CCTV 관련 질문 생략)\n\n");

        List<String> filled = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        if (profile != null) {
            if (str(profile.getBusinessType())) filled.add("업종: " + profile.getBusinessType());
            else missing.add("업종 (어떤 사업을 하시나요?)");

            if (profile.getEmployeeCount() != null) filled.add("직원 수: " + profile.getEmployeeCount() + "명");
            else missing.add("직원 수 → 법적 의무 범위 판단에 사용됩니다");

            if (str(profile.getAnnualRevenue())) filled.add("매출: " + profile.getAnnualRevenue());
            else missing.add("연 매출 규모 → 기업 규모(소상공인/중소기업) 분류에 사용됩니다");

            if (profile.getHasPrivacyPolicy() != null) filled.add("개인정보처리방침: " + (profile.getHasPrivacyPolicy() ? "있음" : "없음"));
            else missing.add("개인정보처리방침 보유 여부 → 10인 이상이면 공개 의무가 있습니다");

            if (str(profile.getDelegationStatus())) filled.add("처리 위탁: " + profile.getDelegationStatus());
            else missing.add("처리 위탁 여부 → 배송·결제·고객센터 등 외부 업체에 개인정보를 맡기는지 확인합니다");

            if (str(profile.getCctvOperationStatus())) filled.add("CCTV: " + profile.getCctvOperationStatus());
            else missing.add("CCTV 운영 여부 → CCTV가 있으면 영상정보처리기기 운영 규정이 적용됩니다");

            if (str(profile.getMarketingStatus())) filled.add("마케팅 발송: " + profile.getMarketingStatus());
            else missing.add("마케팅 문자·이메일 발송 여부 → 별도 수신 동의를 받아야 합니다");

            if (str(profile.getProvisionStatus())) filled.add("제3자 제공: " + profile.getProvisionStatus());
            else missing.add("제3자 제공 여부 → 다른 회사에 고객 정보를 넘기는지 확인합니다");

            if (str(profile.getEncryptionStatus())) filled.add("암호화: " + profile.getEncryptionStatus());
            else missing.add("개인정보 암호화 처리 여부 → 비밀번호·주민번호 등은 암호화 의무가 있습니다");
        } else {
            missing.addAll(List.of(
                    "업종 (어떤 사업을 하시나요?)",
                    "직원 수 → 법적 의무 범위 판단에 사용됩니다",
                    "연 매출 규모 → 기업 규모 분류에 사용됩니다",
                    "개인정보처리방침 보유 여부",
                    "처리 위탁 여부 (배송·결제 등 외부 업체 활용)",
                    "CCTV 운영 여부",
                    "마케팅 문자·이메일 발송 여부",
                    "제3자 제공 여부",
                    "개인정보 암호화 처리 여부"
            ));
        }

        if (!filled.isEmpty()) {
            sb.append("## 이미 파악된 정보\n");
            filled.forEach(f -> sb.append("- ").append(f).append("\n"));
            sb.append("\n");
        }

        if (!missing.isEmpty()) {
            sb.append("## 아직 필요한 정보 (목록 순서대로 하나씩)\n");
            missing.forEach(m -> sb.append("- ").append(m).append("\n"));
            sb.append("\n지금 첫 번째 미입력 항목부터 자연스럽게 질문하세요.");
        } else {
            sb.append("## 상태: 핵심 정보가 모두 파악되었습니다\n");
            sb.append("감사 인사를 하고, 마이페이지에서 전체 내용을 확인할 수 있다고 안내하세요. 추가로 궁금한 법률 질문이 있는지 물어보세요.");
        }

        return sb.toString();
    }

    public Mono<Map<String, String>> extractProfileFields(String userMessage, List<Message> history) {
        String historyText = history.stream()
                .filter(m -> m.getRole() != null)
                .map(m -> (m.getRole() == Message.Role.USER ? "사용자: " : "AI: ") + m.getContent())
                .collect(Collectors.joining("\n"));

        String systemPrompt = """
                사용자 발화에서 기업 프로필 정보를 추출하여 JSON 형식으로 반환하세요.
                확실한 정보만 포함하고 불확실한 경우 해당 필드는 생략하세요.
                JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만.

                추출 가능한 필드와 허용값:
                - businessType: 농업·임업·어업, 광업, 제조업, 전기·가스·수도업, 건설업, 소매업, 운수업, 숙박업, 음식점업, 정보통신업, 금융업·보험업, 부동산업, 교육서비스업, 보건업·사회복지서비스업, 기타서비스업
                - employeeCount: 정수 문자열 (예: "5")
                - annualRevenue: "0 ~ 10억원 미만", "10억원 이상 ~ 50억원 미만", "50억원 이상 ~ 120억원 미만", "120억원 이상 ~ 300억원 미만", "300억원 이상 ~ 1,500억원 미만", "1,500억원 이상 ~ 5,000억원 미만", "5,000억원 이상"
                - hasPrivacyPolicy: "true" 또는 "false" (개인정보처리방침 보유 여부)
                - delegationStatus: "yes", "no", "unknown" (개인정보 처리 위탁 여부)
                - cctvOperationStatus: "yes", "no" (CCTV 운영 여부)
                - marketingStatus: "yes", "no" (마케팅 정보 발송 여부)
                - overseasTransferStatus: "yes", "no", "unknown" (개인정보 국외 이전 여부)
                - provisionStatus: "yes", "no", "unknown" (제3자 제공 여부)
                - encryptionStatus: "전부 암호화", "일부 암호화", "암호화 안 함", "모르겠음"
                - systemStatus: "자체 운영", "SaaS 활용", "없음" (개인정보처리시스템 운영 형태)
                - collectionPurposes: 해당하는 것을 쉼표로 구분 (서비스 제공, 채용·인사 관리, 마케팅·광고 (영리 목적), 민원 처리, 시설 안전·관리, 기타)
                - personalDataItems: 수집하는 개인정보 항목 쉼표 구분 (예: "이름, 전화번호, 이메일")
                - sensitiveDataTypes: 처리하는 민감정보 유형 쉼표 구분 (예: "건강정보, 생체정보")
                - subjectRange: 개인정보 처리 정보주체 규모 (예: "1,000명 미만", "1만명 이상")
                - cpoStatus: "yes" 또는 "no" (CPO/개인정보보호책임자 지정 여부. 예: '지정 안 했어요' → no)
                - cpoTitle: CPO 직책 문자열 (예: "대표이사", "정보보호팀장")
                - operatingChannels: 운영 채널 쉼표 구분 (예: "웹사이트, 앱")
                - privacyPolicyUrl: 처리방침 URL 문자열
                - contractPerType: 수탁자별 계약 형태 (예: "서면 계약", "구두 계약", "없음")
                - marketingConsentType: "사전 동의", "사후 동의", "미확인" (마케팅 수신 동의 방식)
                - marketingNightSend: "yes", "no" (야간 마케팅 발송 여부. 예: '밤에도 보내요' → yes)
                - marketingChannels: 마케팅 채널 쉼표 구분 (예: "문자, 이메일, 카카오")
                - accessLogStatus: "yes", "no" (접속기록 보관 여부)
                - juminCollectionGround: 주민번호 수집 근거 (예: "법령 근거", "수집 안 함")
                - provisionConsentStatus: "yes", "no" (제3자 제공 동의 수취 여부)
                - internalPlanStatus: "yes", "no" (내부관리계획 수립 여부)
                - internalPlanCycle: 내부관리계획 갱신 주기 (예: "연 1회", "없음")
                - delegateeTypes: 수탁자 유형 쉼표 구분 (예: "배송사, 결제사")
                - delegateeDisclosureStatus: "전체 공개", "일부 공개", "미공개" (처리방침 내 수탁자 공개)
                - delegateeAuditStatus: 수탁자 점검 주기 (예: "연 1회", "없음")
                - delegateeEducationStatus: "yes", "no" (수탁자 교육 실시 여부)
                - cloudServerLocation: "국내", "해외", "혼합" (클라우드 서버 위치)
                - overseasServerCountry: 국외 서버 소재 국가 (예: "미국", "일본")
                - cctvSignageStatus: "yes", "no" (CCTV 안내판 설치 여부)
                - cctvRange: CCTV 촬영 범위 (예: "출입구, 주차장")
                - cctvExternalProvision: "yes", "no" (CCTV 영상 외부 제공 여부)
                - cctvAccessControl: CCTV 접근 통제 방식 (예: "담당자 지정", "없음")
                - encryptedDataItems: 암호화 적용 항목 쉼표 구분 (예: "비밀번호, 주민번호")
                - accessControlSeparation: "yes", "no" (직원별 접근권한 분리 여부)
                - retiredAccessRevocation: "yes", "no" (퇴직자 권한 회수 여부)
                - accessChangeHistoryStatus: "yes", "no" (권한 변경 이력 기록 여부)
                - formerEmployeeDestructionTiming: 퇴사자 개인정보 파기 시점 (예: "즉시", "1개월 이내", "없음")
                - employmentDocumentRetention: 이력서 보관 기간 (예: "채용 후 파기", "3년 보관")
                - partnerContactDbRegistration: "yes", "no" (거래처 연락처 DB 등록 여부)
                - partnerContactRetention: 거래 종료 후 보관 (예: "즉시 파기", "1년 보관")
                - destructionPolicyStatus: "yes", "no" (파기 절차 수립 여부)
                - destructionMethods: 파기 방법 쉼표 구분 (예: "영구 삭제, 파쇄")
                - privacyPolicyIncludedItems: 처리방침 포함 항목 쉼표 구분
                - marketplaceSource: 오픈마켓 고객정보 수령 방식 (예: "API 연동", "수동 다운로드")
                - futureEmployees: 향후 직원 변화 계획 (예: "증가 예정", "유지")
                - futureRevenue: 향후 매출 변화 계획 (예: "성장 예정")
                - futureSubjectScale: 향후 정보주체 규모 변화 (예: "증가 예정")
                - newBiz: 향후 신규 사업/기술 도입 계획 (예: "AI 서비스 도입 예정", "없음")

                ## 발화 → 추출 예시 (반드시 이 패턴을 참고하세요)
                "CPO 지정 안 했어요" → {"cpoStatus":"no"}
                "개인정보보호책임자는 대표가 겸직해요" → {"cpoStatus":"yes","cpoTitle":"대표이사"}
                "야간에 마케팅 문자 안 보내요" → {"marketingNightSend":"no"}
                "밤 9시 이후에도 광고 문자 발송해요" → {"marketingNightSend":"yes"}
                "접속기록 6개월 보관해요" → {"accessLogStatus":"yes"}
                "접속기록 따로 안 남겨요" → {"accessLogStatus":"no"}
                "AWS 한국 리전 써요" → {"cloudServerLocation":"국내"}
                "서버가 미국에 있어요" → {"cloudServerLocation":"해외","overseasServerCountry":"미국"}
                "내부관리계획 아직 없어요" → {"internalPlanStatus":"no"}
                "내부관리계획은 매년 갱신해요" → {"internalPlanStatus":"yes","internalPlanCycle":"연 1회"}
                "직원별 권한 분리 안 돼 있어요" → {"accessControlSeparation":"no"}
                "CCTV 안내판 달아놨어요" → {"cctvSignageStatus":"yes"}
                "CCTV 안내판 없어요" → {"cctvSignageStatus":"no"}
                "제3자 제공 동의는 받고 있어요" → {"provisionConsentStatus":"yes"}
                "퇴직하면 바로 계정 삭제해요" → {"retiredAccessRevocation":"yes","formerEmployeeDestructionTiming":"즉시"}
                "이력서는 채용 후 바로 파기해요" → {"employmentDocumentRetention":"채용 후 파기"}
                "파기 절차 정해진 게 없어요" → {"destructionPolicyStatus":"no"}
                "수탁사 정보를 처리방침에 다 공개했어요" → {"delegateeDisclosureStatus":"전체 공개"}
                "마케팅 수신 동의는 가입할 때 사전에 받아요" → {"marketingConsentType":"사전 동의"}

                예시 출력: {"businessType":"음식점업","employeeCount":"5","delegationStatus":"no","cpoStatus":"no"}
                """;

        String userPrompt = (historyText.isBlank() ? "" : "대화 이력:\n" + historyText + "\n\n")
                + "현재 발화: " + userMessage;

        return completeText(systemPrompt, userPrompt)
                .map(json -> {
                    try {
                        String trimmed = json.trim()
                                .replaceAll("(?s)^```(?:json)?\\s*", "")
                                .replaceAll("(?s)\\s*```$", "")
                                .trim();
                        JsonNode node = MAPPER.readTree(trimmed);
                        Map<String, String> result = new HashMap<>();
                        node.fields().forEachRemaining(e -> {
                            if (!e.getValue().isNull() && !e.getValue().asText().isBlank()) {
                                result.put(e.getKey(), e.getValue().asText());
                            }
                        });
                        return result;
                    } catch (Exception e) {
                        log.warn("프로필 필드 추출 JSON 파싱 실패: {}", json);
                        return Map.<String, String>of();
                    }
                })
                .onErrorReturn(Map.of());
    }

    String extractContent(String sseChunk) {
        // "data: " 프리픽스 제거
        String data = sseChunk.startsWith("data:") ? sseChunk.substring(5).trim() : sseChunk.trim();
        if (data.isEmpty() || "[DONE]".equals(data)) return "";

        try {
            JsonNode root = MAPPER.readTree(data);
            JsonNode content = root.path("choices").path(0).path("delta").path("content");
            return content.isMissingNode() || content.isNull() ? "" : content.asText();
        } catch (Exception e) {
            log.debug("SSE 청크 파싱 실패: {}", data);
            return "";
        }
    }
}
