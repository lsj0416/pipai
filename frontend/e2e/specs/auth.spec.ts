import { test, expect } from '@playwright/test';
import { generateTestEmail } from '../fixtures/helpers';
import { LoginPage } from '../pages/LoginPage';

// auth-flows 프로젝트: storageState 없이 실행

test.describe('Auth Flows', () => {
  test('회원가입 성공 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/signup');
    await page.getByPlaceholder('이름').fill('테스트 사용자');
    await page.getByPlaceholder('이메일').fill(generateTestEmail());
    await page.getByPlaceholder('비밀번호').fill('TestPass1234!');
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page).toHaveURL('/login', { timeout: 10_000 });
  });

  test('로그인 성공 → /chat 이동 + localStorage token 저장', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPass1234!';

    await page.request.post('/api/auth/signup', { data: { email, password, name: '로그인 테스트' } });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    await expect(page).toHaveURL('/chat', { timeout: 15_000 });
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('잘못된 비밀번호 → 에러 메시지 표시', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await expect(
      page.getByText(/로그인에 실패|서버에 연결|이메일 또는 비밀번호/),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('미인증 상태 /chat 접근 → /login 리다이렉트', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL('/login', { timeout: 10_000 });
  });

  test('로그아웃 → localStorage null + /login 이동', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPass1234!';
    await page.request.post('/api/auth/signup', { data: { email, password, name: '로그아웃 테스트' } });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
    await expect(page).toHaveURL('/chat', { timeout: 15_000 });

    // Sidebar 로그아웃 버튼 (SVG title="로그아웃")
    await page.getByTitle('로그아웃').click();
    await expect(page).toHaveURL('/login', { timeout: 10_000 });
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
  });
});
