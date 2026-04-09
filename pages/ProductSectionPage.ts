import { Page, expect } from '@playwright/test';

export interface ProductCardResult {
  index: number;
  productId: string;
  name: string;
  atcVisible: boolean;
  bnVisible: boolean;
  outOfStock: boolean;
  passed: boolean;
  note: string;
}

export class ProductSectionPage {
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

  /* ── Scroll to section ───────────────────────────────── */

  async scrollToSection() {
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 120));
      }
    });
    await this.page.waitForTimeout(1000);
  }

  /* ── Get product grid by section index ───────────────── */
  // Index 0 = SELECT CONCERN, 1 = Bestsellers, 2 = New Arrivals

  async getSectionGrid(sectionIndex: number) {
    const heading = this.page.locator('[class*="glider-track"][class*="grid-rows-2"]').nth(sectionIndex);
    await heading.waitFor({ state: 'attached', timeout: 10000 });
    return heading;
  }

  async scrollToSectionHeading(headingText: RegExp) {
    const heading = this.page.locator('span').filter({ hasText: headingText }).first();
    await heading.waitFor({ state: 'attached', timeout: 10000 });
    await heading.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1500);
  }

  /* ── Inspect a single product card ───────────────────── */

  async inspectCard(card: any, index: number): Promise<ProductCardResult> {
    await card.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);

    const productId = await card.getAttribute('data-product-id') ?? '';

    const nameLocators = [
      card.locator('h2').first(),
      card.locator('h3').first(),
      card.locator('p[class*="font-medium"]').first(),
      card.locator('p[class*="font-semibold"]').first(),
      card.locator('p').first(),
    ];
    let name = '';
    for (const loc of nameLocators) {
      const txt = await loc.innerText({ timeout: 1000 }).catch(() => '');
      if (txt.trim()) { name = txt.trim(); break; }
    }

    const atcBtn = card.locator('button').filter({ has: this.page.locator('svg') }).first();
    const atcVisible = await atcBtn.isVisible({ timeout: 2000 }).catch(() => false);

    const bnBtn = card.locator('button').filter({ hasText: /buy now/i }).first();
    const bnVisible = await bnBtn.isVisible({ timeout: 2000 }).catch(() => false);

    const oosLocator = card.locator('text=/out of stock|sold out/i').first();
    const outOfStock = await oosLocator.isVisible({ timeout: 1000 }).catch(() => false);

    const nameOk = name.length > 0;
    const btnOk = outOfStock || (atcVisible && bnVisible);
    const passed = nameOk && btnOk;

    const note = !nameOk
      ? 'Product name missing'
      : outOfStock
        ? 'Out of Stock ⚠️'
        : !atcVisible && !bnVisible
          ? 'ATC & BuyNow both missing'
          : !atcVisible
            ? 'Add to Cart missing'
            : !bnVisible
              ? 'Buy Now missing'
              : '✅ OK';

    return { index, productId, name, atcVisible, bnVisible, outOfStock, passed, note };
  }

  /* ── Inspect all cards in a grid ─────────────────────── */

  async inspectAllCards(sectionIndex: number): Promise<ProductCardResult[]> {
    const grid = await this.getSectionGrid(sectionIndex);
    const cards = grid.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'Section should have at least 1 product').toBeGreaterThan(0);

    const results: ProductCardResult[] = [];
    for (let i = 0; i < cardCount; i++) {
      const result = await this.inspectCard(cards.nth(i), i + 1);
      console.log(`[${result.index}] ${result.name || '⚠️ EMPTY'} | ATC: ${result.atcVisible ? '✅' : '❌'} | BuyNow: ${result.bnVisible ? '✅' : '❌'} | OOS: ${result.outOfStock ? '⚠️' : '✅'} | ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      results.push(result);
    }
    return results;
  }

  /* ── Print summary ────────────────────────────────────── */

  printSummary(title: string, results: ProductCardResult[]) {
    console.log('\n\n' + '═'.repeat(85));
    console.log(`  ${title} — SUMMARY`);
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
  }

  /* ── Assertions ───────────────────────────────────────── */

  assertAllPassed(results: ProductCardResult[]) {
    for (const r of results) {
      expect(r.name, `Product [${r.index}] (id=${r.productId}) should have a name`).not.toBe('');
      if (!r.outOfStock) {
        expect(r.atcVisible, `Product [${r.index}] "${r.name}" — Add to Cart should be visible`).toBe(true);
        expect(r.bnVisible, `Product [${r.index}] "${r.name}" — Buy Now should be visible`).toBe(true);
      }
    }
  }
}
