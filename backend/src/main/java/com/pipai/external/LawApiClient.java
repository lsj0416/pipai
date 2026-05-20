package com.pipai.external;

import com.pipai.common.exception.ExternalApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class LawApiClient {

    public record LawChunk(String lawId, String lawName, String articleNumber, String content) {}

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

    public LawApiClient(
            @Value("${law-api.base-url}") String baseUrl,
            @Value("${law-api.key}") String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
    }

    @Cacheable("lawSearch")
    public List<LawChunk> searchLaws(String query) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl + "/lawSearch.do")
                    .queryParam("OC", apiKey)
                    .queryParam("target", "law")
                    .queryParam("query", query)
                    .queryParam("type", "JSON")
                    .encode()
                    .build()
                    .toUri();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            return parseLawChunks(response);
        } catch (Exception e) {
            throw new ExternalApiException("법제처 API 호출 실패: " + e.getMessage(), e);
        }
    }

    public List<LawChunk> fetchLawArticles(String lawId) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl + "/lawService.do")
                    .queryParam("OC", apiKey)
                    .queryParam("target", "law")
                    .queryParam("ID", lawId)
                    .queryParam("type", "JSON")
                    .encode()
                    .build()
                    .toUri();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);
            return parseLawArticles(lawId, response);
        } catch (Exception e) {
            log.warn("법령 조문 조회 실패 (lawId={}): {}", lawId, e.getMessage());
            return List.of();
        }
    }

    public List<LawChunk> fetchRecentlyAmended() {
        return searchLaws("개인정보");
    }

    @SuppressWarnings("unchecked")
    List<LawChunk> parseLawChunks(Map<String, Object> response) {
        if (response == null) return List.of();

        try {
            Map<String, Object> lawSearch = (Map<String, Object>) response.get("LawSearch");
            if (lawSearch == null) {
                log.warn("법제처 응답에 LawSearch 키 없음: {}", response.keySet());
                return List.of();
            }

            Object lawObj = lawSearch.get("law");
            List<Map<String, Object>> laws;
            if (lawObj instanceof List<?> list) {
                laws = (List<Map<String, Object>>) list;
            } else if (lawObj instanceof Map<?, ?> map) {
                laws = List.of((Map<String, Object>) map);
            } else {
                return List.of();
            }

            return laws.stream()
                    .map(law -> new LawChunk(
                            String.valueOf(law.getOrDefault("법령ID", "")),
                            String.valueOf(law.getOrDefault("법령명한글", "")),
                            "",
                            String.valueOf(law.getOrDefault("소관부처명", "")) + " — " +
                            String.valueOf(law.getOrDefault("법령구분명", ""))
                    ))
                    .filter(chunk -> !chunk.lawId().isEmpty() && !chunk.lawName().isEmpty())
                    .toList();
        } catch (Exception e) {
            log.warn("법령 검색 응답 파싱 실패: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<LawChunk> parseLawArticles(String lawId, Map<String, Object> response) {
        if (response == null) return List.of();

        try {
            Map<String, Object> law = (Map<String, Object>) response.get("법령");
            if (law == null) return List.of();

            Map<String, Object> basicInfo = (Map<String, Object>) law.get("기본정보");
            String lawName = String.valueOf(basicInfo.getOrDefault("법령명_한글", ""));

            Map<String, Object> articlesWrapper = (Map<String, Object>) law.get("조문");
            if (articlesWrapper == null) return List.of();

            Object articleUnitsObj = articlesWrapper.get("조문단위");
            List<Map<String, Object>> articleUnits;
            if (articleUnitsObj instanceof List<?> list) {
                articleUnits = (List<Map<String, Object>>) list;
            } else if (articleUnitsObj instanceof Map<?, ?> map) {
                articleUnits = List.of((Map<String, Object>) map);
            } else {
                return List.of();
            }

            return articleUnits.stream()
                    .map(article -> {
                        String articleNo = "제" + article.get("조문번호") + "조";
                        Object title = article.get("조문제목");
                        if (title != null && !String.valueOf(title).isBlank()) {
                            articleNo += "(" + title + ")";
                        }
                        return new LawChunk(
                                lawId,
                                lawName,
                                articleNo,
                                String.valueOf(article.getOrDefault("조문내용", ""))
                        );
                    })
                    .filter(chunk -> !chunk.content().isBlank())
                    .toList();
        } catch (Exception e) {
            log.warn("법령 조문 파싱 실패 (lawId={}): {}", lawId, e.getMessage());
            return List.of();
        }
    }
}
