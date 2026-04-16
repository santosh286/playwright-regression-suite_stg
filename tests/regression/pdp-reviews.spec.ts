import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Customer Reviews', () => {

  test('Open PDP → verify rating badge → scroll to Customer Reviews → verify review cards', async ({ page }) => {
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

    // Step 4: Verify rating badge visible near top of PDP (e.g., "4.6/5 (5275)")
    const ratingBadge = page.locator('.kp-review-small.kp-pdp-preview-badge').first();
    await expect(ratingBadge).toBeAttached({ timeout: 10000 });
    const ratingText = await ratingBadge.textContent();
    expect(ratingText, 'Rating badge should have text').toBeTruthy();
    expect(ratingText).toMatch(/\d+\.\d+\/5/);
    console.log(`✅ Step 4: Rating badge — "${ratingText?.trim()}"`);

    // Step 5: Extract rating value and review count
    const ratingInfo = await page.evaluate(() => {
      const badge = document.querySelector('.kp-review-small.kp-pdp-preview-badge');
      const text = badge?.textContent?.trim() || '';
      const ratingMatch = text.match(/(\d+\.\d+)\/5/);
      const countMatch = text.match(/\((\d+)\)/);
      return {
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        count: countMatch ? parseInt(countMatch[1]) : null,
      };
    });

    expect(ratingInfo.rating, 'Rating should be a number between 1 and 5').toBeTruthy();
    expect(ratingInfo.rating!).toBeGreaterThanOrEqual(1);
    expect(ratingInfo.rating!).toBeLessThanOrEqual(5);
    console.log(`✅ Step 5: Rating = ${ratingInfo.rating}/5, Reviews = ${ratingInfo.count}`);

    // Step 6: Scroll down to Customer Reviews section
    await page.evaluate(async () => {
      for (let y = 0; y <= 8000; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
    });
    await page.waitForTimeout(1000);

    const reviewH2 = page.locator('h2').filter({ hasText: /Customer Reviews/i }).first();
    await expect(reviewH2).toBeAttached({ timeout: 10000 });
    console.log('✅ Step 6: "Customer Reviews" section heading found');

    // Step 7: Scroll Reviews heading into view
    await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => /customer review/i.test(h.textContent || ''));
      h2?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(800);

    // Step 8: Verify individual review titles (H3 inside reviews section)
    const reviewTitles = await page.evaluate(() => {
      const reviewH2 = Array.from(document.querySelectorAll('h2')).find(h => /customer review/i.test(h.textContent || ''));
      const container = reviewH2?.closest('section') || reviewH2?.parentElement?.parentElement;
      const h3s = container ? Array.from(container.querySelectorAll('h3')) : [];
      return h3s.map(h => h.textContent?.trim()).filter(t => t && t.length > 0);
    });

    expect(reviewTitles.length, 'At least 1 individual review should be visible').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 8: Found ${reviewTitles.length} individual review(s):`);
    reviewTitles.forEach((t, i) => console.log(`   [${i + 1}] "${t}"`));

    console.log('\n🎉 Customer Reviews section validated successfully!\n');
  });

});
