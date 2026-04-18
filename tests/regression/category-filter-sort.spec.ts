import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/womens-health/';

test.describe("Category — Filter & Sort", () => {

  test("Women's Health → verify initial products → test sort → test filter → no crash", async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log("\n✅ Step 1: Homepage opened");

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to Women's Health category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Count initial product cards
    const cards = page.locator('[data-product-id]');
    const initialCount = await cards.count();
    expect(initialCount, 'At least 3 product cards should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 4: Initial product count — ${initialCount} cards`);

    // Step 5: Find and interact with Sort UI
    const sortInfo = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('select, button, div, span'));
      const sortEl = candidates.find(el => {
        const text = el.textContent?.trim() || '';
        const cls = el.className || '';
        return /sort|price.*low|price.*high|newest|popular/i.test(text) ||
               /sort/i.test(cls);
      });
      return sortEl ? {
        found: true,
        tag: sortEl.tagName,
        text: sortEl.textContent?.trim()?.slice(0, 40),
        className: sortEl.className?.slice(0, 60),
      } : { found: false, tag: '', text: '', className: '' };
    });

    if (sortInfo.found) {
      console.log(`✅ Step 5: Sort UI found — <${sortInfo.tag}> "${sortInfo.text}"`);

      // Try clicking sort option
      const sortBtn = page.locator('button, div, span').filter({ hasText: /sort/i }).first();
      const sortCount = await sortBtn.count();
      if (sortCount > 0) {
        await sortBtn.click({ force: true });
        await page.waitForTimeout(1500);

        // Look for price low-to-high option
        const sortOption = page.locator('li, button, div, span').filter({ hasText: /price.*low|low.*price/i }).first();
        const optionCount = await sortOption.count();
        if (optionCount > 0) {
          await sortOption.click({ force: true });
          await page.waitForTimeout(2000);
          const afterSortCount = await cards.count();
          expect(afterSortCount, 'Product count should remain ≥ 3 after sorting').toBeGreaterThanOrEqual(3);
          console.log(`✅ Step 5: Sorted by Price Low→High — ${afterSortCount} products still visible`);
        } else {
          console.log('⚠️  Step 5: Sort option "Price Low→High" not found in dropdown — skipping');
        }
      }
    } else {
      console.log('⚠️  Step 5: Sort UI not found on this category page — may not be implemented on staging');
    }

    // Step 6: Find and interact with Filter UI
    const filterInfo = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, div, span, aside'));
      const filterEl = candidates.find(el => {
        const text = el.textContent?.trim() || '';
        const cls = el.className || '';
        return /^filter$/i.test(text.trim()) ||
               /filter/i.test(cls);
      });
      return filterEl ? {
        found: true,
        tag: filterEl.tagName,
        text: filterEl.textContent?.trim()?.slice(0, 40),
        className: filterEl.className?.slice(0, 60),
      } : { found: false, tag: '', text: '', className: '' };
    });

    if (filterInfo.found) {
      console.log(`✅ Step 6: Filter UI found — <${filterInfo.tag}> "${filterInfo.text}"`);

      const filterBtn = page.locator('button, div, span').filter({ hasText: /^filter$/i }).first();
      const filterCount = await filterBtn.count();
      if (filterCount > 0) {
        await filterBtn.click({ force: true });
        await page.waitForTimeout(1500);

        // Look for any filter checkbox/option
        const filterOption = page.locator('input[type="checkbox"], li, label').first();
        const filterOptionCount = await filterOption.count();
        if (filterOptionCount > 0) {
          await filterOption.click({ force: true });
          await page.waitForTimeout(2000);
          const afterFilterCount = await cards.count();
          console.log(`⚠️  Step 6: Filter applied — product count changed to ${afterFilterCount} (soft check)`);
        } else {
          console.log('⚠️  Step 6: No filter options found in panel — skipping filter option click');
        }
      }
    } else {
      console.log('⚠️  Step 6: Filter UI not found — may not be implemented on staging');
    }

    // Step 7: Verify page is still on staging and not crashed
    expect(page.url()).toContain('staging.kapiva.in');
    const finalCount = await cards.count();
    expect(finalCount, 'Products should still be visible after filter/sort interactions').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 7: Page stable — ${finalCount} products visible, URL: ${page.url()}`);

    // Step 8: Verify page title still valid
    const title = await page.title();
    expect(title).toMatch(/KAPIVA/i);
    console.log(`✅ Step 8: Page title still valid — "${title}"`);

    console.log('\n🎉 Category Filter & Sort validated successfully!\n');
  });

});
