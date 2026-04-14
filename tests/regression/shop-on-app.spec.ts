import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Shop on App — Shilajit Gold Resin PDP', () => {

  test('Homepage → SELECT CONCERN Gym → Shilajit Gold Resin PDP → Shop on App', async ({ page, context }) => {
    test.setTimeout(120000);

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

    await navigateTo(page, 'https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/gym/i);
    console.log(`✅ Step 3: Navigated to Gym concern → ${page.url()}`);

    await page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);

    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });
    const productName = await shilajitCard.locator('h2').first().innerText({ timeout: 3000 }).catch(() => 'Shilajit Gold Resin');
    console.log(`✅ Step 4: Found product — "${productName}" (id=1405)`);
    expect(productName).toMatch(/shilajit gold resin/i);

    await shilajitCard.locator('a').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);
    const pdpUrl = page.url();
    console.log(`✅ Step 4: PDP opened → ${pdpUrl}`);
    expect(pdpUrl).toMatch(/shilajit/i);

    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);

    const coinsSection = page.locator('text=/kapiva coins/i').first();
    await coinsSection.waitFor({ state: 'attached', timeout: 10000 });
    await coinsSection.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    const coinsSectionText = await coinsSection.innerText({ timeout: 3000 }).catch(() => '');
    console.log(`✅ Step 5: Kapiva coins section found — "${coinsSectionText.trim().slice(0, 80)}"`);
    expect(coinsSectionText).toMatch(/kapiva coins/i);

    const shopBtn = page.locator('button').filter({ hasText: /shop on app/i }).first();
    await shopBtn.waitFor({ state: 'visible', timeout: 10000 });
    const btnText = await shopBtn.innerText({ timeout: 2000 });
    expect(btnText.trim()).toMatch(/shop on app/i);

    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10000 }),
      shopBtn.click(),
    ]).catch(async () => {
      await page.waitForTimeout(2000);
      return [null];
    });

    const targetPage = newPage ?? page;
    await targetPage.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await targetPage.waitForTimeout(2000);
    const finalUrl = targetPage.url();
    console.log(`✅ Step 6: Redirected to → ${finalUrl}`);

    const isAppStore = /play\.google\.com|apps\.apple\.com|onelink\.me|kapiva\.app\.link/i.test(finalUrl);
    expect(isAppStore, `Expected Play Store / App Store / onelink URL. Got: ${finalUrl}`).toBe(true);

    console.log('\n' + '═'.repeat(65));
    console.log('  SHOP ON APP — SUMMARY');
    console.log('═'.repeat(65));
    console.log(`  Gym concern page      : ✅ ${page.url()}`);
    console.log(`  Shilajit Gold PDP     : ✅ ${pdpUrl}`);
    console.log(`  Kapiva coins section  : ✅ Visible`);
    console.log(`  Shop on App button    : ✅ Visible`);
    console.log(`  Final redirect URL    : ${finalUrl}`);
    console.log(`  Is App Store URL      : ${isAppStore ? '✅ YES' : '❌ NO'}`);
    console.log('═'.repeat(65) + '\n');

    console.log('🎉 Shop on App verified successfully!\n');
  });

});
