import { Page, Locator, expect } from '@playwright/test';

/**
 * =========================
 * Base Page
 * =========================
 */
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }
}

/**
 * =========================
 * Home Page
 * =========================
 */
export class HomePage extends BasePage {
  private searchBox: Locator;

  constructor(page: Page) {
    super(page);
    this.searchBox = page.locator('#search-box');
  }

  async searchProduct(keyword: string) {
    await expect(this.searchBox).toBeVisible();
    await this.searchBox.fill('');
    await this.searchBox.fill(keyword);
    await this.searchBox.press('Enter');
  }
}

/**
 * =========================
 * Search Results Page
 * =========================
 */
export class SearchResultsPage {
  private page: Page;
  private productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productCards = page.locator('[data-product-id]');
  }

  /**
   * Wait until search page is loaded
   * (DO NOT check visibility of first element)
   */
  async waitForResults() {
    await this.page.waitForURL(/search\?q=/, { timeout: 10000 });
    await this.productCards.first().waitFor({ state: 'attached', timeout: 10000 });
  }

  /**
   * Wait until at least ONE product becomes visible
   */
  async waitForAtLeastOneVisibleProduct() {
    await expect.poll(async () => {
      const count = await this.productCards.count();

      for (let i = 0; i < count; i++) {
        if (await this.productCards.nth(i).isVisible()) {
          return true;
        }
      }
      return false;
    }, {
      timeout: 10000,
      message: 'No visible products found'
    }).toBe(true);
  }

  /**
   * Count ONLY visible products
   */
  async getVisibleProductCount(): Promise<number> {
    const totalCards = await this.productCards.count();
    let visibleCount = 0;

    for (let i = 0; i < totalCards; i++) {
      if (await this.productCards.nth(i).isVisible()) {
        visibleCount++;
      }
    }

    console.log(`📦 Current Products found (VISIBLE): ${visibleCount}`);
    return visibleCount;
  }
}
