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
                "PrecSearch", Map.of(
                        "totalCnt", "2",
                        "prec", List.of(
                                Map.of("판례일련번호", "C001", "사건명", "개인정보 무단 수집 사건",
                                        "사건번호", "2024-001", "선고일자", "20240101",
                                        "판시사항", "동의 없이 수집한 경우 위반",
                                        "판결요지", "개인정보보호법 제15조 위반으로 과징금 부과"),
                                Map.of("판례일련번호", "C002", "사건명", "개인정보 유출 사건",
                                        "판시사항", "보안 미조치로 인한 유출")
                        )
                )
        );

        List<PipcApiClient.CaseData> result = client.parseCaseData(response);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).caseId()).isEqualTo("C001");
        assertThat(result.get(0).title()).isEqualTo("개인정보 무단 수집 사건");
        assertThat(result.get(0).rawText()).contains("사건번호: 2024-001");
        assertThat(result.get(0).rawText()).contains("판시사항: 동의 없이 수집한 경우 위반");
        assertThat(result.get(0).rawText()).contains("판결요지: 개인정보보호법 제15조 위반으로 과징금 부과");
    }

    @Test
    void parseCaseData_단건조회시객체형태_파싱성공() {
        Map<String, Object> response = Map.of(
                "PrecSearch", Map.of(
                        "prec", Map.of("판례일련번호", "C001", "사건명", "단건 사건",
                                "판시사항", "단건 판시사항")
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
    void parseCaseData_PrecSearch키없음_빈리스트반환() {
        assertThat(client.parseCaseData(Map.of("other", "value"))).isEmpty();
    }

    @Test
    void parseCaseData_caseId없는항목_필터링() {
        Map<String, Object> response = Map.of(
                "PrecSearch", Map.of(
                        "prec", List.of(
                                Map.of("판례일련번호", "C001", "사건명", "정상 사건"),
                                Map.of("사건명", "ID없는사건")  // 판례일련번호 누락
                        )
                )
        );

        List<PipcApiClient.CaseData> result = client.parseCaseData(response);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).caseId()).isEqualTo("C001");
    }
}
