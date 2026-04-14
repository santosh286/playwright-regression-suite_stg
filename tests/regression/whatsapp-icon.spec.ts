import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('WhatsApp Icon — Presence & URL', () => {

  test('Homepage → scroll → find WhatsApp icon → verify href is WhatsApp URL', async ({ page, context }) => {
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

    // Scroll full page to trigger lazy load
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Page scrolled');

    // Find WhatsApp icon
    const waSelectors = [
      'a[href*="wa.me"]',
      'a[href*="whatsapp"]',
      'a[href*="api.whatsapp"]',
      '[class*="whatsapp" i] a',
      'img[alt*="whatsapp" i]',
      'svg[class*="whatsapp" i]',
      '[data-testid*="whatsapp" i]',
      'a[aria-label*="whatsapp" i]',
    ];

    await page.waitForTimeout(2000);

    let icon: any = null;
    let selector = '';

    for (const sel of waSelectors) {
      const loc = page.locator(sel).first();
      const found = await loc.isVisible({ timeout: 3000 }).catch(() => false);
      if (found) { icon = loc; selector = sel; break; }
    }

    if (!icon) {
      // Scroll and retry
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 100));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);

      for (const sel of waSelectors) {
        const loc = page.locator(sel).first();
        const found = await loc.isVisible({ timeout: 2000 }).catch(() => false);
        if (found) { icon = loc; selector = sel; break; }
      }
    }

    if (!icon) {
      // Last resort: DOM search
      const waHref = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
        const wa = all.find(a => /wa\.me|whatsapp/i.test(a.href));
        return wa ? wa.href : null;
      });
      if (waHref) {
        icon = page.locator(`a[href*="${new URL(waHref).pathname.split('/')[1]}"]`).first();
        selector = 'dom-fallback';
      }
    }

    expect(icon, 'WhatsApp icon should be found on the page').toBeTruthy();
    console.log(`✅ Step 4: WhatsApp icon found via selector: "${selector}"`);

    // Get href
    let href = '';
    if (selector.startsWith('img')) {
      href = await icon.evaluate((el: any) => el.closest('a')?.href || el.parentElement?.href || '');
    } else {
      href = await icon.getAttribute('href') ?? '';
      if (href && !href.startsWith('http')) {
        href = await icon.evaluate((el: any) => (el as HTMLAnchorElement).href);
      }
    }
    console.log(`✅ Step 5: WhatsApp href — "${href}"`);
    expect(href, 'WhatsApp icon should have a non-empty href').toBeTruthy();

    // Verify or click
    let finalUrl = href;
    if (/wa\.me|whatsapp|api\.whatsapp/i.test(href)) {
      console.log('ℹ️  WhatsApp link verified via href (not clicked — browser cannot open app links)');
    } else {
      const newTabPromise = context.waitForEvent('page', { timeout: 20000 }).catch(() => null);
      await icon.click().catch(() => {});
      await page.waitForTimeout(2000);
      const newPage = await newTabPromise;
      if (newPage) {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
        await newPage.waitForTimeout(2000);
        finalUrl = newPage.url();
        await newPage.close().catch(() => {});
      } else {
        finalUrl = page.url();
      }
    }
    console.log(`✅ Step 6: Final WhatsApp URL — "${finalUrl}"`);

    const isWhatsApp = /wa\.me|whatsapp\.com|web\.whatsapp|api\.whatsapp|onelink\.me|kapiva\.app/i.test(finalUrl);
    expect(isWhatsApp, `Expected WhatsApp URL. Got: ${finalUrl}`).toBe(true);
    console.log(`✅ Step 7: WhatsApp URL verified — ${isWhatsApp ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n🎉 WhatsApp icon verified successfully!\n');
  });

});
