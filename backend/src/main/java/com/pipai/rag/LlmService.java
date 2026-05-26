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
import java.util.List;
import java.util.Map;

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
