import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://staging.kapiva.in/');
  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();
  await page.locator('div').filter({ hasText: 'Search for "Gym""Energy""' }).nth(3).click();
  await page.locator('#search-box').fill('dia');
  await page.locator('#search-box').press('Enter');
  await page.getByText('KAPIVA - TESTINGThis is our').click();
  await page.getByRole('img').first().click();
  await page.locator('.flex.flex-1').click();
  await page.locator('#search-box').fill('dia free juice');
  await page.locator('#search-box').press('Enter');
  await page.locator('line').first().click();
});