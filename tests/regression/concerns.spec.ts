import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('Kapiva – Concerns Flow', () => {

  test('Concerns → list all concerns → URL contains staging', async ({ page }) => {
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Kapiva/i);

    const concernsContainer = page.locator('div.relative.flex.flex-wrap.items-center.justify-start');
    await expect(concernsContainer).toBeVisible();

    const concernLabels = concernsContainer.locator('p:visible');
    const texts = await concernLabels.allInnerTexts();
    const concerns = Array.from(new Set(texts.map(t => t.trim()).filter(t => t && t !== 'SELECT CONCERN:')));

    console.log('\n✅ SELECT CONCERN tiles on staging:');
    concerns.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));

    expect(concerns.length, 'At least 1 concern should be listed').toBeGreaterThan(0);
    await expect(page).toHaveURL(/staging\.kapiva\.in/i);
  });

  test('SELECT CONCERN — verify all tiles have image and name', async ({ page }) => {
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Kapiva/i);
    console.log('\n✅ Step 1: Homepage opened');

    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    await page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 3: Scrolled to load concern tiles');

    const tiles: any[] = await page.evaluate(() => {
      const container = Array.from(document.querySelectorAll('*')).find(el => {
        const cls = (el.className || '').toString();
        return cls.includes('flex-wrap') && cls.includes('items-center') && cls.includes('justify-start') && cls.includes('gap-[7px]');
      });
      if (!container) return [];
      return Array.from(container.children).map((tile, i) => {
        const allImgs = Array.from(tile.querySelectorAll('img')) as HTMLImageElement[];
        const lgImg = allImgs.find(im => { const cls = (im.className || '').toString(); return cls.includes('hidden') && cls.includes('lg:block'); });
        const anyImg = allImgs[0];
        const img = lgImg || anyImg;
        const imgSrc = img?.src || img?.getAttribute('src') || img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';
        const imgVisible = img ? window.getComputedStyle(img).display !== 'none' && window.getComputedStyle(img).visibility !== 'hidden' && img.offsetWidth > 0 && img.offsetHeight > 0 : false;
        const imgLoaded = img ? img.complete && img.naturalWidth > 0 : false;
        const nameEl = Array.from(tile.querySelectorAll('p')).find((p: any) => p.textContent?.trim());
        return { index: i + 1, name: (nameEl as any)?.textContent?.trim() || '', imgSrc, imgAlt: img?.alt || '', imgVisible, imgLoaded };
      }).filter((t: any) => t.name || t.imgSrc);
    });

    console.log(`\n✅ Step 4: Found ${tiles.length} SELECT CONCERN tile(s)\n`);
    console.log('─'.repeat(95));
    console.log(`${'#'.padEnd(3)} | ${'Name'.padEnd(22)} | ${'Has Img'.padEnd(8)} | ${'Visible'.padEnd(10)} | ${'Loaded'.padEnd(10)} | ${'Has Name'}`);
    console.log('─'.repeat(95));

    for (const t of tiles) {
      const hasImg  = t.imgSrc.length > 0;
      const hasName = t.name.length > 0;
      const pass    = hasImg && hasName && t.imgVisible && t.imgLoaded;
      console.log(`${String(t.index).padEnd(3)} | ${t.name.slice(0, 21).padEnd(22)} | ${(hasImg ? '✅' : '❌').padEnd(8)} | ${(t.imgVisible ? '✅' : '❌ Hidden').padEnd(10)} | ${(t.imgLoaded ? '✅' : '❌ Broken').padEnd(10)} | ${hasName ? '✅' : '❌'} ${pass ? '' : '← FAIL'}`);
      if (hasImg) console.log(`     └─ ${t.imgSrc.slice(0, 75)}`);
    }

    const passed = tiles.filter((t: any) => t.imgSrc && t.name && t.imgVisible && t.imgLoaded).length;
    const failed = tiles.filter((t: any) => !t.imgSrc || !t.name || !t.imgVisible || !t.imgLoaded).length;
    console.log('─'.repeat(95));
    console.log(`Total: ${tiles.length} tiles | ${passed} passed | ${failed} failed\n`);

    expect(tiles.length, 'At least 1 SELECT CONCERN tile should be found').toBeGreaterThan(0);

    for (const t of tiles) {
      expect(t.name, `Tile [${t.index}] should have a non-empty name`).toBeTruthy();
      expect(t.imgSrc, `Tile [${t.index}] "${t.name}" should have an image src`).toBeTruthy();
      expect(t.imgSrc.startsWith('http') || t.imgSrc.startsWith('/'), `Tile [${t.index}] "${t.name}" image src should be a valid URL. Got: "${t.imgSrc}"`).toBe(true);
      expect(t.imgVisible, `Tile [${t.index}] "${t.name}" image should be visible`).toBe(true);
      expect(t.imgLoaded, `Tile [${t.index}] "${t.name}" image is broken (404/403). URL: "${t.imgSrc}"`).toBe(true);
    }

    console.log('🎉 All SELECT CONCERN tiles have valid image and name!\n');
  });
});
