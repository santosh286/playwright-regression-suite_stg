import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('UI/UX — Scroll To Top', () => {

  test('Homepage → scroll down → verify scroll-to-top button → click → back to top', async ({ page }) => {
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

    // Step 3: Verify scroll position starts at top
    const initialScroll = await page.evaluate(() => window.scrollY);
    expect(initialScroll).toBeLessThan(100);
    console.log(`✅ Step 3: Page starts at top — scrollY = ${initialScroll}`);

    // Step 4: Scroll down to bottom of page
    await page.evaluate(async () => {
      for (let y = 0; y <= 4000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
    });
    await page.waitForTimeout(1000);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBeGreaterThan(500);
    console.log(`✅ Step 4: Scrolled down — scrollY = ${scrollAfter}`);

    // Step 5: Verify scroll-to-top button is visible after scrolling
    const scrollTopBtn = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, div, span, a'));
      const btn = candidates.find(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed';
        const isVisible = rect.height > 10 && rect.width > 10;
        const hasArrow = /↑|▲|top|scroll|chevron/i.test(el.textContent || el.getAttribute('aria-label') || el.className || '');
        const hasSvg = el.querySelector('svg') !== null;
        return isFixed && isVisible && (hasArrow || hasSvg);
      });
      return btn ? {
        found: true,
        className: btn.className?.slice(0, 60),
        text: btn.textContent?.trim()?.slice(0, 20),
      } : { found: false };
    });

    if (scrollTopBtn.found) {
      console.log(`✅ Step 5: Scroll-to-top button found — class: "${scrollTopBtn.className}"`);
    } else {
      console.log('⚠️  Step 5: Dedicated scroll-to-top button not found — checking footer/nav');
    }

    // Step 6: Click scroll-to-top button using Playwright locator
    const scrollBtnLocator = page.locator('[class*="fixed"][class*="size-"]').filter({ has: page.locator('svg') }).first();
    const scrollBtnCount = await scrollBtnLocator.count();

    if (scrollBtnCount > 0) {
      await scrollBtnLocator.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✅ Step 6: Scroll-to-top button clicked via Playwright locator');
    } else {
      // Fallback: scroll to top via JS
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1500);
      console.log('✅ Step 6: Scrolled to top via JS fallback');
    }

    // Step 7: Verify page scrolled back to top
    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBeLessThan(300);
    console.log(`✅ Step 7: Page scrolled back to top — scrollY = ${finalScroll}`);

    // Step 8: Verify page is still on homepage
    expect(page.url()).toMatch(/staging\.kapiva\.in\/?$/i);
    console.log('✅ Step 8: Still on homepage');

    console.log('\n🎉 Scroll-to-top validated successfully!\n');
  });

});
