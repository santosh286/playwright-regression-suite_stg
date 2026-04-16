import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Cart — Sidebar Validation', () => {

  test('Add item → open cart sidebar → verify heading, product, price, CHECKOUT button', async ({ page }) => {
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
    await navigateTo(page, 'https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      for (let y = 0; y < 2500; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Gym listing loaded');

    // Step 4: Click ATC on Shilajit card
    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });
    const atcBtn = shilajitCard.locator('button').filter({ has: page.locator('svg') }).first();
    await atcBtn.waitFor({ state: 'visible', timeout: 5000 });
    await atcBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Step 4: ADD TO CART clicked');

    // Step 5: Click cart button to open sidebar
    const cartBtn = page.locator('header button').filter({ hasText: /^\d+$/ }).first();
    await cartBtn.waitFor({ state: 'visible', timeout: 5000 });
    const cartCount = parseInt(await cartBtn.innerText(), 10);
    expect(cartCount).toBeGreaterThan(0);
    await cartBtn.click();
    await page.waitForTimeout(2000);
    console.log(`✅ Step 5: Cart button clicked (count: ${cartCount})`);

    // Step 6: Verify cart panel is visible
    const cartPanel = page.locator('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]').first();
    await cartPanel.waitFor({ state: 'attached', timeout: 10000 });
    console.log('✅ Step 6: Cart sidebar panel is open');

    // Step 7: Verify "Your Cart" heading inside panel
    const cartHtml = await cartPanel.innerHTML();
    expect(cartHtml, 'Cart panel should contain "Your Cart"').toMatch(/Your Cart/i);
    console.log('✅ Step 7: "Your Cart" heading verified');

    // Step 8: Verify product name visible in cart
    const hasProduct = /shilajit gold resin/i.test(cartHtml);
    expect(hasProduct, 'Shilajit Gold Resin should appear in cart').toBe(true);
    console.log('✅ Step 8: Product name "Shilajit Gold Resin" found in cart');

    // Step 9: Verify price (₹) is shown in cart
    const hasPrice = /₹\d+/.test(cartHtml);
    expect(hasPrice, 'Price with ₹ symbol should be in cart').toBe(true);
    console.log('✅ Step 9: Price (₹) verified in cart');

    // Step 10: Verify CHECKOUT button is visible
    const checkoutBtn = cartPanel.locator('button').filter({ hasText: /^CHECKOUT$/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Step 10: CHECKOUT button is visible');

    console.log('\n🎉 Cart sidebar validated successfully!\n');
  });

});
