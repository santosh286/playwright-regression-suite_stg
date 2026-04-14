import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const BASE_URL = 'https://staging.kapiva.in';
const SEARCH_KEYWORDS = ['sips', 'shilajit', 'energy', 'juice'];

test('Search should show related products', async ({ page }) => {
  await navigateTo(page, BASE_URL, { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);

  const searchBox = page.locator('#search-box');
  const productCards = page.locator('[data-product-id]');

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`\n🔍 Searching: "${keyword}"`);

    await expect(searchBox).toBeVisible();
    await searchBox.fill('');
    await searchBox.fill(keyword);
    await searchBox.press('Enter');

    await page.waitForURL(/search\?q=/, { timeout: 10000 });
    await productCards.first().waitFor({ state: 'attached', timeout: 10000 });

    // Wait for at least one visible product
    await expect.poll(async () => {
      const count = await productCards.count();
      for (let i = 0; i < count; i++) {
        if (await productCards.nth(i).isVisible()) return true;
      }
      return false;
    }, { timeout: 10000, message: 'No visible products found' }).toBe(true);

    // Count visible products
    const totalCards = await productCards.count();
    let visibleCount = 0;
    for (let i = 0; i < totalCards; i++) {
      if (await productCards.nth(i).isVisible()) visibleCount++;
    }

    console.log(`  ✅ "${keyword}" → ${visibleCount} products found`);
    expect(visibleCount).toBeGreaterThan(0);
  }
});
