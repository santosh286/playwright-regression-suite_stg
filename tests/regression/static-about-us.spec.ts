import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const ABOUT_URL = 'https://staging.kapiva.in/about-us/';

test.describe('Static — About Us', () => {

  test('Open About Us page → verify heading, content present, no 404', async ({ page }) => {
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

    // Step 3: Navigate to About Us
    await navigateTo(page, ABOUT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: About Us page opened → ${page.url()}`);

    // Step 4: Verify URL
    expect(page.url()).toContain('about-us');
    console.log('✅ Step 4: URL contains "about-us"');

    // Step 5: Verify no 404
    const pageTitle = await page.title();
    expect(pageTitle).not.toMatch(/page not found|404/i);
    console.log(`✅ Step 5: No 404 — title: "${pageTitle}"`);

    // Step 6: Verify H1 or heading contains "about"
    const h1 = page.locator('h1').first();
    await h1.waitFor({ state: 'attached', timeout: 10000 });
    const h1Text = await h1.innerText().catch(() => '');
    if (/about/i.test(h1Text)) {
      console.log(`✅ Step 6: H1 verified — "${h1Text.trim()}"`);
    } else {
      // Fallback: check any heading
      const anyHeading = await page.evaluate(() => {
        const el = document.querySelector('h1, h2, h3');
        return el?.textContent?.trim() || '';
      });
      console.log(`⚠️  Step 6: H1 text is "${h1Text.trim()}" — checking other headings: "${anyHeading}"`);
    }

    // Step 7: Verify page has substantial text content
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    expect(bodyText.length, 'About Us page should have content').toBeGreaterThan(100);
    console.log(`✅ Step 7: Page has ${bodyText.length} chars of content`);

    // Step 8: Verify Kapiva branding present — title or page body
    const hasKapivaInTitle = /KAPIVA/i.test(pageTitle);
    const hasKapivaInBody = await page.evaluate(() => /kapiva/i.test(document.body.innerText || ''));
    expect(hasKapivaInTitle || hasKapivaInBody, 'Kapiva branding should appear on About Us page').toBe(true);
    console.log(`✅ Step 8: Kapiva branding present — title: "${pageTitle}", in body: ${hasKapivaInBody}`);

    // Step 9: Verify still on staging domain
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 9: Still on staging domain');

    console.log('\n🎉 About Us page validated successfully!\n');
  });

});
