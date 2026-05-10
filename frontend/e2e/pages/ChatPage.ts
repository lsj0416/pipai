import { type Page, type Locator } from '@playwright/test';

export class ChatPage {
  // aria-label="채팅 입력" — Composer.tsx line 65 확인됨
  readonly chatInput: Locator;
  readonly inquiryButton: Locator;

  constructor(readonly page: Page) {
    this.chatInput = page.getByRole('textbox', { name: '채팅 입력' });
    this.inquiryButton = page.getByRole('button', { name: '문의글 자동 생성' });
  }

  async goto() {
    await this.page.goto('/chat');
  }

  async sendMessage(text: string) {
    await this.chatInput.fill(text);
    await this.chatInput.press('Enter');
  }

  // SSE 완료 감지: Topbar status가 '응답 중...' → '진행 중'으로 변경될 때
  async waitForStreamingComplete(timeout = 60_000) {
    await this.page.getByText('진행 중').waitFor({ state: 'visible', timeout });
  }
}
