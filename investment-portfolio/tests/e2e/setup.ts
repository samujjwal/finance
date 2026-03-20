import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication
  await page.goto('http://localhost:1420');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await expect(page.locator('text:has-text("JCL Investment Portfolio")')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
