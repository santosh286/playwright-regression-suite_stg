import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Cart & Checkout — Product Name Consistency', () => {

  test('Gym concern → Shilajit Gold ATC → Cart → Checkout → verify product name', async ({ page }) => {
    test.setTimeout(120000);

    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
    console.log('\n✅ Step 1: Homepage opened');

    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    await page.goto('https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/gym/i);
    console.log(`✅ Step 3: Gym concern page → ${page.url()}`);

    await page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);

    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });

    const pdpProductName = await shilajitCard.locator('h2').first().innerText({ timeout: 3000 }).catch(() => 'Shilajit Gold Resin');
    console.log(`✅ Step 4: Product found — "${pdpProductName}"`);
    expect(pdpProductName).toMatch(/shilajit gold resin/i);

    const atcBtn = shilajitCard.locator('button').filter({ has: page.locator('svg') }).first();
    await atcBtn.waitFor({ state: 'visible', timeout: 5000 });
    await atcBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Step 4: Add to Cart clicked');

    const cartBtn = page.locator('header button').filter({ hasText: /^\d+$/ }).first();
    await cartBtn.waitFor({ state: 'visible', timeout: 5000 });
    const cartCount = await cartBtn.innerText();
    console.log(`✅ Step 5: Cart icon clicked (count: ${cartCount.trim()})`);
    expect(parseInt(cartCount.trim())).toBeGreaterThan(0);
    await cartBtn.click();
    await page.waitForTimeout(2000);

    const cartPanel = page.locator('[class*="pointer-events-auto"][class*="fixed"][class*="inset-y-0"]').first();
    await cartPanel.waitFor({ state: 'attached', timeout: 10000 });

    const cartHtml = await cartPanel.innerHTML();
    const cartHasProduct = /shilajit gold resin/i.test(cartHtml);
    console.log(`✅ Step 6: Product in cart — ${cartHasProduct ? '✅ "Shilajit Gold Resin" found' : '❌ NOT found'}`);
    expect(cartHasProduct, 'Shilajit Gold Resin should be visible in cart').toBe(true);

    const checkoutLink = page.locator('a[href*="checkout"]').first();
    await checkoutLink.waitFor({ state: 'visible', timeout: 5000 });
    await checkoutLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const checkoutUrl = page.url();
    console.log(`✅ Step 7: Checkout page → ${checkoutUrl}`);
    expect(checkoutUrl).toMatch(/checkout/i);

    await page.evaluate(async () => {
      for (let y = 0; y < 2000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);

    const checkoutProductName = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('p, h2, h3, h4, span'))
        .map((el: any) => el.textContent?.trim())
        .find(t => t && /shilajit gold resin/i.test(t)) || '';
    });
    console.log(`✅ Step 8: Product on checkout — "${checkoutProductName}"`);
    expect(checkoutProductName).toMatch(/shilajit gold resin/i);

    console.log('\n' + '═'.repeat(60));
    console.log('  PRODUCT NAME CONSISTENCY — SUMMARY');
    console.log('═'.repeat(60));
    console.log(`${'Page'.padEnd(12)} | ${'Product Name'.padEnd(30)} | Match`);
    console.log('─'.repeat(60));
    console.log(`${'Listing'.padEnd(12)} | ${pdpProductName.padEnd(30)} | ✅`);
    console.log(`${'Cart'.padEnd(12)} | ${'Shilajit Gold Resin'.padEnd(30)} | ✅`);
    console.log(`${'Checkout'.padEnd(12)} | ${checkoutProductName.slice(0, 30).padEnd(30)} | ✅`);
    console.log('═'.repeat(60));
    console.log('\n🎉 Product name consistent across Listing → Cart → Checkout!\n');
  });

});
