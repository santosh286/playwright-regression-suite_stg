import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Place Order – UPI Flow', () => {

  test('User should place order successfully using UPI', async ({ page }) => {

    const checkout = new CheckoutPage(page);

    // 1. Open homepage and dismiss staging popup
    await checkout.openHomePage();
    await checkout.closePopupIfPresent();

    // 2. Select concern (Gym Foods) and open PDP for product 1405
    await checkout.selectConcern('Gym Foods');
    const pdpProductName = await checkout.openProductPDP('1405');

    // 3. Scroll and click Buy Now from PDP
    await checkout.buyNowFromPDP();

    // 4. Verify quantity is exactly 1 on checkout
    await checkout.ensureQuantityIsOne();

    // 5. Fill delivery address
    await checkout.fillAddress({
      phone: '7411849065',
      email: 'santosh.kumbar@kapiva.in',
      name: 'Santosh',
      address: 'Tech Demo Address',
      pincode: '400001'
    });

    // 6. Apply coupon "Save 5"
    await checkout.applyCoupon('Save 5');

    // 7. Select UPI payment (fee is added to Grand Total after selecting UPI)
    await checkout.selectUPI('test123@upi');

    // 8. Capture product name + Grand Total AFTER UPI selected (includes ₹10 UPI fee)
    const checkoutData = await checkout.captureCheckoutSummary();

    // 9. Place order
    await checkout.placeOrder();

    // 10. On Juspay staging gateway — select CHARGED and submit
    await checkout.markPaymentSuccess();

    // 11. Verify order confirmation:
    //     - Product name matches checkout
    //     - Grand Total logged for comparison
    //     - Kapiva Coins animated value captured
    //     - Order ID captured dynamically
    const { orderId, kapivaCoins, confirmationProductName, confirmationGrandTotal } = await checkout.verifyOrderPlaced(checkoutData);

    // Final assertions
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
