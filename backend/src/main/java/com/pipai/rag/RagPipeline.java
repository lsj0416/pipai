package com.pipai.rag;

import com.pipai.domain.CompanyProfile;
import com.pipai.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagPipeline {

    private final ProfileRepository profileRepository;
    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final LlmService llmService;

    public Flux<String> generateAnswer(String userMessage, UUID userId) {
        // 1. 기업 프로필 로드
        CompanyProfile profile = profileRepository.findByUserId(userId).orElse(null);

        // 2. 임베딩 생성
        float[] queryVector = embeddingService.embed(userMessage);

        // 3. 벡터 검색
        List<Map<String, Object>> lawRefs = vectorSearchService.searchLaws(queryVector, 5);
        String businessType = profile != null ? profile.getBusinessType() : null;
        List<Map<String, Object>> caseRefs = vectorSearchService.searchCases(queryVector, businessType, 3);

        log.debug("RAG 검색 완료 - 법령: {}건, 사례: {}건", lawRefs.size(), caseRefs.size());

        // 4. LLM 스트리밍 호출
        return llmService.streamAnswer(userMessage, profile, lawRefs, caseRefs);
    }
}
