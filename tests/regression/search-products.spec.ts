import { test, expect } from '@playwright/test';
import { HomePage, SearchResultsPage } from '../../pages/SearchPages';
import { CheckoutPage } from '../../pages/CheckoutPage';

const BASE_URL = 'https://staging.kapiva.in';
const SEARCH_KEYWORDS = ['sips', 'shilajit', 'energy', 'juice'];

test('Search should show related products', async ({ page }) => {
  const homePage    = new HomePage(page);
  const resultsPage = new SearchResultsPage(page);
  const checkout    = new CheckoutPage(page);

  await homePage.navigate(BASE_URL);

  // Close staging popup if present
  await checkout.closePopupIfPresent();

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`\n🔍 Searching: "${keyword}"`);

    await homePage.searchProduct(keyword);

    await resultsPage.waitForResults();
    await resultsPage.waitForAtLeastOneVisibleProduct();

    const visibleCount = await resultsPage.getVisibleProductCount();

    console.log(`  ✅ "${keyword}" → ${visibleCount} products found`);

    // ✅ Business assertion
    expect(visibleCount).toBeGreaterThan(0);
  }
});
