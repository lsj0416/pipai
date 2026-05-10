package com.pipai.rag;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LlmServiceTest {

    private LlmService llmService;

    @BeforeEach
    void setUp() {
        // extractContent 는 WebClient 미사용 — 리플렉션 없이 직접 생성 불가하므로 서브클래스로 우회
        llmService = new LlmService("dummy-key", "gpt-4o", "test");
    }

    @Test
    void extractContent_data프리픽스포함_정상추출() {
        String chunk = "data: {\"choices\":[{\"delta\":{\"content\":\"안녕하세요\"},\"index\":0}]}";
        assertThat(llmService.extractContent(chunk)).isEqualTo("안녕하세요");
    }

    @Test
    void extractContent_data프리픽스없음_정상추출() {
        String chunk = "{\"choices\":[{\"delta\":{\"content\":\"테스트\"},\"index\":0}]}";
        assertThat(llmService.extractContent(chunk)).isEqualTo("테스트");
    }

    @Test
    void extractContent_이스케이프문자_정상처리() {
        String chunk = "data: {\"choices\":[{\"delta\":{\"content\":\"줄바꿈\\n포함\"},\"index\":0}]}";
        assertThat(llmService.extractContent(chunk)).isEqualTo("줄바꿈\n포함");
    }

    @Test
    void extractContent_DONE시그널_빈문자열반환() {
        assertThat(llmService.extractContent("data: [DONE]")).isEmpty();
        assertThat(llmService.extractContent("[DONE]")).isEmpty();
    }

    @Test
    void extractContent_content필드없는델타_빈문자열반환() {
        // 스트림 첫 청크는 role만 있고 content 없음
        String chunk = "data: {\"choices\":[{\"delta\":{\"role\":\"assistant\"},\"index\":0}]}";
        assertThat(llmService.extractContent(chunk)).isEmpty();
    }

    @Test
    void extractContent_빈청크_빈문자열반환() {
        assertThat(llmService.extractContent("")).isEmpty();
        assertThat(llmService.extractContent("   ")).isEmpty();
    }

    @Test
    void extractContent_파싱불가JSON_빈문자열반환() {
        assertThat(llmService.extractContent("data: not-a-json")).isEmpty();
    }
}
