import { test } from '@playwright/test';
import { KapivaOrderFlowPage } from '../../pages/KapivaOrderFlow.page';

test('Place order using UPI and capture Order ID + clicked actions', async ({ page }) => {

    const kapiva = new KapivaOrderFlowPage(page);

    // ✅ Click list
    const clickedActions: string[] = [];

    await kapiva.openHomePage();
    await kapiva.closeHeaderPopup();

    await kapiva.goToMensHealthCategory();
    clickedActions.push('Mens Health Category');

    await kapiva.viewAllProducts();
    clickedActions.push('View All Products');

    await kapiva.closeHeaderPopup();
    await kapiva.openProduct('Shilajit Gold Resin 22% OFF 4');
    clickedActions.push('Open Product – Shilajit Gold Resin');

    await kapiva.closeHeaderPopup();
    await kapiva.buyNow();
    clickedActions.push('Buy Now');

    await kapiva.closeHeaderPopup();

    await kapiva.fillCheckoutDetails({
        phone: '7411849065',
        email: 'santosh.kumbar@kapiva.in',
        name: 'test demo',
        address: 'demo',
        pincode: '400001'
    });

    await kapiva.selectUPIPayment('test123@upi');
    clickedActions.push('Select UPI Payment');

    await kapiva.placeOrder();
    clickedActions.push('Place Order');

    await kapiva.confirmPaymentSuccess();

    await kapiva.closeHeaderPopup();
    const orderId = await kapiva.getOrderId();

    console.log('✅ Order ID:', orderId);

    // ===============================
    // 🟢 FINAL CLICK LIST OUTPUT
    // ===============================
    console.log('🟢 User Clicks Performed');
    clickedActions.forEach((action, index) => {
        console.log(`${index + 1}. ${action}`);
    });
});
