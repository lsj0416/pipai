import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly resolveButtons: Locator;

  constructor(readonly page: Page) {
    // "완료 처리" 텍스트 — Dashboard.tsx line 138 확인됨
    this.resolveButtons = page.getByRole('button', { name: '완료 처리' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }
}
