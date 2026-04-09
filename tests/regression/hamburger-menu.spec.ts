import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const MENU_ITEMS = [
  {
    label:      'Login',
    type:       'redirect',
    expectedUrl: /login\.php/i,
  },
  {
    label:      'Shop by',
    type:       'dropdown',
    subItems:   ['Heart Health', 'Gym Foods', 'Women\'s Health', 'Weight Management'],
  },
  {
    label:      'Ingredients',
    type:       'dropdown',
    subItems:   ['Amla', 'Ashwagandha', 'Tulsi', 'Turmeric'],
  },
  {
    label:      'Best Offers',
    type:       'dropdown',
    subItems:   ['BOGO', 'Summer Essentials', 'Under 899'],
  },
  {
    label:      'Blog',
    type:       'redirect',
    expectedUrl: /blog\.kapiva\.in/i,
  },
  {
    label:      'Download App',
    type:       'app-download',
    appLinks: [
      { platform: 'Android', imgPattern: /app_1/i },
      { platform: 'iOS',     imgPattern: /app_2/i },
    ],
  },
  {
    label:      'Innovation Fund',
    type:       'redirect',
    expectedUrl: /innovation\.kapiva\.in/i,
  },
  {
    label:      'Contact Us',
    type:       'redirect',
    expectedUrl: /contact-us/i,
  },
  {
    label:      'About Us',
    type:       'redirect',
    expectedUrl: /about-us/i,
  },
];

test.describe('Hamburger Menu Validation', () => {

  test('Open homepage → close popup → hamburger → verify all menu items', async ({ page }) => {
    const loginPage = new LoginPage(page);

    const results: { label: string; visible: boolean; passed: boolean; note: string }[] = [];

    await loginPage.openHomePage();
    await loginPage.closePopupIfPresent();
    console.log('\n✅ Homepage opened & popup dismissed');

    let menuContainer = await loginPage.openHamburgerMenu();
    console.log('✅ Hamburger menu opened\n');

    for (const item of MENU_ITEMS) {
      console.log(`${'─'.repeat(50)}`);
      console.log(`📋 Menu item: "${item.label}" [${item.type}]`);

      if (item.type === 'app-download') {
        const menuLinks: { href: string; imgSrc: string }[] = await page.evaluate(() => {
          const mtAuto = document.querySelector('.mt-auto');
          if (!mtAuto) return [];
          return Array.from(mtAuto.querySelectorAll('a[href]')).map((a: any) => ({
            href:   a.href,
            imgSrc: (a.querySelector('img') as HTMLImageElement)?.src || '',
          }));
        });

        console.log(`  Found ${menuLinks.length} app store link(s) in Download App section`);
        menuLinks.forEach(l => console.log(`    href: ${l.href}  img: ${l.imgSrc}`));

        let allPassed = true;
        for (const appLink of item.appLinks || []) {
          const match = menuLinks.find(l => appLink.imgPattern.test(l.imgSrc));
          const found = !!match && /onelink\.me/i.test(match.href);
          console.log(`  ${appLink.platform} (${appLink.imgPattern}) : ${found ? '✅ ' + match?.href : '❌ Not found'}`);
          if (!found) allPassed = false;
        }

        results.push({
          label:   item.label,
          visible: true,
          passed:  allPassed,
          note:    allPassed ? 'Both Android & iOS links found ✅' : 'One or more app store links missing ❌',
        });

      } else {
        const menuItem = menuContainer.locator('a, button').filter({ hasText: new RegExp(`^${item.label}$`, 'i') }).first();
        const isVisible = await menuItem.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  Visible in menu : ${isVisible ? '✅' : '❌'}`);

        if (!isVisible) {
          results.push({ label: item.label, visible: false, passed: false, note: 'Not visible in menu' });
          menuContainer = await loginPage.openHamburgerMenu();
          continue;
        }

        if (item.type === 'dropdown') {
          let allSubVisible = true;
          for (const sub of item.subItems || []) {
            const subItem = menuContainer.locator('a').filter({ hasText: new RegExp(`^${sub}$`, 'i') }).first();
            const subVisible = await subItem.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(`    Sub-item "${sub}" : ${subVisible ? '✅' : '❌'}`);
            if (!subVisible) allSubVisible = false;
          }
          results.push({
            label: item.label,
            visible: true,
            passed: allSubVisible,
            note: allSubVisible ? 'All sub-items visible ✅' : 'Some sub-items missing ❌',
          });

        } else {
          let httpStatus = 200;
          const onResponse = (response: any) => {
            if (response.request().resourceType() === 'document') httpStatus = response.status();
          };
          page.on('response', onResponse);

          await menuItem.click();
          await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
          await page.waitForTimeout(1000);
          page.off('response', onResponse);

          const finalUrl = page.url();
          const urlMatched = item.expectedUrl!.test(finalUrl);
          const pageTitle = await page.title().catch(() => '');
          const pageText  = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
          const isHard404 = httpStatus === 404;
          const isSoft404 = /404|page not found|not found/i.test(pageTitle) ||
                            /404 error|page not found|this page (could not|doesn.t) exist/i.test(pageText);
          const is404 = isHard404 || isSoft404;
          const passed = urlMatched && !is404;

          console.log(`  Redirected to   : ${finalUrl}`);
          console.log(`  HTTP status     : ${httpStatus}${isHard404 ? ' ❌ hard 404!' : ' ✅'}`);
          console.log(`  Soft 404 check  : ${isSoft404 ? `❌ "${pageTitle}"` : '✅ No 404 content'}`);
          console.log(`  Expected URL    : ${item.expectedUrl} → ${urlMatched ? '✅ PASS' : '❌ FAIL'}`);

          const note = isHard404
            ? `Hard 404 on ${finalUrl}`
            : isSoft404
              ? `Soft 404 — page shows "not found" (${pageTitle})`
              : urlMatched ? finalUrl : `Expected ${item.expectedUrl}, got ${finalUrl}`;

          results.push({ label: item.label, visible: true, passed, note });

          await loginPage.openHomePage();
          await loginPage.closePopupIfPresent();
          menuContainer = await loginPage.openHamburgerMenu();
        }
      }
    }

    console.log('\n\n' + '═'.repeat(70));
    console.log('  HAMBURGER MENU — SUMMARY');
    console.log('═'.repeat(70));
    console.log(`${'Menu Item'.padEnd(20)} | ${'Visible'.padEnd(7)} | ${'Pass'.padEnd(6)} | Note`);
    console.log('─'.repeat(70));

    for (const r of results) {
      const vis  = r.visible ? '✅' : '❌';
      const pass = r.passed  ? '✅' : '❌';
      console.log(`${r.label.padEnd(20)} | ${vis.padEnd(7)} | ${pass.padEnd(6)} | ${r.note.slice(0, 60)}`);
    }

    const allPassed = results.every(r => r.passed);
    console.log('─'.repeat(70));
    console.log(`Overall: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);

    for (const r of results) {
      expect(r.visible, `"${r.label}" should be visible in menu`).toBe(true);
      expect(r.passed,  `"${r.label}" should pass`).toBe(true);
    }
  });

});
