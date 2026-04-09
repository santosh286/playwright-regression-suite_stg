import { test, expect } from '@playwright/test';

test('Best Price – capture price before and after', async ({ page }) => {

  // 👉 Helper to read price safely
  const getPrice = async (): Promise<number> => {
    const priceText = await page
      .locator('(//p[@class="mt-[2px] text-[20px] font-[700]"])[1]')
      .textContent();

    if (!priceText) throw new Error('Price not found');

    return Number(priceText.replace(/[₹,]/g, '').trim());
  };

  await page.goto('https://staging.kapiva.in/');

  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();

  await page.getByText('SELECT CONCERN:Gym FoodsHeart').click();
  await page.locator('div').filter({ hasText: /^Gym Foods$/ }).click();

  await page.getByRole('link', { name: 'Shilajit Gold Resin 22% OFF 4' }).click();

  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();

  // 🔹 Expand Price Summary to ensure price is visible
  await page.getByText('Price Summary').click();

  // ✅ PRICE BEFORE BEST PRICE
  const priceBefore = await getPrice();
  console.log(`💰 Price BEFORE Best Price: ₹${priceBefore}`);

  // 🔹 Apply Best Price / Coupon
  await page.getByText('Online payment coupon').click();

  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();

  await page.locator('.appliedCoupon_couponsCard__DBs17').click();

  // 🔹 Wait for price update
  await page.waitForLoadState('networkidle');

  // ✅ PRICE AFTER BEST PRICE
  const priceAfter = await getPrice();
  console.log(`💸 Price AFTER Best Price: ₹${priceAfter}`);

  // ✅ ASSERTION
  expect(priceAfter).toBeLessThan(priceBefore);
});
