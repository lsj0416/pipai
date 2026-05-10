import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage';

async function mockConversationCreate(
  page: import('@playwright/test').Page,
  convId = 'test-conv',
) {
  await page.route('**/api/conversations', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: convId, title: '테스트', createdAt: '', updatedAt: '' },
        error: null,
        timestamp: '',
      }),
    });
  });
}

test.describe('Chat — SSE 스트리밍 (모킹)', () => {
  test('웰컴 메시지 표시', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByText('개인정보보호법(PIPA) 관련 리스크 진단')).toBeVisible();
  });

  test('SSE text + law_ref → 텍스트 + 법령카드 렌더링', async ({ page }) => {
    await mockConversationCreate(page);
    await page.route('**/api/conversations/*/messages', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: [
          'data:{"type":"text","content":"CCTV 안내판은 필수입니다."}',
          'data:{"type":"law_ref","content":{"articleNo":"제25조","title":"영상정보처리기기 제한","summary":"공개장소 안내판 의무"}}',
          'data:[DONE]',
          '',
        ].join('\n'),
      });
    });

    const chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.sendMessage('CCTV 관련 법령 알려주세요');
    await chatPage.waitForStreamingComplete(15_000);

    await expect(page.getByText('CCTV 안내판은 필수입니다.')).toBeVisible();
    await expect(page.getByText('제25조')).toBeVisible();
  });

  test('SSE case_ref → 사례카드 렌더링', async ({ page }) => {
    await mockConversationCreate(page);
    await page.route('**/api/conversations/*/messages', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: [
          'data:{"type":"text","content":"유사 사례입니다."}',
          'data:{"type":"case_ref","content":{"businessType":"소매업","employeeCount":5,"violation":"처리방침 미게시","penalty":500,"year":2023}}',
          'data:[DONE]',
          '',
        ].join('\n'),
      });
    });

    const chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.sendMessage('비슷한 처벌 사례 있나요?');
    await chatPage.waitForStreamingComplete(15_000);

    await expect(page.getByText(/소매업/)).toBeVisible();
  });

  test('메시지 전송 후 "문의글 자동 생성" 버튼 표시', async ({ page }) => {
    await mockConversationCreate(page);
    await page.route('**/api/conversations/*/messages', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: ['data:{"type":"text","content":"답변입니다."}', 'data:[DONE]', ''].join('\n'),
      });
    });

    const chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.sendMessage('개인정보 처리방침 질문');
    await chatPage.waitForStreamingComplete(15_000);

    await expect(chatPage.inquiryButton).toBeVisible();
  });
});

test.describe('Chat — 실제 백엔드', () => {
  test.skip(!process.env.BACKEND_URL, '백엔드 필요 — BACKEND_URL 환경변수 설정 필요');
  test.setTimeout(90_000);

  test('메시지 전송 후 스트리밍 응답 수신', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.sendMessage('CCTV 촬영 시 고지 의무가 있나요?');

    await expect(page.getByText('응답 중...')).toBeVisible({ timeout: 10_000 });
    await chatPage.waitForStreamingComplete(60_000);
    await expect(chatPage.inquiryButton).toBeVisible();
  });
});
