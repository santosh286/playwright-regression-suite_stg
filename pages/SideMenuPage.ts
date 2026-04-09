import { Page, Locator, expect } from '@playwright/test';

export class SideMenuPage {
  readonly page: Page;
  readonly hamburgerMenu: Locator;
  readonly sideDrawer: Locator;

  constructor(page: Page) {
    this.page = page;

    // ✅ Galaxy S8 – real hamburger (SVG inside clickable div)
    this.hamburgerMenu = page.locator(
      "//header//div[.//svg]"
    ).first();

    // ✅ Side drawer appears after click (contains Login)
    this.sideDrawer = page.locator(
      "//div[contains(@class,'fixed') and .//text()[contains(.,'Login')]]"
    ).first();
  }

  // 1️⃣ Open website
  async openWebsite() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for mobile header render
    await this.page.waitForTimeout(1500);

    await expect(this.hamburgerMenu).toBeVisible({ timeout: 20_000 });
  }

  // 2️⃣ Open hamburger menu
  async openHamburgerMenu() {
    await this.hamburgerMenu.click();

    await expect(this.sideDrawer).toBeVisible({ timeout: 10_000 });
    await expect(
      this.sideDrawer.getByText(/^login$/i)
    ).toBeVisible();
  }

  // 3️⃣ Get menu items
  async getAllMenuData(): Promise<string[]> {
    const items = this.sideDrawer.locator('a, button, p');

    await expect(items.first()).toBeVisible({ timeout: 5_000 });

    const texts = await items.allInnerTexts();

    return [...new Set(
      texts.map(t => t.trim()).filter(Boolean)
    )];
  }

  // 4️⃣ Click Login
  async clickLogin() {
    const loginBtn = this.sideDrawer.getByText(/^login$/i);
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();
  }
}
