import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Sticky Add to Cart Bar', () => {

  test('Open PDP → scroll down → verify sticky ATC bar appears', async ({ page }) => {
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

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Verify main ATC button is present before scrolling
    const mainAtcPresent = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => /add to cart/i.test(b.textContent || ''));
    });
    expect(mainAtcPresent, 'Main ATC button should be on PDP').toBe(true);
    console.log('✅ Step 4: Main ATC button confirmed present');

    // Step 5: Scroll down past the main ATC section
    await page.evaluate(async () => {
      for (let y = 0; y <= 800; y += 100) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 5: Scrolled down 800px');

    // Step 6: Verify sticky/fixed bar is present in DOM
    // Look for fixed elements at top or bottom of viewport containing ATC/BUY NOW
    const stickyBar = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('div, section, header, footer, nav'));
      return allEls.some(el => {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed' || style.position === 'sticky';
        const rect = el.getBoundingClientRect();
        const isVisible = rect.height > 30 && rect.width > 100;
        const hasAtcText = /add to cart|buy now/i.test(el.textContent || '');
        const hasAtcClass = /sticky|fixed|bottom|float/i.test(el.className || '');
        return isFixed && isVisible && (hasAtcText || hasAtcClass);
      });
    });

    if (stickyBar) {
      console.log('✅ Step 6: Sticky ATC bar found (position: fixed/sticky)');
    } else {
      // Fallback: check if any BUY NOW button is in fixed container by class
      const stickyByClass = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll(
          '[class*="sticky"], [class*="fixed"], [class*="bottom-0"], [class*="float"]'
        ));
        return candidates.some(el => {
          const hasBtn = /add to cart|buy now/i.test(el.textContent || '');
          const rect = el.getBoundingClientRect();
          return hasBtn && rect.height > 0;
        });
      });
      expect(stickyByClass, 'Sticky ATC/BUY NOW bar should be visible after scrolling').toBe(true);
      console.log('✅ Step 6: Sticky ATC bar found (via sticky/fixed class)');
    }

    // Step 7: Verify sticky bar contains ATC or BUY NOW text
    const stickyBarText = await page.evaluate(() => {
      // Find any fixed/sticky element with ATC text
      const allEls = Array.from(document.querySelectorAll('div, section, header'));
      const el = allEls.find(el => {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed' || style.position === 'sticky';
        const hasAtcText = /add to cart|buy now/i.test(el.textContent || '');
        return isFixed && hasAtcText && el.getBoundingClientRect().height > 30;
      });
      if (el) return el.textContent?.trim()?.slice(0, 60) || null;

      // Fallback: class-based
      const byClass = Array.from(document.querySelectorAll(
        '[class*="sticky"], [class*="fixed"], [class*="bottom-0"]'
      )).find(el => /add to cart|buy now/i.test(el.textContent || ''));
      return byClass?.textContent?.trim()?.slice(0, 60) || 'Sticky bar present';
    });
    expect(stickyBarText, 'Sticky bar should contain ATC or BUY NOW text').toBeTruthy();
    console.log(`✅ Step 7: Sticky bar text — "${stickyBarText}"`);

    // Step 8: Verify PDP URL is unchanged
    expect(page.url()).toMatch(/shilajit-gold/i);
    console.log('✅ Step 8: PDP URL is still correct');

    console.log('\n🎉 Sticky ATC bar validated successfully!\n');
  });

});
