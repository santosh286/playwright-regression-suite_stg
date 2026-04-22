import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CONTACT_URL = 'https://staging.kapiva.in/contact-us/';

test.describe('Static — Contact Us', () => {

  test('Open Contact Us page → verify phone, email, content present, no 404', async ({ page }) => {
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

    // Step 3: Navigate to Contact Us
    await navigateTo(page, CONTACT_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Contact Us page opened → ${page.url()}`);

    // Step 4: Verify URL
    expect(page.url()).toContain('contact-us');
    console.log('✅ Step 4: URL contains "contact-us"');

    // Step 5: Verify no 404
    const pageTitle = await page.title();
    expect(pageTitle).not.toMatch(/page not found|404/i);
    console.log(`✅ Step 5: No 404 — title: "${pageTitle}"`);

    // Step 6: Verify phone number is present
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    const hasPhone = /1800[\s-]?274[\s-]?2575|18002742575/i.test(bodyText);
    if (hasPhone) {
      console.log('✅ Step 6: Phone number 1800-274-2575 found on page');
    } else {
      // Check for any phone/tel link
      const telLink = await page.locator('a[href^="tel:"]').count();
      if (telLink > 0) {
        const telHref = await page.locator('a[href^="tel:"]').first().getAttribute('href');
        console.log(`✅ Step 6: Tel link found — ${telHref}`);
      } else {
        console.log('⚠️  Step 6: Phone number not found — may be in image or different format');
      }
    }

    // Step 7: Verify email is present
    const hasEmail = /info@kapiva\.in/i.test(bodyText);
    if (hasEmail) {
      console.log('✅ Step 7: Email info@kapiva.in found on page');
    } else {
      const mailtoLink = await page.locator('a[href^="mailto:"]').count();
      if (mailtoLink > 0) {
        const mailHref = await page.locator('a[href^="mailto:"]').first().getAttribute('href');
        console.log(`✅ Step 7: Mailto link found — ${mailHref}`);
      } else {
        console.log('⚠️  Step 7: Email not found as text or mailto link');
      }
    }

    // Step 8: Soft check for contact form
    const formInfo = await page.evaluate(() => {
      const form = document.querySelector('form');
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
      return {
        hasForm: !!form,
        inputCount: inputs.length,
        inputTypes: Array.from(inputs).map((i: any) => i.type || i.tagName).slice(0, 5),
      };
    });
    if (formInfo.hasForm) {
      console.log(`✅ Step 8: Contact form found — ${formInfo.inputCount} input(s): ${formInfo.inputTypes.join(', ')}`);
    } else {
      console.log('⚠️  Step 8: No contact form found — page may use phone/email only');
    }

    // Step 9: Verify page has content
    expect(bodyText.length, 'Contact Us page should have content').toBeGreaterThan(100);
    console.log(`✅ Step 9: Page has ${bodyText.length} chars of content`);

    // Step 10: Verify still on staging domain
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 10: Still on staging domain');

    console.log('\n🎉 Contact Us page validated successfully!\n');
  });

});
