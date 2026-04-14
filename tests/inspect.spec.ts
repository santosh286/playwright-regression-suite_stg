import { test } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';

test('inspect location button', async ({ page }) => {
  const checkout = new CheckoutPage(page);
  await page.goto('https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
  await checkout.closePopupIfPresent();
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
      text: btn.textContent?.trim().slice(0, 60),
      classes: btn.className?.slice(0, 80),
      ariaLabel: btn.getAttribute('aria-label'),
    })).filter(b => b.text && b.text.length > 0);
    return buttons.slice(0, 20);
  });
  console.log(JSON.stringify(result, null, 2));
});
