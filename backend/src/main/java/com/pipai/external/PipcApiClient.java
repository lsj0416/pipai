package com.pipai.external;

import com.pipai.common.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

// 개인정보보호위원회 처분 결정문 — 법제처 Open API(DRF) expc(법령해석례) 타겟으로 조회
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
                            .queryParam("target", "expc")
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
    List<CaseData> parseCaseData(Map<String, Object> response) {
        if (response == null) return List.of();

        try {
            // 법제처 expc(법령해석례) 응답 구조: {"PrecSearch": {"prec": [...]}}
            Map<String, Object> precSearch = (Map<String, Object>) response.get("PrecSearch");
            if (precSearch == null) {
                log.warn("PipcApiClient 응답에 PrecSearch 키 없음: {}", response.keySet());
                return List.of();
            }

            Object precObj = precSearch.get("prec");
            List<Map<String, Object>> precs;
            if (precObj instanceof List<?> list) {
                precs = (List<Map<String, Object>>) list;
            } else if (precObj instanceof Map<?, ?> map) {
                // 결과가 1건일 때 배열 대신 객체로 오는 경우
                precs = List.of((Map<String, Object>) map);
            } else {
                return List.of();
            }

            return precs.stream()
                    .map(prec -> {
                        String caseId = String.valueOf(prec.getOrDefault("판례일련번호", ""));
                        String title = String.valueOf(prec.getOrDefault("사건명", ""));
                        // 판시사항 + 판결요지를 rawText로 합산
                        String rawText = buildRawText(prec);
                        return new CaseData(caseId, title, rawText);
                    })
                    .filter(c -> !c.caseId().isEmpty() && !c.title().isEmpty())
                    .toList();
        } catch (Exception e) {
            log.warn("개보위 응답 파싱 실패: {}", e.getMessage());
            return List.of();
        }
    }

    private String buildRawText(Map<String, Object> prec) {
        StringBuilder sb = new StringBuilder();
        Object 판시사항 = prec.get("판시사항");
        Object 판결요지 = prec.get("판결요지");
        Object 사건번호 = prec.get("사건번호");
        Object 선고일자 = prec.get("선고일자");

        if (사건번호 != null) sb.append("사건번호: ").append(사건번호).append("\n");
        if (선고일자 != null) sb.append("선고일자: ").append(선고일자).append("\n");
        if (판시사항 != null && !String.valueOf(판시사항).isBlank()) {
            sb.append("판시사항: ").append(판시사항).append("\n");
        }
        if (판결요지 != null && !String.valueOf(판결요지).isBlank()) {
            sb.append("판결요지: ").append(판결요지);
        }
        return sb.toString().trim();
    }
}
