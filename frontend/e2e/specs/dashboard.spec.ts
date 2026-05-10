import { test, expect } from '@playwright/test';

const MOCK_SUMMARY = {
  success: true,
  data: {
    riskCounts: { IMMEDIATE: 2, CHECK_NEEDED: 3, GOOD: 5 },
    recentItems: [
      {
        id: 'risk-1',
        title: '개인정보 처리방침 미게시',
        level: 'IMMEDIATE',
        relatedLaw: '개인정보보호법 제30조',
        resolved: false,
        description: null,
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
  error: null,
  timestamp: '',
};

test.describe('Dashboard — 리스크 관리 (모킹)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/summary', async (route) => {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_SUMMARY) });
    });
    await page.route('**/api/dashboard/growth-scenarios', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], error: null, timestamp: '' }),
      });
    });
  });

  test('리스크 목록 표시', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('개인정보 처리방침 미게시')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('개인정보보호법 제30조')).toBeVisible();
  });

  test('리스크 카운트 표시', async ({ page }) => {
    await page.goto('/dashboard');
    // riskCounts: IMMEDIATE: 2
    await expect(page.getByText('2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('"완료 처리" 클릭 → done 상태로 변경', async ({ page }) => {
    await page.route('**/api/dashboard/risks/risk-1/resolve', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'risk-1',
            title: '개인정보 처리방침 미게시',
            level: 'IMMEDIATE',
            relatedLaw: '개인정보보호법 제30조',
            resolved: true,
            description: null,
            createdAt: '',
            updatedAt: '',
          },
          error: null,
          timestamp: '',
        }),
      });
    });

    await page.goto('/dashboard');
    await expect(page.getByText('개인정보 처리방침 미게시')).toBeVisible({ timeout: 10_000 });

    // "완료 처리" 텍스트 — Dashboard.tsx line 138 확인됨
    await page.getByRole('button', { name: '완료 처리' }).first().click();

    // done: true → "완료" 텍스트로 대체
    await expect(page.getByText('완료').first()).toBeVisible({ timeout: 5_000 });
  });
});
