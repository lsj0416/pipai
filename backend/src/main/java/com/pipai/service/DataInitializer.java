package com.pipai.service;

import com.pipai.external.LawApiClient;
import com.pipai.external.PipcApiClient;
import com.pipai.rag.EmbeddingService;
import com.pipai.repository.CaseEmbeddingRepository;
import com.pipai.repository.LawEmbeddingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final LawApiClient lawApiClient;
    private final PipcApiClient pipcApiClient;
    private final EmbeddingService embeddingService;
    private final LawEmbeddingRepository lawEmbeddingRepository;
    private final CaseEmbeddingRepository caseEmbeddingRepository;
    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void initializeData() {
        initLawData();
        initCaseData();
    }

    private void initLawData() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM law_embeddings", Integer.class);
        if (count != null && count > 0) {
            log.info("법령 임베딩 이미 존재 ({}건) — 초기화 스킵", count);
            return;
        }

        log.info("법령 임베딩 초기 데이터 로드 시작");
        // 개인정보 관련 주요 법령 검색어
        List<String> queries = List.of("개인정보 보호법", "정보통신망 이용촉진 및 정보보호", "신용정보의 이용 및 보호");
        int total = 0;

        for (String query : queries) {
            try {
                List<LawApiClient.LawChunk> lawMetas = lawApiClient.searchLaws(query);
                for (LawApiClient.LawChunk meta : lawMetas) {
                    List<LawApiClient.LawChunk> articles = lawApiClient.fetchLawArticles(meta.lawId());
                    for (LawApiClient.LawChunk article : articles) {
                        if (article.content().isBlank()) continue;
                        float[] embedding = embeddingService.embed(article.content());
                        lawEmbeddingRepository.upsert(
                                article.lawId(), article.articleNumber(),
                                article.content(), article.lawName(), embedding);
                        total++;
                    }
                }
            } catch (Exception e) {
                log.warn("법령 초기화 중 오류 (query={}): {}", query, e.getMessage());
            }
        }
        log.info("법령 임베딩 초기화 완료: {}건", total);
    }

    private void initCaseData() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM case_embeddings", Integer.class);
        if (count != null && count > 0) {
            log.info("사례 임베딩 이미 존재 ({}건) — 초기화 스킵", count);
            return;
        }

        log.info("사례 임베딩 초기 데이터 로드 시작");
        int total = 0;

        for (int page = 1; page <= 3; page++) {   // 최초 3페이지 (60건)
            try {
                List<PipcApiClient.CaseData> cases = pipcApiClient.fetchDecisions(page, 20);
                for (PipcApiClient.CaseData c : cases) {
                    if (c.rawText().isBlank()) continue;
                    float[] embedding = embeddingService.embed(c.rawText());
                    caseEmbeddingRepository.upsert(c.caseId(), c.title(), c.rawText(),
                            null, null, null, embedding);
                    total++;
                }
            } catch (Exception e) {
                log.warn("사례 초기화 중 오류 (page={}): {}", page, e.getMessage());
            }
        }
        log.info("사례 임베딩 초기화 완료: {}건", total);
    }
}
