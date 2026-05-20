package com.pipai.external;

import com.pipai.common.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

// 법제처 Open API(DRF) expc(법령해석례) 타겟으로 조회
@Component
@Slf4j
public class PipcApiClient {

    public record CaseData(String caseId, String title, String rawText) {}

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

    public PipcApiClient(
            @Value("${law-api.base-url}") String baseUrl,
            @Value("${law-api.key}") String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
    }

    public int fetchTotalCount() {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl + "/lawSearch.do")
                    .queryParam("OC", apiKey)
                    .queryParam("target", "expc")
                    .queryParam("query", "개인정보")
                    .queryParam("display", 1)
                    .queryParam("type", "JSON")
                    .encode()
                    .build()
                    .toUri();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            if (response == null) return 0;
            @SuppressWarnings("unchecked")
            Map<String, Object> expc = (Map<String, Object>) response.get("Expc");
            if (expc == null) return 0;
            return Integer.parseInt(String.valueOf(expc.getOrDefault("totalCnt", "0")));
        } catch (Exception e) {
            log.warn("판례 totalCnt 조회 실패: {}", e.getMessage());
            return 0;
        }
    }

    public List<CaseData> fetchDecisions(int page, int perPage) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl + "/lawSearch.do")
                    .queryParam("OC", apiKey)
                    .queryParam("target", "expc")
                    .queryParam("query", "개인정보")
                    .queryParam("page", page)
                    .queryParam("display", perPage)
                    .queryParam("type", "JSON")
                    .encode()
                    .build()
                    .toUri();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            return parseCaseData(response);
        } catch (Exception e) {
            throw new ExternalApiException("법령해석례 조회 실패: " + e.getMessage(), e);
        }
    }

    // 실제 응답 구조: {"Expc": {"expc": {...or [...]}, "totalCnt": "50", ...}}
    @SuppressWarnings("unchecked")
    List<CaseData> parseCaseData(Map<String, Object> response) {
        if (response == null) return List.of();

        try {
            Map<String, Object> expcWrapper = (Map<String, Object>) response.get("Expc");
            if (expcWrapper == null) {
                log.warn("PipcApiClient 응답에 Expc 키 없음: {}", response.keySet());
                return List.of();
            }

            Object expcObj = expcWrapper.get("expc");
            List<Map<String, Object>> expcList;
            if (expcObj instanceof List<?> list) {
                expcList = (List<Map<String, Object>>) list;
            } else if (expcObj instanceof Map<?, ?> map) {
                expcList = List.of((Map<String, Object>) map);
            } else {
                return List.of();
            }

            return expcList.stream()
                    .map(item -> {
                        String caseId = String.valueOf(item.getOrDefault("법령해석례일련번호", ""));
                        String title = String.valueOf(item.getOrDefault("안건명", ""));
                        String rawText = buildRawText(item);
                        return new CaseData(caseId, title, rawText);
                    })
                    .filter(c -> !c.caseId().isEmpty() && !c.title().isEmpty())
                    .toList();
        } catch (Exception e) {
            log.warn("법령해석례 응답 파싱 실패: {}", e.getMessage());
            return List.of();
        }
    }

    private String buildRawText(Map<String, Object> item) {
        StringBuilder sb = new StringBuilder();
        Object 안건번호 = item.get("안건번호");
        Object 회신일자 = item.get("회신일자");
        Object 질의기관명 = item.get("질의기관명");
        Object 안건명 = item.get("안건명");

        if (안건번호 != null) sb.append("안건번호: ").append(안건번호).append("\n");
        if (회신일자 != null) sb.append("회신일자: ").append(회신일자).append("\n");
        if (질의기관명 != null) sb.append("질의기관: ").append(질의기관명).append("\n");
        if (안건명 != null && !String.valueOf(안건명).isBlank()) {
            sb.append("안건명: ").append(안건명);
        }
        return sb.toString().trim();
    }
}
