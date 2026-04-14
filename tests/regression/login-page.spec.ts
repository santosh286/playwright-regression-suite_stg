import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const TEST_PHONE = '7411849065';

async function openHomePage(page: any) {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page).toHaveTitle(/KAPIVA/i);
}

async function closePopupIfPresent(page: any) {
  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);
}

async function openHamburgerMenu(page: any) {
  const hamburgerBtn = page.locator('//button[@class="h-full px-1 lg:order-2 "]');
  await hamburgerBtn.waitFor({ state: 'visible', timeout: 10000 });
  await hamburgerBtn.click();
  await page.waitForTimeout(1000);
  const menuPanel = page.locator('//div[@class="flex-1 overflow-y-auto"]');
  await expect(menuPanel).toBeVisible({ timeout: 5000 });
  return menuPanel;
}

test.describe('Login Page Validation', () => {

  test('Open homepage → close popup → click Login → enter phone → verify OTP screen', async ({ page }) => {
    await openHomePage(page);
    console.log('\n✅ Step 1: Homepage opened');

    await closePopupIfPresent(page);
    console.log('✅ Step 2: Popup dismissed');

    const loginBtn = page.locator('button, a').filter({ hasText: /^LOGIN$/i }).first();
    await loginBtn.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      loginBtn.click(),
    ]);
    console.log(`✅ Step 3: Login button clicked → ${page.url()}`);

    await expect(page).toHaveURL(/login|account/);
    console.log(`✅ Step 4: Login page URL → ${page.url()}`);

    const phoneInput = page.locator('input[name="number"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await phoneInput.fill(TEST_PHONE);
    console.log(`✅ Step 5 & 6: Phone input visible, entered: ${TEST_PHONE}`);

    const submitBtn = page.locator('button.MuiLoadingButton-root');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 7: Submit button clicked');

    await expect(page.getByText(/OTP Verification/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_PHONE)).toBeVisible({ timeout: 5000 });
    const allTelInputs = page.locator('input[type="tel"]');
    const totalTel = await allTelInputs.count();
    expect(totalTel).toBeGreaterThanOrEqual(6);
    await expect(page.getByText(/Resend OTP/i)).toBeVisible({ timeout: 5000 });
    console.log(`✅ Step 8: OTP screen verified — ${totalTel} tel inputs found`);

    console.log('\n🎉 OTP screen loaded successfully!\n');
  });

  test('Homepage → close popup → Hamburger menu → Login → phone → verify OTP screen', async ({ page }) => {
    await openHomePage(page);
    console.log('\n✅ Step 1: Homepage opened');

    await closePopupIfPresent(page);
    console.log('✅ Step 2: Popup dismissed');

    const menuPanel = await openHamburgerMenu(page);
    const loginMenuItem = menuPanel.locator('a, button').filter({ hasText: /^Login$/i }).first();
    await expect(loginMenuItem).toBeVisible({ timeout: 5000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      loginMenuItem.click(),
    ]);
    console.log(`✅ Step 3-6: Hamburger → Login → ${page.url()}`);

    await expect(page).toHaveURL(/login|account/);

    const phoneInput = page.locator('input[name="number"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await phoneInput.fill(TEST_PHONE);
    console.log(`✅ Step 7 & 8: Phone input visible, entered: ${TEST_PHONE}`);

    const submitBtn = page.locator('button.MuiLoadingButton-root');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 9: Submit button clicked');

    await expect(page.getByText(/OTP Verification/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_PHONE)).toBeVisible({ timeout: 5000 });
    const allTelInputs = page.locator('input[type="tel"]');
    const totalTel = await allTelInputs.count();
    expect(totalTel).toBeGreaterThanOrEqual(6);
    await expect(page.getByText(/Resend OTP/i)).toBeVisible({ timeout: 5000 });
    console.log(`✅ Step 10: OTP screen verified — ${totalTel} tel inputs found`);

    console.log('\n🎉 Hamburger → Login → OTP screen verified successfully!\n');
  });

});
