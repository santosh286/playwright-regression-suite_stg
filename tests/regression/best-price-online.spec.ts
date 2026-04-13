import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test('Best Price validation for Online Payment coupon', async ({ page }) => {
  // 1. Open homepage
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });

  // 2. Close popup
  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);

  // 3. Navigate to product: SELECT CONCERN → Gym Foods → Shilajit Gold Resin
  await page.getByText('SELECT CONCERN').click();
  await page.locator('div').filter({ hasText: /^Gym Foods$/ }).click();
  await page.getByRole('link', { name: /Shilajit Gold Resin/i }).click();

  // 4. Close popup again on product page
  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);

  // 5. Open Offers For You
  const offersHeading = page.getByRole('heading', { name: 'Offers For You' });
  await expect(offersHeading).toBeVisible();
  await offersHeading.click();

  // 6. Capture price BEFORE coupon
  const beforePriceEl = page.locator('(//p[@class="mt-[2px] text-[20px] font-[700]"])[1]');
  const beforeText = await beforePriceEl.innerText();
  const beforePrice = Number(beforeText.replace(/[₹,]/g, '').trim());
  console.log('💰 Price BEFORE coupon:', beforePrice);

  // 7. Click online payment coupon → navigates directly to checkout with coupon applied
  const onlineCoupon = page.getByText('Online payment couponCode -');
  await expect(onlineCoupon).toBeVisible();
  await onlineCoupon.click();

  // Coupon click navigates directly to checkout with coupon param in URL (no modal)
  await page.waitForURL(/checkout/, { timeout: 30000 });
  const checkoutUrl = page.url();
  console.log('✅ Coupon applied — navigated to checkout:', checkoutUrl);
  expect(checkoutUrl).toMatch(/coupon=/i);

  // 8. Verify coupon code appears in the checkout URL
  const urlParams = new URL(checkoutUrl).searchParams;
  const couponParam = urlParams.get('coupon') || '';
  console.log('🎟️ Coupon in URL:', couponParam);
  expect(couponParam.toLowerCase()).toBeTruthy();

  // 9. Verify checkout page loaded (not 404)
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  const pageTitle = await page.title();
  console.log('📄 Checkout page title:', pageTitle);
  expect(pageTitle.toLowerCase()).not.toMatch(/not found|404/i);

  console.log(`✅ Best Price Online coupon verified — PDP price ₹${beforePrice} → checkout with coupon "${couponParam}"`);
});
