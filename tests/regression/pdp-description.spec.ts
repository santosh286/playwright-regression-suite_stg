import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Product Description & Pricing', () => {

  test('Open PDP → close popup → verify name, price, MRP, description', async ({ page }) => {
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
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Verify product name (H1) is visible and non-empty
    const productName = page.locator('h1').first();
    await expect(productName).toBeVisible({ timeout: 10000 });
    const nameText = await productName.innerText();
    expect(nameText.trim().length, 'Product name should not be empty').toBeGreaterThan(0);
    console.log(`✅ Step 4: Product name — "${nameText.trim()}"`);

    // Step 5: Verify current price is visible and contains ₹
    const currentPrice = page.locator('span[class*="font-black"]').filter({ hasText: /₹/ }).first();
    await expect(currentPrice).toBeVisible({ timeout: 10000 });
    const priceText = await currentPrice.innerText();
    expect(priceText).toMatch(/₹\d+/);
    console.log(`✅ Step 5: Current price — "${priceText.trim()}"`);

    // Step 6: Verify MRP (strikethrough) is visible
    const mrp = page.locator('span[class*="line-through"]').filter({ hasText: /₹/ }).first();
    await expect(mrp).toBeVisible({ timeout: 10000 });
    const mrpText = await mrp.innerText();
    expect(mrpText).toMatch(/₹\d+/);
    console.log(`✅ Step 6: MRP (strikethrough) — "${mrpText.trim()}"`);

    // Step 7: Verify description section is visible and has text
    const description = page.locator('[class*="description" i]').first();
    await expect(description).toBeVisible({ timeout: 10000 });
    const descText = await description.innerText();
    expect(descText.trim().length, 'Description should not be empty').toBeGreaterThan(10);
    console.log(`✅ Step 7: Description visible — "${descText.trim().slice(0, 60)}..."`);

    console.log('\n🎉 PDP description & pricing validated successfully!\n');
  });

});
