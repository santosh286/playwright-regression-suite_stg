import { Page, expect } from '@playwright/test';

export interface FooterLink {
  label: string;
  path: string;
  expectedUrl: RegExp;
}

export interface FooterLinkResult {
  label: string;
  href: string;
  visible: boolean;
  redirectedUrl: string;
  is404: boolean;
  passed: boolean;
  note: string;
}

export class FooterPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* ── Navigation ───────────────────────────────────────── */

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await this.page.waitForTimeout(1000);
    // Scroll to footer to trigger lazy rendering
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await this.page.waitForTimeout(500);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1500);
  }

  /* ── 404 detection ────────────────────────────────────── */

  async check404(): Promise<boolean> {
    const is404ByStatus = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length > 0 && 'responseStatus' in entries[0]) {
        return (entries[0] as any).responseStatus === 404;
      }
      return false;
    }).catch(() => false);

    if (is404ByStatus) return true;

    const h1 = await this.page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => '');
    const title = await this.page.title().catch(() => '');
    const strict404 = [/^404$/, /page not found/i, /404.*not found/i, /error 404/i];
    return strict404.some(rx => rx.test(h1 || '') || rx.test(title || ''));
  }

  /* ── Link helpers ─────────────────────────────────────── */

  async findFooterLink(path: string) {
    const partialPath = path.replace(/^https?:\/\/[^/]+/, '');
    const selectors = [
      `footer a[href="${path}"]`,
      `footer a[href*="${partialPath}"]`,
      `footer a[href$="${partialPath}"]`,
    ];
    for (const sel of selectors) {
      const el = this.page.locator(sel).first();
      const visible = await el.isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) return el;
    }
    return null;
  }

  /* ── Contact info ─────────────────────────────────────── */

  async verifyContactInfo(contacts: { label: string; href: string; display: string }[]) {
    for (const contact of contacts) {
      const el = this.page.locator(`footer a[href="${contact.href}"]`);
      const isVisible = await el.isVisible();
      const text = await el.textContent().catch(() => '');
      expect(isVisible, `${contact.label} should be visible in footer`).toBe(true);
      expect(text?.trim(), `${contact.label} display text mismatch`).toBe(contact.display);
      console.log(`✅ [${contact.label}] Visible: ${isVisible} | Text: "${text?.trim()}" | href: ${contact.href}`);
    }
  }

  /* ── Navigation links ─────────────────────────────────── */

  async verifyNavLinks(links: FooterLink[], context: any): Promise<FooterLinkResult[]> {
    const results: FooterLinkResult[] = [];

    for (const link of links) {
      await this.openHomePage();

      const anchor = await this.findFooterLink(link.path);
      const isVisible = anchor
        ? await anchor.isVisible({ timeout: 3000 }).catch(() => false)
        : false;

      console.log(`\n🔗 [${link.label}] | href: ${link.path} | Visible: ${isVisible ? '✅' : '❌'}`);

      if (!isVisible) {
        results.push({ label: link.label, href: link.path, visible: false, redirectedUrl: 'N/A', is404: false, passed: false, note: 'Not visible in footer' });
        continue;
      }

      await anchor!.scrollIntoViewIfNeeded();

      let redirectedUrl = 'N/A';
      let is404 = false;
      let passed = false;
      let note = '';

      const targetAttr = await anchor!.getAttribute('target').catch(() => '');
      const opensNewTab = targetAttr === '_blank';

      if (opensNewTab) {
        const [newPage] = await Promise.all([
          context.waitForEvent('page', { timeout: 20000 }),
          anchor!.click(),
        ]);
        await newPage.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
        redirectedUrl = newPage.url();
        const footerNew = new FooterPage(newPage);
        is404 = await footerNew.check404();
        passed = link.expectedUrl.test(redirectedUrl) && !is404;
        note = is404 ? '🚨 404' : passed ? 'New tab ✅' : 'URL mismatch ❌';
        await newPage.close();
      } else {
        await Promise.all([
          this.page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {}),
          anchor!.click(),
        ]);
        await this.page.waitForTimeout(1000);
        redirectedUrl = this.page.url();
        is404 = await this.check404();
        passed = link.expectedUrl.test(redirectedUrl) && !is404;
        note = is404 ? '🚨 404' : passed ? 'Same tab ✅' : 'URL mismatch ❌';
      }

      console.log(`   Redirected: ${redirectedUrl} | 404: ${is404} | Pass: ${passed}`);
      results.push({ label: link.label, href: link.path, visible: isVisible, redirectedUrl, is404, passed, note });
    }

    return results;
  }

  /* ── Icon verification ────────────────────────────────── */

  async getFooterImageSrcs(): Promise<string[]> {
    return this.page.evaluate(() => {
      const footer = document.querySelector('footer') as HTMLElement;
      return Array.from(footer.querySelectorAll('img')).map(img => img.getAttribute('src') || '');
    });
  }

  async verifyPlatformIcons(platforms: { label: string; srcPattern: RegExp }[]) {
    const srcs = await this.getFooterImageSrcs();
    for (const platform of platforms) {
      const found = srcs.some(src => platform.srcPattern.test(src));
      console.log(`${found ? '✅' : '❌'} ${platform.label}`);
      expect(found, `"${platform.label}" icon should be visible in footer`).toBe(true);
    }
  }

  async verifyPaymentIcons(payments: { label: string; srcPattern: RegExp }[]) {
    const srcs = await this.getFooterImageSrcs();
    for (const payment of payments) {
      const found = srcs.some(src => payment.srcPattern.test(src));
      console.log(`${found ? '✅' : '❌'} ${payment.label}`);
      expect(found, `"${payment.label}" payment icon should be visible in footer`).toBe(true);
    }
  }
}
