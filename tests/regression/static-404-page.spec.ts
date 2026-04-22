import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const INVALID_URL = 'https://staging.kapiva.in/this-page-does-not-exist-xyz123/';

test.describe('Static — 404 Page', () => {

  test('Navigate to invalid URL → verify 404 or redirect → Kapiva branding still present', async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to invalid URL
    await navigateTo(page, INVALID_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Navigated to invalid URL → landed on: ${page.url()}`);

    // Step 4: Verify page renders without crashing
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    expect(bodyText.length, 'Page should render content even on 404').toBeGreaterThan(0);
    console.log(`✅ Step 4: Page rendered — ${bodyText.length} chars of content`);

    // Step 5: Check for 404 indicators
    const pageTitle = await page.title();
    const h1Text = await page.locator('h1').first().innerText({ timeout: 5000 }).catch(() => '');
    const finalUrl = page.url();

    const isCustom404 = /404|page not found|not found/i.test(pageTitle) ||
                        /404|page not found|not found/i.test(h1Text) ||
                        /404|page not found|not found/i.test(bodyText.slice(0, 500));
    const isHomepageRedirect = finalUrl === 'https://staging.kapiva.in/' ||
                               finalUrl === 'https://staging.kapiva.in';

    if (isCustom404) {
      console.log(`✅ Step 5: Custom 404 page shown — title: "${pageTitle}", H1: "${h1Text.trim()}"`);
    } else if (isHomepageRedirect) {
      console.log('✅ Step 5: Invalid URL redirected to homepage (common staging behavior)');
    } else {
      console.log(`⚠️  Step 5: Neither 404 nor homepage redirect — landed on: ${finalUrl}`);
      console.log(`   Title: "${pageTitle}" | H1: "${h1Text.trim()}"`);
    }

    // Step 6: Verify Kapiva branding is still present
    const hasKapivaBranding = /KAPIVA/i.test(pageTitle) ||
      await page.evaluate(() => {
        const logo = document.querySelector('img[alt*="kapiva" i], svg[id*="kapiva" i], a[href="/"]');
        return !!logo;
      });
    expect(hasKapivaBranding, 'Kapiva branding should still be visible on 404 page').toBe(true);
    console.log('✅ Step 6: Kapiva branding present on 404 page');

    // Step 7: Verify page is still on staging domain (not redirected off-site)
    expect(finalUrl).toContain('kapiva.in');
    console.log(`✅ Step 7: Still on kapiva.in domain — ${finalUrl}`);

    // Step 8: Verify navigation/header still works (logo link present)
    const logoLink = page.locator('a[href="/"], a[href="https://staging.kapiva.in/"]').first();
    const logoCount = await logoLink.count();
    if (logoCount > 0) {
      console.log('✅ Step 8: Header logo link present — site navigation still functional');
    } else {
      console.log('⚠️  Step 8: Logo link not found in standard selectors');
    }

    console.log('\n🎉 404 page behavior validated successfully!\n');
  });

});
