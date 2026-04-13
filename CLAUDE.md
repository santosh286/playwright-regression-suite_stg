# Kapiva Playwright Regression Suite

## Project Overview

Playwright end-to-end regression test suite for **Kapiva** (`https://staging.kapiva.in`). Tests cover homepage, login, checkout flows, product pages, and more.

## Stack

- **Test framework:** Playwright (`@playwright/test` ^1.57)
- **Language:** TypeScript (spec files) + JavaScript (config)
- **BDD support:** `playwright-bdd` (features in `features/`, steps in `steps/`)
- **Reporting:** HTML report + Allure (`allure-playwright`)
- **Module system:** CommonJS (`"type": "commonjs"` in package.json)

## Running Tests

```bash
# Run all tests
npm test

# Run headed (visible browser)
npm run test:headed

# Run with Playwright debug mode
npm run test:debug

# Run a specific spec file
npx playwright test tests/regression/login-page.spec.ts

# Run with Allure report
npm run test:allure
```

## Project Structure

```
├── playwright.config.js          # Playwright config (baseURL, browser, retries, reporters)
├── utils/
│   ├── globalSetup.ts            # Pre-flight: waits for staging server to be up
│   └── helpers.ts                # Shared helpers: navigateTo(), closePopupIfPresent()
├── tests/
│   ├── regression/               # Main regression test suite (26 spec files)
│   │   ├── login-page.spec.ts
│   │   ├── homepage-banners.spec.ts
│   │   ├── hamburger-menu.spec.ts
│   │   ├── hero-products.spec.ts
│   │   ├── bestsellers.spec.ts
│   │   ├── new-arrivals.spec.ts
│   │   ├── search-products.spec.ts
│   │   ├── concerns.spec.ts
│   │   ├── concern-products-crawl.spec.ts
│   │   ├── footer-validation.spec.ts
│   │   ├── pincode.spec.ts
│   │   ├── eta-verification.spec.ts
│   │   ├── pdp-radio-logo.spec.ts
│   │   ├── shop-on-app.spec.ts
│   │   ├── get-app.spec.ts
│   │   ├── whatsapp-icon.spec.ts
│   │   ├── trackOrder.spec.ts
│   │   ├── best-price-online.spec.ts
│   │   ├── cart-checkout.spec.ts
│   │   ├── place-order.spec.ts
│   │   ├── place-order-upi.spec.ts
│   │   ├── place-order-netbanking.spec.ts
│   │   ├── place-order-best-price.spec.ts
│   │   ├── coupon-upi-checkout.spec.ts
│   │   ├── free-gift-checkout.spec.ts
│   │   └── inspect.spec.ts
│   ├── inspect.spec.ts           # Root-level inspect spec
│   ├── sideMenu.spec.ts
│   ├── mobile-menu-login.spec.ts
│   └── test-1.spec.ts ... test-19.spec.ts  (scratch/exploratory tests)
├── pages/                        # Page Object Models (deleted from working tree — see git)
├── features/                     # BDD feature files (cucumber)
└── steps/                        # BDD step definitions
```

## Configuration Highlights (`playwright.config.js`)

| Setting | Value |
|---|---|
| Base URL | `https://staging.kapiva.in` |
| Browser | Chromium (Chrome channel) |
| Viewport | 1512×861 |
| Headless | `false` |
| Timeout | 90 000 ms |
| Retries (CI) | 2 |
| Workers (CI) | 1 |
| Global setup | `utils/globalSetup.ts` — pings staging before running |

## Shared Utilities (`utils/helpers.ts`)

- **`navigateTo(page, url, options?)`** — retry-enabled `page.goto` (retries on `ERR_TIMED_OUT`, `ERR_ABORTED`, `net::ERR*`). Always use this instead of bare `page.goto`.
- **`closePopupIfPresent(page)`** — dismisses the staging popup via `window.hideStagingPopup()` with a click fallback. Best-effort, never throws.

## Writing Tests

- Import helpers from `../../utils/helpers` (two levels up from `tests/regression/`)
- Use `navigateTo` for all page navigations to get automatic retry behavior
- Call `closePopupIfPresent` after navigating to the homepage
- Use `test.describe` blocks with descriptive names
- Phone number for OTP tests: `7411849065` (staging test account)
- Locators: prefer `page.locator()` with CSS/XPath; use `getByText` for text assertions

## CI / GitHub Actions

Workflow is manual-trigger only (`workflow_dispatch`). Tests run on CI with `workers: 1` and `retries: 2`.
