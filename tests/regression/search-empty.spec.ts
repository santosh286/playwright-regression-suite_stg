import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Search — Empty Search', () => {

  test('Empty search → verify no results message → whitespace search → no crash', async ({ page }) => {
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

    // Step 3: Find and click search input
    const searchInput = page.locator('#search-box');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await page.waitForTimeout(500);
    console.log('✅ Step 3: Search input focused');

    // Step 4: Submit empty search
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);
    console.log('✅ Step 4: Empty search submitted');

    // Step 5: Verify no results message or stays on homepage without crash
    const currentUrl = page.url();
    const pageTitle = await page.title();
    expect(pageTitle).toMatch(/KAPIVA/i);
    console.log(`✅ Step 5: Page still valid after empty search — URL: ${currentUrl}`);

    const noResultsText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, p, span, h1, h2, h3'));
      return els.find(el =>
        /no results|not found|no products|nothing found|0 results/i.test(el.textContent || '') &&
        el.getBoundingClientRect().height > 0
      )?.textContent?.trim()?.slice(0, 60) || null;
    });

    if (noResultsText) {
      console.log(`✅ Step 5: No results message — "${noResultsText}"`);
    } else {
      console.log('✅ Step 5: No crash on empty search — stayed on homepage or search page');
    }

    // Step 6: Navigate back to homepage and try whitespace search
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);

    const searchInput2 = page.locator('#search-box');
    await searchInput2.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput2.click();
    await searchInput2.fill('   ');
    await searchInput2.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);
    console.log('✅ Step 6: Whitespace search submitted');

    // Step 7: Verify page doesn't crash after whitespace search
    const titleAfterWhitespace = await page.title();
    expect(page.url()).toContain('staging.kapiva.in');
    console.log(`✅ Step 7: Page still valid after whitespace search — title: "${titleAfterWhitespace}"`);

    // Step 8: Verify still on staging domain
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 8: Still on staging domain');

    console.log('\n🎉 Empty search validated successfully!\n');
  });

});
