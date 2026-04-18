import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/skin-care/';

test.describe('Category — Skin Care', () => {

  test('Open Skin Care category → verify heading, product cards, images load, links valid', async ({ page }) => {
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

    // Step 3: Navigate to Skin Care category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify H1 heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/skin.*care/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 3 product cards should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify names, prices, images, and links
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => ({
        name: card.querySelector('h2')?.textContent?.trim(),
        price: Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim(),
        hasLink: !!card.querySelector('a[href]'),
        imgSrc: (card.querySelector('img') as HTMLImageElement)?.src || '',
        imgLoaded: (card.querySelector('img') as HTMLImageElement)?.complete &&
                   ((card.querySelector('img') as HTMLImageElement)?.naturalWidth || 0) > 0,
      }));
    });

    for (const card of cardData) {
      expect((card.name?.length || 0), `Card name should be non-empty`).toBeGreaterThan(0);
      expect(card.price, `Card price should contain ₹`).toMatch(/₹\d+/);
      expect(card.hasLink, `Card should have a link`).toBe(true);
    }
    console.log(`✅ Step 6: All ${cardData.length} cards have names, prices and links:`);
    cardData.forEach((c, i) => console.log(`   [${i + 1}] "${c.name}" — ${c.price}`));

    // Step 7: Verify product images — 80% pass threshold
    const loadedImgs = cardData.filter(c => c.imgLoaded);
    const imgPassRate = Math.round((loadedImgs.length / cardData.length) * 100);
    console.log(`✅ Step 7: ${loadedImgs.length}/${cardData.length} product images loaded (${imgPassRate}%)`);
    expect(imgPassRate, 'At least 80% of product images should load').toBeGreaterThanOrEqual(80);

    // Step 8: Verify all links point to staging
    const allLinksStaging = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.every(card => {
        const href = card.querySelector('a[href]')?.getAttribute('href') || '';
        return href.startsWith('/') || href.includes('staging.kapiva.in');
      });
    });
    expect(allLinksStaging, 'All product links should point to staging').toBe(true);
    console.log('✅ Step 8: All product links point to staging');

    console.log('\n🎉 Skin Care category validated successfully!\n');
  });

});
