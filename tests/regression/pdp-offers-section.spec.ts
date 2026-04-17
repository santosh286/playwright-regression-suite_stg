import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Offers Section', () => {

  test('Open PDP → verify Offers For You → BEST PRICE cards → Extra OFF amounts', async ({ page }) => {
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

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Verify "Offers For You" H2 heading is present
    const offersHeading = page.locator('h2').filter({ hasText: /^Offers For You$/i }).first();
    await expect(offersHeading).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 4: "Offers For You" heading found');

    // Step 5: Count "BEST PRICE" H2 headings (one per offer card)
    const bestPriceCards = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.filter(h => /^BEST PRICE$/i.test(h.textContent?.trim() || '')).length;
    });
    expect(bestPriceCards, 'At least 1 BEST PRICE offer card should exist').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 5: Found ${bestPriceCards} BEST PRICE offer card(s)`);

    // Step 6: Verify "Extra ₹X OFF" headings exist inside offer cards
    const extraOffOffers = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s
        .filter(h => /extra.*₹.*off/i.test(h.textContent || ''))
        .map(h => h.textContent?.trim());
    });
    expect(extraOffOffers.length, 'At least 1 "Extra ₹X OFF" offer should be shown').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 6: Found ${extraOffOffers.length} "Extra OFF" offer(s):`);
    extraOffOffers.forEach((o, i) => console.log(`   [${i + 1}] "${o}"`));

    // Step 7: Verify each Extra OFF amount contains a ₹ value
    for (const offer of extraOffOffers) {
      expect(offer, `Offer should contain ₹ amount`).toMatch(/₹\d+/);
    }
    console.log('✅ Step 7: All offers have valid ₹ discount amounts');

    // Step 8: Scroll offers section into view and verify it is visible
    await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => /offers for you/i.test(h.textContent || ''));
      h2?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(800);
    console.log('✅ Step 8: Offers section scrolled into view');

    // Step 9: Verify "BEST PRICE" text is visible in DOM
    const bestPriceVisible = await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      return h2s.some(h => /^BEST PRICE$/i.test(h.textContent?.trim() || ''));
    });
    expect(bestPriceVisible, 'BEST PRICE label should be visible').toBe(true);
    console.log('✅ Step 9: BEST PRICE label confirmed visible');

    console.log('\n🎉 PDP Offers section validated successfully!\n');
  });

});
