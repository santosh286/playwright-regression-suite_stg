import { Page, expect } from '@playwright/test';

const STAGING_BASE = 'https://staging.kapiva.in';

export interface BannerResult {
  index: number;
  href: string;
  finalUrl: string;
  httpStatus: number;
  isSoft404: boolean;
  isHomepageRedir: boolean;
  passed: boolean;
  note: string;
}

export class BannerPage {
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

  /* ── Scroll entire page to trigger lazy load ─────────── */

  async scrollFullPage() {
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(1500);
  }

  /* ── Collect banner hrefs from first 2 gliders ────────── */

  async collectBannerHrefs(): Promise<{ stagingLinks: string[]; skippedLinks: string[] }> {
    const allHrefs: string[] = await this.page.evaluate(() => {
      const gliders = Array.from(document.querySelectorAll('.glider')).slice(0, 2);
      const hrefs: string[] = [];
      gliders.forEach(g => {
        Array.from(g.querySelectorAll('a[href]')).forEach((a: any) => {
          if (a.href && !a.href.startsWith('javascript') && !a.href.endsWith('#')) {
            hrefs.push(a.href);
          }
        });
      });
      return hrefs;
    });

    const uniqueHrefs = [...new Set(allHrefs)];
    const stagingLinks = uniqueHrefs.filter(h => h.startsWith(STAGING_BASE));
    const skippedLinks = uniqueHrefs.filter(h => !h.startsWith(STAGING_BASE));

    return { stagingLinks, skippedLinks };
  }

  /* ── Verify each banner link (no 404, no homepage redir) ─ */

  async verifyBannerLink(href: string): Promise<BannerResult> {
    let httpStatus = 200;
    const onResponse = (response: any) => {
      if (response.request().resourceType() === 'document') {
        httpStatus = response.status();
      }
    };
    this.page.on('response', onResponse);

    await this.page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.page.waitForTimeout(3000);
    this.page.off('response', onResponse);

    const finalUrl = this.page.url();
    const pageTitle = await this.page.title().catch(() => '');
    const h1Text = await this.page.locator('h1').first().innerText({ timeout: 5000 }).catch(() => '');

    const homepageUrl = `${STAGING_BASE}/`;
    const isHard404 = httpStatus === 404;
    const isSoft404 = /404|not found/i.test(pageTitle) || /404|not found/i.test(h1Text);
    const isHomepageRedir = finalUrl === homepageUrl || finalUrl === homepageUrl.slice(0, -1);
    const passed = !isHard404 && !isSoft404 && !isHomepageRedir;

    const note = isHard404
      ? 'Hard 404'
      : isSoft404
        ? `Soft 404 — h1="${h1Text}"`
        : isHomepageRedir
          ? 'Redirects to homepage (broken link)'
          : '✅ OK';

    return { index: 0, href, finalUrl, httpStatus, isSoft404, isHomepageRedir, passed, note };
  }

  /* ── Print summary ────────────────────────────────────── */

  printSummary(results: BannerResult[], skippedLinks: string[]) {
    console.log('\n\n' + '═'.repeat(78));
    console.log('  HOMEPAGE BANNERS — SUMMARY');
    console.log('═'.repeat(78));
    console.log(`${'#'.padEnd(3)} | ${'Banner URL'.padEnd(48)} | ${'HTTP'.padEnd(4)} | ${'Pass'.padEnd(5)} | Note`);
    console.log('─'.repeat(78));

    for (const r of results) {
      const pass = r.passed ? '✅' : '❌';
      const url = r.href.replace(STAGING_BASE, '').slice(0, 47);
      console.log(`${String(r.index).padEnd(3)} | ${url.padEnd(48)} | ${String(r.httpStatus).padEnd(4)} | ${pass.padEnd(5)} | ${r.note.slice(0, 25)}`);
    }

    if (skippedLinks.length > 0) {
      console.log('─'.repeat(78));
      console.log('⏭  Skipped (non-staging URLs):');
      skippedLinks.forEach(h => console.log(`   ${h}`));
    }

    const passCount = results.filter(r => r.passed).length;
    const allPassed = results.every(r => r.passed);
    console.log('─'.repeat(78));
    console.log(`Overall: ${passCount}/${results.length} staging banners passed — ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);
  }
}
