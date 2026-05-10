package com.pipai.external;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LawApiClientTest {

    private LawApiClient client;

    @BeforeEach
    void setUp() {
        client = new LawApiClient("https://www.law.go.kr/DRF", "dummy-key");
    }

    @Test
    void parseLawChunks_정상응답_파싱성공() {
        Map<String, Object> response = Map.of(
                "LawSearch", Map.of(
                        "totalCnt", "2",
                        "law", List.of(
                                Map.of("법령ID", "001", "법령명한글", "개인정보 보호법",
                                        "소관부처명", "개인정보보호위원회", "법령구분명", "법률"),
                                Map.of("법령ID", "002", "법령명한글", "정보통신망법",
                                        "소관부처명", "과기정통부", "법령구분명", "법률")
                        )
                )
        );

        List<LawApiClient.LawChunk> result = client.parseLawChunks(response);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).lawId()).isEqualTo("001");
        assertThat(result.get(0).lawName()).isEqualTo("개인정보 보호법");
        assertThat(result.get(1).lawId()).isEqualTo("002");
    }

    @Test
    void parseLawChunks_단건조회시객체형태_파싱성공() {
        // 결과 1건일 때 배열 대신 객체로 오는 경우
        Map<String, Object> response = Map.of(
                "LawSearch", Map.of(
                        "totalCnt", "1",
                        "law", Map.of("법령ID", "001", "법령명한글", "개인정보 보호법",
                                "소관부처명", "개인정보보호위원회", "법령구분명", "법률")
                )
        );

        List<LawApiClient.LawChunk> result = client.parseLawChunks(response);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).lawName()).isEqualTo("개인정보 보호법");
    }

    @Test
    void parseLawChunks_null응답_빈리스트반환() {
        assertThat(client.parseLawChunks(null)).isEmpty();
    }

    @Test
    void parseLawChunks_LawSearch키없음_빈리스트반환() {
        assertThat(client.parseLawChunks(Map.of("other", "value"))).isEmpty();
    }

    @Test
    void parseLawChunks_법령ID없는항목_필터링() {
        Map<String, Object> response = Map.of(
                "LawSearch", Map.of(
                        "law", List.of(
                                Map.of("법령ID", "001", "법령명한글", "개인정보 보호법"),
                                Map.of("법령명한글", "ID없는법령")  // 법령ID 누락
                        )
                )
        );

        List<LawApiClient.LawChunk> result = client.parseLawChunks(response);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).lawId()).isEqualTo("001");
    }
}
