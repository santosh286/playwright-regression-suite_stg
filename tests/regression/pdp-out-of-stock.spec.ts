import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

// OOS product is discovered dynamically from homepage bestsellers section
const HOMEPAGE_URL = 'https://staging.kapiva.in/';

test.describe('PDP — Out of Stock', () => {

  test('Find OOS product on homepage → open PDP → verify Out of Stock state', async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, HOMEPAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Scroll homepage to load bestsellers/new arrivals sections
    await page.evaluate(async () => {
      for (let y = 0; y <= 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Homepage scrolled to load product sections');

    // Step 4: Find OOS product link from homepage
    const oosProductUrl = await page.evaluate(() => {
      // Find a product card that has "OUT OF STOCK" text and get its link
      const cards = Array.from(document.querySelectorAll('a[href*="kapiva.in"], a[href^="/"]'));
      const oosCard = cards.find(card => /out of stock/i.test(card.textContent || ''));
      if (!oosCard) return null;
      const href = oosCard.getAttribute('href') || '';
      return href.startsWith('http') ? href : `https://staging.kapiva.in${href}`;
    });

    if (!oosProductUrl) {
      console.log('⚠️  Step 4: No OOS product found on homepage — staging stock may have changed');
      console.log('   → Skipping OOS-specific assertions');
      return;
    }
    console.log(`✅ Step 4: OOS product link found → ${oosProductUrl}`);

    // Step 5: Navigate to OOS product PDP
    await navigateTo(page, oosProductUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 5: OOS PDP opened → ${page.url()}`);

    // Step 6: Verify product H1 is present (page loaded correctly)
    const productName = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || null);
    expect(productName, 'Product name H1 should be present').toBeTruthy();
    console.log(`✅ Step 6: Product name — "${productName?.slice(0, 50)}"`);

    // Step 7: Verify OOS indicator is shown on PDP
    const oosInfo = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, div, span, p'));
      const oosEl = els.find(el =>
        /notify me|out of stock|sold out/i.test(el.textContent?.trim() || '') &&
        el.getBoundingClientRect().height > 0
      );
      const atcBtn = els.find(el => /^add to cart$/i.test(el.textContent?.trim() || ''));
      return {
        oosText: oosEl?.textContent?.trim()?.slice(0, 50) || null,
        hasAtc: !!atcBtn,
      };
    });
    expect(oosInfo.oosText, 'Out of Stock / Notify Me text should be on PDP').toBeTruthy();
    console.log(`✅ Step 7: OOS indicator on PDP — "${oosInfo.oosText}"`);

    // Step 8: Verify ADD TO CART is NOT shown for OOS product
    expect(oosInfo.hasAtc, 'ADD TO CART should NOT be shown for OOS product').toBe(false);
    console.log('✅ Step 8: ADD TO CART correctly hidden for OOS product');

    // Step 9: Verify product price is still shown
    const priceShown = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('span, div, p'));
      return els.some(el => /₹\d+/.test(el.textContent || '') && el.getBoundingClientRect().height > 0);
    });
    expect(priceShown, 'Product price should be visible even for OOS product').toBe(true);
    console.log('✅ Step 9: Product price is visible');

    // Step 10: Verify PDP URL is still the product page
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 10: Still on staging PDP');

    console.log('\n🎉 OOS product page validated successfully!\n');
  });

});
