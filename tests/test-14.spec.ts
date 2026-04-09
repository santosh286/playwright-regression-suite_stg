import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  // ✅ Click list
  const clickedActions: string[] = [];

  await page.goto('https://staging.kapiva.in/');
  clickedActions.push('Opened Kapiva Home Page');

  await page.getByText('KAPIVA - TESTINGThis is our').click();
  clickedActions.push('Clicked testing banner');

  await page.getByRole('img').first().click();
  clickedActions.push('Closed header popup');

  await page.getByText('SELECT CONCERN:Gym FoodsHeart').click();
  clickedActions.push('Clicked Select Concern section');

  await page.locator('div').filter({ hasText: /^Gym Foods$/ }).click();
  clickedActions.push('Selected Gym Foods');

  await page.getByRole('link', { name: 'Shilajit Gold Resin 22% OFF 4' }).click();
  clickedActions.push('Opened product: Shilajit Gold Resin');

  await page.getByText('KAPIVA - TESTINGThis is our').click();
  clickedActions.push('Clicked banner on PDP');

  await page.getByRole('img').first().click();
  clickedActions.push('Closed popup on PDP');

  await page.getByText('Extra ₹200 OFFBEST PRICE₹229936%Online payment couponCode - SAVE5Use NowExtra ₹').click();
  clickedActions.push('Clicked coupon section');

  await page.getByText('KAPIVA - TESTINGThis is our').click();
  clickedActions.push('Clicked banner on cart');

  await page.getByRole('img').first().click();
  clickedActions.push('Closed popup on cart');

  await page.getByText('Price Summary Total MRP:₹3,').click();
  clickedActions.push('Clicked price summary');

  await page.locator('.priceSummary_bottomTotal__dus8f').click();
  clickedActions.push('Clicked bottom total price');

  await page.waitForTimeout(5000);

  // ✅ Print all clicked actions
  console.log('🖱️ Clicked Actions Flow:', clickedActions);
});
