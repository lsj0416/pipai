package com.pipai.rag;

import com.pipai.repository.CaseEmbeddingRepository;
import com.pipai.repository.LawEmbeddingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VectorSearchService {

    private final LawEmbeddingRepository lawRepo;
    private final CaseEmbeddingRepository caseRepo;

    public List<Map<String, Object>> searchLaws(float[] queryVector, int limit) {
        return lawRepo.searchSimilar(queryVector, limit);
    }

    public List<Map<String, Object>> searchCases(float[] queryVector, String businessType, int limit) {
        return caseRepo.searchSimilar(queryVector, businessType, limit);
    }
}
