import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Place Order – NetBanking Flow', () => {

  test('User should place order successfully using NetBanking', async ({ page }) => {

    const checkout = new CheckoutPage(page);

    // 1. Open homepage and dismiss staging popup
    await checkout.openHomePage();
    await checkout.closePopupIfPresent();

    // 2. Select concern and product
    await checkout.selectConcern('Gym Foods');
    await checkout.buyProductByProductId('1317');

    // 3. Verify quantity is exactly 1 on checkout
    await checkout.ensureQuantityIsOne();

    // 4. Fill delivery address
    await checkout.fillAddress({
      phone: '7411849065',
      email: 'santosh.kumbar@kapiva.in',
      name: 'Santosh',
      address: 'Tech Demo Address',
      pincode: '400001'
    });

    // 5. Capture product name + Grand Total from checkout for later comparison
    const checkoutData = await checkout.captureCheckoutSummary();

    // 6. Select NetBanking payment with Axis Bank
    await checkout.selectNetBanking('NB_AXIS');

    // 7. Place order
    await checkout.placeOrder();

    // 8. On Juspay staging gateway — select CHARGED and submit
    await checkout.markPaymentSuccess();

    // 9. Verify order confirmation:
    //    - Product name matches checkout
    //    - Grand Total logged for comparison
    //    - Kapiva Coins animated value captured
    const { orderId, kapivaCoins, confirmationProductName, confirmationGrandTotal } = await checkout.verifyOrderPlaced(checkoutData);

    // Final assertions
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
