import { test } from '@playwright/test';
import { BestPricePage } from '../../pages/BestPricePage';

test('Best Price validation for Online Payment coupon', async ({ page }) => {
  const bestPrice = new BestPricePage(page);

  await bestPrice.openHomePage();
  await bestPrice.closeHeaderPopupIfVisible();

  await bestPrice.navigateToProduct();
  await bestPrice.closeHeaderPopupIfVisible();

  await bestPrice.openOffers();

  const beforePrice = await bestPrice.getBeforePrice();

  await bestPrice.applyOnlinePaymentCoupon();

  const afterPrice = await bestPrice.getAfterPrice();

  await bestPrice.validateBestPrice(beforePrice, afterPrice);
});
