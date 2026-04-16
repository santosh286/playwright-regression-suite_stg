import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const LISTING_URL = 'https://staging.kapiva.in/solution/gym-fitness/';

test.describe('Cart — Multiple Items', () => {

  test('Add 2 different products → open cart → verify both items appear in cart', async ({ page }) => {
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

    // Step 3: Go to gym listing and scroll to product cards
    await navigateTo(page, LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      for (let y = 0; y < 2500; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Gym listing loaded and scrolled');

    // Step 4: Read first 2 product card names, then add item 1
    const allCards = page.locator('[data-product-id]');
    await allCards.first().waitFor({ state: 'attached', timeout: 10000 });
    const totalCards = await allCards.count();
    expect(totalCards, 'Need at least 2 product cards').toBeGreaterThanOrEqual(2);

    const item1Name = await allCards.nth(0).locator('h2').first().innerText().catch(() => 'Item 1');
    const atcBtn1 = allCards.nth(0).locator('button').filter({ has: page.locator('svg') }).first();
    await atcBtn1.waitFor({ state: 'visible', timeout: 5000 });
    await atcBtn1.click({ force: true });
    await page.waitForTimeout(2000);

    const cartBtn = page.locator('header button').filter({ hasText: /^\d+$/ }).first();
    await cartBtn.waitFor({ state: 'visible', timeout: 5000 });
    const countAfter1 = parseInt(await cartBtn.innerText(), 10);
    expect(countAfter1).toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 4: Item 1 added — "${item1Name.trim()}" — cart count = ${countAfter1}`);

    // Step 5: Add item 2 from second card on the same listing page
    const item2Name = await allCards.nth(1).locator('h2').first().innerText().catch(() => 'Item 2');
    const atcBtn2 = allCards.nth(1).locator('button').filter({ has: page.locator('svg') }).first();
    await atcBtn2.waitFor({ state: 'visible', timeout: 5000 });
    await atcBtn2.click({ force: true });
    await page.waitForTimeout(2000);

    const countAfter2 = parseInt(await cartBtn.innerText(), 10);
    expect(countAfter2).toBeGreaterThan(countAfter1);
    console.log(`✅ Step 5: Item 2 added — "${item2Name.trim()}" — cart count = ${countAfter2}`);

    // Step 6: Open cart panel
    await cartBtn.click();
    await page.waitForTimeout(2000);
    const cartPanel = page.locator('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]').first();
    await cartPanel.waitFor({ state: 'attached', timeout: 10000 });
    console.log('✅ Step 6: Cart panel opened');

    // Step 7: Verify first product is in cart
    const panelHtml = await cartPanel.innerHTML();
    const hasItem1 = new RegExp(item1Name.trim().slice(0, 15), 'i').test(panelHtml);
    expect(hasItem1, `"${item1Name.trim()}" should appear in cart`).toBe(true);
    console.log(`✅ Step 7: "${item1Name.trim()}" found in cart`);

    // Step 8: Verify second product is in cart
    const hasItem2 = new RegExp(item2Name.trim().slice(0, 15), 'i').test(panelHtml);
    expect(hasItem2, `"${item2Name.trim()}" should appear in cart`).toBe(true);
    console.log(`✅ Step 8: "${item2Name.trim()}" found in cart`);

    // Step 9: Verify CHECKOUT button is visible with 2 items
    const checkoutBtn = cartPanel.locator('button').filter({ hasText: /^CHECKOUT$/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 9: CHECKOUT button visible with 2 items in cart');

    console.log('\n🎉 Multiple items in cart validated successfully!\n');
  });

});
