import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const CATEGORY_URL = 'https://staging.kapiva.in/solution/weight-management/';

test.describe('Category — Weight Management', () => {

  test('Open Weight Management category → verify heading, products → click card → PDP opens', async ({ page }) => {
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

    // Step 3: Navigate to Weight Management category
    await navigateTo(page, CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: Category page opened → ${page.url()}`);

    // Step 4: Verify H1 heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/weight.*management/i);
    console.log(`✅ Step 4: H1 verified — "${h1Text.trim()}"`);

    // Step 5: Count product cards — expect at least 5
    const cards = page.locator('[data-product-id]');
    const cardCount = await cards.count();
    expect(cardCount, 'At least 5 product cards should be present').toBeGreaterThanOrEqual(5);
    console.log(`✅ Step 5: Found ${cardCount} product cards`);

    // Step 6: Verify names and prices on all cards
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-product-id]'));
      return cards.map(card => ({
        name: card.querySelector('h2')?.textContent?.trim(),
        price: Array.from(card.querySelectorAll('span')).find(s => /₹/.test(s.textContent || ''))?.textContent?.trim(),
        linkHref: card.querySelector('a[href]')?.getAttribute('href'),
      }));
    });

    for (const card of cardData) {
      expect((card.name?.length || 0), `Product name should not be empty`).toBeGreaterThan(0);
      expect(card.price, `Price should contain ₹`).toMatch(/₹\d+/);
    }
    console.log(`✅ Step 6: All ${cardData.length} cards verified — names and prices present`);
    cardData.forEach((c, i) => console.log(`   [${i + 1}] "${c.name}" — ${c.price}`));

    // Step 7: Click first product card link → verify PDP opens
    const firstProductName = cardData[0].name;
    const firstLink = page.locator('[data-product-id] a[href]').first();
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1500);

    const pdpUrl = page.url();
    expect(pdpUrl, 'Should navigate away from category page').not.toMatch(/weight-management\/?$/);
    expect(pdpUrl).toMatch(/staging\.kapiva\.in/);
    console.log(`✅ Step 7: Clicked "${firstProductName}" → navigated to ${pdpUrl}`);

    // Step 8: Verify PDP has an H1
    const pdpH1 = page.locator('h1').first();
    await expect(pdpH1).toBeVisible({ timeout: 10000 });
    const pdpH1Text = await pdpH1.innerText();
    expect(pdpH1Text.trim().length).toBeGreaterThan(0);
    console.log(`✅ Step 8: PDP H1 — "${pdpH1Text.trim()}"`);

    console.log('\n🎉 Weight Management category + PDP navigation validated!\n');
  });

});
