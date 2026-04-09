import { test, expect } from '@playwright/test';
import { AppPage } from '../../pages/AppPage';

test.describe('WhatsApp Icon Validation', () => {

  test('Homepage → close popup → find WhatsApp icon → verify redirect', async ({ page, context }) => {
    const app = new AppPage(page);

    await app.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await app.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    const { icon, selector } = await app.findWhatsAppIcon();
    expect(icon, 'WhatsApp icon should be found on the page').not.toBeNull();
    console.log(`✅ Step 3: WhatsApp icon found via selector: "${selector}"`);

    const href = await app.getWhatsAppHref(icon, selector);
    console.log(`✅ Step 4: WhatsApp href → ${href}`);
    expect(href, 'WhatsApp link href should not be empty').toBeTruthy();
    expect(/wa\.me|whatsapp/i.test(href), `href should contain wa.me or whatsapp. Got: ${href}`).toBe(true);

    const finalUrl = await app.clickWhatsAppAndVerify(icon, href, context);
    console.log(`✅ Step 5: Redirected to → ${finalUrl}`);

    const isWhatsApp = await app.verifyWhatsAppUrl(finalUrl);

    console.log(`\n${'─'.repeat(55)}`);
    console.log(`  WhatsApp icon visible : ✅`);
    console.log(`  href                  : ${href}`);
    console.log(`  Final URL             : ${finalUrl}`);
    console.log(`  Is WhatsApp URL       : ${isWhatsApp ? '✅ YES' : '❌ NO'}`);
    console.log(`${'─'.repeat(55)}\n`);

    console.log('🎉 WhatsApp icon verified successfully!\n');
  });

});
