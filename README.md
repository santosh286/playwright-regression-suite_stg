# Playwright Regression Suite — Kapiva Staging

End-to-end regression test suite for [staging.kapiva.in](https://staging.kapiva.in) built with **Playwright + TypeScript** using the **Page Object Model (POM)** pattern.

---

## Tech Stack

| Tool | Version |
|---|---|
| [Playwright](https://playwright.dev) | Latest |
| TypeScript | Latest |
| Browser | Chrome (1512×861 viewport) |
| Reporter | HTML + Allure |
| CI/CD | GitHub Actions |

---

## Project Structure

```
playwright-regression-suite_stg/
│
├── pages/                          # Page Object Model classes
│   ├── AppPage.ts                  # Get App, WhatsApp, Shop on App
│   ├── BannerPage.ts               # Homepage banner link validation
│   ├── BestPricePage.ts            # Best price coupon flow
│   ├── CheckoutPage.ts             # Core: home, product, address, payment, ETA, free gift
│   ├── ConcernPage.ts              # Concern tiles & product crawl
│   ├── FooterPage.ts               # Footer links & icons
│   ├── HeroProductsPage.ts         # Product search & card validation
│   ├── HomePage.ts                 # Homepage, concerns, popup
│   ├── LoginPage.ts                # Login via header & hamburger, OTP
│   ├── PincodePage.ts              # Pincode panel
│   ├── ProductSectionPage.ts       # Bestsellers & New Arrivals
│   ├── SearchPages.ts              # Search box & results
│   ├── SideMenuPage.ts             # Hamburger side drawer
│   └── TrackOrderPage.ts           # Track order
│
├── tests/
│   └── regression/                 # 26 regression spec files
│       ├── best-price-online.spec.ts
│       ├── bestsellers.spec.ts
│       ├── cart-checkout.spec.ts
│       ├── concern-products-crawl.spec.ts
│       ├── concerns.spec.ts
│       ├── coupon-upi-checkout.spec.ts
│       ├── eta-verification.spec.ts
│       ├── footer-validation.spec.ts
│       ├── free-gift-checkout.spec.ts
│       ├── get-app.spec.ts
│       ├── hamburger-menu.spec.ts
│       ├── hero-products.spec.ts
│       ├── homepage-banners.spec.ts
│       ├── login-page.spec.ts
│       ├── new-arrivals.spec.ts
│       ├── pdp-radio-logo.spec.ts
│       ├── pincode.spec.ts
│       ├── place-order.spec.ts
│       ├── place-order-best-price.spec.ts
│       ├── place-order-netbanking.spec.ts
│       ├── place-order-upi.spec.ts
│       ├── search-products.spec.ts
│       ├── shop-on-app.spec.ts
│       ├── trackOrder.spec.ts
│       └── whatsapp-icon.spec.ts
│
├── .github/
│   └── workflows/
│       └── playwright.yml          # GitHub Actions CI pipeline
│
├── playwright.config.js            # Playwright configuration
├── package.json
└── README.md
```

---

## Test Coverage

| # | Spec File | What It Tests |
|---|---|---|
| 1 | `place-order.spec.ts` | Full E2E order via UPI |
| 2 | `place-order-upi.spec.ts` | UPI payment with coupon |
| 3 | `place-order-netbanking.spec.ts` | NetBanking payment |
| 4 | `place-order-best-price.spec.ts` | Best Price Online coupon |
| 5 | `best-price-online.spec.ts` | Price before/after coupon |
| 6 | `free-gift-checkout.spec.ts` | Free gift selection + order |
| 7 | `coupon-upi-checkout.spec.ts` | Coupon "Save 5" + UPI order |
| 8 | `eta-verification.spec.ts` | ETA match: PDP → Checkout → Thank You |
| 9 | `cart-checkout.spec.ts` | Product name consistency: Listing → Cart → Checkout |
| 10 | `hero-products.spec.ts` | Search 7 hero products, verify ATC + Buy Now |
| 11 | `concerns.spec.ts` | SELECT CONCERN tiles: image + name + broken image check |
| 12 | `concern-products-crawl.spec.ts` | All concern products: ATC + Buy Now crawl |
| 13 | `bestsellers.spec.ts` | Bestsellers section product cards |
| 14 | `new-arrivals.spec.ts` | New Arrivals section product cards |
| 15 | `homepage-banners.spec.ts` | Banner links: no 404, no homepage redirect |
| 16 | `footer-validation.spec.ts` | Footer links, contact info, platform & payment icons |
| 17 | `hamburger-menu.spec.ts` | Hamburger menu items, dropdowns, redirects |
| 18 | `login-page.spec.ts` | Login via header + hamburger → OTP screen |
| 19 | `pincode.spec.ts` | Pincode panel, login redirect |
| 20 | `search-products.spec.ts` | Product search results count |
| 21 | `trackOrder.spec.ts` | Track order with invalid ID error |
| 22 | `get-app.spec.ts` | GET APP → Play Store / App Store |
| 23 | `whatsapp-icon.spec.ts` | WhatsApp icon redirect |
| 24 | `shop-on-app.spec.ts` | Shop on App button from PDP |
| 25 | `pdp-radio-logo.spec.ts` | PDP radio variants + logo redirect |
| 26 | `homepage-banners.spec.ts` | Banner 404 and redirect validation |

---

## Setup

### Prerequisites
- Node.js 18+
- Google Chrome installed

### Install

```bash
git clone https://github.com/santosh286/playwright-regression-suite_stg.git
cd playwright-regression-suite_stg
npm install
npx playwright install
```

---

## Running Tests

### Run all regression tests
```bash
npx playwright test tests/regression/
```

### Run a specific spec
```bash
npx playwright test tests/regression/hero-products.spec.ts
```

### Run with HTML report
```bash
npx playwright test tests/regression/ --reporter=html
npx playwright show-report
```

### Run with Allure report
```bash
npx playwright test tests/regression/
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### Run in headed mode (see browser)
```bash
npx playwright test tests/regression/ --headed
```

### Run in debug mode
```bash
npx playwright test tests/regression/hero-products.spec.ts --debug
```

---

## Configuration

| Setting | Value |
|---|---|
| Base URL | `https://staging.kapiva.in` |
| Browser | Chrome (Chromium) |
| Viewport | 1512 × 861 |
| Timeout | 90,000 ms |
| Retries (CI) | 2 |
| Parallel | Yes (local), 1 worker (CI) |
| Screenshot | On failure only |
| Video | Retained on failure |
| Trace | On first retry |

---

## CI/CD

Tests run automatically via **GitHub Actions** on every push.

```
.github/workflows/playwright.yml
```

To view results go to: `Actions` tab in the GitHub repository.

---

## Page Object Model

All tests use the POM pattern — spec files contain only test logic, all selectors and interactions live in page objects.

```
Spec File  →  Page Object  →  Browser
```

**Example:**
```typescript
// tests/regression/login-page.spec.ts
const loginPage = new LoginPage(page);
await loginPage.openHomePage();
await loginPage.closePopupIfPresent();
await loginPage.clickHeaderLoginButton();
await loginPage.enterPhoneNumber('7411849065');
await loginPage.clickSubmit();
const { otpBoxCount } = await loginPage.verifyOTPScreen('7411849065');
```

---

## Author

**Santosh Kumbar**  
QA Automation Engineer — Kapiva
