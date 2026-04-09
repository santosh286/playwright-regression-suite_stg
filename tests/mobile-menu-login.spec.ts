import { test } from '@playwright/test';
import { MobileMenuPage } from '../pages/mobileMenu.page';

test.describe('Kapiva Mobile Menu Flow', () => {
  test.use({
    viewport: { width: 375, height: 812 },
  });

  test('Verify mobile hamburger menu and login page navigation', async ({ page }) => {
    const mobileMenuPage = new MobileMenuPage(page);

    await mobileMenuPage.openWebsite();
    await mobileMenuPage.verifyHamburgerMenuVisible();
    await mobileMenuPage.clickHamburgerMenu();
    await mobileMenuPage.logMenuData();
    await mobileMenuPage.clickLogin();
    await mobileMenuPage.verifyLoginPageLoaded();
  });
});
