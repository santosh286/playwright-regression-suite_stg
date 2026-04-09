import { Page, Locator, expect } from '@playwright/test';

export class BestPricePage {
  private bannerText: Locator;
  private closeIcon: Locator;

  private selectConcern: Locator;
  private gymFoods: Locator;
  private productLink: Locator;

  private offersHeading: Locator;
  private onlineCoupon: Locator;
  private appliedCouponCard: Locator;

  private finalPrice: Locator;
  private beforePriceText: Locator;

  constructor(private page: Page) {
    // Header popup
    this.bannerText = page.getByText('KAPIVA - TESTINGThis is our');
    this.closeIcon = page.getByRole('img').first();

    // Navigation
    this.selectConcern = page.getByText('SELECT CONCERN');
    this.gymFoods = page.locator('div').filter({ hasText: /^Gym Foods$/ });
    this.productLink = page.getByRole('link', { name: /Shilajit Gold Resin/i });

    // Offers
    this.offersHeading = page.getByRole('heading', { name: 'Offers For You' });
    this.onlineCoupon = page.getByText('Online payment couponCode -');
    this.appliedCouponCard = page.locator('.appliedCoupon_couponsCard__DBs17');

    // Prices
    this.finalPrice = page.locator('#priceSummary_grandTotalDiv__CtNir');

    // ✅ Your exact locator for BEFORE price
    this.beforePriceText = page.locator(
      '(//p[@class="mt-[2px] text-[20px] font-[700]"])[1]'
    );
  }

  // ---------------- BASIC ACTIONS ----------------

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
    });
  }

  async closeHeaderPopupIfVisible() {
    if (await this.bannerText.isVisible()) {
      await this.bannerText.click();
      await this.closeIcon.click();
    }
  }

  async navigateToProduct() {
    await this.selectConcern.click();
    await this.gymFoods.click();
    await this.productLink.click();
  }

  async openOffers() {
    await expect(this.offersHeading).toBeVisible();
    await this.offersHeading.click();
  }

  // ---------------- PRICE METHODS ----------------

  async getBeforePrice(): Promise<number> {
    const text = await this.beforePriceText.innerText();
    const price = Number(text.replace(/[₹,]/g, '').trim());
    console.log('💰 Price BEFORE coupon:', price);
    return price;
  }

  async applyOnlinePaymentCoupon() {
    // Click online payment coupon (opens modal)
    await expect(this.onlineCoupon).toBeVisible();
    await this.onlineCoupon.click();

    // Wait for modal overlay
    const couponModal = this.page.locator('div.fixed.inset-0.z-\\[100\\]');
    await expect(couponModal).toBeVisible();

    // Click applied coupon INSIDE modal
    await expect(this.appliedCouponCard).toBeVisible();
    await this.appliedCouponCard.click();

    // Wait for modal to disappear
    await expect(couponModal).toBeHidden({ timeout: 10000 });
  }

  async getAfterPrice(): Promise<number> {
    const text = await this.finalPrice.getByText(/₹/).textContent();
    const price = Number(text?.replace(/[₹,]/g, '').trim());
    console.log('💸 Price AFTER coupon:', price);
    return price;
  }

  // ---------------- VALIDATION ----------------

  async validateBestPrice(before: number, after: number) {
    if (before !== after) {
      expect(after).toBeLessThan(before);
    } else {
      console.log('ℹ️ Price unchanged – Best price already applied');
    }
  }
}
