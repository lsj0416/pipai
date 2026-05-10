import { test as setup, expect } from '@playwright/test';
import { generateTestEmail } from './helpers';

setup('create test user and login', async ({ page, request }) => {
  const email = generateTestEmail();
  const password = 'TestPass1234!';

  // Step 1: API 직접 호출로 사용자 생성 (UI 우회)
  const signupRes = await request.post('/api/auth/signup', {
    data: { email, password, name: 'E2E User' },
  });
  const signupBody = await signupRes.json() as { success: boolean; error?: { code?: string } };
  if (!signupRes.ok() && signupBody?.error?.code !== 'DUPLICATE_EMAIL') {
    throw new Error(`Signup failed: ${JSON.stringify(signupBody)}`);
  }

  // Step 2: 로그인 UI → httpOnly 쿠키 + localStorage 동시 획득
  await page.goto('/login');
  await page.getByPlaceholder('이메일').fill(email);
  await page.getByPlaceholder('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL('/chat', { timeout: 15_000 });

  // Step 3: storageState 저장 (httpOnly 쿠키 + localStorage 포함)
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
