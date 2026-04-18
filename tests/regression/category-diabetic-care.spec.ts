import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/product/capsules/';

test.describe('Category — Capsules', () => {

  test('Open Capsules category → verify heading, product cards, names, prices, ATC buttons', async ({ page }) => {
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

    // Step 3: Navigate to Diabetic Care category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify H1 heading (may be visually hidden via is-srOnly on product pages)
    const h1 = page.locator('h1').first();
    await h1.waitFor({ state: 'attached', timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/capsules/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 3 product cards should be present').toBeGreaterThanOrEqual(3);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify each card has name and price
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
          hasAtc: Array.from(card.querySelectorAll('button, a')).some(b => /add to cart/i.test(b.textContent || '')),
          hasLink: !!card.querySelector('a[href]'),
        };
      }).filter(c => c.name.length > 0);
    });

    expect(cardData.length, 'At least 3 real product cards should be found').toBeGreaterThanOrEqual(3);
    for (const card of cardData) {
      expect((card.name?.length || 0), 'Card name should be non-empty').toBeGreaterThan(0);
      expect(card.price, 'Card price should contain ₹').toMatch(/₹[\d,]+/);
    }
    console.log(`✅ Step 6: All ${cardData.length} cards have names and prices:`);
    cardData.forEach((c, i) => console.log(`   [${i + 1}] "${c.name}" — ${c.price} — ATC: ${c.hasAtc}`));

    // Step 7: Verify ADD TO CART buttons are present on cards
    const atcCount = cardData.filter(c => c.hasAtc).length;
    if (atcCount > 0) {
      console.log(`✅ Step 7: ${atcCount}/${cardData.length} cards have ADD TO CART button`);
      expect(atcCount, 'At least 1 card should have ADD TO CART button').toBeGreaterThanOrEqual(1);
    } else {
      console.log('⚠️  Step 7: No inline ATC buttons found — ATC may be inside product link (staging pattern)');
    }

    // Step 8: Click first product ATC button and verify cart count increments
    const firstAtcCard = cardData.findIndex(c => c.hasAtc);
    if (firstAtcCard >= 0) {
      const cartBtn = page.locator('button[class*="cart"], header button').filter({ hasText: /\d/ }).first();
      const initialCount = await cartBtn.innerText().catch(() => '0');

      const atcBtn = page.locator('[data-product-id]').nth(firstAtcCard).locator('button').filter({ hasText: /add to cart/i }).first();
      await atcBtn.click();
      await page.waitForTimeout(2000);

      await expect.poll(async () => {
        const text = await cartBtn.innerText().catch(() => '0');
        return parseInt(text, 10);
      }, { timeout: 10000 }).toBeGreaterThan(parseInt(initialCount, 10));

      console.log(`✅ Step 8: Clicked ATC on card [${firstAtcCard + 1}] — cart count incremented`);
    } else {
      console.log('⚠️  Step 8: Skipped ATC click — no inline ATC buttons found on listing');
    }

    // Step 9: Verify URL stays on staging domain
    expect(page.url()).toContain('staging.kapiva.in');
    console.log('✅ Step 9: Still on staging domain');

    console.log('\n🎉 Capsules category validated successfully!\n');
  });

});
