import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

async function openHomePage(page: any) {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
}

async function closePopupIfPresent(page: any) {
  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);
}

test.describe('Pincode Panel Validation', () => {

  test('User can apply pincode successfully', async ({ page }) => {
    await openHomePage(page);
    await closePopupIfPresent(page);

    // Click location button to open pincode panel
    const locationButton = page.locator('header div[class*="cursor-pointer"][class*="shrink-0"][class*="lg\\:flex"]').first();
    await locationButton.waitFor({ state: 'visible', timeout: 10000 });
    await locationButton.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(800);

    // Enter pincode
    const pincodeInput = page.getByRole('textbox', { name: 'Enter area pincode' });
    await pincodeInput.click();
    await pincodeInput.fill('400001');

    const applyButton = page.getByRole('button', { name: 'Apply' });
    await applyButton.click();

    console.log('\n📍 Applying pincode: 400001');
    await page.waitForTimeout(1500);
    const pageText = await page.locator('body').innerText();
    const pincodeVisible = pageText.includes('400001');
    console.log(`  ${pincodeVisible ? '✅' : '⚠️'} Pincode 400001 ${pincodeVisible ? 'visible on page' : 'not visible — may be applied silently'}`);

    expect(pincodeVisible).toBe(true);
  });

  test('Open pincode panel → LOG IN TO ADD NEW ADDRESS → redirects to login page', async ({ page }) => {
    await openHomePage(page);
    console.log('\n✅ Step 1: Homepage opened');

    await closePopupIfPresent(page);
    console.log('✅ Step 2: Popup dismissed');

    const locationButton = page.locator('header div[class*="cursor-pointer"][class*="shrink-0"][class*="lg\\:flex"]').first();
    await locationButton.waitFor({ state: 'visible', timeout: 10000 });
    await locationButton.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(1500);
    console.log('✅ Step 3: Pincode panel opened');

    const loginAddressBtn = page.locator('button').filter({ hasText: /log in to add new address/i }).first();
    await loginAddressBtn.waitFor({ state: 'visible', timeout: 10000 });

    const btnText = await loginAddressBtn.innerText();
    console.log(`✅ Step 4: Button visible — "${btnText.trim()}"`);
    expect(btnText.trim()).toMatch(/log in to add new address/i);

    await loginAddressBtn.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log(`✅ Step 5: Redirected to → ${finalUrl}`);

    expect(finalUrl, `Expected redirect to login.php. Got: ${finalUrl}`).toMatch(/login\.php/i);

    console.log('\n🎉 LOG IN TO ADD NEW ADDRESS redirect verified!\n');
  });

});
