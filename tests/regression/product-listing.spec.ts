import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/gym-foods/';

test.describe('Product Listing Page Validation', () => {

  test('Open homepage → close popup → navigate to category → verify product cards', async ({ page }) => {
    test.setTimeout(120000);

    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to category/solution page
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveURL(/solution/);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify page heading is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    const headingText = await heading.innerText().catch(() => '');
    console.log(`✅ Step 4: Page heading visible — "${headingText.trim()}"`);

    // Step 5: Scroll to trigger lazy load of product cards
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    console.log('✅ Step 5: Page scrolled to trigger lazy load');

    // Step 6: Verify product links are rendered
    // Product cards are <a> links with class containing "hover:text-inherit" pointing to product URLs
    const productCards = page.locator('a[class*="hover:text-inherit"][href*="staging.kapiva.in"]');
    const cardCount = await productCards.count();
    expect(cardCount, 'Should have at least 1 product card on the listing page').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 6: ${cardCount} product card(s) found`);

    // Step 7: Verify first 5 cards each have image and price (₹)
    const maxCheck = Math.min(cardCount, 5);
    let passCount = 0;

    for (let i = 0; i < maxCheck; i++) {
      const card = productCards.nth(i);

      const img = card.locator('img').first();
      const hasImg = await img.isVisible({ timeout: 3000 }).catch(() => false);
      const imgSrc = hasImg ? await img.getAttribute('src') ?? '' : '';

      // Price: span containing ₹ symbol
      const priceSpan = card.locator('span').filter({ hasText: /₹/ }).first();
      const hasPrice = await priceSpan.isVisible({ timeout: 3000 }).catch(() => false);
      const priceText = hasPrice ? await priceSpan.innerText().catch(() => '') : '';

      const passed = hasImg && imgSrc !== '' && hasPrice;
      if (passed) passCount++;

      console.log(`   Card [${i + 1}]: img=${hasImg ? '✅' : '❌'} | price="${priceText.trim()}" ${hasPrice ? '✅' : '❌'}`);
    }

    expect(passCount, `All ${maxCheck} checked product cards should have image and price`).toBe(maxCheck);
    console.log(`✅ Step 7: ${passCount}/${maxCheck} cards verified with image & price`);

    console.log('\n🎉 Product listing page validated successfully!\n');
  });

});
