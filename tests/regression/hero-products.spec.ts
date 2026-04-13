import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const EXPECTED_PRODUCTS = [
  'Dia Free Juice - Blood Sugar Management',
  'Shilajit Gold Resin',
  'Himalayan Shilajit Resin',
  'Get Slim Powder (Mix)',
  'Get Slim Juice',
  'Hair Care Juice | Hair Fall Control & Hair Growth',
  'Ghee Kumkumadi Body Butter - 200g',
];

function getSearchKeyword(name: string): string {
  if (/dia free/i.test(name))            return 'Dia Free';
  if (/shilajit gold resin/i.test(name)) return 'Shilajit Gold Resin';
  if (/himalayan shilajit/i.test(name))  return 'Himalayan Shilajit';
  if (/get slim powder/i.test(name))     return 'Slim Powder';
  if (/get slim juice/i.test(name))      return 'Get Slim Juice';
  if (/hair care juice/i.test(name))     return 'Hair Care Juice';
  if (/kumkumadi/i.test(name))           return 'Kumkumadi';
  return name.split(' ').slice(0, 3).join(' ');
}

async function searchProduct(page: any, keyword: string) {
  const searchBox = page.locator('#search-box');
  await expect(searchBox).toBeVisible({ timeout: 10000 });
  await searchBox.click();
  await searchBox.fill('');
  await searchBox.fill(keyword);
  await searchBox.press('Enter');
  await page.waitForURL(/search\?q=/, { timeout: 30000 });
  await page.locator('[data-product-id]').first().waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function findMatchingCard(page: any, expectedProduct: string) {
  const allCards = page.locator('[data-product-id]');
  const total = await allCards.count();

  let found = false, atcVisible = false, bnVisible = false, outOfStock = false, matchedName = '—';
  const seenIds = new Set<string>();

  for (let ci = 0; ci < total; ci++) {
    const card = allCards.nth(ci);
    const productId = await card.getAttribute('data-product-id') ?? '';
    if (seenIds.has(productId) && atcVisible) break;
    seenIds.add(productId);

    let name = '';
    for (const sel of ['h2', 'h3', 'p']) {
      const txt = await card.locator(sel).first().innerText({ timeout: 500 }).catch(() => '');
      if (txt.trim()) { name = txt.trim(); break; }
    }

    const expWords = expectedProduct.toLowerCase().split(' ').filter((w: string) => w.length > 2 && !/[()]/g.test(w)).slice(0, 3).join(' ');
    const expWords2 = expectedProduct.toLowerCase().split(' ').filter((w: string) => w.length > 2 && !/[()]/g.test(w)).slice(0, 2).join(' ');
    const matches = name.toLowerCase().includes(expWords) || name.toLowerCase().includes(expWords2) || expectedProduct.toLowerCase().includes(name.toLowerCase().split(' ').slice(0, 3).join(' '));
    if (!matches) continue;

    const atcBtn = card.locator('button').filter({ has: page.locator('svg') }).first();
    const bnBtn = card.locator('button').filter({ hasText: /buy now/i }).first();
    const oos = await card.locator('text=/out of stock|sold out/i').first().isVisible({ timeout: 500 }).catch(() => false);
    const atc = await atcBtn.isVisible({ timeout: 1000 }).catch(() => false);
    const bn = await bnBtn.isVisible({ timeout: 1000 }).catch(() => false);

    if (!found || (!atcVisible && atc)) {
      found = true; matchedName = name; atcVisible = atc; bnVisible = bn; outOfStock = oos;
    }
    if (atcVisible && bnVisible) break;
  }

  let productUrl = '—';
  if (found) {
    const allCards2 = page.locator('[data-product-id]');
    const total2 = await allCards2.count();
    for (let ci = 0; ci < total2; ci++) {
      const card2 = allCards2.nth(ci);
      let name2 = '';
      for (const sel of ['h2', 'h3', 'p']) {
        const txt = await card2.locator(sel).first().innerText({ timeout: 500 }).catch(() => '');
        if (txt.trim()) { name2 = txt.trim(); break; }
      }
      if (name2.toLowerCase().includes(matchedName.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase())) {
        const href = await card2.locator('a').first().getAttribute('href').catch(() => '');
        if (href) { productUrl = href.startsWith('http') ? href : `https://staging.kapiva.in${href}`; break; }
      }
    }
  }

  const passed = found && (outOfStock || (atcVisible && bnVisible));
  return { found, atcVisible, bnVisible, outOfStock, matchedName, productUrl, passed };
}

test.describe('Product Search — Cards Validation', () => {

  test('Search each product → verify name + ATC + Buy Now visible', async ({ page }) => {
    test.setTimeout(180000);

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

    const results = [];

    for (const expectedProduct of EXPECTED_PRODUCTS) {
      const keyword = getSearchKeyword(expectedProduct);
      console.log(`\n🔍 Searching: "${keyword}" (for: "${expectedProduct}")`);

      await searchProduct(page, keyword);

      const result = await findMatchingCard(page, expectedProduct);

      console.log(`   Found    : ${result.found ? '✅' : '❌'} "${result.matchedName}"`);
      console.log(`   ATC      : ${result.atcVisible ? '✅' : '❌'}`);
      console.log(`   Buy Now  : ${result.bnVisible  ? '✅' : '❌'}`);
      console.log(`   OOS      : ${result.outOfStock ? '⚠️  YES' : '✅ No'}`);
      console.log(`   URL      : ${result.productUrl}`);
      console.log(`   Result   : ${result.passed ? '✅ PASS' : '❌ FAIL'}`);

      results.push({ product: expectedProduct, ...result });

      await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.evaluate(() => {
        if (typeof (window as any).hideStagingPopup === 'function') {
          (window as any).hideStagingPopup();
        }
      });
      await page.waitForTimeout(500);
    }

    console.log('\n' + '═'.repeat(90));
    console.log('  PRODUCT SEARCH — SUMMARY');
    console.log('═'.repeat(90));
    console.log(`${'Expected Product'.padEnd(40)} | ${'Found'.padEnd(6)} | ${'ATC'.padEnd(5)} | ${'Buy Now'.padEnd(8)} | Pass`);
    console.log('─'.repeat(90));
    for (const r of results) {
      const pass = r.passed ? '✅' : '❌';
      const found = r.found ? '✅' : '❌';
      const atc = r.atcVisible ? '✅' : r.outOfStock ? '⚠️ ' : '❌';
      const bn = r.bnVisible ? '✅' : r.outOfStock ? '⚠️ ' : '❌';
      console.log(`${r.product.slice(0, 39).padEnd(40)} | ${found.padEnd(6)} | ${atc.padEnd(5)} | ${bn.padEnd(8)} | ${pass}`);
      if (r.productUrl !== '—') console.log(`  └─ URL: ${r.productUrl}`);
    }
    const passCount = results.filter(r => r.passed).length;
    console.log('─'.repeat(90));
    console.log(`Total: ${results.length} products | ${passCount} passed | ${results.length - passCount} failed\n`);

    for (const r of results) {
      expect(r.found, `Product "${r.product}" should appear in search results`).toBe(true);
      if (!r.outOfStock) {
        expect(r.atcVisible, `"${r.product}" — Add to Cart button should be visible`).toBe(true);
        expect(r.bnVisible, `"${r.product}" — Buy Now button should be visible`).toBe(true);
      }
    }

    console.log('🎉 All product search results verified successfully!\n');
  });

});
