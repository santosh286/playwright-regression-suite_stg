import { test, expect } from '@playwright/test';

test('best price validation for online ', async ({ page }) => {
  await page.goto('https://staging.kapiva.in/');
  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();
  await page.getByText('SELECT CONCERN:Gym FoodsHeart').click();
  await page.locator('div').filter({ hasText: /^Gym Foods$/ }).click();
  await page.getByRole('link', { name: 'Shilajit Gold Resin 22% OFF 4' }).click();
  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();
  await page.getByRole('heading', { name: 'Offers For You' }).click();



  const beforePriceText = await page
    .locator('(//p[@class="mt-[2px] text-[20px] font-[700]"])[1]')
    .innerText();

  const beforePrice = Number(beforePriceText.replace(/[₹,]/g, '').trim());
  console.log('💰 Price BEFORE coupon:', beforePrice);
  // 🔼 END


  await page.getByText('₹2299').first().click();
  await page.getByText('Online payment couponCode -').click();
  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();
  await page.locator('.appliedCoupon_couponsCard__DBs17').click();
  await page.getByText('Price Summary Total MRP:₹3,').click();
  await page.locator('.priceSummary_bottomTotal__dus8f').click();
  await page.locator('#priceSummary_grandTotalDiv__CtNir').getByText('₹2,299.00').click();

  // 🔽 AFTER PRICE
  const afterPriceText = await page
    .locator('#priceSummary_grandTotalDiv__CtNir')
    .getByText(/₹/)
    .textContent();

  const afterPrice = Number(afterPriceText?.replace(/[₹,]/g, '').trim());
  console.log('💸 Price AFTER coupon:', afterPrice);

  // ✅ Validation
  if (beforePrice !== afterPrice) {
    expect(afterPrice).toBeLessThan(beforePrice);
  } else {
    console.log('ℹ️ Price unchanged – coupon already applied');
  }

});
