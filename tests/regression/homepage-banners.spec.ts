import { test, expect } from '@playwright/test';
import { BannerPage } from '../../pages/BannerPage';

test.describe('Homepage Banner Validation', () => {

  test('Open homepage → close popup → collect all banners → verify each staging link', async ({ page }) => {
    test.setTimeout(180000);
    const banner = new BannerPage(page);

    await banner.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await banner.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await banner.scrollFullPage();
    console.log('✅ Step 3: Scrolled entire page');

    const { stagingLinks, skippedLinks } = await banner.collectBannerHrefs();
    console.log(`\n✅ Step 4: Found ${stagingLinks.length + skippedLinks.length} unique banner link(s)`);
    console.log(`   ✅ Staging  (will test) : ${stagingLinks.length}`);
    stagingLinks.forEach((h, i) => console.log(`     [${i + 1}] ${h}`));
    console.log(`   ⏭  Skipped (non-staging): ${skippedLinks.length}`);
    skippedLinks.forEach(h => console.log(`     ↪ ${h}`));

    expect(stagingLinks.length, 'Should have at least 1 staging banner link').toBeGreaterThan(0);

    const results = [];
    for (let i = 0; i < stagingLinks.length; i++) {
      const href = stagingLinks[i];
      console.log(`\n${'─'.repeat(58)}`);
      console.log(`🖼  Banner [${i + 1}/${stagingLinks.length}]: ${href}`);

      const result = await banner.verifyBannerLink(href);
      result.index = i + 1;

      console.log(`  Final URL      : ${result.finalUrl}`);
      console.log(`  HTTP status    : ${result.httpStatus}${result.httpStatus === 404 ? ' ❌ hard 404!' : ' ✅'}`);
      console.log(`  Soft 404 check : ${result.isSoft404 ? '❌' : '✅ OK'}`);
      console.log(`  Homepage redir : ${result.isHomepageRedir ? '❌ redirected to homepage!' : '✅ OK'}`);
      console.log(`  Result         : ${result.passed ? '✅ PASS' : '❌ FAIL'}`);

      results.push(result);

      await banner.openHomePage();
      await page.waitForTimeout(500);
    }

    banner.printSummary(results, skippedLinks);

    for (const r of results) {
      expect(r.passed, `Banner [${r.index}] "${r.href}" failed — ${r.note}`).toBe(true);
    }
  });

});
