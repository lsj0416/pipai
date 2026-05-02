package com.pipai.external;

import com.pipai.common.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

// 개인정보보호위원회 처분 결정문 — 법제처 Open API(DRF)로 조회
@Component
@Slf4j
public class PipcApiClient {

    public record CaseData(String caseId, String title, String rawText) {}

    private final WebClient webClient;
    private final String apiKey;

    public PipcApiClient(
            @Value("${law-api.base-url}") String baseUrl,
            @Value("${law-api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public List<CaseData> fetchDecisions(int page, int perPage) {
        try {
            var response = webClient.get()
                    .uri(u -> u.path("/lawSearch.do")
                            .queryParam("OC", apiKey)
                            .queryParam("target", "expc")   // 법령해석례 (개보위 처분 포함)
                            .queryParam("query", "개인정보")
                            .queryParam("page", page)
                            .queryParam("display", perPage)
                            .queryParam("type", "JSON")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return parseCaseData(response);
        } catch (Exception e) {
            throw new ExternalApiException("개보위 처분 결정문 조회 실패: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<CaseData> parseCaseData(Map<String, Object> response) {
        if (response == null) return List.of();
        // 응답 파싱 로직 (법제처 DRF 응답 구조에 맞춰 구현 필요)
        return List.of();
    }
}
