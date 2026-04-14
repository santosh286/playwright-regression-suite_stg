import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const STAGING_BASE = 'https://staging.kapiva.in';

test.describe('Homepage Banner Validation', () => {

  test('Open homepage → close popup → collect all banners → verify each staging link', async ({ page }) => {
    test.setTimeout(180000);

    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Scroll full page
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);
    console.log('✅ Step 3: Scrolled entire page');

    // Step 4: Collect banner hrefs
    const allHrefs: string[] = await page.evaluate(() => {
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

    console.log(`\n✅ Step 4: Found ${stagingLinks.length + skippedLinks.length} unique banner link(s)`);
    console.log(`   ✅ Staging  (will test) : ${stagingLinks.length}`);
    stagingLinks.forEach((h, i) => console.log(`     [${i + 1}] ${h}`));
    console.log(`   ⏭  Skipped (non-staging): ${skippedLinks.length}`);
    skippedLinks.forEach(h => console.log(`     ↪ ${h}`));

    expect(stagingLinks.length, 'Should have at least 1 staging banner link').toBeGreaterThan(0);

    const results: any[] = [];
    for (let i = 0; i < stagingLinks.length; i++) {
      const href = stagingLinks[i];
      console.log(`\n${'─'.repeat(58)}`);
      console.log(`🖼  Banner [${i + 1}/${stagingLinks.length}]: ${href}`);

      let httpStatus = 200;
      const onResponse = (response: any) => {
        if (response.request().resourceType() === 'document') {
          httpStatus = response.status();
        }
      };
      page.on('response', onResponse);

      await navigateTo(page, href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      page.off('response', onResponse);

      const finalUrl = page.url();
      const pageTitle = await page.title().catch(() => '');
      const h1Text = await page.locator('h1').first().innerText({ timeout: 5000 }).catch(() => '');
      const homepageUrl = `${STAGING_BASE}/`;
      const isHard404 = httpStatus === 404;
      const isSoft404 = /404|not found/i.test(pageTitle) || /404|not found/i.test(h1Text);
      const isHomepageRedir = finalUrl === homepageUrl || finalUrl === homepageUrl.slice(0, -1);
      const passed = !isHard404 && !isSoft404 && !isHomepageRedir;
      const note = isHard404 ? 'Hard 404' : isSoft404 ? `Soft 404 — h1="${h1Text}"` : isHomepageRedir ? 'Redirects to homepage' : '✅ OK';

      const result = { index: i + 1, href, finalUrl, httpStatus, isSoft404, isHomepageRedir, passed, note };

      console.log(`  Final URL      : ${result.finalUrl}`);
      console.log(`  HTTP status    : ${result.httpStatus}${result.httpStatus === 404 ? ' ❌ hard 404!' : ' ✅'}`);
      console.log(`  Soft 404 check : ${result.isSoft404 ? '❌' : '✅ OK'}`);
      console.log(`  Homepage redir : ${result.isHomepageRedir ? '❌ redirected to homepage!' : '✅ OK'}`);
      console.log(`  Result         : ${result.passed ? '✅ PASS' : '❌ FAIL'}`);

      results.push(result);

      await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(500);
    }

    // Print summary
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

    for (const r of results) {
      expect(r.passed, `Banner [${r.index}] "${r.href}" failed — ${r.note}`).toBe(true);
    }
  });

});
