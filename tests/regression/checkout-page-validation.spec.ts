import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('Checkout — Page Validation', () => {

  test('BUY NOW → checkout → verify phone step, order summary, payment methods, price summary', async ({ page }) => {
    test.setTimeout(120000);

    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Click BUY NOW and wait for checkout navigation
    const buyNowBtn = page.locator('button').filter({ hasText: /^BUY NOW$/i }).first();
    await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      buyNowBtn.click(),
    ]);
    await page.waitForTimeout(2000);
    const checkoutUrl = page.url();
    expect(checkoutUrl).toMatch(/checkout/i);
    console.log(`✅ Step 4: Navigated to checkout → ${checkoutUrl}`);

    // Step 5: Verify page title is "Checkout"
    await expect(page).toHaveTitle(/checkout/i);
    console.log('✅ Step 5: Page title is "Checkout"');

    // Step 6: Verify "Verify your number to proceed" heading
    const verifyHeading = page.locator('h3').filter({ hasText: /verify your number/i }).first();
    await expect(verifyHeading).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 6: "Verify your number to proceed" heading visible');

    // Step 7: Verify phone input is visible
    const phoneInput = page.locator('input[placeholder="Phone No."]').first();
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 7: Phone number input field is visible');

    // Step 8: Verify Order Summary section
    const orderSummaryH2 = page.locator('h2').filter({ hasText: /Order Summary/i }).first();
    await expect(orderSummaryH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 8: "Order Summary" section present');

    // Step 9: Verify Choose Payment Method section
    const paymentH2 = page.locator('h2').filter({ hasText: /Choose Payment Method/i }).first();
    await expect(paymentH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 9: "Choose Payment Method" section present');

    // Step 10: Verify payment radio buttons (Online and COD)
    const paymentRadios = page.locator('input.kp-radio-input-checkout');
    const radioCount = await paymentRadios.count();
    expect(radioCount, 'Online and COD radio buttons should exist').toBeGreaterThanOrEqual(2);
    console.log(`✅ Step 10: ${radioCount} payment method radio buttons found`);

    // Step 11: Verify Price Summary section
    const priceSummaryH2 = page.locator('h2').filter({ hasText: /Price Summary/i }).first();
    await expect(priceSummaryH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 11: "Price Summary" section present');

    console.log('\n🎉 Checkout page structure validated successfully!\n');
  });

});
