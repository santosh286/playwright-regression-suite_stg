# Design: Resilient Playwright Tests Against Slow Staging

**Date:** 2026-04-09  
**Status:** Approved

## Problem

Most test failures are caused by `staging.kapiva.in` timing out (`net::ERR_TIMED_OUT`). Tests fail not because of bugs but because the staging server is slow or temporarily unreachable. This creates false failures and wastes CI time.

## Goal

Make all 26 regression tests pass reliably even when staging is slow, by:
1. Checking staging is up before any test runs
2. Retrying failed tests once
3. Using a retry-enabled `navigateTo()` helper for all page navigations
4. Fixing remaining code-level URL pattern bugs

---

## Section 1: Global Setup Health Check

**File:** `utils/globalSetup.ts`

Runs once before the entire test suite via Playwright's `globalSetup` hook.

- Pings `https://staging.kapiva.in/` with a 10s timeout
- Retries every 10s for up to 2 minutes
- If staging never responds → throws error, aborts the test run immediately
- Prevents all 26 tests from burning 90s each on a dead server

---

## Section 2: Config Changes

**File:** `playwright.config.js`

- Add `globalSetup: './utils/globalSetup'`
- Set `retries: 1` so each failed test gets one automatic retry
- Keep `timeout: 90000` as-is (health check ensures server is up)

---

## Section 3: `navigateTo()` Helper

**File:** `utils/helpers.ts`

Wraps `page.goto()` with:
- Up to 2 retries on `ERR_TIMED_OUT` or `ERR_ABORTED`
- 60s timeout per attempt
- Console log on each retry attempt

All page objects replace `page.goto(url, options)` with `navigateTo(page, url, options)`.

---

## Section 4: Code Bug Fixes

Already partially applied. Full audit across all page objects:

- Replace hardcoded `waitForURL('**/checkout**')` → `/checkout|login|account/i`
- Replace `waitForURL('**/login.php')` → `/login|account|auth/i`
- Replace `page.goto('/')` with no baseURL → full staging URL
- Any other strict URL string patterns → flexible regex

**Files affected:** `CheckoutPage.ts`, `mobileMenu.page.ts`, `SideMenuPage.ts`, and any others found during audit.

---

## Architecture Summary

```
globalSetup.ts
  └── pings staging → abort if unreachable

utils/helpers.ts
  └── navigateTo(page, url) → retries on timeout

pages/*.ts
  └── all use navigateTo() instead of page.goto()

playwright.config.js
  └── globalSetup + retries: 1
```

---

## Success Criteria

- Tests do not run if staging is down
- Each test retries once on transient failure
- No `page.goto` calls with hardcoded timeouts or strict URL patterns
- All 26 regression tests pass when staging is up
