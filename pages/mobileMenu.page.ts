import { Page, Locator, expect } from '@playwright/test';

export class MobileMenuPage {
  readonly page: Page;
  readonly hamburgerMenuBtn: Locator;
  readonly menuContainer: Locator;
  readonly loginLink: Locator;
  readonly phoneInput: Locator;
  readonly continueButton: Locator;
  readonly loginText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Hamburger menu
    this.hamburgerMenuBtn = page.locator(
      '//button[@class="h-full px-1 lg:order-2 "]'
    );

    // Menu container
    this.menuContainer = page.locator(
      '//div[@class="flex-1 overflow-y-auto"]'
    );

    // Login link
    this.loginLink = page.getByRole('link', { name: /login/i });

    // Login page elements (REAL & STABLE)
    this.phoneInput = page.locator('input[type="tel"]');
    this.continueButton = page.locator('button', {
      hasText: /continue|login/i,
    });

    // Visible login text (not heading-based)
    this.loginText = page.getByText(/login/i).first();
  }

  async openWebsite() {
    await this.page.goto('https://kapiva.in/', {
      waitUntil: 'domcontentloaded',
    });
  }

  async verifyHamburgerMenuVisible() {
    await expect(this.hamburgerMenuBtn).toBeVisible();
  }

  async clickHamburgerMenu() {
    await this.hamburgerMenuBtn.click();
    await expect(this.menuContainer).toBeVisible();
  }

  async logMenuData() {
    const menuText = await this.menuContainer.innerText();
    console.log('📋 Mobile Menu Data:\n', menuText);
  }

  async clickLogin() {
    await expect(this.loginLink).toBeVisible();
    await this.loginLink.click();
  }

  async verifyLoginPageLoaded() {
    // URL validation
    await this.page.waitForURL('**/login.php', { timeout: 15000 });
    await expect(this.page).toHaveURL(/login\.php/);

    // Core UI checks
    await expect(this.phoneInput).toBeVisible();
    await expect(this.continueButton).toBeVisible();

    // Soft confirmation
    await expect(this.loginText).toBeVisible();
  }
}
