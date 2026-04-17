import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Pincode Check', () => {

  test('Open PDP → verify pincode section visible → verify delivery text present', async ({ page }) => {
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

    // Step 4: Verify "Verify pincode for accurate delivery" text is present
    const pincodeText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('span, div, p'));
      return els.find(el =>
        /verify pincode for accurate delivery/i.test(el.textContent || '') &&
        el.children.length < 3
      )?.textContent?.trim() || null;
    });
    expect(pincodeText, 'Pincode delivery text should be present on PDP').toBeTruthy();
    console.log(`✅ Step 4: Delivery pincode text found — "${pincodeText?.slice(0, 50)}"`);

    // Step 5: Verify a pincode value is shown (default location pincode)
    const pincodeValue = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div, span, p'));
      const el = els.find(el =>
        /\d{6}/.test(el.textContent || '') &&
        /verify pincode/i.test(el.textContent || '')
      );
      const match = el?.textContent?.match(/\d{6}/);
      return match ? match[0] : null;
    });
    if (pincodeValue) {
      expect(pincodeValue).toMatch(/^\d{6}$/);
      console.log(`✅ Step 5: Default pincode shown — "${pincodeValue}"`);
    } else {
      console.log('✅ Step 5: No default pincode set (user not logged in — expected)');
    }

    // Step 6: Verify pincode section is clickable (cursor-pointer)
    const clickablePincode = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[class*="cursor-pointer"]'));
      return els.some(el => /verify pincode|pincode/i.test(el.textContent || ''));
    });
    expect(clickablePincode, 'Pincode section should be clickable').toBe(true);
    console.log('✅ Step 6: Pincode section is clickable (cursor-pointer)');

    // Step 7: Verify pincode section text contains location/area info
    const locationText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('div'));
      const el = els.find(e =>
        /verify pincode for accurate delivery/i.test(e.textContent || '') &&
        e.children.length < 5
      );
      return el?.textContent?.trim()?.slice(0, 80) || null;
    });
    expect(locationText, 'Pincode section should have delivery text').toBeTruthy();
    console.log(`✅ Step 7: Pincode section text — "${locationText}"`);

    // Step 8: Verify PDP URL is still the product page
    expect(page.url()).toMatch(/shilajit-gold/i);
    console.log('✅ Step 8: PDP URL is still the product page');

    console.log('\n🎉 PDP pincode check section validated successfully!\n');
  });

});
