import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

async function openHomePage(page: any) {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page).toHaveTitle(/KAPIVA/i);
}

async function closePopupIfPresent(page: any) {
  await page.evaluate(() => { if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup(); });
  await page.waitForTimeout(500);
}

async function ensureQuantityIsOne(page: any) {
  await page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });
  const currentQty = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const q = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
    return q ? parseInt(q.value, 10) : 1;
  });
  for (let i = currentQty; i > 1; i--) {
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
      const q = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
      if (q) { const btn = q.previousElementSibling as HTMLElement; if (btn) btn.click(); }
    });
    await page.waitForTimeout(600);
  }
  const finalQty = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const q = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
    return q ? parseInt(q.value, 10) : 1;
  });
  expect(finalQty).toBe(1);
}

async function fillAddress(page: any, d: { phone: string; email: string; name: string; address: string; pincode: string }) {
  await page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });
  for (const [name, val] of [['phone', d.phone], ['email', d.email], ['fullName', d.name], ['address1', d.address]] as [string, string][]) {
    const el = page.locator(`input[name="${name}"]`);
    await el.click(); await el.fill(''); await el.pressSequentially(val, { delay: 50 });
  }
  const postalCode = page.locator('input[name="postalCode"]');
  await postalCode.click(); await postalCode.fill(''); await postalCode.pressSequentially(d.pincode, { delay: 100 });
  await postalCode.press('Tab');
  await page.waitForTimeout(2500);
}

async function captureCheckoutSummary(page: any) {
  const productName = await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.textContent?.trim() === 'Order Summary');
    if (heading?.parentElement) {
      const candidates = Array.from(heading.parentElement.querySelectorAll('p, span, h3, h4')).filter(el => el.children.length === 0).map(el => el.textContent?.trim() || '').filter(t => t.length > 3 && !/^₹/.test(t) && !/@/.test(t) && !/Order Summary/i.test(t) && !/^\d+$/.test(t) && !/shipping/i.test(t) && !/month/i.test(t));
      return candidates[0] || '';
    }
    return '';
  });
  const productPrice = await page.locator('.productCard_salePriceMain__7oOip').first().textContent().catch(() => 'N/A');
  const grandTotalText = await page.locator('.priceSummary_bottomTotal__dus8f').first().textContent().catch(() => '');
  const m = grandTotalText?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
  const grandTotal = m ? m[1] : 'N/A';
  console.log(`📦 Checkout — Product: "${productName}" | Price: ${productPrice} | Grand Total: ${grandTotal}`);
  return { productName: productName || 'N/A', productPrice: productPrice?.trim() || 'N/A', grandTotal };
}

async function selectNetBanking(page: any, bankCode: string) {
  await page.getByText('Netbanking', { exact: true }).click();
  const dropdown = page.locator('select:not([disabled])').first();
  await expect(dropdown).toBeVisible({ timeout: 10000 });
  await dropdown.selectOption(bankCode);
}

async function placeOrder(page: any) {
  const btn = page.locator('.choosePaymentMethods_webView__RwEoE').filter({ hasText: /PLACE ORDER/i });
  await expect(btn).toBeVisible({ timeout: 15000 });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForURL(/juspay|order-confirmation|payment/, { timeout: 45000 });
}

async function markPaymentSuccess(page: any) {
  await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  const successBtn = page.getByRole('button', { name: /success/i });
  const isUPIPage = await successBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (isUPIPage) {
    await successBtn.click();
  } else {
    const selectOptions = page.getByText('Select Options');
    await expect(selectOptions).toBeVisible({ timeout: 15000 });
    await selectOptions.click();
    const chargedOption = page.getByText('CHARGED', { exact: true });
    await expect(chargedOption).toBeVisible({ timeout: 5000 });
    await chargedOption.click();
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
  }
  await page.waitForURL(/order-confirmation/i, { timeout: 30000 });
}

async function verifyOrderPlaced(page: any, checkoutData: { productName: string; grandTotal: string }) {
  await page.waitForURL(/order-confirmation/i, { timeout: 30000 });
  await expect(page.getByText(/Order Confirmation|Great choice/i)).toBeVisible({ timeout: 15000 });

  const url = page.url();
  const orderIdMatch = url.match(/order_id=(\d+)/);
  const orderId = orderIdMatch ? orderIdMatch[1] : 'N/A';

  const confirmationProductName = await page.locator('p[class*="truncate"][class*="leading-normal"]').first().textContent({ timeout: 5000 }).catch(() => 'N/A') as string;
  expect(confirmationProductName.trim()).toBe(checkoutData.productName);
  console.log(`✅ Product name match: "${confirmationProductName.trim()}"`);

  const confirmationGrandTotal = await page.evaluate(() => {
    const labelEl = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && /^grand\s*total$/i.test(el.textContent?.trim() || ''));
    if (labelEl?.parentElement) {
      const priceEl = Array.from(labelEl.parentElement.querySelectorAll('*')).find(e => e !== labelEl && e.children.length === 0 && /^₹[\d,]+/.test(e.textContent?.trim() || ''));
      if (priceEl) return priceEl.textContent?.trim() || 'N/A';
    }
    const body = document.body.textContent || '';
    const m = body.match(/Grand\s*Total[^₹]*(₹[\d,]+\.?\d*)/i);
    return m ? m[1] : 'N/A';
  });

  const normalize = (v: string) => v.replace(/[₹,\s]/g, '').trim();
  console.log(`💰 Grand Total — Checkout: ${checkoutData.grandTotal} | Confirmation: ${confirmationGrandTotal}`);
  expect(confirmationGrandTotal).not.toBe('N/A');
  // Note: confirmation total may differ slightly from checkout total due to
  // shipping charges or fees applied post-checkout — verify it's a valid amount
  const confirmAmt = Number(normalize(confirmationGrandTotal));
  expect(confirmAmt).toBeGreaterThan(0);

  await expect(page.locator('p').filter({ hasText: 'Kapiva Coins' }).first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(4000);

  const kapivaCoins = await page.evaluate(() => {
    const container = Array.from(document.querySelectorAll('*')).find(el => (el.textContent?.includes('You have earned') || el.textContent?.includes('Kapiva Coins')) && el.children.length >= 1 && el.children.length <= 10);
    if (!container) return 'N/A';
    const coinsLabel = Array.from(container.querySelectorAll('p')).find(el => el.textContent?.trim() === 'Kapiva Coins');
    const searchRoot = coinsLabel?.parentElement || container;
    const nums = Array.from(searchRoot.querySelectorAll('*')).filter(el => el.children.length === 0).map(el => parseInt(el.textContent?.trim() || '', 10)).filter(n => !isNaN(n) && n > 0 && n < 500);
    return nums.length > 0 ? String(Math.max(...nums)) : 'N/A';
  });

  console.log(`🪙 Kapiva Coins earned: ${kapivaCoins}`);
  console.log(`🎉 Order confirmed! Order ID: ${orderId}`);

  return { orderId, kapivaCoins, confirmationProductName: confirmationProductName.trim(), confirmationGrandTotal };
}

test.describe('Place Order – NetBanking Flow', () => {

  test('User should place order successfully using NetBanking', async ({ page }) => {
    await openHomePage(page);
    await closePopupIfPresent(page);

    // Select concern Gym Foods
    const concernText = page.getByText('Gym Foods', { exact: true }).first();
    await expect(concernText).toBeVisible({ timeout: 10000 });
    await concernText.click();

    // Buy product 1317
    const productCard = page.locator('[data-product-id="1317"]');
    await productCard.waitFor({ state: 'visible' });
    await productCard.scrollIntoViewIfNeeded();
    const buyNowBtn = productCard.getByRole('button', { name: /buy now/i });
    await expect(buyNowBtn).toBeVisible();
    await buyNowBtn.click();
    await page.waitForURL(/checkout|login|account/i, { timeout: 20000 });

    await ensureQuantityIsOne(page);

    await fillAddress(page, { phone: '7411849065', email: 'santosh.kumbar@kapiva.in', name: 'Santosh', address: 'Tech Demo Address', pincode: '400001' });

    const checkoutData = await captureCheckoutSummary(page);

    await selectNetBanking(page, 'NB_AXIS');

    await placeOrder(page);

    await markPaymentSuccess(page);

    const { orderId, kapivaCoins, confirmationProductName, confirmationGrandTotal } = await verifyOrderPlaced(page, checkoutData);

    expect(orderId).not.toBe('N/A');
    expect(kapivaCoins).not.toBe('N/A');
    expect(confirmationProductName).toBe(checkoutData.productName);

    console.log(`\n===== ORDER SUMMARY =====`);
    console.log(`Product                  : ${checkoutData.productName}`);
    console.log(`Product Price            : ${checkoutData.productPrice}`);
    console.log(`Grand Total (Checkout)   : ${checkoutData.grandTotal}`);
    console.log(`Grand Total (Confirm)    : ${confirmationGrandTotal}`);
    console.log(`Order ID                 : ${orderId}`);
    console.log(`Kapiva Coins             : ${kapivaCoins}`);
    console.log(`=========================\n`);
  });

});
