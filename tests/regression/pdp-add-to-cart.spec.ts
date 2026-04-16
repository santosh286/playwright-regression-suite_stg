import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Add To Cart', () => {

  test('Open PDP → close popup → click ADD TO CART → verify cart count increments', async ({ page }) => {
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

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Read initial cart count (should be 0)
    const cartBtn = page.locator('button[class*="transition-colors"]').filter({ hasText: /^\d+$/ }).first();
    await expect(cartBtn).toBeVisible({ timeout: 10000 });
    const initialCount = parseInt(await cartBtn.innerText(), 10);
    console.log(`✅ Step 4: Initial cart count — ${initialCount}`);

    // Step 5: Verify ADD TO CART button is visible
    const addToCartBtn = page.locator('button').filter({ hasText: /^ADD TO CART$/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 5: ADD TO CART button is visible');

    // Step 6: Click ADD TO CART
    await addToCartBtn.click();
    console.log('✅ Step 6: ADD TO CART clicked');

    // Step 7: Wait for cart count to increment (poll up to 10s)
    await expect(cartBtn).toBeVisible({ timeout: 10000 });
    await expect.poll(async () => parseInt(await cartBtn.innerText(), 10), { timeout: 10000 })
      .toBeGreaterThan(initialCount);
    const newCount = parseInt(await cartBtn.innerText(), 10);
    console.log(`✅ Step 7: Cart count updated — ${initialCount} → ${newCount}`);

    console.log('\n🎉 Add to Cart flow validated successfully!\n');
  });

});
