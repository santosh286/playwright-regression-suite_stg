import { test } from '@playwright/test';
import { TrackOrderPage } from '../../pages/TrackOrderPage';

test('Track order with invalid order ID shows error message', async ({ page }) => {
  const trackOrderPage = new TrackOrderPage(page);

  await trackOrderPage.openHomePage();
  await trackOrderPage.closeHeaderPopup();
  await trackOrderPage.openTrackOrderPage();

  await trackOrderPage.trackOrder('15086');

  // ✅ Assertion — verify error message is visible and contains expected text
  await trackOrderPage.verifyErrorMessage('Order details not found');
});
