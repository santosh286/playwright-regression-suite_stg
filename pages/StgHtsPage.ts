import { Page, Locator, expect } from '@playwright/test';

const STG_HTS_URL = 'https://stg-hts.kapiva.tech/';

/** Desktop viewport size */
const DESKTOP_VIEWPORT = { width: 1512, height: 861 };  



export class StgHtsPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email\s*id/i).or(page.getByPlaceholder(/email/i));
    this.passwordInput = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    this.loginButton = page.getByRole('button', { name: /^login$/i });
  }

  /** Open the staging HTS website in desktop view */
  async open() {
    await this.page.setViewportSize(DESKTOP_VIEWPORT);
    await this.page.goto(STG_HTS_URL, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Open and verify we're on the staging URL */
  async openAndVerify() {
    await this.open();
    await expect(this.page).toHaveURL(/stg-hts\.kapiva\.tech/);
  }

  /** Enter email in the Email ID field */
  async enterEmail(email: string) {
    await expect(this.emailInput).toBeVisible({ timeout: 15_000 });
    await this.emailInput.fill(email);
  }

  /** Enter password in the Password field */
  async enterPassword(password: string) {
    await expect(this.passwordInput).toBeVisible({ timeout: 10_000 });
    await this.passwordInput.fill(password);
  }

  /** Click the LOGIN button */
  async clickLogin() {
    await expect(this.loginButton).toBeVisible({ timeout: 10_000 });
    await this.loginButton.click();
  }

  /** Perform login with email and password */
  async login(email: string, password: string) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLogin();
  }
}
