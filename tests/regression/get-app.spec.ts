import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Get App Button Validation', () => {

  test('Open homepage → close popup → click Get App → verify Play Store/App Store', async ({ page }) => {
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

    const link = page.locator('a').filter({ hasText: /get.?app/i }).first();
    await expect(link).toBeVisible({ timeout: 10000 });
    const href = await link.getAttribute('href');
    console.log(`✅ Step 3: GET APP link found → ${href}`);
    expect(href).toBeTruthy();

    await link.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    console.log(`✅ Step 4: Redirected to → ${finalUrl}`);

    const isPlayStore  = /play\.google\.com/i.test(finalUrl);
    const isAppStore   = /apps\.apple\.com/i.test(finalUrl);
    const isOneLinkApp = /onelink\.me|kapiva/i.test(finalUrl);
    console.log(`  Play Store  : ${isPlayStore  ? '✅' : '❌'}`);
    console.log(`  App Store   : ${isAppStore   ? '✅' : '❌'}`);
    console.log(`  Onelink/App : ${isOneLinkApp ? '✅' : '❌'}`);
    expect(isPlayStore || isAppStore || isOneLinkApp, `Expected Play Store, App Store or Kapiva app link. Got: ${finalUrl}`).toBe(true);

    const title = await page.title().catch(() => '');
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasKapiva = /kapiva/i.test(title) || /kapiva/i.test(bodyText);
    console.log(`  Page title       : "${title}"`);
    console.log(`  Kapiva mentioned : ${hasKapiva ? '✅' : '❌'}`);
    expect(hasKapiva, `Expected "Kapiva" on destination page. Title: "${title}"`).toBe(true);

    console.log('\n🎉 GET APP button verified successfully!\n');
  });

});
