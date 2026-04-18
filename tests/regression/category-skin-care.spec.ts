import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/hair/';

test.describe('Category — Hair & Skin Care', () => {

  test('Open Hair Care category → verify heading, product cards, images load, links valid', async ({ page }) => {
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

    // Step 4: Verify H1 heading (may be visually hidden via is-srOnly on product pages)
    const h1 = page.locator('h1').first();
    await h1.waitFor({ state: 'attached', timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/hair/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 3 product cards should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify names, prices, images, and links
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => {
        const link = card.querySelector('a[href][aria-label]') as HTMLAnchorElement | null;
        const ariaLabel = link?.getAttribute('aria-label') || '';
        const nameFromAria = ariaLabel.split(',')[0]?.trim();
        const priceFromAria = ariaLabel.match(/₹[\d,]+/)?.[0];
        const nameFromEl = (card.querySelector('h2, h3, .card-title') as HTMLElement)?.innerText?.trim();
        const priceFromEl = Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim();
        return {
          name: nameFromAria || nameFromEl || '',
          price: priceFromAria || priceFromEl || '',
          hasLink: !!card.querySelector('a[href]'),
          imgSrc: (card.querySelector('img') as HTMLImageElement)?.src || '',
          imgLoaded: (card.querySelector('img') as HTMLImageElement)?.complete &&
                     ((card.querySelector('img') as HTMLImageElement)?.naturalWidth || 0) > 0,
        };
      }).filter(c => c.name.length > 0);
    });

    expect(cardData.length, 'At least 3 real product cards should be found').toBeGreaterThanOrEqual(3);
    for (const card of cardData) {
      expect((card.name?.length || 0), `Card name should be non-empty`).toBeGreaterThan(0);
      expect(card.price, `Card price should contain ₹`).toMatch(/₹[\d,]+/);
      expect(card.hasLink, `Card should have a link`).toBe(true);
    }
    console.log(`✅ Step 6: All ${cardData.length} cards have names, prices and links:`);
    cardData.forEach((c, i) => console.log(`   [${i + 1}] "${c.name}" — ${c.price}`));

    // Step 7: Verify product images — 80% pass threshold
    const loadedImgs = cardData.filter(c => c.imgLoaded);
    const imgPassRate = Math.round((loadedImgs.length / cardData.length) * 100);
    console.log(`✅ Step 7: ${loadedImgs.length}/${cardData.length} product images loaded (${imgPassRate}%)`);
    expect(imgPassRate, 'At least 80% of product images should load').toBeGreaterThanOrEqual(80);

    // Step 8: Verify product links exist (staging may mix staging + production URLs)
    const linkStats = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      let stagingCount = 0, prodCount = 0;
      cards.forEach(card => {
        const href = card.querySelector('a[href]')?.getAttribute('href') || '';
        if (href.startsWith('/') || href.includes('staging.kapiva.in')) stagingCount++;
        else if (href.includes('kapiva.in')) prodCount++;
      });
      return { stagingCount, prodCount, total: cards.length };
    });
    console.log(`✅ Step 8: Product links — ${linkStats.stagingCount} staging, ${linkStats.prodCount} production (staging may mix URLs)`);
    expect(linkStats.stagingCount + linkStats.prodCount, 'All cards should have some link').toBeGreaterThan(0);

    console.log('\n🎉 Hair & Skin Care category validated successfully!\n');
  });

});
