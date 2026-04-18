import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/product/juices/';

test.describe('Category — Ayurveda Juices', () => {

  test('Open Juices category → verify heading, product cards, names, prices, links', async ({ page }) => {
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

    // Step 4: Verify H1 heading (may be visually hidden via is-srOnly on product pages)
    const h1 = page.locator('h1').first();
    await h1.waitFor({ state: 'attached', timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/juices/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 3 product cards should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify each card has name, price, and link
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => {
        // Try aria-label first (BigCommerce product pages store "Name,₹price" in aria-label)
        const link = card.querySelector('a[href][aria-label]') as HTMLAnchorElement | null;
        const ariaLabel = link?.getAttribute('aria-label') || '';
        const nameFromAria = ariaLabel.split(',')[0]?.trim();
        const priceFromAria = ariaLabel.match(/₹[\d,]+/)?.[0];
        // Fallback to heading element
        const nameFromEl = (card.querySelector('h2, h3, .card-title') as HTMLElement)?.innerText?.trim();
        const priceFromEl = Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim();
        return {
          name: nameFromAria || nameFromEl || '',
          price: priceFromAria || priceFromEl || '',
          hasLink: !!card.querySelector('a[href]'),
        };
      }).filter(c => c.name.length > 0); // skip template/empty cards
    });

    expect(cardData.length, 'At least 3 real product cards should be found').toBeGreaterThanOrEqual(3);
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

    console.log('\n🎉 Ayurveda Juices category validated successfully!\n');
  });

});
