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

    public record RagResult(Flux<String> stream, List<Map<String, Object>> lawRefs, List<Map<String, Object>> caseRefs) {}

    public RagResult generateAnswer(String userMessage, UUID userId) {
        CompanyProfile profile = profileRepository.findByUserId(userId).orElse(null);
        float[] queryVector = embeddingService.embed(userMessage);
        List<Map<String, Object>> lawRefs = vectorSearchService.searchLaws(queryVector, 5);
        String businessType = profile != null ? profile.getBusinessType() : null;
        List<Map<String, Object>> caseRefs = vectorSearchService.searchCases(queryVector, businessType, 3);
        log.debug("RAG 검색 완료 - 법령: {}건, 사례: {}건", lawRefs.size(), caseRefs.size());
        return new RagResult(llmService.streamAnswer(userMessage, profile, lawRefs, caseRefs), lawRefs, caseRefs);
    }
}
