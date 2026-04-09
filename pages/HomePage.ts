import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly concernsContainer: Locator;
  readonly concernLabels: Locator;
  readonly viewAllLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.concernsContainer = page.locator(
      'div.relative.flex.flex-wrap.items-center.justify-start'
    );

    this.concernLabels = this.concernsContainer.locator('p:visible');

    this.viewAllLink = page.locator(
      "//a[normalize-space()='View all']"
    );
  }

  async navigateToHome() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveTitle(/Kapiva/i);
  }

  async getAllConcernsText(): Promise<string[]> {
    await expect(this.concernsContainer).toBeVisible();

    const texts = await this.concernLabels.allInnerTexts();

    return Array.from(
      new Set(
        texts
          .map(text => text.trim())
          .filter(text => text && text !== 'SELECT CONCERN:')
      )
    );
  }

  async clickMenHealth() {
    const menHealth = this.concernLabels
      .filter({ hasText: "Men's Health" })
      .first();

    await expect(menHealth).toBeVisible();
    await menHealth.click();
  }

  async closePopupIfPresent() {
    await this.page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await this.page.waitForTimeout(500);
  }

  async scrollToLoadConcerns() {
    await this.page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(1000);
  }

  async getConcernTiles(): Promise<{
    index: number;
    name: string;
    imgSrc: string;
    imgAlt: string;
    isLgImg: boolean;
    imgVisible: boolean;
    imgLoaded: boolean;
  }[]> {
    return this.page.evaluate(() => {
      const container = Array.from(document.querySelectorAll('*')).find(el => {
        const cls = (el.className || '').toString();
        return cls.includes('flex-wrap') &&
          cls.includes('items-center') &&
          cls.includes('justify-start') &&
          cls.includes('gap-[7px]');
      });

      if (!container) return [];

      const tileEls = Array.from(container.children);

      return tileEls.map((tile, i) => {
        const allImgs = Array.from(tile.querySelectorAll('img')) as HTMLImageElement[];

        const lgImg = allImgs.find(im => {
          const cls = (im.className || '').toString();
          return cls.includes('hidden') && cls.includes('lg:block');
        });

        const anyImg = allImgs[0];
        const img = lgImg || anyImg;

        const imgSrc = img?.src || img?.getAttribute('src') ||
          img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';

        const imgVisible = img
          ? window.getComputedStyle(img).display !== 'none' &&
            window.getComputedStyle(img).visibility !== 'hidden' &&
            img.offsetWidth > 0 &&
            img.offsetHeight > 0
          : false;

        const imgLoaded = img
          ? img.complete && img.naturalWidth > 0
          : false;

        const nameEl = Array.from(tile.querySelectorAll('p'))
          .find(p => p.textContent?.trim());

        return {
          index: i + 1,
          name: nameEl?.textContent?.trim() || '',
          imgSrc,
          imgAlt: img?.alt || '',
          isLgImg: !!lgImg,
          imgVisible,
          imgLoaded,
        };
      }).filter(t => t.name || t.imgSrc);
    });
  }

  async scrollAndClickViewAll() {
    // ✅ Wait until View all exists in DOM
    await this.viewAllLink.waitFor({ state: 'attached', timeout: 30_000 });

    // 🔽 Scroll if needed
    await this.viewAllLink.scrollIntoViewIfNeeded();

    // ✅ Wait until visible
    await expect(this.viewAllLink).toBeVisible({ timeout: 30_000 });

    await this.viewAllLink.click();

    //await this.page.waitForLoadState('networkidle');
  }
}
