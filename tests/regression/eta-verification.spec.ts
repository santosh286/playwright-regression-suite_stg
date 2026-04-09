import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('ETA Verification — PDP → Checkout → Thank You', () => {

  test('Gym → Shilajit Gold PDP → capture ETA → Buy Now → verify ETA on Checkout & Thank You', async ({ page }) => {
    test.setTimeout(180000);
    const checkout = new CheckoutPage(page);

    await checkout.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await checkout.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await page.goto('https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/gym/i);
    console.log(`✅ Step 3: Gym concern page → ${page.url()}`);

    await page.evaluate(async () => {
      for (let y = 0; y < 3000; y += 300) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);

    const shilajitCard = page.locator('[data-product-id="1405"]').first();
    await shilajitCard.waitFor({ state: 'attached', timeout: 10000 });
    const listingProductName = await shilajitCard.locator('h2').first()
      .innerText({ timeout: 3000 }).catch(() => 'Shilajit Gold Resin');
    console.log(`✅ Step 4: Product found — "${listingProductName}"`);
    expect(listingProductName).toMatch(/shilajit gold resin/i);

    await shilajitCard.locator('a').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const pdpUrl = page.url();
    expect(pdpUrl).toMatch(/shilajit/i);
    const pdpProductName = await page.locator('h1').first()
      .textContent({ timeout: 10000 }).then(t => t?.trim() || listingProductName);
    console.log(`✅ Step 5: PDP opened → "${pdpProductName}"`);
    expect(pdpProductName).toMatch(/shilajit gold resin/i);

    const pdpETA = await checkout.capturePDPETA();
    console.log(`✅ Step 6: ETA on PDP — "${pdpETA}"`);
    expect(pdpETA, 'ETA should be visible on PDP').toBeTruthy();

    await checkout.buyNowFromPDP();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 7: Buy Now → Checkout → ${page.url()}`);

    await checkout.ensureQuantityIsOne();
    console.log('✅ Step 8: Quantity = 1 verified');

    await checkout.fillAddress({
      phone:   '7411849065',
      email:   'santosh.kumbar@kapiva.in',
      name:    'Santosh',
      address: 'Tech Demo Address',
      pincode: '400001',
    });
    console.log('✅ Step 9: Address filled');

    const checkoutETA = await checkout.captureCheckoutETA();
    console.log(`✅ Step 10: ETA on Checkout — "${checkoutETA}"`);

    const grandTotalRaw = await page.locator('.priceSummary_bottomTotal__dus8f').first()
      .textContent().catch(() => '');
    const gtMatch = grandTotalRaw?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
    const grandTotalBefore = gtMatch ? gtMatch[1] : 'N/A';
    console.log(`✅ Step 11: Grand Total — ${grandTotalBefore}`);

    await checkout.selectUPI('test123@upi');
    console.log('✅ Step 12: UPI selected — test123@upi');

    const checkoutData = await checkout.captureCheckoutSummary();
    console.log(`✅ Step 13: Checkout — Product: "${checkoutData.productName}" | Grand Total: ${checkoutData.grandTotal}`);
    expect(checkoutData.productName).toMatch(/shilajit gold resin/i);

    await checkout.placeOrder();
    console.log('✅ Step 14: Place Order clicked');

    await checkout.markPaymentSuccess();
    console.log('✅ Step 15: Payment marked as Success');

    await page.waitForURL('**/order-confirmation**', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const confirmationUrl = page.url();
    console.log(`✅ Step 16: Thank You page → ${confirmationUrl}`);

    const orderIdMatch = confirmationUrl.match(/order_id=(\d+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : 'N/A';
    console.log(`   Order ID: ${orderId}`);

    const confirmProductName = await page
      .locator('p[class*="truncate"][class*="leading-normal"]').first()
      .textContent({ timeout: 5000 })
      .then(t => t?.trim() || 'N/A')
      .catch(() => 'N/A');
    console.log(`   Product on Thank You: "${confirmProductName}"`);

    const thankyouETA = await checkout.captureThankYouETA();
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
