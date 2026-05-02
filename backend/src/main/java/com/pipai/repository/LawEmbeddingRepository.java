package com.pipai.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class LawEmbeddingRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> searchSimilar(float[] queryVector, int limit) {
        String vectorStr = toVectorString(queryVector);
        String sql = """
                SELECT id, law_id, article_number, content, law_name,
                       embedding <=> ?::vector AS distance
                FROM law_embeddings
                ORDER BY distance
                LIMIT ?
                """;
        return jdbcTemplate.queryForList(sql, vectorStr, limit);
    }

    public void upsert(String lawId, String articleNumber, String content,
                       String lawName, float[] embedding) {
        String sql = """
                INSERT INTO law_embeddings (law_id, article_number, content, law_name, embedding)
                VALUES (?, ?, ?, ?, ?::vector)
                ON CONFLICT (law_id, article_number)
                DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding
                """;
        jdbcTemplate.update(sql, lawId, articleNumber, content, lawName, toVectorString(embedding));
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
