import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* ── Navigation ─────────────────────────────────────── */

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await expect(this.page).toHaveTitle(/KAPIVA/i);
  }

  async closePopupIfPresent() {
    await this.page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await this.page.waitForTimeout(500);
  }

  /* ── Login via header LOGIN button ─────────────────── */

  async clickHeaderLoginButton() {
    const loginBtn = this.page.locator('button, a').filter({ hasText: /^LOGIN$/i }).first();
    await loginBtn.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      loginBtn.click(),
    ]);
  }

  /* ── Login via Hamburger menu ───────────────────────── */

  async openHamburgerMenu() {
    const hamburgerBtn = this.page.locator('//button[@class="h-full px-1 lg:order-2 "]');
    await hamburgerBtn.waitFor({ state: 'visible', timeout: 10000 });
    await hamburgerBtn.click();
    await this.page.waitForTimeout(1000);
    const menuPanel = this.page.locator('//div[@class="flex-1 overflow-y-auto"]');
    await expect(menuPanel).toBeVisible({ timeout: 5000 });
    return menuPanel;
  }

  async clickLoginInHamburgerMenu() {
    const menuPanel = await this.openHamburgerMenu();
    const loginMenuItem = menuPanel.locator('a, button').filter({ hasText: /^Login$/i }).first();
    await expect(loginMenuItem).toBeVisible({ timeout: 5000 });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      loginMenuItem.click(),
    ]);
  }

  /* ── Phone input & submit ───────────────────────────── */

  async enterPhoneNumber(phone: string) {
    const phoneInput = this.page.locator('input[name="number"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await phoneInput.fill(phone);
  }

  async clickSubmit() {
    const submitBtn = this.page.locator('button.MuiLoadingButton-root');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();
    await this.page.waitForTimeout(2000);
  }

  /* ── OTP screen verification ────────────────────────── */

  async verifyOTPScreen(phone: string) {
    const otpHeading = this.page.getByText(/OTP Verification/i);
    await expect(otpHeading).toBeVisible({ timeout: 10000 });

    const otpMessage = this.page.getByText(phone);
    await expect(otpMessage).toBeVisible({ timeout: 5000 });

    const allTelInputs = this.page.locator('input[type="tel"]');
    const totalTel = await allTelInputs.count();
    expect(totalTel).toBeGreaterThanOrEqual(6);

    const resendLink = this.page.getByText(/Resend OTP/i);
    await expect(resendLink).toBeVisible({ timeout: 5000 });

    return { otpBoxCount: totalTel };
  }
}
