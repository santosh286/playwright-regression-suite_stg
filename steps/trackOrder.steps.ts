import { Given, When, Then } from '@cucumber/cucumber';
import { chromium, Page } from '@playwright/test';
import { TrackOrderPage } from '../pages/TrackOrderPages';

let page: Page;
let trackOrderPage: TrackOrderPage;

Given('user is on Kapiva tracking page', async function () {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  page = await context.newPage();
  trackOrderPage = new TrackOrderPage(page);

  await trackOrderPage.openSite();
  await trackOrderPage.navigateToTrackOrder();
});

When('user enters order id {string}', async function (orderId: string) {
  await trackOrderPage.enterOrderId(orderId);
});

When('user clicks on track button', async function () {
  await trackOrderPage.clickTrack();
});

Then('order status should be displayed', async function () {
  await trackOrderPage.verifyOrderStatus('15142');
});
