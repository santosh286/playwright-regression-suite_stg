import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const LISTING_URL = 'https://staging.kapiva.in/solution/gym-fitness/';

test.describe('Cart — Checkout Redirect', () => {

  test('Add item → open cart → click CHECKOUT → verify checkout page loads', async ({ page }) => {
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

    // Step 3: Go to gym listing and scroll
    await navigateTo(page, LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      for (let y = 0; y < 2500; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Gym listing loaded');

    // Step 4: Add item to cart
    const card = page.locator('[data-product-id="1405"]').first();
    await card.waitFor({ state: 'attached', timeout: 10000 });
    const atcBtn = card.locator('button').filter({ has: page.locator('svg') }).first();
    await atcBtn.waitFor({ state: 'visible', timeout: 5000 });
    await atcBtn.click({ force: true });
    await page.waitForTimeout(2000);

    const cartBtn = page.locator('header button').filter({ hasText: /^\d+$/ }).first();
    await cartBtn.waitFor({ state: 'visible', timeout: 5000 });
    const cartCount = parseInt(await cartBtn.innerText(), 10);
    expect(cartCount).toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 4: Item added — cart count = ${cartCount}`);

    // Step 5: Open cart panel
    await cartBtn.click();
    await page.waitForTimeout(2000);
    const cartPanel = page.locator('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]').first();
    await cartPanel.waitFor({ state: 'attached', timeout: 10000 });
    const panelHtml = await cartPanel.innerHTML();
    expect(panelHtml).toMatch(/Your Cart/i);
    console.log('✅ Step 5: Cart panel opened with "Your Cart" heading');

    // Step 6: Verify CHECKOUT button is visible inside panel
    const checkoutBtn = cartPanel.locator('button').filter({ hasText: /^CHECKOUT$/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 6: CHECKOUT button is visible in cart panel');

    // Step 7: Click CHECKOUT and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
      checkoutBtn.click(),
    ]);
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log(`✅ Step 7: CHECKOUT clicked → navigated to ${finalUrl}`);

    // Step 8: Verify URL is checkout page
    expect(finalUrl, `Expected checkout URL, got: ${finalUrl}`).toMatch(/checkout/i);
    console.log('✅ Step 8: URL confirmed as checkout page');

    // Step 9: Verify page title is Checkout
    await expect(page).toHaveTitle(/checkout/i);
    console.log('✅ Step 9: Page title = "Checkout"');

    // Step 10: Verify checkout page has expected content
    const checkoutH1 = page.locator('h1').filter({ hasText: /checkout/i }).first();
    await expect(checkoutH1).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 10: Checkout H1 heading verified');

    console.log('\n🎉 Cart → Checkout redirect validated successfully!\n');
  });

});
