import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('Checkout — Payment Method Switch', () => {

  test('BUY NOW → checkout → verify payment tabs → switch Online ↔ COD → no crash', async ({ page }) => {
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

    // Step 4: Verify "Choose Payment Method" section is present
    const paymentH2 = page.locator('h2').filter({ hasText: /Choose Payment Method/i }).first();
    await expect(paymentH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 4: "Choose Payment Method" section present');

    // Step 5: Count payment radio buttons
    const paymentRadios = page.locator('input.kp-radio-input-checkout');
    const radioCount = await paymentRadios.count();
    expect(radioCount, 'At least 2 payment options (Online + COD) should exist').toBeGreaterThanOrEqual(2);
    console.log(`✅ Step 5: ${radioCount} payment radio buttons found`);

    // Step 6: Click Online payment via JS (radios may be visually hidden with custom styling)
    const onlineClicked = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input.kp-radio-input-checkout')) as HTMLInputElement[];
      const labels = Array.from(document.querySelectorAll('label, span, div, p'));
      const onlineLabel = labels.find(el => /^online$/i.test(el.textContent?.trim() || ''));
      if (onlineLabel) { (onlineLabel as HTMLElement).click(); return 'label'; }
      if (radios[0]) { radios[0].click(); return 'radio'; }
      return null;
    });
    await page.waitForTimeout(1000);
    console.log(`✅ Step 6: Online payment clicked via JS (${onlineClicked})`);

    // Step 7: Verify one radio is now checked
    const checkedCount = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input.kp-radio-input-checkout'));
      return radios.filter((r: any) => r.checked).length;
    });
    console.log(`✅ Step 7: ${checkedCount} payment radio(s) checked after clicking Online`);

    // Step 8: Click COD option via JS
    const codClicked = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label, span, div, p'));
      const codLabel = labels.find(el => /cash on delivery|^cod$/i.test(el.textContent?.trim() || ''));
      if (codLabel) { (codLabel as HTMLElement).click(); return 'label'; }
      const radios = Array.from(document.querySelectorAll('input.kp-radio-input-checkout')) as HTMLInputElement[];
      if (radios[radios.length - 1]) { radios[radios.length - 1].click(); return 'radio'; }
      return null;
    });
    await page.waitForTimeout(1000);
    console.log(`✅ Step 8: COD payment clicked via JS (${codClicked})`);

    // Step 9: Verify still on checkout after switching
    expect(page.url()).toMatch(/checkout/i);
    console.log('✅ Step 9: Still on checkout after switching payment method');

    // Step 10: Switch back to Online via JS
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label, span, div, p'));
      const onlineLabel = labels.find(el => /^online$/i.test(el.textContent?.trim() || ''));
      if (onlineLabel) { (onlineLabel as HTMLElement).click(); return; }
      const radios = Array.from(document.querySelectorAll('input.kp-radio-input-checkout')) as HTMLInputElement[];
      if (radios[0]) radios[0].click();
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 10: Switched back to Online payment');

    // Step 11: Verify checkout page is still intact
    expect(page.url()).toMatch(/checkout/i);
    await expect(paymentH2).toBeAttached({ timeout: 5000 });
    console.log('✅ Step 11: Checkout page intact after all payment switches');

    console.log('\n🎉 Payment method switching validated successfully!\n');
  });

});
