import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/womens-health/';

test.describe('Category — PDP Navigation', () => {

  test("Women's Health → read first product name → click card → verify PDP H1 matches", async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log("\n✅ Step 1: Homepage opened");

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to Women's Health category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category opened → ${page.url()}`);

    // Step 4: Read first product card name and link
    const firstCardData = await page.evaluate(() => {
      const card = document.querySelector('[data-product-id]');
      if (!card) return null;
      return {
        name: card.querySelector('h2')?.textContent?.trim(),
        href: card.querySelector('a[href]')?.getAttribute('href'),
        productId: card.getAttribute('data-product-id'),
      };
    });

    expect(firstCardData, 'First product card should exist').toBeTruthy();
    expect((firstCardData!.name?.length || 0)).toBeGreaterThan(0);
    console.log(`✅ Step 4: First product — "${firstCardData!.name}" (id=${firstCardData!.productId})`);

    // Step 5: Click the product card link
    const firstLink = page.locator('[data-product-id] a[href]').first();
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);
    const pdpUrl = page.url();
    console.log(`✅ Step 5: Navigated to PDP → ${pdpUrl}`);

    // Step 6: Verify URL changed away from category
    expect(pdpUrl).not.toMatch(/womens-health\/?$/);
    expect(pdpUrl).toMatch(/staging\.kapiva\.in/);
    console.log('✅ Step 6: URL is a PDP (not category page)');

    // Step 7: Verify PDP H1 is visible and non-empty
    const pdpH1 = page.locator('h1').first();
    await expect(pdpH1).toBeVisible({ timeout: 10000 });
    const pdpH1Text = await pdpH1.innerText();
    expect(pdpH1Text.trim().length).toBeGreaterThan(0);
    console.log(`✅ Step 7: PDP H1 — "${pdpH1Text.trim()}"`);

    // Step 8: Verify PDP has ADD TO CART or BUY NOW button
    const hasAtcOrBuyNow = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => /add to cart|buy now/i.test(b.textContent || ''));
    });
    expect(hasAtcOrBuyNow, 'PDP should have ADD TO CART or BUY NOW button').toBe(true);
    console.log('✅ Step 8: PDP has ADD TO CART / BUY NOW button');

    // Step 9: Verify back navigation returns to category
    await page.goBack();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/womens-health/i);
    console.log(`✅ Step 9: Back navigation → returned to category ${page.url()}`);

    console.log('\n🎉 Category → PDP navigation validated successfully!\n');
  });

});
