import { test, expect } from '@playwright/test';

test.describe('Inquiry — 문의글 생성', () => {
  test('conversationId 없이 접근 → 안내 화면', async ({ page }) => {
    await page.goto('/inquiry');
    // inquiry/page.tsx line 65, 75 확인됨
    await expect(page.getByText('대화가 필요해요')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: '대화 시작하기 →' })).toBeVisible();
  });

  test('"대화 시작하기 →" 클릭 → /chat 이동', async ({ page }) => {
    await page.goto('/inquiry');
    await page.getByRole('button', { name: '대화 시작하기 →' }).click();
    await expect(page).toHaveURL('/chat', { timeout: 10_000 });
  });

  test('conversationId로 접근 + API 모킹 → 문의글 렌더링', async ({ page }) => {
    const convId = 'conv-mock-123';
    await page.route(`**/api/inquiry/generate/${convId}`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'inq-1',
            subject: 'CCTV 설치 관련 개인정보보호법 준수 문의',
            content: '안내판 설치 방법 및 영상 보관 기간 문의드립니다.',
            relatedLaws: '개인정보보호법 제25조',
            status: 'DRAFT',
            createdAt: '',
            updatedAt: '',
          },
          error: null,
          timestamp: '',
        }),
      });
    });

    await page.goto(`/inquiry?conversationId=${convId}`);
    // InquiryGen 렌더링 확인 — "전문가 문의글" 제목 (InquiryGen.tsx line 38)
    await expect(page.getByText('전문가 문의글')).toBeVisible({ timeout: 15_000 });
    // draft.title → <input defaultValue> → toHaveValue로 확인
    await expect(page.locator('input').first()).toHaveValue(
      'CCTV 설치 관련 개인정보보호법 준수 문의',
    );
    // draft.diagnosis.law → <span> text
    await expect(page.getByText('개인정보보호법 제25조')).toBeVisible();
  });
});
