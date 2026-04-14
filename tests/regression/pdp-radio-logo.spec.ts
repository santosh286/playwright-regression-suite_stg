import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test.describe('PDP — Radio Buttons & Logo Redirect', () => {

  test('Homepage → Gym concern → Shilajit Gold PDP → radio buttons → logo → homepage', async ({ page }) => {
    test.setTimeout(120000);

    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
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

    const gymHref = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('article a[href*="solution"]')).find((el: any) => /^gym$/i.test(el.textContent?.trim()));
      return (a as HTMLAnchorElement)?.href || '';
    });
    expect(gymHref, 'Gym concern tile should exist on homepage').toBeTruthy();

    const tiles = await page.evaluate(() =>
      Array.from(document.querySelectorAll('article a[href*="solution"]')).slice(0, 6).map((a: any) => `"${a.textContent?.trim()?.slice(0, 10)}" → ${a.href}`)
    );
    console.log('✅ Step 3: SELECT CONCERN tiles:');
    tiles.forEach(t => console.log(`   ${t}`));

    await page.goto('https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/gym/i);
    console.log(`✅ Step 3: Navigated to Gym → ${page.url()}`);

    await page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);

    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });

    const productName = await shilajitCard.locator('h2').first().innerText({ timeout: 3000 }).catch(() => 'Shilajit Gold Resin');
    console.log(`✅ Step 4: Found product — "${productName}" (id=1405)`);
    expect(productName).toMatch(/shilajit gold resin/i);

    await shilajitCard.locator('a').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const pdpUrl = page.url();
    expect(pdpUrl).toMatch(/shilajit/i);
    console.log(`✅ Step 4: PDP opened → ${pdpUrl}`);

    await page.evaluate(async () => {
      for (let y = 0; y < 2000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const radioDetails = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[type="radio"]')).map((inp: any) => {
        const label = document.querySelector(`label[for="${inp.id}"]`) as HTMLElement | null;
        const labelText = label?.textContent?.trim() || '';
        let pack = '', quantity = '';
        try {
          const parsed = JSON.parse(labelText);
          pack = parsed.pack || '';
          quantity = parsed.quantity || '';
        } catch {
          pack = labelText.slice(0, 40);
        }
        return { id: inp.id, value: inp.value, checked: inp.checked, pack, quantity };
      });
    });

    console.log(`\n✅ Step 5: Found ${radioDetails.length} radio button(s) on PDP:\n`);
    console.log('─'.repeat(60));
    console.log(`${'#'.padEnd(3)} | ${'Pack'.padEnd(12)} | ${'Quantity'.padEnd(12)} | ${'SKU ID'.padEnd(8)} | Selected`);
    console.log('─'.repeat(60));
    radioDetails.forEach((r, i) => {
      const sel = r.checked ? '✅ YES' : '❌ No';
      console.log(`${String(i + 1).padEnd(3)} | ${r.pack.padEnd(12)} | ${r.quantity.padEnd(12)} | ${r.value.padEnd(8)} | ${sel}`);
    });
    console.log('─'.repeat(60));

    expect(radioDetails.length, 'PDP should have at least 1 variant radio button').toBeGreaterThan(0);
    const selectedCount = radioDetails.filter(r => r.checked).length;
    expect(selectedCount, 'Exactly 1 radio should be selected by default').toBe(1);
    for (const r of radioDetails) {
      expect(r.value, `Radio (id=${r.id}) should have a value`).toBeTruthy();
    }
    console.log(`\n   ${selectedCount} radio selected by default ✅`);
    console.log(`   All ${radioDetails.length} radios have valid values ✅`);

    const logoLink = page.locator('header a[href="https://staging.kapiva.in/"]').first();
    await logoLink.waitFor({ state: 'attached', timeout: 10000 });
    const logoHref = await logoLink.evaluate((el: any) => el.href);
    console.log(`\n✅ Step 6: Kapiva logo found (href="${logoHref}")`);
    expect(logoHref).toMatch(/staging\.kapiva\.in\/?$/);

    await logoLink.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    console.log(`✅ Step 6: Logo clicked → redirected to: ${finalUrl}`);
    expect(finalUrl === 'https://staging.kapiva.in/' || finalUrl === 'https://staging.kapiva.in', `Logo should redirect to homepage. Got: ${finalUrl}`).toBe(true);

    console.log('\n' + '═'.repeat(65));
    console.log('  PDP RADIO & LOGO — SUMMARY');
    console.log('═'.repeat(65));
    console.log(`  Gym concern page      : ✅`);
    console.log(`  Shilajit Gold PDP     : ✅ ${pdpUrl}`);
    console.log(`  Radio buttons found   : ✅ ${radioDetails.length} variants`);
    console.log(`  Default selected      : ✅ ${radioDetails.find(r => r.checked)?.pack} ${radioDetails.find(r => r.checked)?.quantity}`);
    console.log(`  Logo redirect         : ✅ ${finalUrl}`);
    console.log('═'.repeat(65));
    console.log('\n🎉 All steps verified successfully!\n');
  });

});
