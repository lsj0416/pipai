package com.pipai.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class CaseEmbeddingRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> searchSimilar(float[] queryVector, String businessType, int limit) {
        String vectorStr = toVectorString(queryVector);
        if (businessType == null || businessType.isBlank()) {
            String sql = """
                    SELECT id, case_id, title, summary, business_type, violation_type, fine_amount,
                           embedding <=> ?::vector AS distance
                    FROM case_embeddings
                    ORDER BY distance
                    LIMIT ?
                    """;
            return jdbcTemplate.queryForList(sql, vectorStr, limit);
        }

        String sql = """
                SELECT id, case_id, title, summary, business_type, violation_type, fine_amount,
                       embedding <=> ?::vector AS distance
                FROM case_embeddings
                WHERE business_type = ?
                ORDER BY distance
                LIMIT ?
                """;
        return jdbcTemplate.queryForList(sql, vectorStr, businessType, limit);
    }

    public void upsert(String caseId, String title, String summary, String businessType,
                       String violationType, Long fineAmount, float[] embedding) {
        String sql = """
                INSERT INTO case_embeddings (case_id, title, summary, business_type, violation_type, fine_amount, embedding)
                VALUES (?, ?, ?, ?, ?, ?, ?::vector)
                ON CONFLICT (case_id)
                DO UPDATE SET summary = EXCLUDED.summary, embedding = EXCLUDED.embedding
                """;
        jdbcTemplate.update(sql, caseId, title, summary, businessType, violationType, fineAmount, toVectorString(embedding));
    }

    private String toVectorString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
