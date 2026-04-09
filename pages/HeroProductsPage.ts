import { Page, expect } from '@playwright/test';

export interface HeroProductResult {
  product: string;
  found: boolean;
  atcVisible: boolean;
  bnVisible: boolean;
  outOfStock: boolean;
  matchedName: string;
  productUrl: string;
  passed: boolean;
}

export class HeroProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* ── Navigation ──────────────────────────────────────── */

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await expect(this.page).toHaveTitle(/KAPIVA/i);
  }

  async closePopupIfPresent() {
    await this.page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await this.page.waitForTimeout(500);
  }

  /* ── Search ───────────────────────────────────────────── */

  async searchProduct(keyword: string) {
    const searchBox = this.page.locator('#search-box');
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    await searchBox.click();
    await searchBox.fill('');
    await searchBox.fill(keyword);
    await searchBox.press('Enter');
    await this.page.waitForURL(/search\?q=/, { timeout: 15000 });
    await this.page.locator('[data-product-id]').first().waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1500);

    // Scroll to load all cards
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(500);
  }

  /* ── Find matching product card ───────────────────────── */

  async findMatchingCard(expectedProduct: string): Promise<Omit<HeroProductResult, 'product'>> {
    const allCards = this.page.locator('[data-product-id]');
    const total = await allCards.count();

    let found = false;
    let atcVisible = false;
    let bnVisible = false;
    let outOfStock = false;
    let matchedName = '—';
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

      const expWords = expectedProduct.toLowerCase().split(' ').filter(w => w.length > 2 && !/[()]/g.test(w)).slice(0, 3).join(' ');
      const expWords2 = expectedProduct.toLowerCase().split(' ').filter(w => w.length > 2 && !/[()]/g.test(w)).slice(0, 2).join(' ');
      const matches =
        name.toLowerCase().includes(expWords) ||
        name.toLowerCase().includes(expWords2) ||
        expectedProduct.toLowerCase().includes(name.toLowerCase().split(' ').slice(0, 3).join(' '));

      if (!matches) continue;

      const atcBtn = card.locator('button').filter({ has: this.page.locator('svg') }).first();
      const bnBtn = card.locator('button').filter({ hasText: /buy now/i }).first();
      const oos = await card.locator('text=/out of stock|sold out/i').first().isVisible({ timeout: 500 }).catch(() => false);
      const atc = await atcBtn.isVisible({ timeout: 1000 }).catch(() => false);
      const bn = await bnBtn.isVisible({ timeout: 1000 }).catch(() => false);

      if (!found || (!atcVisible && atc)) {
        found = true;
        matchedName = name;
        atcVisible = atc;
        bnVisible = bn;
        outOfStock = oos;
      }

      if (atcVisible && bnVisible) break;
    }

    // Get product URL from matched card
    let productUrl = '—';
    if (found) {
      const allCards2 = this.page.locator('[data-product-id]');
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
          if (href) {
            productUrl = href.startsWith('http') ? href : `https://staging.kapiva.in${href}`;
            break;
          }
        }
      }
    }

    const passed = found && (outOfStock || (atcVisible && bnVisible));
    return { found, atcVisible, bnVisible, outOfStock, matchedName, productUrl, passed };
  }

  /* ── Search keyword mapping ───────────────────────────── */

  getSearchKeyword(name: string): string {
    if (/dia free/i.test(name))             return 'Dia Free';
    if (/shilajit gold resin/i.test(name))  return 'Shilajit Gold Resin';
    if (/himalayan shilajit/i.test(name))   return 'Himalayan Shilajit';
    if (/get slim powder/i.test(name))      return 'Slim Powder';
    if (/get slim juice/i.test(name))       return 'Get Slim Juice';
    if (/hair care juice/i.test(name))      return 'Hair Care Juice';
    if (/kumkumadi/i.test(name))            return 'Kumkumadi';
    return name.split(' ').slice(0, 3).join(' ');
  }

  /* ── Print summary ────────────────────────────────────── */

  printSummary(results: HeroProductResult[]) {
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
  }

  /* ── Assertions ───────────────────────────────────────── */

  assertAllFound(results: HeroProductResult[]) {
    for (const r of results) {
      expect(r.found, `Product "${r.product}" should appear in search results`).toBe(true);
      if (!r.outOfStock) {
        expect(r.atcVisible, `"${r.product}" — Add to Cart button should be visible`).toBe(true);
        expect(r.bnVisible, `"${r.product}" — Buy Now button should be visible`).toBe(true);
      }
    }
  }
}
