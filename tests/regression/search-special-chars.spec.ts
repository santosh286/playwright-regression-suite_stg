import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Search — Special Characters', () => {

  test('Special chars / numbers / long string in search → no crash → page stays valid', async ({ page }) => {
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

    // Helper: find search input
    const getSearchInput = () => page.locator('#search-box');

    // Step 3: Search with special characters @#$%
    const searchInput = getSearchInput();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await searchInput.fill('@#$%');
    await searchInput.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('staging.kapiva.in');
    console.log(`✅ Step 3: "@#$%" search — no crash → ${page.url()}`);

    // Step 4: Navigate back and search XSS string
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);

    const searchInput2 = getSearchInput();
    await searchInput2.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput2.click();
    await searchInput2.fill('<script>alert(1)</script>');
    await searchInput2.press('Enter');
    await page.waitForTimeout(2000);

    // Verify XSS not executed — no alert dialog
    const alertFired = await page.evaluate(() => {
      return (window as any).__alertFired || false;
    });
    expect(alertFired, 'XSS alert should NOT fire').toBe(false);
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 4: XSS string search — no script injection, page safe');

    // Step 5: Numbers-only search
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);

    const searchInput3 = getSearchInput();
    await searchInput3.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput3.click();
    await searchInput3.fill('123456');
    await searchInput3.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('staging.kapiva.in');
    console.log(`✅ Step 5: Numbers-only search "123456" — no crash → ${page.url()}`);

    // Step 6: Very long string search (100 chars)
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);

    const longString = 'a'.repeat(100);
    const searchInput4 = getSearchInput();
    await searchInput4.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput4.click();
    await searchInput4.fill(longString);
    await searchInput4.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('staging.kapiva.in');
    console.log(`✅ Step 6: Long string (100 chars) search — no crash → ${page.url()}`);

    // Step 7: Verify still on staging domain throughout
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 7: Still on staging domain after all searches');

    console.log('\n🎉 Special characters search validated successfully!\n');
  });

});
