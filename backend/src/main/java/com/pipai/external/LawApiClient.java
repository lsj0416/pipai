package com.pipai.external;

import com.pipai.common.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class LawApiClient {

    public record LawChunk(String lawId, String lawName, String articleNumber, String content) {}

    private final WebClient webClient;
    private final String apiKey;

    public LawApiClient(
            @Value("${law-api.base-url}") String baseUrl,
            @Value("${law-api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    @Cacheable("lawSearch")
    public List<LawChunk> searchLaws(String query) {
        try {
            var response = webClient.get()
                    .uri(u -> u.path("/lawSearch.do")
                            .queryParam("OC", apiKey)
                            .queryParam("target", "law")
                            .queryParam("query", query)
                            .queryParam("type", "JSON")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return parseLawChunks(response);
        } catch (Exception e) {
            throw new ExternalApiException("법제처 API 호출 실패: " + e.getMessage(), e);
        }
    }

    public List<LawChunk> fetchRecentlyAmended() {
        // 최근 개정 법령 조회 — 실제 구현 시 변경이력 API 활용
        return searchLaws("개인정보");
    }

    @SuppressWarnings("unchecked")
    private List<LawChunk> parseLawChunks(Map<String, Object> response) {
        if (response == null) return List.of();
        // 응답 파싱 로직 (법제처 API 응답 구조에 맞춰 구현 필요)
        return List.of();
    }
}
