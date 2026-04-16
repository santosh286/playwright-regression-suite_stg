import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Buy Now', () => {

  test('Open PDP → close popup → verify BUY NOW button → click → verify checkout redirect', async ({ page }) => {
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

    // Step 4: Verify product name is visible (confirms PDP loaded correctly)
    const productName = page.locator('h1').first();
    await expect(productName).toBeVisible({ timeout: 10000 });
    const nameText = await productName.innerText();
    console.log(`✅ Step 4: Product loaded — "${nameText.trim()}"`);

    // Step 5: Verify BUY NOW button is visible
    const buyNowBtn = page.locator('button').filter({ hasText: /^BUY NOW$/i }).first();
    await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 5: BUY NOW button is visible');

    // Step 6: Click BUY NOW and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      buyNowBtn.click(),
    ]);
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log(`✅ Step 6: BUY NOW clicked → navigated to ${finalUrl}`);

    // Step 7: Verify redirected to checkout or cart or login (not same PDP page)
    const isCheckoutOrCart = /checkout|cart|login|account/i.test(finalUrl);
    expect(isCheckoutOrCart, `Expected checkout/cart/login URL after BUY NOW. Got: ${finalUrl}`).toBe(true);
    console.log(`✅ Step 7: Redirected correctly — ${finalUrl}`);

    console.log('\n🎉 BUY NOW flow validated successfully!\n');
  });

});
