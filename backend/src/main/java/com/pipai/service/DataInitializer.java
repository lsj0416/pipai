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
        int total = 0;

        // "개인정보" 단일 검색으로 관련 법령 전체(12건) 가져오기
        try {
            List<LawApiClient.LawChunk> lawMetas = lawApiClient.searchLaws("개인정보");
            log.info("개인정보 관련 법령 {}건 발견", lawMetas.size());
            for (LawApiClient.LawChunk meta : lawMetas) {
                try {
                    List<LawApiClient.LawChunk> articles = lawApiClient.fetchLawArticles(meta.lawId());
                    for (LawApiClient.LawChunk article : articles) {
                        if (article.content().isBlank()) continue;
                        float[] embedding = embeddingService.embed(article.content());
                        lawEmbeddingRepository.upsert(
                                article.lawId(), article.articleNumber(),
                                article.content(), article.lawName(), embedding);
                        total++;
                    }
                    log.info("법령 조문 저장 완료: {} ({}건)", meta.lawName(), articles.size());
                } catch (Exception e) {
                    log.warn("법령 조문 로드 실패 (lawId={}): {}", meta.lawId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("법령 초기화 실패: {}", e.getMessage());
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
        int perPage = 20;

        // totalCnt 조회 후 전체 페이지 순회
        int totalCnt = pipcApiClient.fetchTotalCount();
        int totalPages = (int) Math.ceil((double) totalCnt / perPage);
        log.info("법령해석례 전체 {}건, {}페이지 로드 시작", totalCnt, totalPages);

        for (int page = 1; page <= totalPages; page++) {
            try {
                List<PipcApiClient.CaseData> cases = pipcApiClient.fetchDecisions(page, perPage);
                for (PipcApiClient.CaseData c : cases) {
                    if (c.rawText().isBlank()) continue;
                    float[] embedding = embeddingService.embed(c.rawText());
                    caseEmbeddingRepository.upsert(c.caseId(), c.title(), c.rawText(),
                            null, null, null, embedding);
                    total++;
                }
                log.info("사례 {}페이지 처리 완료 (누적 {}건)", page, total);
            } catch (Exception e) {
                log.warn("사례 초기화 중 오류 (page={}): {}", page, e.getMessage());
            }
        }
        log.info("사례 임베딩 초기화 완료: {}건", total);
    }
}
