import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const BESTSELLERS_INDEX = 1;

async function inspectCard(page: any, card: any, index: number) {
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const productId = await card.getAttribute('data-product-id') ?? '';

  let name = '';
  for (const sel of [() => card.locator('h2').first(), () => card.locator('h3').first(), () => card.locator('p').first()]) {
    const txt = await sel().innerText({ timeout: 1000 }).catch(() => '');
    if (txt.trim()) { name = txt.trim(); break; }
  }

  const atcBtn = card.locator('button').filter({ has: page.locator('svg') }).first();
  const atcVisible = await atcBtn.isVisible({ timeout: 2000 }).catch(() => false);

  const bnBtn = card.locator('button').filter({ hasText: /buy now/i }).first();
  const bnVisible = await bnBtn.isVisible({ timeout: 2000 }).catch(() => false);

  const outOfStock = await card.locator('text=/out of stock|sold out/i').first().isVisible({ timeout: 1000 }).catch(() => false);

  const nameOk = name.length > 0;
  const btnOk = outOfStock || (atcVisible && bnVisible);
  const passed = nameOk && btnOk;

  const note = !nameOk ? 'Product name missing' : outOfStock ? 'Out of Stock ⚠️' : !atcVisible && !bnVisible ? 'ATC & BuyNow both missing' : !atcVisible ? 'Add to Cart missing' : !bnVisible ? 'Buy Now missing' : '✅ OK';

  return { index, productId, name, atcVisible, bnVisible, outOfStock, passed, note };
}

test.describe('Kapiva Bestsellers Section', () => {

  test('Homepage → close popup → scroll to Bestsellers → verify all products', async ({ page }) => {
    test.setTimeout(120000);

    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(1000);

    const heading = page.locator('span').filter({ hasText: /^Kapiva Bestsellers$/i }).first();
    await heading.waitFor({ state: 'attached', timeout: 10000 });
    await heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    console.log('✅ Step 3: Scrolled to Kapiva Bestsellers section');

    const grid = page.locator('[class*="glider-track"][class*="grid-rows-2"]').nth(BESTSELLERS_INDEX);
    await grid.waitFor({ state: 'attached', timeout: 10000 });
    const cards = grid.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'Section should have at least 1 product').toBeGreaterThan(0);

    const results = [];
    for (let i = 0; i < cardCount; i++) {
      const result = await inspectCard(page, cards.nth(i), i + 1);
      console.log(`[${result.index}] ${result.name || '⚠️ EMPTY'} | ATC: ${result.atcVisible ? '✅' : '❌'} | BuyNow: ${result.bnVisible ? '✅' : '❌'} | OOS: ${result.outOfStock ? '⚠️' : '✅'} | ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      results.push(result);
    }
    console.log(`\n✅ Step 4: Inspected ${results.length} product card(s) in Bestsellers`);

    console.log('\n\n' + '═'.repeat(85));
    console.log('  KAPIVA BESTSELLERS — SUMMARY');
    console.log('═'.repeat(85));
    console.log(`${'#'.padEnd(3)} | ${'Product Name'.padEnd(35)} | ${'ATC'.padEnd(5)} | ${'BuyNow'.padEnd(7)} | ${'OOS'.padEnd(5)} | Pass`);
    console.log('─'.repeat(85));
    for (const r of results) {
      const atc = r.atcVisible ? '✅' : '❌';
      const bn = r.bnVisible ? '✅' : '❌';
      const oos = r.outOfStock ? '⚠️ ' : '✅';
      const pass = r.passed ? '✅' : '❌';
      console.log(`${String(r.index).padEnd(3)} | ${r.name.slice(0, 34).padEnd(35)} | ${atc.padEnd(5)} | ${bn.padEnd(7)} | ${oos.padEnd(5)} | ${pass} ${r.passed ? '' : '— ' + r.note}`);
    }
    const passCount = results.filter(r => r.passed).length;
    const oosCount = results.filter(r => r.outOfStock).length;
    console.log('─'.repeat(85));
    console.log(`Total: ${results.length} | ${passCount} passed | ${oosCount} out of stock | ${results.every(r => r.passed) ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);

    for (const r of results) {
      expect(r.name, `Product [${r.index}] (id=${r.productId}) should have a name`).not.toBe('');
      if (!r.outOfStock) {
        expect(r.atcVisible, `Product [${r.index}] "${r.name}" — Add to Cart should be visible`).toBe(true);
        expect(r.bnVisible, `Product [${r.index}] "${r.name}" — Buy Now should be visible`).toBe(true);
      }
    }
  });

});
