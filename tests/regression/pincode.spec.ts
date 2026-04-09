import { test, expect } from '@playwright/test';
import { PincodePage } from '../../pages/PincodePage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Pincode Panel Validation', () => {

test('User can apply pincode successfully', async ({ page }) => {
  const pincodePage = new PincodePage(page);
  const checkout    = new CheckoutPage(page);

  // 1. Open staging homepage
  await pincodePage.navigate();

  // 2. Close staging popup if present
  await checkout.closePopupIfPresent();

  // 3. Apply pincode 400001
  console.log('\n📍 Applying pincode: 400001');
  await pincodePage.setPincode('400001');

  // 4. Assert pincode is reflected on the page
  await page.waitForTimeout(1500);
  const pageText = await page.locator('body').innerText();
  const pincodeVisible = pageText.includes('400001');
  console.log(`  ${pincodeVisible ? '✅' : '⚠️'} Pincode 400001 ${pincodeVisible ? 'visible on page' : 'not visible — may be applied silently'}`);

  expect(pincodeVisible).toBe(true);
});

test('Open pincode panel → LOG IN TO ADD NEW ADDRESS → redirects to login page', async ({ page }) => {
  const pincodePage = new PincodePage(page);
  const checkout    = new CheckoutPage(page);

  /* ── Step 1: Open staging homepage ─────────────────────── */
  await pincodePage.navigate();
  console.log('\n✅ Step 1: Homepage opened');

  /* ── Step 2: Close popup ────────────────────────────────── */
  await checkout.closePopupIfPresent();
  console.log('✅ Step 2: Popup dismissed');

  /* ── Step 3: Click location button to open pincode panel ── */
  await pincodePage.clickLocation();
  await page.waitForTimeout(1500);
  console.log('✅ Step 3: Pincode panel opened');

  /* ── Step 4: "LOG IN TO ADD NEW ADDRESS" button visible ─── */
  const loginAddressBtn = page.locator('button').filter({ hasText: /log in to add new address/i }).first();
  await loginAddressBtn.waitFor({ state: 'visible', timeout: 10000 });

  const btnText = await loginAddressBtn.innerText();
  console.log(`✅ Step 4: Button visible — "${btnText.trim()}"`);
  expect(btnText.trim()).toMatch(/log in to add new address/i);

  /* ── Step 5: Click button → verify redirect to login page ── */
  await loginAddressBtn.click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page.waitForTimeout(1000);

  const finalUrl = page.url();
  console.log(`✅ Step 5: Redirected to → ${finalUrl}`);

  expect(
    finalUrl,
    `Expected redirect to login.php. Got: ${finalUrl}`
  ).toMatch(/login\.php/i);

  console.log('\n🎉 LOG IN TO ADD NEW ADDRESS redirect verified!\n');
});

});
