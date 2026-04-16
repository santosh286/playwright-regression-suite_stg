import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Header Validation', () => {

  test('Open homepage → close popup → verify header elements', async ({ page }) => {
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

    // Step 3: Verify Kapiva logo is visible
    // There are 2 kapiavlogo images with responsive breakpoint classes — check at least one is visible
    const logoVisible = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src*="kapiavlogo"]'));
      return imgs.some(img => {
        const el = img as HTMLImageElement;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
    });
    expect(logoVisible, 'Kapiva logo (kapiavlogo img) should be visible on the page').toBe(true);
    console.log('✅ Step 3: Kapiva logo is visible');

    // Step 4: Verify search bar is visible — input has bg-transparent class (no type="search" or placeholder)
    const searchBar = page.locator('input[class*="bg-transparent"]').first();
    await expect(searchBar).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 4: Search bar is visible');

    // Step 5: Verify LOGIN button is visible
    const loginBtn = page.locator('button, a').filter({ hasText: /^LOGIN$/i }).first();
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 5: LOGIN button is visible');

    // Step 6: Verify Cart count button is visible — shows item count (e.g. "0") with transition-colors class
    const cartBtn = page.locator('button[class*="transition-colors"]').filter({ hasText: /^\d+$/ }).first();
    await expect(cartBtn).toBeVisible({ timeout: 10000 });
    const cartCount = await cartBtn.innerText();
    console.log(`✅ Step 6: Cart button visible — count: "${cartCount}"`);

    // Step 7: Verify at least 1 nav/header link exists
    const navLinks = page.locator('nav a[href], header a[href]');
    const navCount = await navLinks.count();
    expect(navCount, 'Should have at least 1 navigation link in header').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 7: ${navCount} navigation link(s) found in header`);

    console.log('\n🎉 Header validation passed successfully!\n');
  });

});
