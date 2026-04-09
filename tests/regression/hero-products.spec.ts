import { test } from '@playwright/test';
import { HeroProductsPage } from '../../pages/HeroProductsPage';

const EXPECTED_PRODUCTS = [
  'Dia Free Juice - Blood Sugar Management',
  'Shilajit Gold Resin',
  'Himalayan Shilajit Resin',
  'Get Slim Powder (Mix)',
  'Get Slim Juice',
  'Hair Care Juice | Hair Fall Control & Hair Growth',
  'Ghee Kumkumadi Body Butter - 200g',
];

test.describe('Product Search — Cards Validation', () => {

  test('Search each product → verify name + ATC + Buy Now visible', async ({ page }) => {
    test.setTimeout(180000);
    const heroPage = new HeroProductsPage(page);

    await heroPage.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await heroPage.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    const results = [];

    for (const expectedProduct of EXPECTED_PRODUCTS) {
      const keyword = heroPage.getSearchKeyword(expectedProduct);
      console.log(`\n🔍 Searching: "${keyword}" (for: "${expectedProduct}")`);

      await heroPage.searchProduct(keyword);

      const result = await heroPage.findMatchingCard(expectedProduct);

      console.log(`   Found    : ${result.found ? '✅' : '❌'} "${result.matchedName}"`);
      console.log(`   ATC      : ${result.atcVisible ? '✅' : '❌'}`);
      console.log(`   Buy Now  : ${result.bnVisible  ? '✅' : '❌'}`);
      console.log(`   OOS      : ${result.outOfStock ? '⚠️  YES' : '✅ No'}`);
      console.log(`   URL      : ${result.productUrl}`);
      console.log(`   Result   : ${result.passed ? '✅ PASS' : '❌ FAIL'}`);

      results.push({ product: expectedProduct, ...result });

      await heroPage.openHomePage();
      await heroPage.closePopupIfPresent();
    }

    heroPage.printSummary(results);
    heroPage.assertAllFound(results);

    console.log('🎉 All product search results verified successfully!\n');
  });

});
