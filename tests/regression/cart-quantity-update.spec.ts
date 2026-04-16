import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Cart — Quantity Update', () => {

  test('Add item → open cart → click + → quantity becomes 2 → cart count updates', async ({ page }) => {
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

    // Step 3: Go to gym listing and scroll to product card
    await navigateTo(page, 'https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      for (let y = 0; y < 2500; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Gym listing loaded and scrolled');

    // Step 4: Click ATC on Shilajit card
    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });
    const atcBtn = shilajitCard.locator('button').filter({ has: page.locator('svg') }).first();
    await atcBtn.waitFor({ state: 'visible', timeout: 5000 });
    await atcBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Step 4: ADD TO CART clicked on product card');

    // Step 5: Verify cart count = 1
    const cartBtn = page.locator('header button').filter({ hasText: /^\d+$/ }).first();
    await cartBtn.waitFor({ state: 'visible', timeout: 5000 });
    const initialCount = parseInt(await cartBtn.innerText(), 10);
    expect(initialCount).toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 5: Cart count = ${initialCount}`);

    // Step 6: Open cart panel
    await cartBtn.click();
    await page.waitForTimeout(2000);
    const cartPanel = page.locator('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]').first();
    await cartPanel.waitFor({ state: 'attached', timeout: 10000 });
    console.log('✅ Step 6: Cart panel opened');

    // Step 7: Click + (plus) button to increase quantity
    const plusBtn = cartPanel.locator('button[class*="pr-0.5"][class*="cursor-pointer"]').first();
    await plusBtn.waitFor({ state: 'attached', timeout: 5000 });
    await plusBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Step 7: Clicked + button to increase quantity');

    // Step 8: Verify cart count in header updated to 2
    await expect.poll(async () => parseInt(await cartBtn.innerText(), 10), { timeout: 10000 })
      .toBeGreaterThan(initialCount);
    const newCount = parseInt(await cartBtn.innerText(), 10);
    console.log(`✅ Step 8: Cart count updated — ${initialCount} → ${newCount}`);
    expect(newCount).toBe(initialCount + 1);

    console.log('\n🎉 Cart quantity update validated successfully!\n');
  });

});
