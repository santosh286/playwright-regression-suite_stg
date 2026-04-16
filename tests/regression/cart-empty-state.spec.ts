import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Cart — Empty State', () => {

  test('Open cart with 0 items → verify empty message → close panel', async ({ page }) => {
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

    // Step 3: Verify cart count is 0
    const cartBtn = page.locator('header button').filter({ hasText: /^0$/ }).first();
    await expect(cartBtn).toBeVisible({ timeout: 10000 });
    const count = await cartBtn.innerText();
    expect(count.trim()).toBe('0');
    console.log(`✅ Step 3: Cart count verified = ${count.trim()}`);

    // Step 4: Click cart button to open panel
    await cartBtn.click();
    await page.waitForTimeout(2000);
    const cartPanel = page.locator('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]').first();
    await cartPanel.waitFor({ state: 'attached', timeout: 10000 });
    console.log('✅ Step 4: Cart panel opened');

    // Step 5: Verify "Your cart is empty" message in panel
    const panelHtml = await cartPanel.innerHTML();
    expect(panelHtml, 'Cart panel should show empty cart message').toMatch(/your cart is empty/i);
    console.log('✅ Step 5: "Your cart is empty" message verified');

    // Step 6: Verify "Shop now" or fill message is present
    expect(panelHtml).toMatch(/shop now|fill it with|products/i);
    console.log('✅ Step 6: "Shop now / Fill it with our products" text verified');

    // Step 7: Verify close button exists
    const closeBtn = cartPanel.locator('button.cursor-pointer').first();
    await expect(closeBtn).toBeAttached({ timeout: 5000 });
    console.log('✅ Step 7: Close button found in panel');

    // Step 8: Click close button → panel should disappear
    await closeBtn.click();
    await page.waitForTimeout(1000);
    const panelGone = await page.evaluate(() => {
      const panel = document.querySelector('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]');
      if (!panel) return true;
      const style = window.getComputedStyle(panel);
      return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
    });
    expect(panelGone, 'Cart panel should close after clicking close button').toBe(true);
    console.log('✅ Step 8: Cart panel closed successfully');

    console.log('\n🎉 Cart empty state validated successfully!\n');
  });

});
