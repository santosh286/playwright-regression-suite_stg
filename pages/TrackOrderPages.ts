import { Page, expect } from '@playwright/test';

export class TrackOrderPage {
  constructor(private page: Page) {}

  async openSite() {
    await this.page.goto('https://staging.kapiva.in/');
  }

  async navigateToTrackOrder() {
    await this.page.getByText('KAPIVA - TESTINGThis is our').click();
    await this.page.getByRole('img').first().click();
    await this.page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
  }

  async enterOrderId(orderId: string) {
    await this.page.locator('input[name="id"]').fill(orderId);
  }

  async clickTrack() {
    await this.page.getByRole('button', { name: 'Track' }).click();
  }

  async verifyOrderStatus(orderId: string) {
    await expect(
      this.page.getByText(
        `Your Order “${orderId}” is currently being packed in our warehouse`
      )
    ).toBeVisible();
  }
}
