package com.pipai.external;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PipcApiClientTest {

    private PipcApiClient client;

    @BeforeEach
    void setUp() {
        client = new PipcApiClient("https://www.law.go.kr/DRF", "dummy-key");
    }

    @Test
    void parseCaseData_정상응답_파싱성공() {
        Map<String, Object> response = Map.of(
                "Expc", Map.of(
                        "totalCnt", "2",
                        "expc", List.of(
                                Map.of("법령해석례일련번호", "C001", "안건명", "개인정보 무단 수집 사건",
                                        "안건번호", "2024-001", "회신일자", "20240101",
                                        "질의기관명", "행정안전부"),
                                Map.of("법령해석례일련번호", "C002", "안건명", "개인정보 유출 사건")
                        )
                )
        );

        List<PipcApiClient.CaseData> result = client.parseCaseData(response);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).caseId()).isEqualTo("C001");
        assertThat(result.get(0).title()).isEqualTo("개인정보 무단 수집 사건");
        assertThat(result.get(0).rawText()).contains("안건번호: 2024-001");
        assertThat(result.get(0).rawText()).contains("회신일자: 20240101");
        assertThat(result.get(0).rawText()).contains("질의기관: 행정안전부");
    }

    @Test
    void parseCaseData_단건조회시객체형태_파싱성공() {
        Map<String, Object> response = Map.of(
                "Expc", Map.of(
                        "expc", Map.of("법령해석례일련번호", "C001", "안건명", "단건 사건",
                                "안건번호", "2024-999")
                )
        );

        List<PipcApiClient.CaseData> result = client.parseCaseData(response);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).caseId()).isEqualTo("C001");
    }

    @Test
    void parseCaseData_null응답_빈리스트반환() {
        assertThat(client.parseCaseData(null)).isEmpty();
    }

    @Test
    void parseCaseData_Expc키없음_빈리스트반환() {
        assertThat(client.parseCaseData(Map.of("other", "value"))).isEmpty();
    }

    @Test
    void parseCaseData_caseId없는항목_필터링() {
        Map<String, Object> response = Map.of(
                "Expc", Map.of(
                        "expc", List.of(
                                Map.of("법령해석례일련번호", "C001", "안건명", "정상 사건"),
                                Map.of("안건명", "ID없는사건")  // 법령해석례일련번호 누락
                        )
                )
        );

        List<PipcApiClient.CaseData> result = client.parseCaseData(response);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).caseId()).isEqualTo("C001");
    }
}
