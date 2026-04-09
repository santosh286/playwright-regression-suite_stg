import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const TEST_PHONE = '7411849065';

test.describe('Login Page Validation', () => {

  test('Open homepage → close popup → click Login → enter phone → verify OTP screen', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await loginPage.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await loginPage.clickHeaderLoginButton();
    console.log(`✅ Step 3: Login button clicked → ${page.url()}`);

    await expect(page).toHaveURL(/login|account/);
    console.log(`✅ Step 4: Login page URL → ${page.url()}`);

    await loginPage.enterPhoneNumber(TEST_PHONE);
    console.log(`✅ Step 5 & 6: Phone input visible, entered: ${TEST_PHONE}`);

    await loginPage.clickSubmit();
    console.log('✅ Step 7: Submit button clicked');

    const { otpBoxCount } = await loginPage.verifyOTPScreen(TEST_PHONE);
    console.log(`✅ Step 8: OTP screen verified — ${otpBoxCount} tel inputs found`);

    console.log('\n🎉 OTP screen loaded successfully!\n');
  });

  test('Homepage → close popup → Hamburger menu → Login → phone → verify OTP screen', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await loginPage.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await loginPage.clickLoginInHamburgerMenu();
    console.log(`✅ Step 3-6: Hamburger → Login → ${page.url()}`);

    await expect(page).toHaveURL(/login|account/);

    await loginPage.enterPhoneNumber(TEST_PHONE);
    console.log(`✅ Step 7 & 8: Phone input visible, entered: ${TEST_PHONE}`);

    await loginPage.clickSubmit();
    console.log('✅ Step 9: Submit button clicked');

    const { otpBoxCount } = await loginPage.verifyOTPScreen(TEST_PHONE);
    console.log(`✅ Step 10: OTP screen verified — ${otpBoxCount} tel inputs found`);

    console.log('\n🎉 Hamburger → Login → OTP screen verified successfully!\n');
  });

});
