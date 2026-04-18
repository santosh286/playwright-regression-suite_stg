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
│   └── regression/                 # 71 regression spec files
│       │
│       │── Homepage & Header
│       ├── homepage-banners.spec.ts
│       ├── header-validation.spec.ts
│       ├── hero-products.spec.ts
│       ├── new-arrivals.spec.ts
│       ├── bestsellers.spec.ts
│       ├── concerns.spec.ts
│       ├── concern-products-crawl.spec.ts
│       ├── footer-validation.spec.ts
│       ├── whatsapp-icon.spec.ts
│       │
│       │── Navigation & App
│       ├── hamburger-menu.spec.ts
│       ├── get-app.spec.ts
│       ├── shop-on-app.spec.ts
│       ├── back-navigation.spec.ts
│       │
│       │── UI / UX
│       ├── scroll-to-top.spec.ts
│       ├── cookie-consent.spec.ts
│       │
│       │── Search & Listing
│       ├── search-products.spec.ts
│       ├── search-empty.spec.ts
│       ├── search-autocomplete.spec.ts
│       ├── search-special-chars.spec.ts
│       ├── product-listing.spec.ts
│       │
│       │── Product Detail Page (PDP)
│       ├── pdp-description.spec.ts
│       ├── pdp-images.spec.ts
│       ├── pdp-add-to-cart.spec.ts
│       ├── pdp-buy-now.spec.ts
│       ├── pdp-breadcrumb.spec.ts
│       ├── pdp-radio-logo.spec.ts
│       ├── pdp-share-copy-link.spec.ts
│       ├── pdp-variant-selector.spec.ts
│       ├── pdp-faq-accordion.spec.ts
│       ├── pdp-reviews.spec.ts
│       ├── pdp-related-products.spec.ts
│       ├── pdp-benefits.spec.ts
│       ├── pdp-how-to-use.spec.ts
│       ├── pdp-pincode-check.spec.ts
│       ├── pdp-coins-display.spec.ts
│       ├── pdp-offers-section.spec.ts
│       ├── pdp-sticky-atc.spec.ts
│       ├── pdp-out-of-stock.spec.ts
│       ├── pdp-recently-viewed.spec.ts
│       ├── pdp-rating-breakdown.spec.ts
│       ├── pdp-social-share.spec.ts
│       │
│       │── Login & Account
│       ├── login-page.spec.ts
│       │
│       │── Pincode & Delivery
│       ├── pincode.spec.ts
│       ├── eta-verification.spec.ts
│       │
│       │── Cart
│       ├── cart-checkout.spec.ts
│       ├── cart-sidebar-validation.spec.ts
│       ├── cart-quantity-update.spec.ts
│       ├── cart-empty-state.spec.ts
│       ├── cart-multiple-items.spec.ts
│       ├── cart-checkout-redirect.spec.ts
│       │
│       │── Checkout & Orders
│       ├── checkout-page-validation.spec.ts
│       ├── checkout-coupon-validation.spec.ts
│       ├── place-order.spec.ts
│       ├── place-order-upi.spec.ts
│       ├── place-order-netbanking.spec.ts
│       ├── place-order-best-price.spec.ts
│       ├── best-price-online.spec.ts
│       ├── coupon-upi-checkout.spec.ts
│       ├── free-gift-checkout.spec.ts
│       ├── trackOrder.spec.ts
│       │
│       │── Category Pages
│       ├── category-womens-health.spec.ts
│       ├── category-weight-management.spec.ts
│       ├── category-gym-foods.spec.ts
│       ├── category-mens-health.spec.ts
│       ├── category-hair-care.spec.ts
│       ├── category-pdp-navigation.spec.ts
│       │
│       └── inspect.spec.ts         # DOM inspection utility
│
├── docs/
│   └── superpowers/
│       └── plans/                  # Implementation plans
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

## Test Coverage (71 Specs)

### Homepage & Header (9)


| Spec File | What It Tests |
|---|---|
| `homepage-banners.spec.ts` | Banner images load, links navigate correctly |
| `header-validation.spec.ts` | Logo, search bar, LOGIN button, cart count, nav links |
| `hero-products.spec.ts` | Hero product cards visible, ATC + Buy Now buttons |
| `new-arrivals.spec.ts` | New Arrivals section product cards |
| `bestsellers.spec.ts` | Bestsellers section product cards |
| `concerns.spec.ts` | SELECT CONCERN tiles: image + name validation |
| `concern-products-crawl.spec.ts` | All concern categories → all products ATC + Buy Now |
| `footer-validation.spec.ts` | Footer links, contact info, platform & payment icons |
| `whatsapp-icon.spec.ts` | WhatsApp icon href validation |

### Navigation & App (4)

| Spec File | What It Tests |
|---|---|
| `hamburger-menu.spec.ts` | Hamburger menu items, dropdowns, redirects |
| `get-app.spec.ts` | GET APP button → Play Store redirect |
| `shop-on-app.spec.ts` | Shop on App button → App Store redirect |
| `back-navigation.spec.ts` | Browser back button navigates correctly between pages |

### UI / UX (2)

| Spec File | What It Tests |
|---|---|
| `scroll-to-top.spec.ts` | Scroll-to-top button appears after scrolling, returns to top |
| `cookie-consent.spec.ts` | Cookie/staging banner appears, can be dismissed, stays dismissed |

### Search & Listing (5)

| Spec File | What It Tests |
|---|---|
| `search-products.spec.ts` | Product search results count |
| `search-empty.spec.ts` | Empty search + whitespace search → no crash |
| `search-autocomplete.spec.ts` | Type partial term → autocomplete → results page loads |
| `search-special-chars.spec.ts` | Special chars, XSS string, numbers, long string → no crash |
| `product-listing.spec.ts` | Listing page products, prices, links |

### Product Detail Page — PDP (21)

| Spec File | What It Tests |
|---|---|
| `pdp-description.spec.ts` | Product name (H1), price (₹), MRP, description |
| `pdp-images.spec.ts` | All product images load — 80% pass threshold |
| `pdp-add-to-cart.spec.ts` | ADD TO CART → cart count increments |
| `pdp-buy-now.spec.ts` | BUY NOW → redirects to checkout |
| `pdp-breadcrumb.spec.ts` | Breadcrumb links: Home → Category → Product |
| `pdp-radio-logo.spec.ts` | Radio variant buttons + Kapiva logo redirect |
| `pdp-share-copy-link.spec.ts` | Share button → all options + Copy Link clipboard |
| `pdp-variant-selector.spec.ts` | Pack size radio buttons → price updates on switch |
| `pdp-faq-accordion.spec.ts` | FAQ section with 6 questions, click to expand |
| `pdp-reviews.spec.ts` | Rating badge (4.6/5), Customer Reviews section |
| `pdp-related-products.spec.ts` | Related product cards with ADD buttons |
| `pdp-benefits.spec.ts` | Benefits, Key Ingredients, Suitable For sections |
| `pdp-how-to-use.spec.ts` | How To Use, Customers Speak, Specs, Why Kapiva |
| `pdp-pincode-check.spec.ts` | Pincode delivery text, default pincode, clickable section |
| `pdp-coins-display.spec.ts` | Earn Coins badge, coins count, app purchase price |
| `pdp-offers-section.spec.ts` | Offers For You heading, BEST PRICE cards, Extra ₹X OFF |
| `pdp-sticky-atc.spec.ts` | Sticky Add to Cart bar appears after scrolling |
| `pdp-out-of-stock.spec.ts` | OOS product shows Out of Stock — no ATC button |
| `pdp-recently-viewed.spec.ts` | Recently Viewed section appears after visiting PDPs |
| `pdp-rating-breakdown.spec.ts` | Star rating (1–5) breakdown, review count |
| `pdp-social-share.spec.ts` | Share modal — WhatsApp, Facebook, Copy Link options |

### Login & Account (1)

| Spec File | What It Tests |
|---|---|
| `login-page.spec.ts` | Login via header + hamburger → OTP screen |

### Pincode & Delivery (2)

| Spec File | What It Tests |
|---|---|
| `pincode.spec.ts` | Pincode panel apply + login redirect |
| `eta-verification.spec.ts` | ETA match across PDP → Checkout → Thank You |

### Cart (6)

| Spec File | What It Tests |
|---|---|
| `cart-checkout.spec.ts` | Product name consistency: Listing → Cart → Checkout |
| `cart-sidebar-validation.spec.ts` | Cart panel: heading, product, price, CHECKOUT button |
| `cart-quantity-update.spec.ts` | Cart + button → quantity increases → count updates |
| `cart-empty-state.spec.ts` | Empty cart panel shows "Your cart is empty" message |
| `cart-multiple-items.spec.ts` | Add 2 products → both appear in cart → count = 2 |
| `cart-checkout-redirect.spec.ts` | Cart CHECKOUT button → lands on checkout URL |

### Checkout & Orders (10)

| Spec File | What It Tests |
|---|---|
| `checkout-page-validation.spec.ts` | Phone step, Order Summary, Payment Methods, Price Summary |
| `checkout-coupon-validation.spec.ts` | Invalid coupon → no discount applied |
| `place-order.spec.ts` | Full E2E order via UPI |
| `place-order-upi.spec.ts` | UPI payment with coupon — full order |
| `place-order-netbanking.spec.ts` | NetBanking payment — full order |
| `place-order-best-price.spec.ts` | Best Price Online coupon + order |
| `best-price-online.spec.ts` | Online payment coupon → checkout with coupon in URL |
| `coupon-upi-checkout.spec.ts` | Coupon "Save 5" applied + UPI order |
| `free-gift-checkout.spec.ts` | Free gift selection + order |
| `trackOrder.spec.ts` | Track order with invalid ID → error message |

### Category Pages (10)

| Spec File | What It Tests |
|---|---|
| `category-womens-health.spec.ts` | Women's Health listing — products, names, prices, links |
| `category-weight-management.spec.ts` | Weight Management — products + click → PDP opens |
| `category-gym-foods.spec.ts` | Gym Foods — products, ATC buttons present |
| `category-mens-health.spec.ts` | Men's Health — products, all links point to staging |
| `category-hair-care.spec.ts` | Hair Care — products, 80% images load |
| `category-pdp-navigation.spec.ts` | Click product card → PDP H1 matches → back navigation |
| `category-ayurveda.spec.ts` | Ayurveda listing — H1, products, names, prices, links |
| `category-skin-care.spec.ts` | Skin Care listing — H1, products, images load, links valid |
| `category-diabetic-care.spec.ts` | Diabetic Care listing — H1, products, ATC buttons |
| `category-filter-sort.spec.ts` | Filter & Sort UI interaction — products remain, no crash |

### Utility (1)

| Spec File | What It Tests |
|---|---|
| `inspect.spec.ts` | DOM inspection utility for debugging |

---

## CI/CD Config Notes

The following settings in `playwright.config.js` are environment-aware:

| Setting | Local | CI (GitHub Actions) |
|---|---|---|
| `headless` | `false` (see browser) | `true` (no display) |
| `channel` | `'chrome'` | `undefined` (Chromium) |
| `--start-maximized` | enabled | disabled |
| Reporter | HTML + Allure | HTML only |

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
npx playwright test tests/regression/pdp-description.spec.ts
```

### Run with a single worker (recommended for staging)
```bash
npx playwright test tests/regression/ --workers=1
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
| Staging server timeouts under concurrent load | Run with `--workers=1` |

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
