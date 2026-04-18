import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/ayurveda/';

test.describe('Category — Ayurveda', () => {

  test('Open Ayurveda category → verify heading, product cards, names, prices, links', async ({ page }) => {
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

    // Step 3: Navigate to Ayurveda category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify H1 heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/ayurveda/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 3 product cards should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify each card has name, price, and link
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => ({
        name: card.querySelector('h2')?.textContent?.trim(),
        price: Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim(),
        hasLink: !!card.querySelector('a[href]'),
      }));
    });

    let passed = 0;
    for (const card of cardData) {
      const ok = (card.name?.length || 0) > 0 && /₹/.test(card.price || '') && card.hasLink;
      if (ok) passed++;
      console.log(`   ${ok ? '✅' : '❌'} "${card.name}" — ${card.price} — link: ${card.hasLink}`);
    }
    expect(passed, 'All cards should have name + price + link').toBe(cardData.length);
    console.log(`✅ Step 6: All ${cardData.length} cards have name, price and link`);

    // Step 7: Verify URL stays on staging domain
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 7: Still on staging domain');

    console.log('\n🎉 Ayurveda category validated successfully!\n');
  });

});
