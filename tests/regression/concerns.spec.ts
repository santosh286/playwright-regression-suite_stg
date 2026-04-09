import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Kapiva – Concerns Flow', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  test('Concerns → list all concerns → URL contains staging', async () => {
    const concerns = await homePage.getAllConcernsText();

    console.log('\n✅ SELECT CONCERN tiles on staging:');
    concerns.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));

    expect(concerns.length, 'At least 1 concern should be listed').toBeGreaterThan(0);
    await expect(homePage.page).toHaveURL(/staging\.kapiva\.in/i);
  });

  test('SELECT CONCERN — verify all tiles have image and name', async () => {
    console.log('\n✅ Step 1: Homepage opened');

    await homePage.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await homePage.scrollToLoadConcerns();
    console.log('✅ Step 3: Scrolled to load concern tiles');

    const tiles = await homePage.getConcernTiles();
    console.log(`\n✅ Step 4: Found ${tiles.length} SELECT CONCERN tile(s)\n`);

    console.log('─'.repeat(95));
    console.log(`${'#'.padEnd(3)} | ${'Name'.padEnd(22)} | ${'Has Img'.padEnd(8)} | ${'Visible'.padEnd(10)} | ${'Loaded'.padEnd(10)} | ${'Has Name'}`);
    console.log('─'.repeat(95));

    for (const t of tiles) {
      const hasImg  = t.imgSrc.length > 0;
      const hasName = t.name.length > 0;
      const pass    = hasImg && hasName && t.imgVisible && t.imgLoaded;
      console.log(
        `${String(t.index).padEnd(3)} | ${t.name.slice(0, 21).padEnd(22)} | ${(hasImg ? '✅' : '❌').padEnd(8)} | ${(t.imgVisible ? '✅' : '❌ Hidden').padEnd(10)} | ${(t.imgLoaded ? '✅' : '❌ Broken').padEnd(10)} | ${hasName ? '✅' : '❌'} ${pass ? '' : '← FAIL'}`
      );
      if (hasImg) console.log(`     └─ ${t.imgSrc.slice(0, 75)}`);
    }

    const passed = tiles.filter(t => t.imgSrc && t.name && t.imgVisible && t.imgLoaded).length;
    const failed = tiles.filter(t => !t.imgSrc || !t.name || !t.imgVisible || !t.imgLoaded).length;
    console.log('─'.repeat(95));
    console.log(`Total: ${tiles.length} tiles | ${passed} passed | ${failed} failed\n`);

    expect(tiles.length, 'At least 1 SELECT CONCERN tile should be found').toBeGreaterThan(0);

    for (const t of tiles) {
      expect(t.name, `Tile [${t.index}] should have a non-empty name`).toBeTruthy();
      expect(t.imgSrc, `Tile [${t.index}] "${t.name}" should have an image src`).toBeTruthy();
      expect(
        t.imgSrc.startsWith('http') || t.imgSrc.startsWith('/'),
        `Tile [${t.index}] "${t.name}" image src should be a valid URL. Got: "${t.imgSrc}"`
      ).toBe(true);
      expect(t.imgVisible, `Tile [${t.index}] "${t.name}" image should be visible`).toBe(true);
      expect(t.imgLoaded, `Tile [${t.index}] "${t.name}" image is broken (404/403). URL: "${t.imgSrc}"`).toBe(true);
    }

    console.log('🎉 All SELECT CONCERN tiles have valid image and name!\n');
  });
});
