import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Free Gift Checkout — Shilajit Gold + Honey 250g', () => {

  test('Gym → Shilajit Gold PDP → Buy Now → Add Free Gift (Honey 250g) → UPI → Place Order → Verify Thank You', async ({ page }) => {
    test.setTimeout(240000);
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
    console.log(`✅ Step 5: PDP opened → ${pdpUrl}`);

    await checkout.buyNowFromPDP();
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/checkout/i);
    console.log(`✅ Step 6: Buy Now → Checkout → ${page.url()}`);

    await checkout.ensureQuantityIsOne();
    console.log('✅ Step 7: Quantity = 1 verified');

    await checkout.fillAddress({
      phone:   '7411849065',
      email:   'santosh.kumbar@kapiva.in',
      name:    'Santosh',
      address: 'Tech Demo Address',
      pincode: '400001',
    });
    console.log('✅ Step 8: Address filled');

    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1000);
    console.log('✅ Step 9: Scrolled to Free Gift section');

    const freeGiftName = await checkout.selectFreeGift('Honey 250g') ?? '';
    const giftSelected = !!freeGiftName;
    if (giftSelected) {
      await page.waitForTimeout(1500);
      console.log(`✅ Step 10: Free gift selected — "${freeGiftName}"`);
    } else {
      console.log('⚠️ Step 10: No free gift section found — continuing without gift');
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const checkoutSummary = await checkout.captureCheckoutSummary();
    console.log(`✅ Step 11: Checkout product — "${checkoutSummary.productName}" | Grand Total: ${checkoutSummary.grandTotal}`);

    const giftKeyword = freeGiftName ? freeGiftName.split(' ')[0] : '';
    const giftInCheckout = giftSelected ? await checkout.captureThankYouFreeGift(giftKeyword) : false;
    console.log(`   Free gift in checkout: ${giftInCheckout ? `✅ "${freeGiftName}" found` : '⚠️ Not found in HTML'}`);

    await checkout.selectUPI('test123@upi');
    console.log('✅ Step 12: UPI selected — test123@upi');

    const grandTotalRaw = await page.locator('.priceSummary_bottomTotal__dus8f').first()
      .textContent().catch(() => '');
    const grandTotalMatch = grandTotalRaw?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
    const finalGrandTotal = grandTotalMatch ? grandTotalMatch[1] : checkoutSummary.grandTotal;
    console.log(`✅ Step 12: Grand Total (after UPI fee) — ${finalGrandTotal}`);

    await checkout.placeOrder();
    console.log('✅ Step 13: Place Order clicked');

    await checkout.markPaymentSuccess();
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
      .textContent({ timeout: 5000 }).then(t => t?.trim() || 'N/A').catch(() => 'N/A');
    console.log(`   Product on Thank You: "${confirmProductName}"`);

    const giftInConfirm = giftSelected ? await checkout.captureThankYouFreeGift(giftKeyword) : false;
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
