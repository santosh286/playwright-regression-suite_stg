import { Page, expect } from '@playwright/test';

export class AppPage {
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

  async scrollFullPage() {
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(1000);
  }

  /* ── GET APP button ───────────────────────────────────── */

  async getAppLink() {
    const link = this.page.locator('a').filter({ hasText: /get.?app/i }).first();
    await expect(link).toBeVisible({ timeout: 10000 });
    return link;
  }

  async clickGetApp() {
    const link = await this.getAppLink();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    await link.click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await this.page.waitForTimeout(3000);
    return this.page.url();
  }

  async verifyAppStoreRedirect(finalUrl: string) {
    const isPlayStore = /play\.google\.com/i.test(finalUrl);
    const isAppStore = /apps\.apple\.com/i.test(finalUrl);
    const isOneLinkApp = /onelink\.me|kapiva/i.test(finalUrl);
    expect(
      isPlayStore || isAppStore || isOneLinkApp,
      `Expected Play Store, App Store or Kapiva app link. Got: ${finalUrl}`
    ).toBe(true);
    return { isPlayStore, isAppStore, isOneLinkApp };
  }

  /* ── WhatsApp icon ────────────────────────────────────── */

  async findWhatsAppIcon() {
    const waSelectors = [
      'a[href*="wa.me"]',
      'a[href*="whatsapp"]',
      'a[href*="api.whatsapp"]',
      '[class*="whatsapp" i] a',
      'img[alt*="whatsapp" i]',
    ];

    for (const sel of waSelectors) {
      const loc = this.page.locator(sel).first();
      const found = await loc.isVisible({ timeout: 3000 }).catch(() => false);
      if (found) return { icon: loc, selector: sel };
    }

    // Scroll and retry
    await this.scrollFullPage();

    for (const sel of waSelectors) {
      const loc = this.page.locator(sel).first();
      const found = await loc.isVisible({ timeout: 2000 }).catch(() => false);
      if (found) return { icon: loc, selector: sel };
    }

    return { icon: null, selector: '' };
  }

  async getWhatsAppHref(icon: any, selector: string): Promise<string> {
    if (selector.startsWith('img')) {
      return icon.evaluate((el: any) => el.closest('a')?.href || el.parentElement?.href || '');
    }
    const href = await icon.getAttribute('href') ?? '';
    if (href && !href.startsWith('http')) {
      return icon.evaluate((el: any) => (el as HTMLAnchorElement).href);
    }
    return href;
  }

  async clickWhatsAppAndVerify(icon: any, href: string, context: any): Promise<string> {
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15000 }),
      icon.click(),
    ]).catch(async () => {
      await this.page.goto(href, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return [this.page];
    });

    const targetPage = newPage ?? this.page;
    await targetPage.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await targetPage.waitForTimeout(2000);
    return targetPage.url();
  }

  async verifyWhatsAppUrl(finalUrl: string) {
    const isWhatsApp = /wa\.me|whatsapp\.com|web\.whatsapp|api\.whatsapp/i.test(finalUrl);
    expect(isWhatsApp, `Expected WhatsApp URL. Got: ${finalUrl}`).toBe(true);
    return isWhatsApp;
  }

  /* ── Shop on App (PDP) ────────────────────────────────── */

  async navigateToGymPage() {
    await this.page.goto('https://staging.kapiva.in/solution/gym-fitness/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await this.page.waitForTimeout(1500);
    expect(this.page.url()).toMatch(/gym/i);
  }

  async scrollToProductById(productId: string) {
    await this.page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await this.page.waitForTimeout(1000);

    const card = this.page.locator(`[data-product-id="${productId}"]`).first();
    await card.waitFor({ state: 'attached', timeout: 10000 });
    return card;
  }

  async openPDPFromCard(card: any) {
    await card.locator('a').first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await this.page.waitForTimeout(2000);
    return this.page.url();
  }

  async scrollPDPAndFindKapivaCoinsSection() {
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await this.page.waitForTimeout(1000);

    const coinsSection = this.page.locator('text=/kapiva coins/i').first();
    await coinsSection.waitFor({ state: 'attached', timeout: 10000 });
    await coinsSection.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await this.page.waitForTimeout(500);
    return coinsSection;
  }

  async clickShopOnApp(context: any): Promise<string> {
    const shopBtn = this.page.locator('button').filter({ hasText: /shop on app/i }).first();
    await shopBtn.waitFor({ state: 'visible', timeout: 10000 });
    const btnText = await shopBtn.innerText({ timeout: 2000 });
    expect(btnText.trim()).toMatch(/shop on app/i);

    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      shopBtn.click(),
    ]).catch(async () => {
      await this.page.waitForTimeout(2000);
      return [null];
    });

    const targetPage = newPage ?? this.page;
    await targetPage.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await targetPage.waitForTimeout(2000);
    return targetPage.url();
  }

  async verifyShopOnAppUrl(finalUrl: string) {
    const isAppStore = /play\.google\.com|apps\.apple\.com|onelink\.me|kapiva\.app\.link/i.test(finalUrl);
    expect(isAppStore, `Expected Play Store / App Store / onelink URL. Got: ${finalUrl}`).toBe(true);
    return isAppStore;
  }
}
