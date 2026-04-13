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

async function openProductPDP(page: any, productId: string): Promise<string> {
  const productCard = page.locator(`[data-product-id="${productId}"]`);
  await productCard.waitFor({ state: 'visible' });
  await productCard.scrollIntoViewIfNeeded();
  await productCard.locator('a').first().click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  const productName = await page.locator('h1').first().textContent({ timeout: 10000 });
  const name = productName?.trim() || 'N/A';
  console.log(`📋 PDP Product Name: "${name}"`);
  return name;
}

async function buyNowFromPDP(page: any) {
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  const buyNowBtn = page.getByRole('button', { name: /buy now/i }).first();
  await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
  await buyNowBtn.scrollIntoViewIfNeeded();
  await buyNowBtn.click();
  await page.waitForURL(/checkout|login|account/i, { timeout: 30000 });
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

async function applyCoupon(page: any, couponLabel: string) {
  const couponCard = page.locator('div, section').filter({ hasText: couponLabel }).first();
  await expect(couponCard).toBeVisible({ timeout: 10000 });
  const tapToApply = couponCard.getByText(/tap to apply/i).first();
  await expect(tapToApply).toBeVisible({ timeout: 5000 });
  await tapToApply.click();
  await page.waitForTimeout(2000);
  console.log(`🎟️ Coupon "${couponLabel}" applied`);
}

async function selectUPI(page: any, upiId: string) {
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  const upiTab = page.locator('div, button, span, li').filter({ hasText: /^(upi|pay online)$/i }).filter({ visible: true }).first();
  await expect(upiTab).toBeVisible({ timeout: 10000 });
  await upiTab.scrollIntoViewIfNeeded();
  await upiTab.click();
  await page.waitForTimeout(500);
  const upiInput = page.locator('input[placeholder*="upi" i], input[name*="upi" i], input[placeholder*="@" i]').first();
  await expect(upiInput).toBeVisible({ timeout: 10000 });
  await upiInput.click(); await upiInput.fill(''); await upiInput.pressSequentially(upiId, { delay: 50 });
  await page.waitForTimeout(3000);
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
    await page.getByText('CHARGED', { exact: true }).click();
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
  const confirmationGrandTotal = await page.evaluate(() => {
    const body = document.body.textContent || '';
    const m = body.match(/Grand\s*Total[^₹]*(₹[\d,]+\.?\d*)/i);
    return m ? m[1] : 'N/A';
  });
  const normalize = (v: string) => v.replace(/[₹,\s]/g, '').trim();
  expect(confirmationGrandTotal).not.toBe('N/A');
  expect(normalize(confirmationGrandTotal)).toBe(normalize(checkoutData.grandTotal));
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
  return { orderId, kapivaCoins, confirmationProductName: confirmationProductName.trim(), confirmationGrandTotal };
}

test.describe('Place Order – UPI Flow', () => {

  test('User should place order successfully using UPI', async ({ page }) => {
    await openHomePage(page);
    await closePopupIfPresent(page);

    const concernText = page.getByText('Gym Foods', { exact: true }).first();
    await expect(concernText).toBeVisible({ timeout: 10000 });
    await concernText.click();

    const pdpProductName = await openProductPDP(page, '1405');

    await buyNowFromPDP(page);

    await ensureQuantityIsOne(page);

    await fillAddress(page, { phone: '7411849065', email: 'santosh.kumbar@kapiva.in', name: 'Santosh', address: 'Tech Demo Address', pincode: '400001' });

    await applyCoupon(page, 'Save 5');

    await selectUPI(page, 'test123@upi');

    const checkoutData = await captureCheckoutSummary(page);

    await placeOrder(page);

    await markPaymentSuccess(page);

    const { orderId, kapivaCoins, confirmationProductName, confirmationGrandTotal } = await verifyOrderPlaced(page, checkoutData);

    expect(orderId).not.toBe('N/A');
    expect(kapivaCoins).not.toBe('N/A');
    expect(confirmationProductName).toBe(checkoutData.productName);

    console.log(`\n===== ORDER SUMMARY =====`);
    console.log(`PDP Product Name         : ${pdpProductName}`);
    console.log(`Product                  : ${checkoutData.productName}`);
    console.log(`Product Price            : ${checkoutData.productPrice}`);
    console.log(`Grand Total (Checkout)   : ${checkoutData.grandTotal}`);
    console.log(`Grand Total (Confirm)    : ${confirmationGrandTotal}`);
    console.log(`Order ID                 : ${orderId}`);
    console.log(`Kapiva Coins             : ${kapivaCoins}`);
    console.log(`=========================\n`);
  });

});
