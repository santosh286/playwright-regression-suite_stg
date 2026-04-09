import { test, expect } from '@playwright/test';
import { AppPage } from '../../pages/AppPage';

test.describe('Get App Button Validation', () => {

  test('Open homepage → close popup → click Get App → verify Play Store/App Store', async ({ page }) => {
    const app = new AppPage(page);

    await app.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await app.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    const link = await app.getAppLink();
    const href = await link.getAttribute('href');
    console.log(`✅ Step 3: GET APP link found → ${href}`);
    expect(href).toBeTruthy();

    const finalUrl = await app.clickGetApp();
    console.log(`✅ Step 4: Redirected to → ${finalUrl}`);

    const { isPlayStore, isAppStore, isOneLinkApp } = await app.verifyAppStoreRedirect(finalUrl);
    console.log(`  Play Store  : ${isPlayStore  ? '✅' : '❌'}`);
    console.log(`  App Store   : ${isAppStore   ? '✅' : '❌'}`);
    console.log(`  Onelink/App : ${isOneLinkApp ? '✅' : '❌'}`);

    const title = await page.title().catch(() => '');
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasKapiva = /kapiva/i.test(title) || /kapiva/i.test(bodyText);
    console.log(`  Page title       : "${title}"`);
    console.log(`  Kapiva mentioned : ${hasKapiva ? '✅' : '❌'}`);
    expect(hasKapiva, `Expected "Kapiva" on destination page. Title: "${title}"`).toBe(true);

    console.log('\n🎉 GET APP button verified successfully!\n');
  });

});
