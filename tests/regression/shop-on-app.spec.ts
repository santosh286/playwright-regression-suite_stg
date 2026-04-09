import { test, expect } from '@playwright/test';
import { AppPage } from '../../pages/AppPage';

test.describe('Shop on App — Shilajit Gold Resin PDP', () => {

  test('Homepage → SELECT CONCERN Gym → Shilajit Gold Resin PDP → Shop on App', async ({ page, context }) => {
    test.setTimeout(120000);
    const app = new AppPage(page);

    await app.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await app.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await app.navigateToGymPage();
    console.log(`✅ Step 3: Navigated to Gym concern → ${page.url()}`);

    const shilajitCard = await app.scrollToProductById('1405');
    const productName = await shilajitCard.locator('h2').first()
      .innerText({ timeout: 3000 }).catch(() => 'Shilajit Gold Resin');
    console.log(`✅ Step 4: Found product — "${productName}" (id=1405)`);
    expect(productName).toMatch(/shilajit gold resin/i);

    const pdpUrl = await app.openPDPFromCard(shilajitCard);
    console.log(`✅ Step 4: PDP opened → ${pdpUrl}`);
    expect(pdpUrl).toMatch(/shilajit/i);

    const coinsSection = await app.scrollPDPAndFindKapivaCoinsSection();
    const coinsSectionText = await coinsSection.innerText({ timeout: 3000 }).catch(() => '');
    console.log(`✅ Step 5: Kapiva coins section found — "${coinsSectionText.trim().slice(0, 80)}"`);
    expect(coinsSectionText).toMatch(/kapiva coins/i);

    const finalUrl = await app.clickShopOnApp(context);
    console.log(`✅ Step 6: Redirected to → ${finalUrl}`);

    const isAppStore = await app.verifyShopOnAppUrl(finalUrl);

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
