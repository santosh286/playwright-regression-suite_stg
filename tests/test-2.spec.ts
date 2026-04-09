import { test, expect } from '@playwright/test';

const searchKeywords = ['sips', 'shilajit', 'energy', 'juice'];
const baseUrl = 'https://kapiva.in';

test('Search should show related products and capture product URLs', async ({ page }) => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  for (const keyword of searchKeywords) {
    console.log(`\n🔍 Searching for: ${keyword}`);

    // Search
    const searchBox = page.locator('#search-box');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('');
    await searchBox.fill(keyword);
    await searchBox.press('Enter');

    // Wait for search results page
    await page.waitForURL(/search\?q=/, { timeout: 10000 });

    const productCards = page.locator('[data-product-id]');
    await productCards.first().waitFor({ state: 'attached', timeout: 10000 });

    const totalCards = await productCards.count();

    let visibleCount = 0;
    const visibleProductUrls: string[] = [];

    for (let i = 0; i < totalCards; i++) {
      const card = productCards.nth(i);

      if (await card.isVisible()) {
        visibleCount++;

        const productLink = card.locator('a[href]').first();
        const href = await productLink.getAttribute('href');

        if (href) {
          const productUrl = href.startsWith('http')
            ? href
            : `${baseUrl}${href}`;

          visibleProductUrls.push(productUrl);
        }
      }
    }

    // ✅ This is the REAL business assertion
    expect(visibleCount).toBeGreaterThan(0);

    console.log(`📦 Current Products found (VISIBLE): ${visibleCount}`);

    // Print first 3 product URLs only
    visibleProductUrls.slice(0, 3).forEach(url => {
      console.log(`➡ Product URL: ${url}`);
    });
  }
});
