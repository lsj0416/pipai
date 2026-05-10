import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(readonly page: Page) {
    this.emailInput = page.getByPlaceholder('이메일');
    this.passwordInput = page.getByPlaceholder('비밀번호');
    this.submitButton = page.getByRole('button', { name: '로그인' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
