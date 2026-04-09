import { test, expect } from '@playwright/test';
import { SideMenuPage } from '../pages/SideMenuPage';

test.describe('Kapiva – Hamburger Menu Flow (Galaxy S8)', () => {
  let sideMenuPage: SideMenuPage;

  test.beforeEach(async ({ page }) => {
    sideMenuPage = new SideMenuPage(page);
    await sideMenuPage.openWebsite();
  });

  test('Open hamburger menu, read menu, and click login', async () => {
    await sideMenuPage.openHamburgerMenu();

    const menuData = await sideMenuPage.getAllMenuData();
    console.log('Menu Data:', menuData);

    expect(menuData.length).toBeGreaterThan(0);

    await sideMenuPage.clickLogin();

    await expect(sideMenuPage.page).toHaveURL(/login|account|auth/i);
  });
});
