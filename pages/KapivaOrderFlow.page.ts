import { Page, expect } from '@playwright/test';

export class KapivaOrderFlowPage {
  constructor(private page: Page) {}

  // ───────────────────
  // Navigation
  // ───────────────────
  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/');
  }

  async closeHeaderPopup() {
    await this.page.getByText('KAPIVA - TESTINGThis is our').click();
    await this.page.getByRole('img').first().click();
  }

  // ───────────────────
  // Category & Product
  // ───────────────────
  async goToMensHealthCategory() {
    await this.page.locator('div').filter({ hasText: /^Men's Health$/ }).click();
  }

  async viewAllProducts() {
    await this.page.getByRole('link', { name: 'View all', exact: true }).click();
  }

  async openProduct(productName: string) {
    await this.page.getByRole('link', { name: productName }).click();
  }

  async buyNow() {
    const buyNowBtn = this.page.getByRole('button', { name: 'BUY NOW' });
    await expect(buyNowBtn).toBeVisible();
    await buyNowBtn.click();
  }

  // ───────────────────
  // Checkout Details
  // ───────────────────
  async fillCheckoutDetails(details: {
    phone: string;
    email: string;
    name: string;
    address: string;
    pincode: string;
  }) {
    await this.page.getByRole('textbox', { name: 'Phone No.' }).fill(details.phone);
    await this.page.getByRole('textbox', { name: 'Email Address' }).fill(details.email);
    await this.page.getByRole('textbox', { name: 'Full Name' }).fill(details.name);
    await this.page
      .getByRole('textbox', { name: 'Address (House No., Building' })
      .fill(details.address);
    await this.page.getByRole('textbox', { name: 'Pincode' }).fill(details.pincode);
  }

  // ───────────────────
  // Payment
  // ───────────────────
  async selectUPIPayment(upiId: string) {
    await this.page.getByText('UPICredit/Debit').click();
    await this.page.getByRole('listitem').filter({ hasText: 'UPI' }).click();
    await this.page.getByRole('textbox', { name: 'Enter your UPI ID' }).fill(upiId);
  }

  async placeOrder() {
    const placeOrderBtn = this.page.locator('[class*="bg-[#80a03c]"]');
    await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
    await placeOrderBtn.click();
  }

  // ───────────────────
  // Payment Success (ADDED)
  // ───────────────────
  async confirmPaymentSuccess() {
    const successForm = this.page
      .locator('form')
      .filter({ hasText: /SUCCESS/i });

    // ✅ Wait for payment success
    await expect(successForm).toBeVisible({ timeout: 15000 });

    // Optional click (keep only if required by flow)
    await successForm.click();
  }

  // ───────────────────
  // Order Confirmation
  // ───────────────────
  async getOrderId(): Promise<string> {
    await expect(this.page.getByText(/order id/i)).toBeVisible({ timeout: 20000 });

    const orderText = await this.page
      .locator('text=/Order ID/i')
      .textContent();

    const orderId = orderText?.match(/Order ID[:\s]*([A-Z0-9-]+)/i)?.[1];
    expect(orderId).toBeTruthy();

    return orderId!;
  }
}
