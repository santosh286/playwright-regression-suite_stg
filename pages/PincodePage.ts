import { Page, Locator } from '@playwright/test';

export class PincodePage {
  readonly page: Page;
  readonly locationButton: Locator;
  readonly pincodeInput: Locator;
  readonly applyButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Click the cursor-pointer div in the header that shows current pincode/city
    // This opens the "Enter area pincode" input
    this.locationButton = page.locator('header div[class*="cursor-pointer"][class*="shrink-0"][class*="lg\\:flex"]').first();
    this.pincodeInput = page.getByRole('textbox', { name: 'Enter area pincode' });
    this.applyButton = page.getByRole('button', { name: 'Apply' });
  }

  async navigate() {
    await this.page.goto('https://staging.kapiva.in/', { waitUntil: 'domcontentloaded' });
  }

  async clickLocation() {
    await this.locationButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.locationButton.evaluate((el: HTMLElement) => el.click());
    await this.page.waitForTimeout(800);
  }

  async enterPincode(pincode: string) {
    await this.pincodeInput.click();
    await this.pincodeInput.fill(pincode);
  }

  async applyPincode() {
    await this.applyButton.click();
  }

  async setPincode(pincode: string) {
    await this.clickLocation();
    await this.enterPincode(pincode);
    await this.applyPincode();
  }
}
