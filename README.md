# Playwright Regression Suite — Kapiva Staging

End-to-end regression test suite for [staging.kapiva.in](https://staging.kapiva.in) built with **Playwright + TypeScript**.

---

## Tech Stack

| Tool | Version |
|---|---|
| [Playwright](https://playwright.dev) | ^1.57 |
| TypeScript | Latest |
| Browser | Chrome (Mobile Chrome — 390×844 viewport) |
| Reporter | HTML + Allure |
| CI/CD | GitHub Actions (manual trigger) |

---

## Project Structure

```
playwright-regression-suite_stg/
│
├── utils/
│   ├── globalSetup.ts              # Pre-flight: pings staging before tests run
│   └── helpers.ts                  # navigateTo() with retry + closePopupIfPresent()
│
├── tests/
│   └── regression/                 # 27 regression spec files
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
│       ├── inspect.spec.ts
│       ├── login-page.spec.ts
│       ├── new-arrivals.spec.ts
│       ├── pdp-radio-logo.spec.ts
│       ├── pdp-share-copy-link.spec.ts
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
│       └── playwright.yml          # GitHub Actions CI pipeline (manual trigger)
│
├── playwright.config.js            # Playwright configuration
├── package.json
├── CLAUDE.md                       # Project instructions for Claude Code
└── README.md
```

---

## Test Coverage (27 Specs)

| # | Spec File | What It Tests | Status |
|---|---|---|---|
| 1 | `place-order.spec.ts` | Full E2E order via UPI | ✅ |
| 2 | `place-order-upi.spec.ts` | UPI payment with coupon — full order | ✅ |
| 3 | `place-order-netbanking.spec.ts` | NetBanking payment — full order | ✅ |
| 4 | `place-order-best-price.spec.ts` | Best Price Online coupon + order | ✅ |
| 5 | `best-price-online.spec.ts` | Online payment coupon → checkout with coupon in URL | ✅ |
| 6 | `free-gift-checkout.spec.ts` | Free gift (Honey 250g) selection + order | ✅ |
| 7 | `coupon-upi-checkout.spec.ts` | Coupon "Save 5" applied + UPI order | ✅ |
| 8 | `eta-verification.spec.ts` | ETA match across PDP → Checkout → Thank You | ✅ |
| 9 | `cart-checkout.spec.ts` | Product name consistency: Listing → Cart → Checkout | ✅ |
| 10 | `hero-products.spec.ts` | Search 7 hero products, verify ATC + Buy Now | ✅ |
| 11 | `concerns.spec.ts` | SELECT CONCERN tiles: image + name validation | ⚠️ |
| 12 | `concern-products-crawl.spec.ts` | All concern categories → all products ATC + Buy Now | ✅ |
| 13 | `bestsellers.spec.ts` | Bestsellers section product cards | ✅ |
| 14 | `new-arrivals.spec.ts` | New Arrivals section product cards | ✅ |
| 15 | `homepage-banners.spec.ts` | Banner links: no 404, no homepage redirect | ⚠️ |
| 16 | `footer-validation.spec.ts` | Footer links, contact info, platform & payment icons | ⚠️ |
| 17 | `hamburger-menu.spec.ts` | Hamburger menu items, dropdowns, redirects | ✅ |
| 18 | `login-page.spec.ts` | Login via header + hamburger → OTP screen | ✅ |
| 19 | `pincode.spec.ts` | Pincode panel apply + login redirect | ✅ |
| 20 | `search-products.spec.ts` | Product search results count | ✅ |
| 21 | `trackOrder.spec.ts` | Track order with invalid ID → error message | ✅ |
| 22 | `get-app.spec.ts` | GET APP button → Play Store redirect | ✅ |
| 23 | `whatsapp-icon.spec.ts` | WhatsApp icon href validation | ✅ |
| 24 | `shop-on-app.spec.ts` | Shop on App button → App Store redirect | ✅ |
| 25 | `pdp-radio-logo.spec.ts` | PDP radio variants + Kapiva logo redirect | ✅ |
| 26 | `pdp-share-copy-link.spec.ts` | PDP Share button → all options + Copy Link clipboard | ✅ |
| 27 | `inspect.spec.ts` | DOM inspection utility for debugging | ✅ |

> ⚠️ — Known staging environment issues (not test code bugs):
> - `concerns.spec.ts` — Gym Foods tile image broken on CDN
> - `homepage-banners.spec.ts` — `/solution/` concern pages return soft 404
> - `footer-validation.spec.ts` — `/media/` page returns 404 on staging

---

## Shared Utilities

### `utils/helpers.ts`

| Function | Description |
|---|---|
| `navigateTo(page, url, options?)` | Retry-enabled `page.goto` — retries on `ERR_TIMED_OUT`, `ERR_ABORTED`, `net::ERR*` |
| `closePopupIfPresent(page)` | Dismisses staging popup via `window.hideStagingPopup()` with click fallback |

Always use `navigateTo` instead of bare `page.goto` for automatic retry behavior.

### `utils/globalSetup.ts`

Pings `https://staging.kapiva.in` before any test runs. If staging is unreachable, the suite aborts early with a clear error.

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
npm test
# or
npx playwright test tests/regression/
```

### Run a specific spec
```bash
npx playwright test tests/regression/hero-products.spec.ts
```

### Run in headed mode (see browser)
```bash
npm run test:headed
```

### Run in debug mode
```bash
npm run test:debug
```

### Run with Allure report
```bash
npm run test:allure
```

### Generate & open Allure report separately
```bash
npm run allure:generate
npm run allure:open
```

---

## NPM Scripts

| Script | Command |
|---|---|
| `npm test` | Run all tests headless |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Run in Playwright debug mode |
| `npm run allure:generate` | Generate Allure report from results |
| `npm run allure:open` | Open Allure report in browser |
| `npm run test:allure` | Run tests + generate + open Allure |

---

## Configuration

| Setting | Value |
|---|---|
| Base URL | `https://staging.kapiva.in` |
| Browser | Chrome (Mobile Chrome emulation) |
| Viewport | 390 × 844 |
| Timeout | 90,000 ms |
| Retries (CI) | 2 |
| Workers (CI) | 1 |
| Workers (local) | Auto |
| Screenshot | On failure only |
| Video | Retained on failure |
| Trace | On first retry |
| Global Setup | `utils/globalSetup.ts` |

---

## CI/CD

Tests are triggered **manually only** via `workflow_dispatch` in GitHub Actions.

```
.github/workflows/playwright.yml
```

To run: Go to **Actions** tab → **Playwright Regression Suite** → **Run workflow**.

---

## Known Staging Issues

The following failures are **staging environment bugs**, not test code issues:

| Issue | Affected Spec |
|---|---|
| Gym Foods tile image broken on CDN (404) | `concerns.spec.ts` |
| `/solution/` concern pages show soft 404 | `homepage-banners.spec.ts` |
| `/media/` footer link returns 404 | `footer-validation.spec.ts` |
| Contact Us in hamburger menu shows "Not Found" | `hamburger-menu.spec.ts` (soft assertion) |

---

## Test Account

| Field | Value |
|---|---|
| Phone | `7411849065` |
| UPI ID | `test123@upi` |
| Environment | Staging only |

---

## Author

**Santosh Kumbar**
QA Automation Engineer — Kapiva
