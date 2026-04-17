import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Kapiva Coins Display', () => {

  test('Open PDP → verify Earn Coins badge → verify coins count → verify app purchase price', async ({ page }) => {
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

    // Step 4: Verify "Earn X Coins" text is present
    const coinsInfo = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, span, p'));
      const earnEl = els.find(el => /earn.*coin/i.test(el.textContent || '') && el.children.length < 5);
      const coinsMatch = earnEl?.textContent?.match(/(\d+)\s*Coin/i);
      return {
        text: earnEl?.textContent?.trim()?.slice(0, 80) || null,
        coinsCount: coinsMatch ? parseInt(coinsMatch[1]) : null,
      };
    });

    expect(coinsInfo.text, '"Earn X Coins" text should be visible on PDP').toBeTruthy();
    console.log(`✅ Step 4: Coins earn text found — "${coinsInfo.text}"`);

    // Step 5: Verify coins count is a positive number
    expect(coinsInfo.coinsCount, 'Coins count should be a positive number').toBeTruthy();
    expect(coinsInfo.coinsCount!).toBeGreaterThan(0);
    console.log(`✅ Step 5: Coins count = ${coinsInfo.coinsCount}`);

    // Step 6: Verify specific coins span (class: text-[14px] font-[600])
    const coinsSpan = page.locator('span[class*="font-\\[600\\]"]').filter({ hasText: /\d+\s*Coins/i }).first();
    await expect(coinsSpan).toBeAttached({ timeout: 5000 });
    const coinsText = await coinsSpan.textContent();
    expect(coinsText).toMatch(/\d+\s*Coins/i);
    console.log(`✅ Step 6: Coins badge element verified — "${coinsText?.trim()}"`);

    // Step 7: Verify "redeem it on next app purchase" text
    const redeemText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, span, p'));
      return els.find(el => /redeem it on next app purchase/i.test(el.textContent || ''))?.textContent?.trim()?.slice(0, 80) || null;
    });
    expect(redeemText, '"redeem it on next app purchase" text should exist').toBeTruthy();
    console.log(`✅ Step 7: Redeem text found — "${redeemText}"`);

    // Step 8: Verify "Get this product for ₹X using Kapiva coins on app" section
    const appPriceInfo = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, p, span'));
      const el = els.find(el => /get this product for.*kapiva coins on app/i.test(el.textContent || ''));
      const priceMatch = el?.textContent?.match(/₹(\d+)/);
      return {
        text: el?.textContent?.trim()?.slice(0, 80) || null,
        price: priceMatch ? parseInt(priceMatch[1]) : null,
      };
    });

    expect(appPriceInfo.text, '"Get this product using Kapiva coins" section should exist').toBeTruthy();
    console.log(`✅ Step 8: App coins price section found — "${appPriceInfo.text}"`);

    // Step 9: Verify app price is lower than regular price
    if (appPriceInfo.price) {
      const regularPrice = await page.evaluate(() => {
        const el = document.querySelector('span[class*="font-black"]');
        const match = el?.textContent?.match(/₹(\d+)/);
        return match ? parseInt(match[1]) : null;
      });
      if (regularPrice) {
        expect(appPriceInfo.price, 'Coins app price should be less than regular price').toBeLessThan(regularPrice);
        console.log(`✅ Step 9: App coins price ₹${appPriceInfo.price} < regular price ₹${regularPrice}`);
      }
    }

    console.log('\n🎉 Kapiva Coins display validated successfully!\n');
  });

});
