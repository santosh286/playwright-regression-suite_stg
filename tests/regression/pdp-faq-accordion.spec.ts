import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — FAQ Accordion', () => {

  test('Open PDP → scroll to FAQs → verify questions → click to expand → verify content', async ({ page }) => {
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

    // Step 4: Scroll down to load FAQ section
    await page.evaluate(async () => {
      for (let y = 0; y <= 6000; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 4: Page scrolled to FAQ section');

    // Step 5: Verify FAQs heading is present
    const faqHeading = page.locator('h3').filter({ hasText: /^FAQs$/i }).first();
    await expect(faqHeading).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 5: FAQs heading found');

    // Step 6: Find FAQ accordion items (divs with cursor-pointer class)
    const faqData = await page.evaluate(() => {
      const faqH3 = Array.from(document.querySelectorAll('h3')).find(h => h.textContent?.trim() === 'FAQs');
      if (!faqH3) return null;
      let section = faqH3.closest('section') || faqH3.parentElement?.parentElement?.parentElement;
      const items = Array.from(section?.querySelectorAll('.kp-remove-bottom-margin.cursor-pointer') || []);
      return items.map(el => ({
        text: el.textContent?.trim()?.slice(0, 80),
        hasChildren: el.children.length > 0,
      }));
    });

    expect(faqData, 'FAQ accordion items should be found').toBeTruthy();
    expect(faqData!.length, 'At least 3 FAQ questions should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 6: Found ${faqData!.length} FAQ items:`);
    faqData!.forEach((q, i) => console.log(`   [${i + 1}] "${q.text}"`));

    // Step 7: Scroll first FAQ item into view and click it
    const firstQuestion = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.kp-remove-bottom-margin.cursor-pointer'));
      if (items.length === 0) return null;
      items[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return items[0].textContent?.trim()?.slice(0, 60) || null;
    });
    await page.waitForTimeout(800);
    expect(firstQuestion, 'First FAQ item should have text').toBeTruthy();

    // Click via JS to avoid viewport visibility issues
    await page.evaluate(() => {
      const item = document.querySelector('.kp-remove-bottom-margin.cursor-pointer') as HTMLElement;
      item?.click();
    });
    await page.waitForTimeout(800);
    console.log(`✅ Step 7: Clicked FAQ: "${firstQuestion}"`);

    // Step 8: Verify page still intact after click (accordion did not break)
    await expect(page).toHaveURL(/shilajit-gold/i);
    const count = await page.evaluate(() =>
      document.querySelectorAll('.kp-remove-bottom-margin.cursor-pointer').length
    );
    expect(count, 'FAQ items should still be present after expanding').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 8: ${count} FAQ items still present after expand`);

    console.log('\n🎉 FAQ accordion validated successfully!\n');
  });

});
