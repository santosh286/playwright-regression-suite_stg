import { Page, expect } from '@playwright/test';

export class KapivaPage {
  constructor(private page: Page) {}

  /* ---------- Navigation ---------- */

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
    });
  }

  async openHamburgerMenu() {
    await this.page.getByRole('img').first().click();
  }

  async goToMensHealthCategory() {
    await this.page.getByText("Men's Health", { exact: true }).click();
  }

  async viewAllProducts() {
    await this.page.getByRole('link', { name: 'View all', exact: true }).click();
  }

  async openProduct(productName: string) {
    await this.page.getByRole('link', { name: productName }).click();
  }

  /* ---------- Product ---------- */

  async clickBuyNow() {
    const buyNowBtn = this.page.getByRole('button', { name: 'BUY NOW' });
    await expect(buyNowBtn).toBeVisible();
    await buyNowBtn.click();
  }

  /* ---------- Checkout ---------- */

  async fillCustomerDetails(data: {
    phone: string;
    email: string;
    name: string;
    address: string;
    pincode: string;
  }) {
    await this.page.getByRole('textbox', { name: 'Phone No.' }).fill(data.phone);
    await this.page.getByRole('textbox', { name: 'Email Address' }).fill(data.email);
    await this.page.getByRole('textbox', { name: 'Full Name' }).fill(data.name);
    await this.page
      .getByRole('textbox', { name: 'Address (House No., Building' })
      .fill(data.address);
    await this.page.getByRole('textbox', { name: 'Pincode' }).fill(data.pincode);
  }

  async selectUPIPayment(upiId: string) {
    await this.page.getByRole('listitem', { hasText: 'UPI' }).click();
    await this.page
      .getByRole('textbox', { name: 'Enter your UPI ID' })
      .fill(upiId);
  }

  async placeOrder() {
    const placeOrderBtn = this.page.getByText('PLACE ORDER');
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();
  }

  /* ---------- Payment ---------- */

  async verifyPaymentSuccess() {
    await this.page.waitForURL(/juspay/, { timeout: 30_000 });
    await expect(this.page.locator('form')).toContainText('SUCCESS');
  }

  async verifyOrderIdVisible() {
    await expect(this.page.getByText('Order ID')).toBeVisible();
  }
}
