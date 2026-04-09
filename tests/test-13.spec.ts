import { test, expect, devices } from '@playwright/test';

// 🔥 Use mobile device
test.use({
  ...devices['iPhone 13']
});

test('Open staging.copior.in in mobile view', async ({ page }) => {
  await page.goto('https://kapiva.in');

  

  await expect(page).toHaveURL(/kapiva/);

  await page.waitForTimeout(5000);
});
