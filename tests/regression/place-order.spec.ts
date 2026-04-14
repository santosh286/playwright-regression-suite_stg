import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test('Place order using UPI and capture Order ID + clicked actions', async ({ page }) => {
  const clickedActions: string[] = [];

  // Open homepage
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });

  // Close popup
  const bannerText = page.getByText('KAPIVA - TESTINGThis is our');
  if (await bannerText.isVisible()) {
    await bannerText.click();
    await page.getByRole('img').first().click();
  }

  // Navigate: Men's Health category
  await page.locator('div').filter({ hasText: /^Men's Health$/ }).click();
  clickedActions.push('Mens Health Category');

  // View all products
  await page.getByRole('link', { name: 'View all', exact: true }).click();
  clickedActions.push('View All Products');

  // Close popup again
  if (await bannerText.isVisible()) {
    await bannerText.click();
    await page.getByRole('img').first().click();
  }

  // Open product
  await page.getByRole('link', { name: /Shilajit Gold Resin 22% OFF 4/i }).click();
  clickedActions.push('Open Product – Shilajit Gold Resin');

  // Close popup
  if (await bannerText.isVisible()) {
    await bannerText.click();
    await page.getByRole('img').first().click();
  }

  // Buy Now
  const buyNowBtn = page.getByRole('button', { name: 'BUY NOW' });
  await expect(buyNowBtn).toBeVisible();
  await buyNowBtn.click();
  clickedActions.push('Buy Now');

  // Close popup
  if (await bannerText.isVisible()) {
    await bannerText.click();
    await page.getByRole('img').first().click();
  }

  // Fill checkout details
  await page.getByRole('textbox', { name: 'Phone No.' }).fill('7411849065');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('santosh.kumbar@kapiva.in');
  await page.getByRole('textbox', { name: 'Full Name' }).fill('test demo');
  await page.getByRole('textbox', { name: 'Address (House No., Building' }).fill('demo');
  await page.getByRole('textbox', { name: 'Pincode' }).fill('400001');

  // Select UPI
  await page.getByText('UPICredit/Debit').click();
  await page.getByRole('listitem').filter({ hasText: 'UPI' }).click();
  await page.getByRole('textbox', { name: 'Enter your UPI ID' }).fill('test123@upi');
  clickedActions.push('Select UPI Payment');

  // Place order
  const placeOrderBtn = page.locator('[class*="bg-[#80a03c]"]');
  await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
  await placeOrderBtn.click();
  clickedActions.push('Place Order');

  // Confirm payment success
  const successForm = page.locator('form').filter({ hasText: /SUCCESS/i });
  await expect(successForm).toBeVisible({ timeout: 15000 });
  await successForm.click();

  // Close popup
  if (await bannerText.isVisible()) {
    await bannerText.click();
    await page.getByRole('img').first().click();
  }

  // Get Order ID
  await expect(page.getByText(/order id/i)).toBeVisible({ timeout: 20000 });
  const orderText = await page.locator('text=/Order ID/i').textContent();
  const orderId = orderText?.match(/Order ID[:\s]*([A-Z0-9-]+)/i)?.[1];
  expect(orderId).toBeTruthy();

  console.log('✅ Order ID:', orderId);

  console.log('🟢 User Clicks Performed');
  clickedActions.forEach((action, index) => {
    console.log(`${index + 1}. ${action}`);
  });
});
