import { Page, expect } from '@playwright/test';

export interface ProductResult {
  productId: string;
  productName: string;
  addToCartVisible: boolean;
  addToCartClicked: boolean;
  buyNowVisible: boolean;
  buyNowClicked: boolean;
  error?: string;
}

export interface ConcernResult {
  concernName: string;
  listingUrl: string;
  productCount: number;
  products: ProductResult[];
  error?: string;
}

export class ConcernPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* -------------------- CONCERNS -------------------- */

  // Returns concern pills [{name, href}] from the SELECT CONCERN row
  // Uses class="relative mb-5 lg:mb-10" to find the pill container (direct children only),
  // clicks each pill and reads the "View All" href from
  // (//div[@class="mb-5 flex items-center justify-start lg:mb-10"])//a
  async getAllConcerns(): Promise<{ name: string; href: string }[]> {
    await this.page.evaluate(() => window.scrollBy(0, 200));
    await this.page.waitForTimeout(800);

    // Step 1: Collect pill names using direct-child XPath (single / avoids picking inner elements)
    const pillNames: string[] = await this.page.evaluate(() => {
      const snap = document.evaluate(
        '//div[@class="relative mb-5 lg:mb-10"]/div[contains(@class,"gap")]/*',
        document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
      const names: string[] = [];
      for (let i = 0; i < snap.snapshotLength; i++) {
        const el = snap.snapshotItem(i) as HTMLElement;
        const name = el.querySelector('p')?.textContent?.trim() || '';
        names.push(/select concern/i.test(name) ? '' : name);
      }
      return names;
    });

    const validCount = pillNames.filter(n => n.length > 0).length;
    console.log(`🔍 Found ${validCount} concern pills: ${pillNames.filter(n => n).map(n => `"${n}"`).join(', ')}`);

    const concerns: { name: string; href: string }[] = [];

    // Step 2: Click each pill, read View All href, guard against navigation
    for (let i = 0; i < pillNames.length; i++) {
      const pillName = pillNames[i];
      if (!pillName) continue;

      // Click pill via JS
      await this.page.evaluate((idx) => {
        const snap = document.evaluate(
          '//div[@class="relative mb-5 lg:mb-10"]/div[contains(@class,"gap")]/*',
          document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        );
        const el = snap.snapshotItem(idx) as HTMLElement | null;
        if (el) el.click();
      }, i).catch(() => {});

      await this.page.waitForTimeout(800);

      // If click navigated away, go back to homepage and skip this pill
      const currentUrl = this.page.url();
      if (!currentUrl.includes('staging.kapiva.in') || currentUrl !== 'https://staging.kapiva.in/') {
        if (!currentUrl.startsWith('https://staging.kapiva.in/#') && currentUrl !== 'https://staging.kapiva.in/') {
          await this.page.goto('https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 20000 });
          await this.page.evaluate(() => window.scrollBy(0, 200));
          await this.page.waitForTimeout(800);
          console.log(`  ⚠️ "${pillName}" — pill navigated away, skipping`);
          continue;
        }
      }

      // Read View All href from the concern heading section using XPath
      const viewAllHref = await this.page.evaluate(() => {
        const snap = document.evaluate(
          '(//div[@class="mb-5 flex items-center justify-start lg:mb-10"])//a',
          document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
        );
        if (snap.snapshotLength === 0) return '';
        return (snap.snapshotItem(0) as HTMLAnchorElement).href || '';
      }).catch(() => '');

      if (viewAllHref) {
        concerns.push({ name: pillName, href: viewAllHref });
        console.log(`  ✅ "${pillName}" → ${viewAllHref}`);
      } else {
        console.log(`  ⚠️ "${pillName}" — no View All link found, skipping`);
      }
    }

    console.log(`✅ Concerns (${concerns.length}): ${concerns.map(c => `"${c.name}"`).join(', ')}`);
    return concerns;
  }

  // Count concern pills in the SELECT CONCERN horizontal row
  async getConcernPillCount(): Promise<number> {
    return this.page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.filter(a => {
        const img  = a.querySelector('img');
        const rect = a.getBoundingClientRect();
        return img && rect.top > 50 && rect.top < 600 && rect.width < 200;
      }).length;
    });
  }

  // Click i-th concern pill via JS (bypasses horizontal scroll visibility)
  async clickConcernByIndex(index: number): Promise<void> {
    await this.page.evaluate((idx) => {
      const anchors = Array.from(document.querySelectorAll('a'));
      const pills = anchors.filter(a => {
        const img  = a.querySelector('img');
        const rect = a.getBoundingClientRect();
        return img && rect.top > 50 && rect.top < 600 && rect.width < 200;
      });
      (pills[idx] as HTMLElement)?.click();
    }, index);
    await this.page.waitForTimeout(1500);
  }

  // Get concern heading text shown after clicking a concern pill
  async getConcernHeading(): Promise<string> {
    const heading = this.page.locator('h2, h3').filter({ hasNot: this.page.locator('footer') }).first();
    const text = await heading.textContent({ timeout: 5000 }).catch(() => '');
    return text?.trim() || '';
  }

  // Get the View All link href without clicking
  async getViewAllUrl(): Promise<string> {
    const viewAll = this.page.locator('a').filter({ hasText: /view all/i }).first();
    const href = await viewAll.getAttribute('href', { timeout: 5000 }).catch(() => '');
    if (!href) return '';
    return href.startsWith('http') ? href : `https://staging.kapiva.in${href}`;
  }

  /* -------------------- CLICK CONCERN BY NAME -------------------- */

  async clickConcernByName(concernName: string): Promise<void> {
    await this.page.evaluate(() => window.scrollBy(0, 200));
    await this.page.waitForTimeout(500);

    // Try clicking via JS to bypass horizontal scroll visibility
    const clicked = await this.page.evaluate((name) => {
      const anchors = Array.from(document.querySelectorAll('a'));
      for (const a of anchors) {
        const clone = a.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('img, svg').forEach(n => n.remove());
        const text = clone.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (text === name) {
          (a as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, concernName);

    if (!clicked) {
      // Fallback: use Playwright locator
      const el = this.page.getByText(concernName, { exact: true }).first();
      await el.scrollIntoViewIfNeeded();
      await el.click();
    }
    await this.page.waitForTimeout(1500);
  }

  /* -------------------- VIEW ALL -------------------- */

  async clickViewAll(): Promise<string> {
    // Use XPath to find View All link inside class="mb-5 flex items-center justify-start lg:mb-10"
    const viewAll = this.page.locator(
      'xpath=(//div[@class="mb-5 flex items-center justify-start lg:mb-10"])//a'
    ).first();

    let visible = await viewAll.isVisible({ timeout: 5000 }).catch(() => false);

    // Fallback: any visible "View All" anchor on the page
    if (!visible) {
      const fallback = this.page.locator('a').filter({ hasText: /view all/i }).first();
      visible = await fallback.isVisible({ timeout: 5000 }).catch(() => false);
      if (!visible) throw new Error('View All link not found');
      await fallback.scrollIntoViewIfNeeded();
      await fallback.click();
    } else {
      await viewAll.scrollIntoViewIfNeeded();
      await viewAll.click();
    }

    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await this.page.waitForTimeout(1000);
    return this.page.url();
  }

  /* -------------------- LOAD MORE -------------------- */

  async loadAllProducts(maxIterations = 5): Promise<void> {
    for (let i = 0; i < maxIterations; i++) {
      const loadMoreBtn = this.page.getByRole('button', { name: /load more/i });
      const visible = await loadMoreBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (!visible) break;

      const countBefore = await this.page.locator('[data-product-id]').count();
      await loadMoreBtn.scrollIntoViewIfNeeded();
      await loadMoreBtn.click();

      await this.page.waitForFunction(
        (before: number) => document.querySelectorAll('[data-product-id]').length > before,
        countBefore,
        { timeout: 10000 }
      ).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /* -------------------- PRODUCTS -------------------- */

  async getProductCount(): Promise<number> {
    return this.page.locator('[data-product-id]').count();
  }

  async getProductName(index: number): Promise<string> {
    const card = this.page.locator('[data-product-id]').nth(index);

    const name = await card.evaluate((el) => {
      // Get all leaf text nodes, pick the longest one that looks like a product name
      const leaves = Array.from(el.querySelectorAll('*'))
        .filter(e => e.children.length === 0)
        .map(e => e.textContent?.trim() || '')
        .filter(t =>
          t.length > 3 && t.length < 100 &&
          !t.includes('₹') &&
          !/^[\d%+\-\s]+$/.test(t) &&
          !/^(add to cart|buy now|off|sale|new|hot|view|shop)/i.test(t) &&
          !/^(out of stock|delivered by|delivery by|arriving|expected)/i.test(t) &&
          !/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t)
        );
      // Return the longest candidate (most likely product name)
      return leaves.sort((a, b) => b.length - a.length)[0] || '';
    });

    return name || `Product #${index + 1}`;
  }

  async getProductId(index: number): Promise<string> {
    return (await this.page.locator('[data-product-id]').nth(index).getAttribute('data-product-id')) || '';
  }

  /* -------------------- ADD TO CART -------------------- */

  async checkAddToCart(index: number): Promise<{ visible: boolean }> {
    const card = this.page.locator('[data-product-id]').nth(index);
    await card.scrollIntoViewIfNeeded();

    // ATC is an SVG icon-only button (no text/aria-label) — it's the first button in the card
    // identified by its dark background class and w-[35%] width
    const btn = card.locator('button').filter({ has: this.page.locator('svg') }).first();
    const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
    return { visible };
  }

  /* -------------------- BUY NOW -------------------- */

  async checkBuyNow(index: number): Promise<{ visible: boolean }> {
    const card = this.page.locator('[data-product-id]').nth(index);
    await card.scrollIntoViewIfNeeded();

    const btn = card.getByRole('button', { name: /buy now/i });
    const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
    return { visible };
  }

  /* -------------------- INTERACT WITH ONE PRODUCT -------------------- */

  async interactWithProduct(index: number, listingUrl: string): Promise<ProductResult> {
    // Fresh navigate to avoid stale locators
    await this.page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.loadAllProducts();

    const productId   = await this.getProductId(index);
    const productName = await this.getProductName(index);

    // --- Check visibility only (no clicking) ---
    const atcResult = await this.checkAddToCart(index);
    const bnResult  = await this.checkBuyNow(index);

    return {
      productId,
      productName,
      addToCartVisible: atcResult.visible,
      addToCartClicked: false,
      buyNowVisible:    bnResult.visible,
      buyNowClicked:    false,
    };
  }
}
