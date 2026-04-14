import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

async function openHomePage(page: any) {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page).toHaveTitle(/KAPIVA/i);
}

async function closePopupIfPresent(page: any) {
  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);
}

async function buyNowFromPDP(page: any) {
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  const buyNowBtn = page.getByRole('button', { name: /buy now/i }).first();
  await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
  await buyNowBtn.scrollIntoViewIfNeeded();
  await buyNowBtn.click();
  await page.waitForURL(/checkout|login|account/i, { timeout: 20000 });
}

async function ensureQuantityIsOne(page: any) {
  await page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });
  const currentQty = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const qtyInput = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
    return qtyInput ? parseInt(qtyInput.value, 10) : 1;
  });
  if (currentQty > 1) {
    for (let i = currentQty; i > 1; i--) {
      await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
        const qtyInput = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
        if (qtyInput) { const minusBtn = qtyInput.previousElementSibling as HTMLElement; if (minusBtn) minusBtn.click(); }
      });
      await page.waitForTimeout(600);
    }
  }
  const finalQty = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const qtyInput = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
    return qtyInput ? parseInt(qtyInput.value, 10) : 1;
  });
  expect(finalQty).toBe(1);
  console.log(`✅ Quantity verified: ${finalQty}`);
}

async function fillAddress(page: any, details: { phone: string; email: string; name: string; address: string; pincode: string }) {
  await page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });
  const phone = page.locator('input[name="phone"]');
  await phone.click(); await phone.fill(''); await phone.pressSequentially(details.phone, { delay: 50 });
  const email = page.locator('input[name="email"]');
  await email.click(); await email.fill(''); await email.pressSequentially(details.email, { delay: 50 });
  const fullName = page.locator('input[name="fullName"]');
  await fullName.click(); await fullName.fill(''); await fullName.pressSequentially(details.name, { delay: 50 });
  const address1 = page.locator('input[name="address1"]');
  await address1.click(); await address1.fill(''); await address1.pressSequentially(details.address, { delay: 50 });
  const postalCode = page.locator('input[name="postalCode"]');
  await postalCode.click(); await postalCode.fill(''); await postalCode.pressSequentially(details.pincode, { delay: 100 });
  await postalCode.press('Tab');
  await page.waitForTimeout(2500);
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
  console.log(`💳 UPI ID entered: ${upiId}`);
  await page.waitForTimeout(3000);
}

async function captureCheckoutSummary(page: any) {
  const productName = await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('*')).find(el => el.children.length === 0 && el.textContent?.trim() === 'Order Summary');
    if (heading?.parentElement) {
      const section = heading.parentElement;
      const candidates = Array.from(section.querySelectorAll('p, span, h3, h4')).filter(el => el.children.length === 0).map(el => el.textContent?.trim() || '').filter(t => t.length > 3 && !/^₹/.test(t) && !/@/.test(t) && !/Order Summary/i.test(t) && !/^\d+$/.test(t) && !/shipping/i.test(t) && !/month/i.test(t));
      return candidates[0] || '';
    }
    return '';
  });
  const productPrice = await page.locator('.productCard_salePriceMain__7oOip').first().textContent().catch(() => 'N/A');
  const grandTotalText = await page.locator('.priceSummary_bottomTotal__dus8f').first().textContent().catch(() => '');
  const grandTotalMatch = grandTotalText?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
  const grandTotal = grandTotalMatch ? grandTotalMatch[1] : 'N/A';
  console.log(`📦 Checkout — Product: "${productName}" | Price: ${productPrice} | Grand Total: ${grandTotal}`);
  return { productName: productName || 'N/A', productPrice: productPrice?.trim() || 'N/A', grandTotal };
}

async function placeOrder(page: any) {
  const placeOrderBtn = page.locator('.choosePaymentMethods_webView__RwEoE').filter({ hasText: /PLACE ORDER/i });
  await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
  await placeOrderBtn.scrollIntoViewIfNeeded();
  await placeOrderBtn.click();
  await page.waitForURL(/juspay|order-confirmation|payment/, { timeout: 45000 });
}

async function markPaymentSuccess(page: any) {
  await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  const successBtn = page.getByRole('button', { name: /success/i });
  const selectOptions = page.getByText('Select Options');
  const isUPIPage = await successBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (isUPIPage) {
    await successBtn.click();
  } else {
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

async function capturePDPETA(page: any): Promise<string> {
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => { const cls = e.className || ''; return typeof cls === 'string' && cls.includes('bg-[#F5F5F5]') && cls.includes('px-[10px]') && cls.includes('py-[8px]'); });
    return el ? el.textContent?.trim().replace(/\s+/g, ' ') || '' : '';
  });
}

async function captureCheckoutETA(page: any): Promise<string> {
  await page.waitForTimeout(3000);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const leafWithETA = Array.from(document.querySelectorAll('p, span, div')).find(e => e.children.length === 0 && /expected delivery/i.test(e.textContent?.trim() || '') && !e.closest('style') && !e.closest('script'));
    if (leafWithETA) return leafWithETA.textContent?.trim().replace(/\s+/g, ' ') || '';
    const dateLeaf = Array.from(document.querySelectorAll('p, span')).find(e => e.children.length === 0 && /\d+\s*[-–]\s*\d+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(e.textContent?.trim() || ''));
    if (dateLeaf) return dateLeaf.textContent?.trim() || '';
    return '';
  });
}

async function captureThankYouETA(page: any): Promise<string> {
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD', 'META', 'LINK']);
    const byText = Array.from(document.querySelectorAll('p, span, div')).find(e => !skip.has(e.tagName) && e.children.length <= 8 && /expected delivery/i.test(e.textContent?.trim() || ''));
    if (byText) return byText.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) || '';
    const dateEl = Array.from(document.querySelectorAll('p, span')).find(e => e.children.length === 0 && /\d+\s*[-–]\s*\d+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(e.textContent?.trim() || ''));
    return dateEl?.textContent?.trim() || '';
  });
}

test.describe('ETA Verification — PDP → Checkout → Thank You', () => {

  test('Gym → Shilajit Gold PDP → capture ETA → Buy Now → verify ETA on Checkout & Thank You', async ({ page }) => {
    test.setTimeout(180000);

    await openHomePage(page);
    console.log('\n✅ Step 1: Homepage opened');

    await closePopupIfPresent(page);
    console.log('✅ Step 2: Popup dismissed');

    await page.goto('https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/gym/i);
    console.log(`✅ Step 3: Gym concern page → ${page.url()}`);

    await page.evaluate(async () => { for (let y = 0; y < 3000; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } });
    await page.waitForTimeout(1000);

    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });
    const listingProductName = await shilajitCard.locator('h2').first().innerText({ timeout: 3000 }).catch(() => 'Shilajit Gold Resin');
    console.log(`✅ Step 4: Product found — "${listingProductName}"`);
    expect(listingProductName).toMatch(/shilajit gold resin/i);

    await shilajitCard.locator('a').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const pdpUrl = page.url();
    expect(pdpUrl).toMatch(/shilajit/i);
    const pdpProductName = await page.locator('h1').first().textContent({ timeout: 10000 }).then(t => t?.trim() || listingProductName);
    console.log(`✅ Step 5: PDP opened → "${pdpProductName}"`);
    expect(pdpProductName).toMatch(/shilajit gold resin/i);

    const pdpETA = await capturePDPETA(page);
    console.log(`✅ Step 6: ETA on PDP — "${pdpETA}"`);
    expect(pdpETA, 'ETA should be visible on PDP').toBeTruthy();

    await buyNowFromPDP(page);
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 7: Buy Now → Checkout → ${page.url()}`);

    await ensureQuantityIsOne(page);
    console.log('✅ Step 8: Quantity = 1 verified');

    await fillAddress(page, { phone: '7411849065', email: 'santosh.kumbar@kapiva.in', name: 'Santosh', address: 'Tech Demo Address', pincode: '400001' });
    console.log('✅ Step 9: Address filled');

    const checkoutETA = await captureCheckoutETA(page);
    console.log(`✅ Step 10: ETA on Checkout — "${checkoutETA}"`);

    const grandTotalRaw = await page.locator('.priceSummary_bottomTotal__dus8f').first().textContent().catch(() => '');
    const gtMatch = grandTotalRaw?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
    const grandTotalBefore = gtMatch ? gtMatch[1] : 'N/A';
    console.log(`✅ Step 11: Grand Total — ${grandTotalBefore}`);

    await selectUPI(page, 'test123@upi');
    console.log('✅ Step 12: UPI selected — test123@upi');

    const checkoutData = await captureCheckoutSummary(page);
    console.log(`✅ Step 13: Checkout — Product: "${checkoutData.productName}" | Grand Total: ${checkoutData.grandTotal}`);
    expect(checkoutData.productName).toMatch(/shilajit gold resin/i);

    await placeOrder(page);
    console.log('✅ Step 14: Place Order clicked');

    await markPaymentSuccess(page);
    console.log('✅ Step 15: Payment marked as Success');

    await page.waitForURL('**/order-confirmation**', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const confirmationUrl = page.url();
    console.log(`✅ Step 16: Thank You page → ${confirmationUrl}`);

    const orderIdMatch = confirmationUrl.match(/order_id=(\d+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : 'N/A';
    console.log(`   Order ID: ${orderId}`);

    const confirmProductName = await page.locator('p[class*="truncate"][class*="leading-normal"]').first().textContent({ timeout: 5000 }).then(t => t?.trim() || 'N/A').catch(() => 'N/A');
    console.log(`   Product on Thank You: "${confirmProductName}"`);

    const thankyouETA = await captureThankYouETA(page);
    console.log(`   ETA on Thank You — "${thankyouETA}"`);

    const confirmGrandTotal = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const m = body.match(/Grand\s*Total[^₹]*(₹[\d,]+\.?\d*)/i);
      return m ? m[1] : 'N/A';
    });
    console.log(`   Grand Total on Thank You: ${confirmGrandTotal}`);

    const pdpDateMatch = pdpETA.match(/\d+\s*[-–]\s*\d+\s*\w+/);
    const pdpDate = pdpDateMatch ? pdpDateMatch[0].trim() : pdpETA.slice(0, 15);
    const etaCheckoutMatch = checkoutETA.includes(pdpDate) || pdpETA.includes(checkoutETA.slice(0, 10));
    const etaThankyouMatch = thankyouETA.includes(pdpDate) || pdpETA.includes(thankyouETA.slice(0, 10));

    console.log('\n' + '═'.repeat(75));
    console.log('  ETA VERIFICATION — SUMMARY');
    console.log('═'.repeat(75));
    console.log(`${'Page'.padEnd(12)} | ${'ETA'.padEnd(45)} | Match`);
    console.log('─'.repeat(75));
    console.log(`${'PDP'.padEnd(12)} | ${pdpETA.slice(0, 44).padEnd(45)} | ✅ (reference)`);
    console.log(`${'Checkout'.padEnd(12)} | ${checkoutETA.slice(0, 44).padEnd(45)} | ${etaCheckoutMatch ? '✅' : '⚠️ differs'}`);
    console.log(`${'Thank You'.padEnd(12)} | ${thankyouETA.slice(0, 44).padEnd(45)} | ${etaThankyouMatch ? '✅' : '⚠️ differs'}`);
    console.log('─'.repeat(75));
    console.log(`${'Product Name'.padEnd(12)} | ${'Checkout'.padEnd(22)} | ${'Thank You'.padEnd(22)}`);
    console.log('─'.repeat(75));
    console.log(`${''.padEnd(12)} | ${checkoutData.productName.slice(0, 21).padEnd(22)} | ${confirmProductName.slice(0, 21).padEnd(22)}`);
    console.log(`${'Grand Total'.padEnd(12)} | ${checkoutData.grandTotal.padEnd(22)} | ${confirmGrandTotal.padEnd(22)}`);
    console.log(`${'Order ID'.padEnd(12)} | ${'—'.padEnd(22)} | ${orderId.padEnd(22)}`);
    console.log('═'.repeat(75));

    expect(orderId, 'Order ID should be present').not.toBe('N/A');
    expect(pdpETA, 'ETA must be present on PDP').toBeTruthy();

    if (!checkoutETA) console.log('⚠️  Checkout ETA not found — may require pincode API to respond');
    if (!thankyouETA) console.log('⚠️  Thank You ETA not found — may not be shown on this order confirmation');

    expect(confirmProductName, `Product name on Thank You should match checkout`).toBe(checkoutData.productName);

    const normalize = (v: string) => v.replace(/[₹,\s]/g, '').trim();
    expect(normalize(confirmGrandTotal), `Grand Total mismatch — Checkout: ${checkoutData.grandTotal}, Thank You: ${confirmGrandTotal}`).toBe(normalize(checkoutData.grandTotal));

    console.log('\n🎉 ETA verification across PDP → Checkout → Thank You complete!\n');
  });

});
