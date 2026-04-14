import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test('Track order with invalid order ID shows error message', async ({ page }) => {
  await navigateTo(page, 'https://staging.kapiva.in/track-order/', {
    waitUntil: 'commit',
    timeout: 60000,
  });
  await expect(page).toHaveURL(/track-order/, { timeout: 60000 });
  console.log('✅ Step 1: Track Order page opened');

  const orderIdInput = page.locator('input[name="id"]');
  const trackButton  = page.locator('input[value="Track"]');
  await orderIdInput.waitFor({ state: 'visible', timeout: 60000 });
  await orderIdInput.fill('15086');
  await trackButton.click();
  console.log('✅ Step 2: Order ID entered and tracked');

  const errorMessage = page.locator('.error_message');
  await expect(errorMessage).toBeVisible({ timeout: 10000 });
  await expect(errorMessage).toContainText('Order details not found');
  const actual = await errorMessage.textContent();
  console.log(`✅ Step 3: Error message — "${actual?.trim()}"`);
});
