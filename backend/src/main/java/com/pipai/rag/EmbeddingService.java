package com.pipai.rag;

import com.pipai.common.LocalEnvResolver;
import com.pipai.common.exception.LlmException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmbeddingService {

    private final WebClient webClient;
    private final String model;

    public EmbeddingService(
            @Value("${openai.api-key}") String apiKey,
            @Value("${openai.embedding-model}") String model,
            @Value("${spring.profiles.active:}") String activeProfile) {
        this.model = model;
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

    @Cacheable(value = "embeddings", key = "#text.hashCode()")
    public float[] embed(String text) {
        try {
            var response = webClient.post()
                    .uri("/embeddings")
                    .bodyValue(Map.of("model", model, "input", text))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            @SuppressWarnings("unchecked")
            var data = (List<Map<String, Object>>) response.get("data");
            @SuppressWarnings("unchecked")
            var embeddingList = (List<Double>) data.get(0).get("embedding");

            float[] result = new float[embeddingList.size()];
            for (int i = 0; i < embeddingList.size(); i++) {
                result[i] = embeddingList.get(i).floatValue();
            }
            return result;
        } catch (Exception e) {
            if (e instanceof WebClientResponseException responseException) {
                log.error("Embedding request failed: status={} body={}",
                        responseException.getStatusCode(),
                        responseException.getResponseBodyAsString(),
                        e);
            } else {
                log.error("Embedding request failed: {}", e.getMessage(), e);
            }
            throw new LlmException("임베딩 생성 실패", e);
        }
    }
}
