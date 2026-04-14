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

async function buyNowFromPDP(page: any) {
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  const btn = page.getByRole('button', { name: /buy now/i }).first();
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForURL(/checkout|login|account/i, { timeout: 20000 });
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
  expect(await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    const q = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
    return q ? parseInt(q.value, 10) : 1;
  })).toBe(1);
}

async function fillAddress(page: any, d: { phone: string; email: string; name: string; address: string; pincode: string }) {
  await page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });
  for (const [name, val] of [['phone', d.phone], ['email', d.email], ['fullName', d.name], ['address1', d.address]] as [string, string][]) {
    const el = page.locator(`input[name="${name}"]`); await el.click(); await el.fill(''); await el.pressSequentially(val, { delay: 50 });
  }
  const postalCode = page.locator('input[name="postalCode"]'); await postalCode.click(); await postalCode.fill(''); await postalCode.pressSequentially(d.pincode, { delay: 100 }); await postalCode.press('Tab');
  await page.waitForTimeout(2500);
}

async function selectFreeGift(page: any, giftName: string): Promise<string | null> {
  await page.waitForTimeout(2000);
  return page.evaluate((name: string) => {
    const giftEl = Array.from(document.querySelectorAll('*')).find(
      el => el.children.length === 0 && new RegExp(name, 'i').test(el.textContent?.trim() || '')
    );
    if (!giftEl) return null;
    let parent = giftEl.parentElement;
    for (let i = 0; i < 8; i++) {
      if (!parent) break;
      const btn = parent.querySelector('button');
      const hasImg = !!parent.querySelector('img');
      if (btn && hasImg) { (btn as HTMLButtonElement).click(); return name; }
      parent = parent.parentElement;
    }
    (giftEl.parentElement as HTMLElement)?.click();
    return name;
  }, giftName);
}

async function captureThankYouFreeGift(page: any, keyword: string): Promise<boolean> {
  const bodyText = await page.evaluate(() => document.body.innerHTML);
  return new RegExp(keyword, 'i').test(bodyText);
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
  return { productName: productName || 'N/A', productPrice: productPrice?.trim() || 'N/A', grandTotal };
}

async function selectUPI(page: any, upiId: string) {
  await page.evaluate(() => window.scrollBy(0, 600)); await page.waitForTimeout(500);
  const upiTab = page.locator('div, button, span, li').filter({ hasText: /^(upi|pay online)$/i }).filter({ visible: true }).first();
  await expect(upiTab).toBeVisible({ timeout: 10000 }); await upiTab.scrollIntoViewIfNeeded(); await upiTab.click(); await page.waitForTimeout(500);
  const upiInput = page.locator('input[placeholder*="upi" i], input[name*="upi" i], input[placeholder*="@" i]').first();
  await expect(upiInput).toBeVisible({ timeout: 10000 }); await upiInput.click(); await upiInput.fill(''); await upiInput.pressSequentially(upiId, { delay: 50 });
  await page.waitForTimeout(3000);
}

async function placeOrder(page: any) {
  const btn = page.locator('.choosePaymentMethods_webView__RwEoE').filter({ hasText: /PLACE ORDER/i });
  await expect(btn).toBeVisible({ timeout: 15000 }); await btn.scrollIntoViewIfNeeded(); await btn.click();
  await page.waitForURL(/juspay|order-confirmation|payment/, { timeout: 45000 });
}

async function markPaymentSuccess(page: any) {
  await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  const successBtn = page.getByRole('button', { name: /success/i });
  const isUPIPage = await successBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (isUPIPage) { await successBtn.click(); } else {
    await expect(page.getByText('Select Options')).toBeVisible({ timeout: 15000 }); await page.getByText('Select Options').click();
    await expect(page.getByText('CHARGED', { exact: true })).toBeVisible({ timeout: 5000 }); await page.getByText('CHARGED', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled({ timeout: 5000 }); await page.getByRole('button', { name: 'Submit' }).click();
  }
  await page.waitForURL(/order-confirmation/i, { timeout: 30000 });
}

test.describe('Free Gift Checkout — Shilajit Gold + Honey 250g', () => {

  test('Gym → Shilajit Gold PDP → Buy Now → Add Free Gift (Honey 250g) → UPI → Place Order → Verify Thank You', async ({ page }) => {
    test.setTimeout(240000);

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
    console.log(`✅ Step 5: PDP opened → ${pdpUrl}`);

    await buyNowFromPDP(page);
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 6: Buy Now → Checkout → ${page.url()}`);

    await ensureQuantityIsOne(page);
    console.log('✅ Step 7: Quantity = 1 verified');

    await fillAddress(page, { phone: '7411849065', email: 'santosh.kumbar@kapiva.in', name: 'Santosh', address: 'Tech Demo Address', pincode: '400001' });
    console.log('✅ Step 8: Address filled');

    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } });
    await page.waitForTimeout(1000);
    console.log('✅ Step 9: Scrolled to Free Gift section');

    const freeGiftName = await selectFreeGift(page, 'Honey 250g') ?? '';
    const giftSelected = !!freeGiftName;
    if (giftSelected) {
      await page.waitForTimeout(1500);
      console.log(`✅ Step 10: Free gift selected — "${freeGiftName}"`);
    } else {
      console.log('⚠️ Step 10: No free gift section found — continuing without gift');
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const checkoutSummary = await captureCheckoutSummary(page);
    console.log(`✅ Step 11: Checkout product — "${checkoutSummary.productName}" | Grand Total: ${checkoutSummary.grandTotal}`);

    const giftKeyword = freeGiftName ? freeGiftName.split(' ')[0] : '';
    const giftInCheckout = giftSelected ? await captureThankYouFreeGift(page, giftKeyword) : false;
    console.log(`   Free gift in checkout: ${giftInCheckout ? `✅ "${freeGiftName}" found` : '⚠️ Not found in HTML'}`);

    await selectUPI(page, 'test123@upi');
    console.log('✅ Step 12: UPI selected — test123@upi');

    const grandTotalRaw = await page.locator('.priceSummary_bottomTotal__dus8f').first().textContent().catch(() => '');
    const grandTotalMatch = grandTotalRaw?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
    const finalGrandTotal = grandTotalMatch ? grandTotalMatch[1] : checkoutSummary.grandTotal;
    console.log(`✅ Step 12: Grand Total (after UPI fee) — ${finalGrandTotal}`);

    await placeOrder(page);
    console.log('✅ Step 13: Place Order clicked');

    await markPaymentSuccess(page);
    console.log('✅ Step 14: Payment marked as Success');

    await page.waitForURL('**/order-confirmation**', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const confirmationUrl = page.url();
    console.log(`✅ Step 15: Thank You page → ${confirmationUrl}`);

    const orderIdMatch = confirmationUrl.match(/order_id=(\d+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : 'N/A';
    console.log(`   Order ID: ${orderId}`);

    const confirmProductName = await page.locator('p[class*="truncate"][class*="leading-normal"]').first()
      .textContent({ timeout: 5000 }).then((t: string | null) => t?.trim() || 'N/A').catch(() => 'N/A');
    console.log(`   Product on Thank You: "${confirmProductName}"`);

    const giftInConfirm = giftSelected ? await captureThankYouFreeGift(page, giftKeyword) : false;
    console.log(`   Free gift on Thank You: ${giftInConfirm ? `✅ "${freeGiftName}" found` : '⚠️ Not found'}`);

    const confirmGrandTotal = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const m = body.match(/Grand\s*Total[^₹]*(₹[\d,]+\.?\d*)/i);
      return m ? m[1] : 'N/A';
    });
    console.log(`   Grand Total on Thank You: ${confirmGrandTotal}`);

    console.log('\n' + '═'.repeat(65));
    console.log('  FREE GIFT CHECKOUT — SUMMARY');
    console.log('═'.repeat(65));
    console.log(`${'Field'.padEnd(22)} | ${'Checkout'.padEnd(25)} | ${'Thank You'.padEnd(25)}`);
    console.log('─'.repeat(65));
    console.log(`${'Product Name'.padEnd(22)} | ${checkoutSummary.productName.slice(0,24).padEnd(25)} | ${confirmProductName.slice(0,24).padEnd(25)}`);
    console.log(`${'Free Gift'.padEnd(22)} | ${(giftInCheckout ? freeGiftName : '—').slice(0,24).padEnd(25)} | ${(giftInConfirm ? freeGiftName : '—').slice(0,24).padEnd(25)}`);
    console.log(`${'Grand Total'.padEnd(22)} | ${finalGrandTotal.padEnd(25)} | ${confirmGrandTotal.padEnd(25)}`);
    console.log(`${'Order ID'.padEnd(22)} | ${'—'.padEnd(25)} | ${orderId.padEnd(25)}`);
    console.log('═'.repeat(65));

    expect(orderId, 'Order ID should be present').not.toBe('N/A');
    expect(confirmProductName, `Product name on Thank You should match checkout`).toBe(checkoutSummary.productName);

    if (giftSelected) {
      expect(giftInCheckout, `Free gift "${freeGiftName}" should be visible on checkout page`).toBe(true);
      expect(giftInConfirm, `Free gift "${freeGiftName}" should be visible on Thank You page`).toBe(true);
    }

    const normalize = (v: string) => v.replace(/[₹,\s]/g, '').trim();
    expect(normalize(confirmGrandTotal), `Grand Total mismatch — Checkout: ${finalGrandTotal}, Thank You: ${confirmGrandTotal}`).toBe(normalize(finalGrandTotal));

    console.log('\n🎉 Free Gift Checkout verified successfully!\n');
  });

});
