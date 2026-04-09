import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* -------------------- HOME -------------------- */

  async openHomePage() {
    await this.page.goto('https://staging.kapiva.in/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await expect(this.page).toHaveTitle(/KAPIVA/i);
  }

  async closePopupIfPresent() {
    await this.page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await this.page.waitForTimeout(500);
  }

  /* -------------------- CONCERN -------------------- */

  async selectConcern(concernName: string) {
    // Concern cards are directly visible on the homepage — no modal needed
    const concernText = this.page.getByText(concernName, { exact: true }).first();
    await expect(concernText).toBeVisible({ timeout: 10000 });
    await concernText.click();
  }

  /* -------------------- PRODUCT -------------------- */

  async openProductPDP(productId: string): Promise<string> {
    const productCard = this.page.locator(`[data-product-id="${productId}"]`);
    await productCard.waitFor({ state: 'visible' });
    await productCard.scrollIntoViewIfNeeded();

    // Click the product link (first <a> in card) to open PDP
    const productLink = productCard.locator('a').first();
    await productLink.click();

    // Wait for navigation away from homepage to PDP
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Get product name from H1 on PDP
    const productName = await this.page.locator('h1').first().textContent({ timeout: 10000 });
    const name = productName?.trim() || 'N/A';
    console.log(`📋 PDP Product Name: "${name}"`);
    return name;
  }

  async capturePDPPriceBeforeCoupon(): Promise<string> {
    // Sale price shown on PDP — first large bold price element
    const priceEl = this.page.locator('p.mt-\\[2px\\].text-\\[20px\\].font-\\[700\\]').first();
    const text = await priceEl.textContent({ timeout: 5000 }).catch(() => 'N/A');
    const price = text?.trim() || 'N/A';
    console.log(`💰 PDP Price BEFORE coupon: ${price}`);
    return price;
  }

  async applyBestPriceCouponOnPDP(): Promise<{ priceAfter: string; navigatedToCheckout: boolean }> {
    // Open "Offers For You" section on PDP
    const offersHeading = this.page.getByRole('heading', { name: /offers for you/i });
    await expect(offersHeading).toBeVisible({ timeout: 10000 });
    await offersHeading.scrollIntoViewIfNeeded();
    await offersHeading.click();
    await this.page.waitForTimeout(800);

    // Click the online payment coupon row
    const onlineCoupon = this.page.getByText(/online payment coupon/i).first();
    await expect(onlineCoupon).toBeVisible({ timeout: 5000 });
    await onlineCoupon.click();

    // Wait briefly — it may navigate to checkout OR open a modal
    await this.page.waitForTimeout(2000);
    const currentUrl = this.page.url();
    const navigatedToCheckout = currentUrl.includes('checkout');

    if (navigatedToCheckout) {
      console.log(`🛒 Best Price coupon navigated directly to checkout`);
      return { priceAfter: 'N/A', navigatedToCheckout: true };
    }

    // Modal appeared — find and click the coupon card
    const appliedCouponCard = this.page.locator('.appliedCoupon_couponsCard__DBs17');
    const modalVisible = await appliedCouponCard.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      await appliedCouponCard.click();
      await this.page.waitForTimeout(1000);
    }

    // Capture updated price after coupon applied on PDP
    const priceEl = this.page.locator('p.mt-\\[2px\\].text-\\[20px\\].font-\\[700\\]').first();
    const text = await priceEl.textContent({ timeout: 5000 }).catch(() => 'N/A');
    const price = text?.trim() || 'N/A';
    console.log(`💸 PDP Price AFTER coupon: ${price}`);
    return { priceAfter: price, navigatedToCheckout: false };
  }

  async buyNowFromPDP() {
    // Scroll down to reveal the Buy Now button on PDP
    await this.page.evaluate(() => window.scrollBy(0, 400));
    await this.page.waitForTimeout(500);

    const buyNowBtn = this.page.getByRole('button', { name: /buy now/i }).first();
    await expect(buyNowBtn).toBeVisible({ timeout: 10000 });
    await buyNowBtn.scrollIntoViewIfNeeded();
    await buyNowBtn.click();

    // Wait for navigation to checkout
    await this.page.waitForURL('**/checkout**', { timeout: 20000 });
  }

  async buyProductByProductId(productId: string) {
    const productCard = this.page.locator(`[data-product-id="${productId}"]`);
    await productCard.waitFor({ state: 'visible' });
    await productCard.scrollIntoViewIfNeeded();

    const buyNowBtn = productCard.getByRole('button', { name: /buy now/i });
    await expect(buyNowBtn).toBeVisible();
    await buyNowBtn.click();

    // Wait for navigation to checkout page
    await this.page.waitForURL('**/checkout**', { timeout: 20000 });
  }

  /* -------------------- QUANTITY CHECK -------------------- */

  async ensureQuantityIsOne() {
    // Wait for checkout order summary to load
    await this.page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });

    // Use evaluate to find and read the quantity input (no name, numeric value)
    const currentQty = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
      const qtyInput = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
      return qtyInput ? parseInt(qtyInput.value, 10) : 1;
    });

    if (currentQty > 1) {
      // Click the minus button next to the quantity input (currentQty - 1) times
      for (let i = currentQty; i > 1; i--) {
        await this.page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
          const qtyInput = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
          if (qtyInput) {
            const minusBtn = qtyInput.previousElementSibling as HTMLElement;
            if (minusBtn) minusBtn.click();
          }
        });
        await this.page.waitForTimeout(600);
      }
    }

    // Verify final quantity is 1
    const finalQty = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
      const qtyInput = inputs.find(el => !el.name && /^\d+$/.test(el.value.trim()));
      return qtyInput ? parseInt(qtyInput.value, 10) : 1;
    });

    expect(finalQty).toBe(1);
    console.log(`✅ Quantity verified: ${finalQty}`);
  }

  /* -------------------- ADDRESS -------------------- */

  async fillAddress(details: {
    phone: string;
    email: string;
    name: string;
    address: string;
    pincode: string;
  }) {
    // Wait for checkout form to be ready
    await this.page.waitForSelector('input[name="phone"]', { state: 'visible', timeout: 15000 });

    // Fill phone — clear first, verify exactly 10 digits, retry if needed
    const phone = this.page.locator('input[name="phone"]');
    await phone.click();
    await phone.fill('');
    await phone.pressSequentially(details.phone, { delay: 50 });
    const phoneVal = await phone.inputValue();
    if (phoneVal.replace(/\D/g, '').length !== 10) {
      await phone.fill('');
      await phone.pressSequentially(details.phone, { delay: 80 });
    }

    const email = this.page.locator('input[name="email"]');
    await email.click();
    await email.fill('');
    await email.pressSequentially(details.email, { delay: 50 });

    const fullName = this.page.locator('input[name="fullName"]');
    await fullName.click();
    await fullName.fill('');
    await fullName.pressSequentially(details.name, { delay: 50 });

    const address1 = this.page.locator('input[name="address1"]');
    await address1.click();
    await address1.fill('');
    await address1.pressSequentially(details.address, { delay: 50 });

    const postalCode = this.page.locator('input[name="postalCode"]');
    await postalCode.click();
    await postalCode.fill('');
    await postalCode.pressSequentially(details.pincode, { delay: 100 });
    await postalCode.press('Tab');

    // Wait for pincode API to auto-populate city/state
    await this.page.waitForTimeout(2500);
  }

  /* -------------------- CHECKOUT SUMMARY -------------------- */

  async captureCheckoutSummary(): Promise<{ productName: string; productPrice: string; grandTotal: string }> {
    // Product name — from Order Summary section
    // The section text is "Order SummaryAshwagandha Gold Capsules1 Month @5%..."
    // Extract the product name by taking the text between "Order Summary" and variant info
    const productName = await this.page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('*'))
        .find(el => el.children.length === 0 && el.textContent?.trim() === 'Order Summary');
      if (heading?.parentElement) {
        const section = heading.parentElement;
        // Find elements that look like product names: no ₹, no @, no "Month", not "Order Summary"
        const candidates = Array.from(section.querySelectorAll('p, span, h3, h4'))
          .filter(el => el.children.length === 0)
          .map(el => el.textContent?.trim() || '')
          .filter(t => t.length > 3 && !/^₹/.test(t) && !/@/.test(t) && !/Order Summary/i.test(t) && !/^\d+$/.test(t) && !/shipping/i.test(t) && !/month/i.test(t));
        return candidates[0] || '';
      }
      return '';
    });

    // Product sale price (displayed price, not crossed-out MRP)
    const productPrice = await this.page.locator('.productCard_salePriceMain__7oOip').first()
      .textContent().catch(() => 'N/A');

    // Grand Total from Price Summary section
    const grandTotalText = await this.page.locator('.priceSummary_bottomTotal__dus8f').first()
      .textContent().catch(() => '');
    const grandTotalMatch = grandTotalText?.match(/Grand Total:(₹[\d,]+\.?\d*)/);
    const grandTotal = grandTotalMatch ? grandTotalMatch[1] : 'N/A';

    console.log(`📦 Checkout — Product: "${productName}" | Price: ${productPrice} | Grand Total: ${grandTotal}`);
    return {
      productName: productName || 'N/A',
      productPrice: productPrice?.trim() || 'N/A',
      grandTotal
    };
  }

  /* -------------------- COUPON -------------------- */

  async applyCoupon(couponLabel: string) {
    // Find coupon card containing the label text and click "TAP TO APPLY"
    const couponCard = this.page.locator('div, section').filter({ hasText: couponLabel }).first();
    await expect(couponCard).toBeVisible({ timeout: 10000 });

    const tapToApply = couponCard.getByText(/tap to apply/i).first();
    await expect(tapToApply).toBeVisible({ timeout: 5000 });
    await tapToApply.click();

    // Wait for coupon to be applied (success message or price update)
    await this.page.waitForTimeout(2000);
    console.log(`🎟️ Coupon "${couponLabel}" applied`);
  }

  /* -------------------- PAYMENT -------------------- */

  async selectUPI(upiId: string) {
    // Scroll down to reveal the payment section
    await this.page.evaluate(() => window.scrollBy(0, 600));
    await this.page.waitForTimeout(500);

    // Click the visible "Pay online" / UPI tab
    const upiTab = this.page.locator('div, button, span, li')
      .filter({ hasText: /^(upi|pay online)$/i })
      .filter({ visible: true })
      .first();
    await expect(upiTab).toBeVisible({ timeout: 10000 });
    await upiTab.scrollIntoViewIfNeeded();
    await upiTab.click();
    await this.page.waitForTimeout(500);

    // Fill UPI ID input
    const upiInput = this.page.locator('input[placeholder*="upi" i], input[name*="upi" i], input[placeholder*="@" i]').first();
    await expect(upiInput).toBeVisible({ timeout: 10000 });
    await upiInput.click();
    await upiInput.fill('');
    await upiInput.pressSequentially(upiId, { delay: 50 });
    console.log(`💳 UPI ID entered: ${upiId}`);

    // Wait for UPI fee to be reflected in Grand Total
    await this.page.waitForTimeout(3000);
  }

  async selectNetBanking(bankCode: string) {
    await this.page.getByText('Netbanking', { exact: true }).click();

    // Both selects share name "stateOrProvinceCode"; bank dropdown is the enabled one
    const dropdown = this.page.locator('select:not([disabled])').first();
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.selectOption(bankCode);
  }

  async placeOrder() {
    // PLACE ORDER is a DIV (not a button) with class choosePaymentMethods_webView__RwEoE
    const placeOrderBtn = this.page.locator('.choosePaymentMethods_webView__RwEoE').filter({ hasText: /PLACE ORDER/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 15000 });
    await placeOrderBtn.scrollIntoViewIfNeeded();
    await placeOrderBtn.click();
    // Wait for navigation to Juspay gateway or order confirmation
    await this.page.waitForURL(/juspay|order-confirmation|payment/, { timeout: 45000 });
  }

  /* -------------------- GATEWAY (STAGING) -------------------- */

  async markPaymentSuccess() {
    // Wait for Juspay sandbox to load
    await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 });

    // Check if this is the UPI demo page (has a "Success" button)
    const successBtn = this.page.getByRole('button', { name: /success/i });
    const selectOptions = this.page.getByText('Select Options');

    const isUPIPage = await successBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (isUPIPage) {
      // UPI Juspay demo: click Success directly
      await successBtn.click();
    } else {
      // NetBanking Juspay sandbox: Select Options → CHARGED → Submit
      await expect(selectOptions).toBeVisible({ timeout: 15000 });
      await selectOptions.click();

      const chargedOption = this.page.getByText('CHARGED', { exact: true });
      await expect(chargedOption).toBeVisible({ timeout: 5000 });
      await chargedOption.click();

      const submitBtn = this.page.getByRole('button', { name: 'Submit' });
      await expect(submitBtn).toBeEnabled({ timeout: 5000 });
      await submitBtn.click();
    }

    // Wait for redirect back to order confirmation
    await this.page.waitForURL('**/order-confirmation**', { timeout: 30000 });
  }

  /* -------------------- ETA -------------------- */

  async capturePDPETA(): Promise<string> {
    await this.page.evaluate(() => window.scrollBy(0, 600));
    await this.page.waitForTimeout(800);
    return this.page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(e => {
        const cls = e.className || '';
        return typeof cls === 'string' &&
          cls.includes('bg-[#F5F5F5]') &&
          cls.includes('px-[10px]') &&
          cls.includes('py-[8px]');
      });
      return el ? el.textContent?.trim().replace(/\s+/g, ' ') || '' : '';
    });
  }

  async captureCheckoutETA(): Promise<string> {
    await this.page.waitForTimeout(3000);
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(1000);

    return this.page.evaluate(() => {
      const leafWithETA = Array.from(document.querySelectorAll('p, span, div')).find(e =>
        e.children.length === 0 &&
        /expected delivery/i.test(e.textContent?.trim() || '') &&
        !e.closest('style') && !e.closest('script')
      );
      if (leafWithETA) return leafWithETA.textContent?.trim().replace(/\s+/g, ' ') || '';

      const dateLeaf = Array.from(document.querySelectorAll('p, span')).find(e =>
        e.children.length === 0 &&
        /\d+\s*[-–]\s*\d+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(e.textContent?.trim() || '')
      );
      if (dateLeaf) return dateLeaf.textContent?.trim() || '';

      const container = Array.from(document.querySelectorAll('div')).find(e => {
        const cls = (e.className || '').toString();
        return cls.includes('mb-[16px]') && cls.includes('w-full');
      });
      if (container) {
        const leaves = Array.from(container.querySelectorAll('p, span'))
          .filter(e => e.children.length === 0)
          .map(e => e.textContent?.trim())
          .filter(Boolean);
        if (leaves.length) return leaves.join(' ').slice(0, 100);
      }
      return '';
    });
  }

  async captureThankYouETA(): Promise<string> {
    await this.page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(1000);

    return this.page.evaluate(() => {
      const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD', 'META', 'LINK']);
      const byText = Array.from(document.querySelectorAll('p, span, div')).find(e =>
        !skip.has(e.tagName) &&
        e.children.length <= 8 &&
        /expected delivery/i.test(e.textContent?.trim() || '')
      );
      if (byText) return byText.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) || '';

      const candidates = Array.from(document.querySelectorAll('div, p, span')).filter(e => {
        const cls = (e.className || '').toString();
        return cls.includes('flex') && cls.includes('justify-between');
      });
      for (const el of candidates) {
        const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (/delivery|apr|may|jun|jul/i.test(text) && text.length < 150 && !/(wallet|coins|download)/i.test(text)) {
          return text.slice(0, 100);
        }
      }

      const dateEl = Array.from(document.querySelectorAll('p, span')).find(e =>
        e.children.length === 0 &&
        /\d+\s*[-–]\s*\d+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(e.textContent?.trim() || '')
      );
      return dateEl?.textContent?.trim() || '';
    });
  }

  /* -------------------- FREE GIFT -------------------- */

  async selectFreeGift(giftName: string): Promise<string | null> {
    await this.page.waitForTimeout(2000);
    return this.page.evaluate((name) => {
      const giftEl = Array.from(document.querySelectorAll('*')).find(
        el => el.children.length === 0 && new RegExp(name, 'i').test(el.textContent?.trim() || '')
      );
      if (!giftEl) return null;
      let parent = giftEl.parentElement;
      for (let i = 0; i < 8; i++) {
        if (!parent) break;
        const btn = parent.querySelector('button');
        const hasImg = !!parent.querySelector('img');
        if (btn && hasImg) { (btn as HTMLButtonElement).click(); return name; }
        parent = parent.parentElement;
      }
      (giftEl.parentElement as HTMLElement)?.click();
      return name;
    }, giftName);
  }

  async captureThankYouFreeGift(keyword: string): Promise<boolean> {
    const bodyText = await this.page.evaluate(() => document.body.innerHTML);
    return new RegExp(keyword, 'i').test(bodyText);
  }

  /* -------------------- VERIFICATION -------------------- */

  async verifyOrderPlaced(checkoutData: {
    productName: string;
    grandTotal: string;
  }): Promise<{ orderId: string; kapivaCoins: string; confirmationProductName: string; confirmationGrandTotal: string }> {

    // Confirm we are on the order confirmation page
    await this.page.waitForURL('**/order-confirmation**', { timeout: 30000 });
    await expect(
      this.page.getByText(/Order Confirmation|Great choice/i)
    ).toBeVisible({ timeout: 15000 });

    // ── Order ID from URL ──────────────────────────────────────────────
    const url = this.page.url();
    const orderIdMatch = url.match(/order_id=(\d+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : 'N/A';

    // ── Product name on confirmation — compare with checkout ───────────
    // Class is "truncate leading-normal false" (CSS module pattern)
    const confirmationProductName = await this.page
      .locator('p[class*="truncate"][class*="leading-normal"]').first()
      .textContent({ timeout: 5000 })
      .catch(() => 'N/A') as string;

    expect(confirmationProductName.trim()).toBe(checkoutData.productName);
    console.log(`✅ Product name match: "${confirmationProductName.trim()}"`);

    // ── Grand Total comparison ─────────────────────────────────────────
    // Extract Grand Total from confirmation page — look for "Grand Total" label + sibling price
    const confirmationGrandTotal = await this.page.evaluate(() => {
      // Find leaf element whose text is exactly "Grand Total" or close
      const labelEl = Array.from(document.querySelectorAll('*'))
        .find(el => el.children.length === 0 && /^grand\s*total$/i.test(el.textContent?.trim() || ''));

      if (labelEl) {
        // Look in siblings or parent for the ₹ amount
        const parent = labelEl.parentElement;
        if (parent) {
          const priceEl = Array.from(parent.querySelectorAll('*'))
            .find(e => e !== labelEl && e.children.length === 0 && /^₹[\d,]+/.test(e.textContent?.trim() || ''));
          if (priceEl) return priceEl.textContent?.trim() || 'N/A';
          // Try next sibling of parent
          const nextSib = parent.nextElementSibling;
          if (nextSib) {
            const priceEl2 = Array.from(nextSib.querySelectorAll('*'))
              .find(e => e.children.length === 0 && /^₹[\d,]+/.test(e.textContent?.trim() || ''));
            if (priceEl2) return priceEl2.textContent?.trim() || 'N/A';
          }
        }
      }

      // Fallback: find "Grand Total ₹X" pattern anywhere in the page text
      const body = document.body.textContent || '';
      const m = body.match(/Grand\s*Total[^₹]*(₹[\d,]+\.?\d*)/i);
      return m ? m[1] : 'N/A';
    });

    // Debug: log raw confirmation page text around "total"
    const totalContext = await this.page.evaluate(() => {
      const body = document.body.textContent || '';
      const idx = body.toLowerCase().indexOf('grand total');
      return idx >= 0 ? body.slice(Math.max(0, idx - 10), idx + 40) : 'not found';
    });
    console.log(`🔍 Grand Total context on confirmation: "${totalContext}"`);

    // Normalize and compare (strip commas for numeric comparison)
    const normalize = (val: string) => val.replace(/[₹,\s]/g, '').trim();
    const totalsMatch = normalize(confirmationGrandTotal) === normalize(checkoutData.grandTotal);
    console.log(`💰 Grand Total — Checkout: ${checkoutData.grandTotal} | Confirmation: ${confirmationGrandTotal} | Match: ${totalsMatch ? '✅' : '❌'}`);
    expect(confirmationGrandTotal).not.toBe('N/A');
    expect(normalize(confirmationGrandTotal)).toBe(normalize(checkoutData.grandTotal));

    // ── Kapiva Coins — wait for rolling animation to finish ───────────
    await expect(
      this.page.locator('p').filter({ hasText: 'Kapiva Coins' }).first()
    ).toBeVisible({ timeout: 10000 });

    // Wait for animation to settle (~3-4 seconds rolling counter)
    await this.page.waitForTimeout(4000);

    // Extract final coins: find the "You have earned" section and get all nums < 1000
    const kapivaCoins = await this.page.evaluate(() => {
      // Find the element that contains "You have earned" and "Kapiva Coins"
      const container = Array.from(document.querySelectorAll('*'))
        .find(el =>
          (el.textContent?.includes('You have earned') || el.textContent?.includes('Kapiva Coins')) &&
          el.children.length >= 1 &&
          el.children.length <= 10
        );
      if (!container) return 'N/A';

      // Extract the Kapiva Coins "Earn" parent specifically
      // Look for the element nearest to "Kapiva Coins" label that has rolling numbers
      const coinsLabel = Array.from(container.querySelectorAll('p'))
        .find(el => el.textContent?.trim() === 'Kapiva Coins');

      const searchRoot = coinsLabel?.parentElement || container;

      // Coins are small numbers (< 500); product prices are > 500
      const nums = Array.from(searchRoot.querySelectorAll('*'))
        .filter(el => el.children.length === 0)
        .map(el => parseInt(el.textContent?.trim() || '', 10))
        .filter(n => !isNaN(n) && n > 0 && n < 500);

      return nums.length > 0 ? String(Math.max(...nums)) : 'N/A';
    });

    console.log(`🪙 Kapiva Coins earned: ${kapivaCoins}`);
    console.log(`🎉 Order confirmed! Order ID: ${orderId}`);

    return { orderId, kapivaCoins, confirmationProductName: confirmationProductName.trim(), confirmationGrandTotal };
  }
}
