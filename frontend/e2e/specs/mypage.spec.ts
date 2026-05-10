import { test, expect } from '@playwright/test';

test.describe('MyPage — 기업 프로필 등록', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mypage');
    // 이전 테스트의 localStorage 상태 초기화
    await page.evaluate(() => localStorage.removeItem('pipai_mypage_form'));
    await page.reload();
  });

  test('섹션 탭 클릭으로 섹션 3 이동', async ({ page }) => {
    await page.getByRole('button', { name: '3' }).click();
    await expect(page.getByText('사업자 규모')).toBeVisible({ timeout: 5_000 });
  });

  test('섹션 1 입력 후 다음 → 섹션 2 이동', async ({ page }) => {
    await page.getByPlaceholder('예: 행복한아침 카페').fill('테스트 회사');
    await page.getByPlaceholder('홍길동').first().fill('홍길동');
    await page.getByPlaceholder('000-00-00000').fill('1234567890');
    await page.getByRole('radio', { name: '법인' }).check();
    await page.getByRole('radio', { name: '3~7년' }).check();
    await page
      .getByPlaceholder('예: 서울특별시 강남구 테헤란로 1길 1')
      .fill('서울시 강남구');

    const nextButton = page.getByRole('button', { name: '다음' });
    await expect(nextButton).not.toBeDisabled();
    await nextButton.click();

    await expect(page.getByText('담당자 정보', { exact: true })).toBeVisible({ timeout: 5_000 });
  });
});
