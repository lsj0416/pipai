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
        try {
            var laws = lawApiClient.fetchRecentlyAmended();
            for (var law : laws) {
                float[] embedding = embeddingService.embed(law.content());
                lawEmbeddingRepository.upsert(law.lawId(), law.articleNumber(),
                        law.content(), law.lawName(), embedding);
            }
            log.info("법령 데이터 동기화 완료: {}건", laws.size());
        } catch (Exception e) {
            log.error("법령 데이터 동기화 실패", e);
        }
    }
}
