import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('UI/UX — Back Navigation', () => {

  test('Homepage → Category → PDP → browser back → verify correct pages', async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    const homepageUrl = page.url();
    console.log(`\n✅ Step 1: Homepage opened → ${homepageUrl}`);

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to Women's Health category
    await navigateTo(page, 'https://staging.kapiva.in/solution/womens-health/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    const categoryUrl = page.url();
    const categoryH1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || null);
    expect(categoryH1, 'Category H1 should be present').toBeTruthy();
    console.log(`✅ Step 3: Category page loaded — "${categoryH1}" → ${categoryUrl}`);

    // Step 4: Click first product card to go to PDP
    await page.evaluate(async () => {
      for (let y = 0; y <= 1500; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
    });
    await page.waitForTimeout(1000);

    const productLink = page.locator('a[href*="kapiva.in"]').filter({ has: page.locator('h2') }).first();
    await productLink.waitFor({ state: 'attached', timeout: 10000 });
    await productLink.click();
    await page.waitForTimeout(2000);
    const pdpUrl = page.url();
    const pdpH1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || null);
    expect(pdpH1, 'PDP H1 should be present').toBeTruthy();
    console.log(`✅ Step 4: PDP loaded — "${pdpH1?.slice(0, 40)}" → ${pdpUrl}`);

    // Step 5: Click browser back → should return to category page
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const backUrl1 = page.url();
    expect(backUrl1, 'Back should return to category page').toMatch(/womens-health/i);
    const backH1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || null);
    console.log(`✅ Step 5: Back → category page — "${backH1?.slice(0, 40)}" → ${backUrl1}`);

    // Step 6: Click browser back again → should return to homepage
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const backUrl2 = page.url();
    expect(backUrl2).toMatch(/staging\.kapiva\.in\/?$/i);
    console.log(`✅ Step 6: Back → homepage → ${backUrl2}`);

    // Step 7: Verify homepage title is correct
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('✅ Step 7: Homepage title verified');

    console.log('\n🎉 Back navigation validated successfully!\n');
  });

});
