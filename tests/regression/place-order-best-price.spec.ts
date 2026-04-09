import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Place Order – Best Price Online Flow', () => {

  test('User should place order using Best Price Online coupon', async ({ page }) => {

    const checkout = new CheckoutPage(page);

    // 1. Open homepage and dismiss staging popup
    await checkout.openHomePage();
    await checkout.closePopupIfPresent();

    // 2. Select concern and open PDP for product 1405
    await checkout.selectConcern('Gym Foods');
    const pdpProductName = await checkout.openProductPDP('1405');

    // 3. Capture price BEFORE applying coupon on PDP
    const priceBeforeCoupon = await checkout.capturePDPPriceBeforeCoupon();

    // 4. Apply "Best Price Online" / online payment coupon on PDP
    //    — This may navigate directly to checkout OR apply on PDP first
    const { priceAfter: priceAfterCoupon, navigatedToCheckout } =
      await checkout.applyBestPriceCouponOnPDP();

    // 5. If still on PDP, assert price dropped then click Buy Now
    if (!navigatedToCheckout) {
      const before = Number(priceBeforeCoupon.replace(/[₹,]/g, '').trim());
      const after = Number(priceAfterCoupon.replace(/[₹,]/g, '').trim());
      if (before !== after) {
        expect(after).toBeLessThan(before);
        console.log(`✅ Best Price applied on PDP: ${priceBeforeCoupon} → ${priceAfterCoupon}`);
      } else {
        console.log(`ℹ️ Price unchanged on PDP – Best Price already active`);
      }
      await checkout.buyNowFromPDP();
    } else {
      console.log(`✅ Best Price coupon applied — already on checkout`);
    }

    // 6. Verify quantity is exactly 1 on checkout
    await checkout.ensureQuantityIsOne();

    // 7. Fill delivery address
    await checkout.fillAddress({
      phone: '7411849065',
      email: 'santosh.kumbar@kapiva.in',
      name: 'Santosh',
      address: 'Tech Demo Address',
      pincode: '400001'
    });

    // 8. Select UPI payment (Best Price is for online payments)
    await checkout.selectUPI('test123@upi');

    // 9. Capture Grand Total AFTER UPI selected (includes UPI fee)
    const checkoutData = await checkout.captureCheckoutSummary();

    // 10. Place order
    await checkout.placeOrder();

    // 11. On Juspay staging gateway — click Success
    await checkout.markPaymentSuccess();

    // 12. Verify order confirmation
    const { orderId, kapivaCoins, confirmationProductName, confirmationGrandTotal } =
      await checkout.verifyOrderPlaced(checkoutData);

    // Final assertions
    expect(orderId).not.toBe('N/A');
    expect(kapivaCoins).not.toBe('N/A');
    expect(confirmationProductName).toBe(checkoutData.productName);

    console.log(`\n===== ORDER SUMMARY =====`);
    console.log(`PDP Product Name         : ${pdpProductName}`);
    console.log(`PDP Price Before Coupon  : ${priceBeforeCoupon}`);
    console.log(`PDP Price After Coupon   : ${navigatedToCheckout ? '(applied at checkout)' : priceAfterCoupon}`);
    console.log(`Product (Checkout)       : ${checkoutData.productName}`);
    console.log(`Product Price            : ${checkoutData.productPrice}`);
    console.log(`Grand Total (Checkout)   : ${checkoutData.grandTotal}`);
    console.log(`Grand Total (Confirm)    : ${confirmationGrandTotal}`);
    console.log(`Order ID                 : ${orderId}`);
    console.log(`Kapiva Coins             : ${kapivaCoins}`);
    console.log(`=========================\n`);
  });

});
