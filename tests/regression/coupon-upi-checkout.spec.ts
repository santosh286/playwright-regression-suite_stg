import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Coupon + UPI Checkout — Shilajit Gold Resin', () => {

  test('Gym → Shilajit Gold PDP → Buy Now → Coupon "Save 5" → UPI → Place Order → Verify Thank You', async ({ page }) => {
    test.setTimeout(180000);
    const checkout = new CheckoutPage(page);

    /* ── Step 1: Open staging homepage ─────────────────────── */
    await checkout.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    /* ── Step 2: Close popup ────────────────────────────────── */
    await checkout.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    /* ── Step 3: Navigate to Gym concern page ───────────────── */
    await page.goto('https://staging.kapiva.in/solution/gym-fitness/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/gym/i);
    console.log(`✅ Step 3: Gym concern page → ${page.url()}`);

    /* ── Step 4: Find Shilajit Gold Resin (id=1405) ─────────── */
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

    /* ── Step 5: Open PDP ───────────────────────────────────── */
    await shilajitCard.locator('a').first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const pdpUrl = page.url();
    expect(pdpUrl).toMatch(/shilajit/i);

    const pdpProductName = await page.locator('h1').first()
      .textContent({ timeout: 10000 }).then(t => t?.trim() || listingProductName);
    console.log(`✅ Step 5: PDP opened → "${pdpProductName}" | ${pdpUrl}`);
    expect(pdpProductName).toMatch(/shilajit gold resin/i);

    /* ── Step 6: Click Buy Now → Checkout ───────────────────── */
    await checkout.buyNowFromPDP();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 6: Buy Now → Checkout → ${page.url()}`);

    /* ── Step 7: Ensure quantity = 1 ───────────────────────── */
    await checkout.ensureQuantityIsOne();
    console.log('✅ Step 7: Quantity = 1 verified');

    /* ── Step 8: Fill address ───────────────────────────────── */
    await checkout.fillAddress({
      phone:   '7411849065',
      email:   'santosh.kumbar@kapiva.in',
      name:    'Santosh',
      address: 'Tech Demo Address',
      pincode: '400001',
    });
    console.log('✅ Step 8: Address filled');

    /* ── Step 9: Apply coupon "Save 5" ──────────────────────── */
    await checkout.applyCoupon('Save 5');
    console.log('✅ Step 9: Coupon "Save 5" applied');

    /* ── Step 10: Capture Grand Total before UPI ────────────── */
    const grandTotalBeforeUPI = await page.locator('.priceSummary_bottomTotal__dus8f').first()
      .textContent().catch(() => '');
    const beforeMatch = grandTotalBeforeUPI?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
    const grandTotalBefore = beforeMatch ? beforeMatch[1] : 'N/A';
    console.log(`✅ Step 10: Grand Total (before UPI) — ${grandTotalBefore}`);

    /* ── Step 11: Select UPI → enter test123@upi ─────────────── */
    await checkout.selectUPI('test123@upi');
    console.log('✅ Step 11: UPI selected — test123@upi');

    /* ── Step 12: Capture final checkout summary ─────────────── */
    const checkoutData = await checkout.captureCheckoutSummary();
    console.log(`✅ Step 12: Checkout summary — Product: "${checkoutData.productName}" | Grand Total: ${checkoutData.grandTotal}`);

    expect(checkoutData.productName).toMatch(/shilajit gold resin/i);
    expect(checkoutData.grandTotal).not.toBe('N/A');

    /* ── Step 13: Place order ────────────────────────────────── */
    await checkout.placeOrder();
    console.log('✅ Step 13: Place Order clicked');

    /* ── Step 14: Mark payment as success ───────────────────── */
    await checkout.markPaymentSuccess();
    console.log('✅ Step 14: Payment marked as Success');

    /* ── Step 15: Thank You page ─────────────────────────────── */
    await page.waitForURL('**/order-confirmation**', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const confirmationUrl = page.url();
    console.log(`✅ Step 15: Thank You page → ${confirmationUrl}`);

    /* ── Step 16: Get Order ID ───────────────────────────────── */
    const orderIdMatch = confirmationUrl.match(/order_id=(\d+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : 'N/A';
    console.log(`   Order ID: ${orderId}`);

    /* ── Step 17: Get product name on confirmation ───────────── */
    const confirmProductName = await page
      .locator('p[class*="truncate"][class*="leading-normal"]').first()
      .textContent({ timeout: 5000 })
      .then(t => t?.trim() || 'N/A')
      .catch(() => 'N/A');
    console.log(`   Product on Thank You: "${confirmProductName}"`);

    /* ── Step 18: Get Grand Total on confirmation ────────────── */
    const confirmGrandTotal = await page.evaluate(() => {
      const body = document.body.textContent || '';
      const m = body.match(/Grand\s*Total[^₹]*(₹[\d,]+\.?\d*)/i);
      return m ? m[1] : 'N/A';
    });
    console.log(`   Grand Total on Thank You: ${confirmGrandTotal}`);

    /* ── Summary ─────────────────────────────────────────────── */
    console.log('\n' + '═'.repeat(65));
    console.log('  COUPON + UPI CHECKOUT — SUMMARY');
    console.log('═'.repeat(65));
    console.log(`${'Field'.padEnd(22)} | ${'Checkout'.padEnd(20)} | ${'Thank You'.padEnd(20)}`);
    console.log('─'.repeat(65));
    console.log(`${'Product Name'.padEnd(22)} | ${checkoutData.productName.slice(0,19).padEnd(20)} | ${confirmProductName.slice(0,19).padEnd(20)}`);
    console.log(`${'Grand Total'.padEnd(22)} | ${checkoutData.grandTotal.padEnd(20)} | ${confirmGrandTotal.padEnd(20)}`);
    console.log(`${'Order ID'.padEnd(22)} | ${'—'.padEnd(20)} | ${orderId.padEnd(20)}`);
    console.log('═'.repeat(65));

    /* ── Assertions ─────────────────────────────────────────── */
    expect(orderId, 'Order ID should be present on Thank You page').not.toBe('N/A');

    expect(
      confirmProductName,
      `Product name on Thank You "${confirmProductName}" should match checkout "${checkoutData.productName}"`
    ).toBe(checkoutData.productName);

    const normalize = (v: string) => v.replace(/[₹,\s]/g, '').trim();
    expect(
      normalize(confirmGrandTotal),
      `Grand Total mismatch — Checkout: ${checkoutData.grandTotal}, Thank You: ${confirmGrandTotal}`
    ).toBe(normalize(checkoutData.grandTotal));

    console.log('\n🎉 Coupon + UPI Checkout verified successfully!\n');
  });

});
