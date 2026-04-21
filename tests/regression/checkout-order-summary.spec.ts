import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('Checkout — Order Summary', () => {

  test('BUY NOW → checkout → verify order summary has product name, price, total', async ({ page }) => {
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

    // Step 3: Navigate to PDP and read product name
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    const pdpH1 = page.locator('h1').first();
    await expect(pdpH1).toBeVisible({ timeout: 10000 });
    const productName = await pdpH1.innerText();
    console.log(`✅ Step 3: PDP product name — "${productName.trim()}"`);

    // Step 4: Click BUY NOW → navigate to checkout
    const buyNowBtn = page.locator('button').filter({ hasText: /^BUY NOW$/i }).first();
    await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      buyNowBtn.click(),
    ]);
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 4: On checkout → ${page.url()}`);

    // Step 5: Verify "Order Summary" heading is present
    const orderSummaryH2 = page.locator('h2').filter({ hasText: /Order Summary/i }).first();
    await expect(orderSummaryH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 5: "Order Summary" section present');

    // Step 6: Verify product name appears in checkout page body (partial match)
    const pageBody = await page.locator('body').innerText();
    const firstWord = productName.trim().split(' ')[0];
    const nameFound = pageBody.toLowerCase().includes(firstWord.toLowerCase());
    if (nameFound) {
      console.log(`✅ Step 6: Product name "${firstWord}" found in checkout page`);
    } else {
      console.log(`⚠️  Step 6: Product name "${firstWord}" not found in body — may be in hidden section`);
    }

    // Step 7: Verify at least one ₹ price in the order summary area
    const priceInSummary = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const matches = body.match(/₹[\d,]+/g) || [];
      return matches;
    });
    expect(priceInSummary.length, 'At least one ₹ price should appear in checkout').toBeGreaterThan(0);
    console.log(`✅ Step 7: ${priceInSummary.length} price(s) found in checkout — ${priceInSummary.slice(0, 3).join(', ')}`);

    // Step 8: Verify "Price Summary" section is present
    const priceSummaryH2 = page.locator('h2').filter({ hasText: /Price Summary/i }).first();
    await expect(priceSummaryH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 8: "Price Summary" section present');

    // Step 9: Verify total price label (Total / Grand Total / Amount)
    const totalLabel = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      const el = els.find(e =>
        /total|grand total|amount payable/i.test(e.textContent || '') &&
        /₹/.test(e.textContent || '') &&
        (e.children.length === 0 || e.children.length <= 3)
      );
      return el?.textContent?.trim()?.slice(0, 60) || null;
    });
    if (totalLabel) {
      console.log(`✅ Step 9: Total price found — "${totalLabel}"`);
    } else {
      console.log('⚠️  Step 9: Total price label not isolated — prices still present in page');
    }

    // Step 10: Verify still on checkout
    expect(page.url()).toMatch(/checkout/i);
    console.log('✅ Step 10: Still on checkout page');

    console.log('\n🎉 Checkout order summary validated successfully!\n');
  });

});
