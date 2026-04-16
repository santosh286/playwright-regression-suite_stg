import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/mens-health/';

test.describe("Category — Men's Health", () => {

  test("Open Men's Health category → verify heading, product cards, names, prices, staging links", async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log("\n✅ Step 1: Homepage opened");

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log("✅ Step 2: Popup dismissed");

    // Step 3: Navigate to Men's Health category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify H1 heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/men.*health/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards — expect at least 5
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, "At least 5 product cards should be present").toBeGreaterThanOrEqual(5);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify names and prices
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => ({
        productId: card.getAttribute('data-product-id'),
        name: card.querySelector('h2')?.textContent?.trim(),
        price: Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim(),
        linkHref: card.querySelector('a[href]')?.getAttribute('href') || '',
      }));
    });

    let validCount = 0;
    for (const card of cardData) {
      const valid = (card.name?.length || 0) > 0 && /₹\d+/.test(card.price || '');
      if (valid) validCount++;
      console.log(`   ${valid ? '✅' : '❌'} [id=${card.productId}] "${card.name}" — ${card.price}`);
    }
    expect(validCount, 'All cards should have name and price').toBe(cardData.length);
    console.log(`✅ Step 6: All ${cardData.length} cards verified`);

    // Step 7: Verify all product links point to staging.kapiva.in
    const stagingLinks = cardData.filter(c => /staging\.kapiva\.in/.test(c.linkHref));
    expect(stagingLinks.length, 'All product links should be staging URLs').toBe(cardData.length);
    console.log(`✅ Step 7: All ${stagingLinks.length} links point to staging.kapiva.in`);

    console.log("\n🎉 Men's Health category validated successfully!\n");
  });

});
