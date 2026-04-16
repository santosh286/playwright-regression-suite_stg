import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Benefits Section', () => {

  test('Open PDP → scroll to benefits → verify heading and content visible', async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Scroll down to trigger lazy-loaded benefits section
    await page.evaluate(async () => {
      for (let y = 0; y <= 5000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 4: Page scrolled to load benefits section');

    // Step 5: Verify "benefits of..." H3 heading is in DOM
    const benefitHeadings = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.filter(h => /benefit/i.test(h.textContent || '')).map(h => h.textContent?.trim());
    });
    expect(benefitHeadings.length, 'At least 1 benefits heading should be present').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 5: Benefits headings found: ${benefitHeadings.join(', ')}`);

    // Step 6: Scroll benefits heading into view and verify section has content
    await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => /benefit/i.test(h.textContent || ''));
      h3?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(800);

    const benefitsContent = await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => /benefit/i.test(h.textContent || ''));
      const section = h3?.closest('section') || h3?.parentElement?.parentElement;
      return {
        sectionText: section?.textContent?.trim()?.slice(0, 200) || '',
        hasImages: (section?.querySelectorAll('img').length || 0) > 0,
        hasText: (section?.textContent?.trim().length || 0) > 20,
      };
    });

    expect(benefitsContent.hasText, 'Benefits section should have text content').toBe(true);
    console.log(`✅ Step 6: Benefits section has content, images: ${benefitsContent.hasImages}`);

    // Step 7: Verify "KEY INGREDIENTS" heading is also present
    const keyIngrPresent = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.some(h => /key.*ingredient|ingredient/i.test(h.textContent || ''));
    });
    expect(keyIngrPresent, 'KEY INGREDIENTS heading should be present on PDP').toBe(true);
    console.log('✅ Step 7: KEY INGREDIENTS section verified');

    // Step 8: Verify "SUITABLE FOR" heading is present
    const suitableForPresent = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return h3s.some(h => /suitable.*for/i.test(h.textContent || ''));
    });
    expect(suitableForPresent, 'SUITABLE FOR heading should be present on PDP').toBe(true);
    console.log('✅ Step 8: SUITABLE FOR section verified');

    console.log('\n🎉 PDP Benefits section validated successfully!\n');
  });

});
