package com.pipai.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipai.common.LocalEnvResolver;
import com.pipai.common.exception.LlmException;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.Message;
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

    private static final String DISCLAIMER = "\n\n⚠️ 이 답변은 참고용이며, 법적 효력이 없습니다. 중요한 사항은 반드시 전문가와 상담하세요.";
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
                                     List<Message> history) {
        String systemPrompt = buildSystemPrompt(userMessage, profile, lawRefs, caseRefs);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        for (Message msg : history) {
            String content = msg.getContent();
            if (msg.getRole() == Message.Role.ASSISTANT) {
                content = content.replace(DISCLAIMER, "").strip();
            }
            String role = msg.getRole() == Message.Role.USER ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", content));
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
                .onErrorMap(e -> new LlmException("LLM 스트리밍 실패", e))
                .concatWith(Flux.just(DISCLAIMER));
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
                                     List<Map<String, Object>> caseRefs) {
        QuestionType type = classifyQuestion(userMessage);
        StringBuilder sb = new StringBuilder();

        sb.append("당신은 개인정보보호법(PIPA) 전문 AI 어시스턴트입니다.\n");
        sb.append("반드시 아래 법령 조문을 근거로 답변하고, 조문 번호와 출처를 명시하세요.\n");
        sb.append("기업의 구체적인 상황(업종·규모·수집 데이터·민감정보 유형)을 반영한 맞춤형 답변을 제공하세요.\n\n");

        // 미등록 핵심 정보 → AI가 자연스럽게 수집하도록 안내
        List<String> missing = new ArrayList<>();
        if (profile == null || !str(profile.getBusinessType())) missing.add("업종");
        if (profile == null || profile.getEmployeeCount() == null) missing.add("직원 수");
        if (!missing.isEmpty()) {
            sb.append("## 기업 정보 미등록 항목\n");
            sb.append("다음 정보가 아직 등록되지 않았습니다: ").append(String.join(", ", missing)).append("\n");
            sb.append("답변 후 대화 흐름이 자연스럽다면 이 정보를 한 가지씩 질문해 주세요.\n");
            sb.append("예: \"업종이 어떻게 되세요? 더 정확한 리스크 진단을 드릴 수 있어요.\"\n\n");
        }

        if (profile != null) {
            sb.append("## 기업 정보\n");
            if (str(profile.getBusinessType())) sb.append("업종: ").append(profile.getBusinessType()).append("\n");
            if (profile.getEmployeeCount() != null) sb.append("직원 수: ").append(profile.getEmployeeCount()).append("명\n");
            if (str(profile.getAnnualRevenue())) sb.append("매출 규모: ").append(profile.getAnnualRevenue()).append("\n");
            if (str(profile.getPersonalDataItems())) sb.append("수집 개인정보 항목: ").append(profile.getPersonalDataItems()).append("\n");
            if (profile.getHasPrivacyPolicy() != null) sb.append("개인정보처리방침 보유 여부: ").append(profile.getHasPrivacyPolicy() ? "있음" : "없음").append("\n");
            if (str(profile.getSensitiveDataTypes())) sb.append("처리하는 민감정보 유형: ").append(profile.getSensitiveDataTypes()).append("\n");
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
            String content = msg.getContent();
            if (msg.getRole() == Message.Role.ASSISTANT) {
                content = content.replace(DISCLAIMER, "").strip();
            }
            messages.add(Map.of("role", role, "content", content));
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
                .onErrorMap(e -> new LlmException("프로필 작성 도우미 스트리밍 실패", e))
                .concatWith(Flux.just(DISCLAIMER));
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

                예시 출력: {"businessType":"음식점업","employeeCount":"5","delegationStatus":"no"}
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
