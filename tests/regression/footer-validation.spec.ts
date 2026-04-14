import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const FOOTER_LINKS = [
  { label: 'SHOP ALL',             path: '/shop-all/',                              expectedUrl: /shop-all/i },
  { label: 'MY ACCOUNT',           path: '/account.php',                            expectedUrl: /account/i },
  { label: 'FAQS',                 path: '/faq/',                                   expectedUrl: /faq/i },
  { label: 'INNOVATION FUND',      path: 'https://innovation.kapiva.in/',           expectedUrl: /innovation\.kapiva\.in/i },
  { label: 'ABOUT US',             path: '/about-us/',                              expectedUrl: /about-us/i },
  { label: 'BLOG',                 path: 'https://blog.kapiva.in/',                 expectedUrl: /blog\.kapiva\.in/i },
  { label: 'MEDIA',                path: '/media/',                                 expectedUrl: /media/i },
  { label: 'CONTACT US',           path: '/contact-us/',                            expectedUrl: /contact-us/i },
  { label: 'Privacy Policy',       path: '/privacy-policy/',                        expectedUrl: /privacy-policy/i },
  { label: 'Terms and Conditions', path: '/terms-and-condition/',                   expectedUrl: /terms-and-condition/i },
  { label: 'Shipping Policy',      path: '/shipping-policy/',                       expectedUrl: /shipping-policy/i },
  { label: 'Cancellation Policy',  path: '/cancellation-returns-refunds-policy/',   expectedUrl: /cancellation/i },
];

const CONTACT_LINKS = [
  { label: 'Phone', href: 'tel:18002742575',       display: '1800-274-2575' },
  { label: 'Email', href: 'mailto:info@kapiva.in', display: 'info@kapiva.in' },
];

const ALSO_AVAILABLE_ON = [
  { label: 'Amazon',    srcPattern: /top_strip\/amazon/i },
  { label: 'Flipkart',  srcPattern: /top_strip\/flipkart/i },
  { label: 'Zepto',     srcPattern: /top_strip\/zepto/i },
  { label: 'Instamart', srcPattern: /top_strip\/instamart/i },
];

const WE_ACCEPT = [
  { label: 'Amazon Pay',  srcPattern: /bottom_strip\/amazon_pay/i },
  { label: 'BHIM UPI',    srcPattern: /bottom_strip\/bhim_upi/i },
  { label: 'Net Banking', srcPattern: /bottom_strip\/intersection/i },
  { label: 'Google Pay',  srcPattern: /bottom_strip\/google_pay/i },
  { label: 'Mastercard',  srcPattern: /bottom_strip\/mastercard/i },
  { label: 'RuPay',       srcPattern: /bottom_strip\/rupay/i },
  { label: 'Visa',        srcPattern: /bottom_strip\/visa/i },
];

async function openHomePage(page: any) {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
}

async function check404(page: any): Promise<boolean> {
  const is404ByStatus = await page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0 && 'responseStatus' in entries[0]) {
      return (entries[0] as any).responseStatus === 404;
    }
    return false;
  }).catch(() => false);
  if (is404ByStatus) return true;
  const h1 = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => '');
  const title = await page.title().catch(() => '');
  const strict404 = [/^404$/, /page not found/i, /404.*not found/i, /error 404/i];
  return strict404.some(rx => rx.test(h1 || '') || rx.test(title || ''));
}

async function getFooterImageSrcs(page: any): Promise<string[]> {
  return page.evaluate(() => {
    const footer = document.querySelector('footer') as HTMLElement;
    return Array.from(footer.querySelectorAll('img')).map((img: any) => img.getAttribute('src') || '');
  });
}

async function findFooterLink(page: any, path: string) {
  const partialPath = path.replace(/^https?:\/\/[^/]+/, '');
  const selectors = [
    `footer a[href="${path}"]`,
    `footer a[href*="${partialPath}"]`,
    `footer a[href$="${partialPath}"]`,
  ];
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    const visible = await el.isVisible({ timeout: 2000 }).catch(() => false);
    if (visible) return el;
  }
  return null;
}

test.describe('Footer Validation – All Links & Redirections', () => {

  test('Contact info (phone & email) are visible in footer', async ({ page }) => {
    await openHomePage(page);
    console.log('\n===== CONTACT INFO =====');
    for (const contact of CONTACT_LINKS) {
      const el = page.locator(`footer a[href="${contact.href}"]`);
      const isVisible = await el.isVisible();
      const text = await el.textContent().catch(() => '');
      expect(isVisible, `${contact.label} should be visible in footer`).toBe(true);
      expect(text?.trim(), `${contact.label} display text mismatch`).toBe(contact.display);
      console.log(`✅ [${contact.label}] Visible: ${isVisible} | Text: "${text?.trim()}" | href: ${contact.href}`);
    }
    console.log('========================\n');
  });

  test('All footer navigation links are visible and redirect correctly', async ({ page, context }) => {
    const results: any[] = [];

    for (const link of FOOTER_LINKS) {
      await openHomePage(page);

      const anchor = await findFooterLink(page, link.path);
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
        is404 = await check404(newPage);
        passed = link.expectedUrl.test(redirectedUrl) && !is404;
        note = is404 ? '🚨 404' : passed ? 'New tab ✅' : 'URL mismatch ❌';
        await newPage.close();
      } else {
        await Promise.all([
          page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {}),
          anchor!.click(),
        ]);
        await page.waitForTimeout(1000);
        redirectedUrl = page.url();
        is404 = await check404(page);
        passed = link.expectedUrl.test(redirectedUrl) && !is404;
        note = is404 ? '🚨 404' : passed ? 'Same tab ✅' : 'URL mismatch ❌';
      }

      console.log(`   Redirected: ${redirectedUrl} | 404: ${is404} | Pass: ${passed}`);
      results.push({ label: link.label, href: link.path, visible: isVisible, redirectedUrl, is404, passed, note });
    }

    console.log('\n\n============ FOOTER VALIDATION SUMMARY ============');
    console.log(`${'Link'.padEnd(26)} | ${'Vis'.padEnd(3)} | ${'404'.padEnd(3)} | ${'Pass'.padEnd(4)} | ${'Note'.padEnd(24)} | Redirected URL`);
    console.log('─'.repeat(120));
    for (const r of results) {
      const vis = r.visible ? '✅' : '❌';
      const err = r.is404   ? '🚨' : '  ';
      const pss = r.passed  ? '✅' : '❌';
      console.log(`${r.label.padEnd(26)} | ${vis.padEnd(3)} | ${err.padEnd(3)} | ${pss.padEnd(4)} | ${r.note.padEnd(24)} | ${r.redirectedUrl}`);
    }
    const allPassed = results.every(r => r.passed);
    const any404    = results.some(r => r.is404);
    console.log('─'.repeat(120));
    console.log(`Overall: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}${any404 ? '  |  🚨 404 errors detected!' : ''}`);
    console.log('===================================================\n');

    for (const r of results) {
      expect(r.visible, `"${r.label}" should be visible in footer`).toBe(true);
      expect(r.is404,   `"${r.label}" returned 404 at ${r.redirectedUrl}`).toBe(false);
      expect(r.passed,  `"${r.label}" should redirect correctly to ${r.href}`).toBe(true);
    }
  });

  test('"Also available on" platform icons are visible in footer', async ({ page }) => {
    await openHomePage(page);
    console.log('\n===== ALSO AVAILABLE ON =====');
    const srcs = await getFooterImageSrcs(page);
    for (const platform of ALSO_AVAILABLE_ON) {
      const found = srcs.some(src => platform.srcPattern.test(src));
      console.log(`${found ? '✅' : '❌'} ${platform.label}`);
      expect(found, `"${platform.label}" icon should be visible in footer`).toBe(true);
    }
    console.log('==============================\n');
  });

  test('"We Accept" payment icons are visible in footer', async ({ page }) => {
    await openHomePage(page);
    console.log('\n===== WE ACCEPT =====');
    const srcs = await getFooterImageSrcs(page);
    for (const payment of WE_ACCEPT) {
      const found = srcs.some(src => payment.srcPattern.test(src));
      console.log(`${found ? '✅' : '❌'} ${payment.label}`);
      expect(found, `"${payment.label}" payment icon should be visible in footer`).toBe(true);
    }
    console.log('=====================\n');
  });

});
