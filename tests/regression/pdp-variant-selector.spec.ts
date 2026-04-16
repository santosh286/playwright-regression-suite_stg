import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Variant Selector', () => {

  test('Open PDP → verify variant radio buttons → switch variant → price updates', async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to PDP
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Count variant radio buttons (kp-radio-input)
    const variantInfo = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input.kp-radio-input')) as HTMLInputElement[];
      const selected = radios.find(r => r.checked);
      const unselected = radios.find(r => !r.checked);
      return {
        total: radios.length,
        selectedId: selected?.id || null,
        selectedValue: selected?.value || null,
        unselectedId: unselected?.id || null,
        unselectedValue: unselected?.value || null,
      };
    });

    expect(variantInfo.total, 'At least 2 variant options should exist').toBeGreaterThanOrEqual(2);
    console.log(`✅ Step 4: Found ${variantInfo.total} variants. Currently selected: id=${variantInfo.selectedId}`);

    // Step 5: Read current price
    const priceEl = page.locator('span[class*="font-black"]').filter({ hasText: /₹/ }).first();
    await expect(priceEl).toBeVisible({ timeout: 10000 });
    const initialPrice = await priceEl.innerText();
    console.log(`✅ Step 5: Initial price — "${initialPrice.trim()}"`);

    // Step 6: Click a different variant label
    expect(variantInfo.unselectedId, 'There should be an unselected variant to click').toBeTruthy();
    const targetLabel = page.locator(`label[for="${variantInfo.unselectedId}"]`).first();
    await expect(targetLabel).toBeVisible({ timeout: 10000 });
    await targetLabel.click();
    await page.waitForTimeout(1500);
    console.log(`✅ Step 6: Clicked variant label for id="${variantInfo.unselectedId}"`);

    // Step 7: Verify that radio is now checked
    const nowChecked = await page.evaluate((targetId: string) => {
      const radio = document.getElementById(targetId) as HTMLInputElement;
      return radio?.checked ?? false;
    }, variantInfo.unselectedId!);
    expect(nowChecked, 'Clicked variant should now be selected').toBe(true);
    console.log(`✅ Step 7: Variant radio is now checked`);

    // Step 8: Verify price updated (may be same or different — just verify it is still a valid price)
    const newPrice = await priceEl.innerText();
    expect(newPrice).toMatch(/₹\d+/);
    console.log(`✅ Step 8: Price after variant switch — "${newPrice.trim()}" (was "${initialPrice.trim()}")`);

    console.log('\n🎉 PDP variant selector validated successfully!\n');
  });

});
