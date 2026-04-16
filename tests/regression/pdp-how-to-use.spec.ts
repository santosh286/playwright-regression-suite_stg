import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — How To Use & Product Specifications', () => {

  test('Open PDP → scroll → verify HOW TO USE, CUSTOMERS SPEAK, PRODUCT SPECIFICATIONS sections', async ({ page }) => {
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

    // Step 4: Scroll down to load all content sections
    await page.evaluate(async () => {
      for (let y = 0; y <= 8000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
    });
    await page.waitForTimeout(1500);
    console.log('✅ Step 4: Page scrolled to load all sections');

    // Step 5: Verify HOW TO USE section is present
    const howToUsePresent = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.some(h => /how\s*to\s*use/i.test(h.textContent || ''));
    });
    expect(howToUsePresent, 'HOW TO USE section heading should be present').toBe(true);
    console.log('✅ Step 5: HOW TO USE section heading verified');

    // Step 6: Scroll HOW TO USE into view and check content
    await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => /how\s*to\s*use/i.test(h.textContent || ''));
      h3?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(800);

    const howToUseContent = await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(h => /how\s*to\s*use/i.test(h.textContent || ''));
      const section = h3?.closest('section') || h3?.parentElement?.parentElement;
      return (section?.textContent?.trim().length || 0) > 20;
    });
    expect(howToUseContent, 'HOW TO USE section should have text content').toBe(true);
    console.log('✅ Step 6: HOW TO USE section has content');

    // Step 7: Verify CUSTOMERS SPEAK section is present
    const customersSpeakPresent = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.some(h => /customer.*speak|customers.*speak/i.test(h.textContent || ''));
    });
    expect(customersSpeakPresent, 'CUSTOMERS SPEAK section should be present').toBe(true);
    console.log('✅ Step 7: CUSTOMERS SPEAK section verified');

    // Step 8: Verify PRODUCT SPECIFICATIONS section is present
    const specsPresent = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.some(h => /product.*specification|specification/i.test(h.textContent || ''));
    });
    expect(specsPresent, 'PRODUCT SPECIFICATIONS section should be present').toBe(true);
    console.log('✅ Step 8: PRODUCT SPECIFICATIONS section verified');

    // Step 9: Verify WHY KAPIVA section is present
    const whyKapivaPresent = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.some(h => /why\s*kapiva/i.test(h.textContent || ''));
    });
    expect(whyKapivaPresent, 'WHY KAPIVA section should be present').toBe(true);
    console.log('✅ Step 9: WHY KAPIVA section verified');

    console.log('\n🎉 PDP content sections (HOW TO USE, SPECS, WHY KAPIVA) validated!\n');
  });

});
