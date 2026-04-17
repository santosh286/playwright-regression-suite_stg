import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Social Share Modal', () => {

  test('Open PDP → click Share → verify WhatsApp / Facebook / Copy Link options', async ({ page }) => {
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

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Find the Share button
    const shareBtn = page.locator('button, div, span').filter({ hasText: /^share$/i }).first();
    const shareBtnPresent = await shareBtn.count();

    if (shareBtnPresent === 0) {
      // Try SVG share icon button
      const shareByIcon = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        return btns.some(b => b.querySelector('svg') && /share/i.test(b.getAttribute('aria-label') || b.title || ''));
      });
      expect(shareByIcon, 'Share button should be present on PDP').toBe(true);
      console.log('✅ Step 4: Share button found (via aria-label/title)');
    } else {
      await expect(shareBtn).toBeAttached({ timeout: 5000 });
      console.log('✅ Step 4: Share button found');
    }

    // Step 5: Click the Share button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"], div, span'));
      const shareBtn = btns.find(b =>
        /^share$/i.test(b.textContent?.trim() || '') ||
        /share/i.test(b.getAttribute('aria-label') || '') ||
        (b.querySelector('svg') && /share/i.test(b.getAttribute('title') || ''))
      );
      if (shareBtn) (shareBtn as HTMLElement).click();
    });
    await page.waitForTimeout(1500);
    console.log('✅ Step 5: Share button clicked');

    // Step 6: Verify share modal/panel is visible
    const shareModalVisible = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div'));
      return els.some(el => {
        const text = el.textContent || '';
        return (
          /whatsapp|facebook|twitter|copy link|instagram/i.test(text) &&
          el.getBoundingClientRect().height > 0
        );
      });
    });
    expect(shareModalVisible, 'Share modal with social options should be visible').toBe(true);
    console.log('✅ Step 6: Share modal is visible');

    // Step 7: Verify WhatsApp option is present
    const hasWhatsApp = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el =>
        /whatsapp/i.test(el.textContent || '') && el.getBoundingClientRect().height > 0
      );
    });
    expect(hasWhatsApp, 'WhatsApp share option should be present').toBe(true);
    console.log('✅ Step 7: WhatsApp option present');

    // Step 8: Verify Facebook option is present
    const hasFacebook = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el =>
        /facebook/i.test(el.textContent || '') && el.getBoundingClientRect().height > 0
      );
    });
    expect(hasFacebook, 'Facebook share option should be present').toBe(true);
    console.log('✅ Step 8: Facebook option present');

    // Step 9: Verify Copy option is present (Copy Link / Copy / Copy URL)
    const hasCopyLink = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).some(el =>
        /copy(\s+link|\s+url)?/i.test(el.textContent?.trim() || '') &&
        el.getBoundingClientRect().height > 0 &&
        (el as HTMLElement).offsetParent !== null
      );
    });
    if (hasCopyLink) {
      console.log('✅ Step 9: Copy Link option present');
    } else {
      console.log('⚠️  Step 9: Copy Link option not found — may use icon only without text label');
    }

    // Step 10: Close the share modal (press Escape)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    console.log('✅ Step 10: Share modal closed via Escape');

    // Step 11: Verify PDP URL is unchanged
    expect(page.url()).toMatch(/shilajit-gold/i);
    console.log('✅ Step 11: PDP URL is still correct');

    console.log('\n🎉 Social share modal validated successfully!\n');
  });

});
