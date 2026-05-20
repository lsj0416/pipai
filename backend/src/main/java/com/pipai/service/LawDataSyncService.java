package com.pipai.service;

import com.pipai.external.LawApiClient;
import com.pipai.rag.EmbeddingService;
import com.pipai.repository.LawEmbeddingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class LawDataSyncService {

    private final LawApiClient lawApiClient;
    private final EmbeddingService embeddingService;
    private final LawEmbeddingRepository lawEmbeddingRepository;

    // 매월 1일 새벽 2시 실행
    @Scheduled(cron = "0 0 2 1 * *")
    public void syncLawData() {
        log.info("법령 데이터 동기화 시작");
        int count = 0;
        try {
            var recentlyAmended = lawApiClient.fetchRecentlyAmended();
            for (var lawMeta : recentlyAmended) {
                var articles = lawApiClient.fetchLawArticles(lawMeta.lawId());
                for (var article : articles) {
                    if (article.content().isBlank()) continue;
                    float[] embedding = embeddingService.embed(article.content());
                    lawEmbeddingRepository.upsert(article.lawId(), article.articleNumber(),
                            article.content(), article.lawName(), embedding);
                    count++;
                }
            }
            log.info("법령 데이터 동기화 완료: {}건", count);
        } catch (Exception e) {
            log.error("법령 데이터 동기화 실패", e);
        }
    }

    // 매월 1일 새벽 3시 실행 (법령 동기화 완료 후)
    @Scheduled(cron = "0 0 3 1 * *")
    public void syncAdmrulData() {
        log.info("행정규칙 데이터 동기화 시작");
        int count = 0;
        try {
            var admruls = lawApiClient.searchAdmruls("개인정보");
            for (var meta : admruls) {
                var articles = lawApiClient.fetchAdmrulArticles(meta.lawId());
                for (var article : articles) {
                    if (article.content().isBlank()) continue;
                    float[] embedding = embeddingService.embed(article.content());
                    lawEmbeddingRepository.upsert("admrul_" + article.lawId(), article.articleNumber(),
                            article.content(), article.lawName(), embedding);
                    count++;
                }
            }
            log.info("행정규칙 데이터 동기화 완료: {}건", count);
        } catch (Exception e) {
            log.error("행정규칙 데이터 동기화 실패", e);
        }
    }
}
