package com.pipai.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipai.common.LocalEnvResolver;
import com.pipai.common.exception.LlmException;
import com.pipai.domain.CompanyProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

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
                                     List<Map<String, Object>> caseRefs) {
        String systemPrompt = buildSystemPrompt(profile, lawRefs, caseRefs);

        var requestBody = Map.of(
                "model", chatModel,
                "stream", true,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                )
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

    private String buildSystemPrompt(CompanyProfile profile,
                                     List<Map<String, Object>> lawRefs,
                                     List<Map<String, Object>> caseRefs) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 개인정보보호법(PIPA) 전문 AI 어시스턴트입니다.\n");
        sb.append("반드시 아래 법령 조문을 근거로 답변하고, 조문 번호와 출처를 명시하세요.\n\n");

        if (profile != null) {
            sb.append("## 기업 정보\n");
            sb.append("업종: ").append(profile.getBusinessType()).append("\n");
            sb.append("직원 수: ").append(profile.getEmployeeCount()).append("명\n\n");
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

        return sb.toString();
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
