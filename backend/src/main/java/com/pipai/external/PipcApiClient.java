package com.pipai.external;

import com.pipai.common.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class PipcApiClient {

    public record CaseData(String caseId, String title, String rawText) {}

    private final WebClient webClient;
    private final String apiKey;

    public PipcApiClient(
            @Value("${pipc-api.base-url}") String baseUrl,
            @Value("${pipc-api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public List<CaseData> fetchDecisions(int page, int perPage) {
        try {
            var response = webClient.get()
                    .uri(u -> u.path("/15121023/v1/uddi:clue")
                            .queryParam("serviceKey", apiKey)
                            .queryParam("page", page)
                            .queryParam("perPage", perPage)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return parseCaseData(response);
        } catch (Exception e) {
            throw new ExternalApiException("개보위 API 호출 실패: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<CaseData> parseCaseData(Map<String, Object> response) {
        if (response == null) return List.of();
        // 응답 파싱 로직 (개보위 API 응답 구조에 맞춰 구현 필요)
        return List.of();
    }
}
