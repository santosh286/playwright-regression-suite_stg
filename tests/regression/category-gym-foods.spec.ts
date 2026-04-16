import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/gym-foods/';

test.describe('Category — Gym Foods', () => {

  test('Open Gym Foods category → verify heading, product cards, prices, ATC buttons', async ({ page }) => {
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

    // Step 3: Navigate to Gym Foods category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify H1 heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/gym.*foods/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards — expect at least 2
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 2 product cards should be present').toBeGreaterThanOrEqual(2);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify names, prices on each card
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => ({
        productId: card.getAttribute('data-product-id'),
        name: card.querySelector('h2')?.textContent?.trim(),
        price: Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim(),
        hasBtn: !!card.querySelector('button'),
        hasLink: !!card.querySelector('a[href]'),
      }));
    });

    for (const card of cardData) {
      expect((card.name?.length || 0)).toBeGreaterThan(0);
      expect(card.price).toMatch(/₹\d+/);
    }
    console.log(`✅ Step 6: All ${cardData.length} cards have valid names and prices:`);
    cardData.forEach((c, i) => console.log(`   [${i + 1}] id=${c.productId} "${c.name}" — ${c.price}`));

    // Step 7: Verify ATC button exists on each card
    const allHaveBtn = cardData.every(c => c.hasBtn);
    expect(allHaveBtn, 'Every product card should have an ATC button').toBe(true);
    console.log(`✅ Step 7: ATC button present on all ${cardData.length} cards`);

    // Step 8: Verify all cards have product links
    const allHaveLinks = cardData.every(c => c.hasLink);
    expect(allHaveLinks, 'Every product card should have a link').toBe(true);
    console.log('✅ Step 8: All cards have product links');

    console.log('\n🎉 Gym Foods category validated successfully!\n');
  });

});
