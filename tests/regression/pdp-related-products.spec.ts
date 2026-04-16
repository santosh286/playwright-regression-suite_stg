import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Related Products', () => {

  test('Open PDP → scroll to related products → verify at least 2 product cards', async ({ page }) => {
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

    // Step 4: Scroll down fully to trigger related product sections
    await page.evaluate(async () => {
      for (let y = 0; y <= 10000; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 100));
      }
    });
    await page.waitForTimeout(1500);
    console.log('✅ Step 4: Scrolled page to load related products');

    // Step 5: Find related product H2 cards (products shown below main product)
    const relatedProducts = await page.evaluate(() => {
      // Related products appear as H2 elements inside cards with class "mb-2.5 p-2.5 pb-0"
      const productCards = Array.from(document.querySelectorAll('h2')).filter(h2 => {
        const parent = h2.parentElement;
        return parent?.className?.includes('mb-2.5') && parent?.className?.includes('p-2.5');
      });
      return productCards.map(h2 => ({
        name: h2.textContent?.trim(),
        parentClass: h2.parentElement?.className?.slice(0, 60),
      }));
    });

    expect(relatedProducts.length, 'At least 2 related products should be visible').toBeGreaterThanOrEqual(2);
    console.log(`✅ Step 5: Found ${relatedProducts.length} related product(s):`);
    relatedProducts.forEach((p, i) => console.log(`   [${i + 1}] "${p.name}"`));

    // Step 6: Verify each related product has a non-empty name
    for (const product of relatedProducts) {
      expect(product.name?.length, `Related product name should not be empty`).toBeGreaterThan(0);
    }
    console.log('✅ Step 6: All related product names are non-empty');

    // Step 7: Find ADD buttons next to related products and verify at least one exists
    const addBtnCount = await page.evaluate(() => {
      const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'ADD');
      return addBtns.length;
    });
    expect(addBtnCount, 'At least 1 ADD button should exist for related products').toBeGreaterThanOrEqual(1);
    console.log(`✅ Step 7: Found ${addBtnCount} ADD button(s) for related products`);

    console.log('\n🎉 Related products section validated successfully!\n');
  });

});
