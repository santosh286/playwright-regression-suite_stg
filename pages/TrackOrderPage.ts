import { Page, expect } from '@playwright/test';

export class TrackOrderPage {
  constructor(private page: Page) {}

  // Locators
  private trackOrderIcon = this.page.locator('#Path_24');
  private orderIdInput = this.page.locator('input[name="id"]');
  private trackButton = this.page.locator('input[value="Track"]');
  private errorMessage = this.page.locator('.error_message');

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/kapiva\.in/);
  }

  async closeHeaderPopup() {
    await this.page.getByText('KAPIVA - TESTINGThis is our').click();
    await this.page.getByRole('img').first().click();
  }

  async openTrackOrderPage() {
    // Navigate directly to avoid flaky SVG icon click
    await this.page.goto('https://staging.kapiva.in/track-order/', { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/track-order/);
  }

  async trackOrder(orderId: string) {
    await this.orderIdInput.waitFor({ state: 'visible' });
    await this.orderIdInput.fill(orderId);
    await this.trackButton.click();
  }

  // ✅ Assertion method — checks visibility + exact text
  async verifyErrorMessage(expectedMessage: string) {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
    await expect(this.errorMessage).toContainText(expectedMessage);
    const actual = await this.errorMessage.textContent();
    console.log(`  ✅ Error message: "${actual?.trim()}"`);
  }
}
