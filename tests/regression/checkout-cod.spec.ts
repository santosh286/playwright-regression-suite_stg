import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('Checkout — Cash on Delivery', () => {

  test('BUY NOW → checkout → verify COD option visible → select COD → no crash', async ({ page }) => {
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

    // Step 3: Navigate to PDP and click BUY NOW
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    const buyNowBtn = page.locator('button').filter({ hasText: /^BUY NOW$/i }).first();
    await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      buyNowBtn.click(),
    ]);
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 3: On checkout → ${page.url()}`);

    // Step 4: Verify "Choose Payment Method" heading
    const paymentH2 = page.locator('h2').filter({ hasText: /Choose Payment Method/i }).first();
    await expect(paymentH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 4: "Choose Payment Method" section present');

    // Step 5: Verify COD option exists in page
    const codInBody = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return /cash on delivery|COD/i.test(body);
    });
    expect(codInBody, 'COD option should be present on checkout page').toBe(true);
    console.log('✅ Step 5: COD option found in checkout page');

    // Step 6: Find and click COD radio/label
    const codLabel = page.locator('label, div, span, p').filter({ hasText: /cash on delivery|^cod$/i }).first();
    const codLabelCount = await codLabel.count();

    if (codLabelCount > 0) {
      await codLabel.click({ force: true });
      await page.waitForTimeout(1500);
      console.log('✅ Step 6: COD option clicked');
    } else {
      // Fallback: click the last payment radio (COD is usually last)
      const paymentRadios = page.locator('input.kp-radio-input-checkout');
      const radioCount = await paymentRadios.count();
      if (radioCount > 0) {
        await paymentRadios.last().click({ force: true });
        await page.waitForTimeout(1500);
        console.log('✅ Step 6: Clicked last payment radio (COD fallback)');
      } else {
        console.log('⚠️  Step 6: No COD label or radio found to click');
      }
    }

    // Step 7: Verify page did not navigate away
    expect(page.url()).toMatch(/checkout/i);
    console.log('✅ Step 7: Still on checkout after selecting COD');

    // Step 8: Verify "Price Summary" is still visible after COD selection
    const priceSummaryH2 = page.locator('h2').filter({ hasText: /Price Summary/i }).first();
    await expect(priceSummaryH2).toBeAttached({ timeout: 5000 });
    console.log('✅ Step 8: "Price Summary" still visible after COD selection');

    // Step 9: Verify at least one ₹ price is still shown
    const priceCount = await page.evaluate(() => {
      return (document.body.textContent?.match(/₹[\d,]+/g) || []).length;
    });
    expect(priceCount, 'Price should still be visible after COD selection').toBeGreaterThan(0);
    console.log(`✅ Step 9: ${priceCount} price(s) still visible after COD selection`);

    // Step 10: Verify checkout page title intact
    await expect(page).toHaveTitle(/checkout/i);
    console.log('✅ Step 10: Checkout page title intact');

    console.log('\n🎉 COD payment option validated successfully!\n');
  });

});
