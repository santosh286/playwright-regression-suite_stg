import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { ConcernPage, ConcernResult, ProductResult } from '../../pages/ConcernPage';

test.describe('Kapiva – Concerns & Products Crawl', () => {

  test.setTimeout(600_000); // 10 min for full crawl

  test('Get all concerns → click each → View All → products → Add to Cart + Buy Now', async ({ page }) => {

    const checkout     = new CheckoutPage(page);
    const concernPage  = new ConcernPage(page);

    /* ── 1. Open homepage & dismiss popup ─────────────────────────── */
    await checkout.openHomePage();
    await checkout.closePopupIfPresent();

    /* ── 2. Collect all concerns (name + href) ─────────────────────── */
    const concerns = await concernPage.getAllConcerns();
    console.log(`\n✅ Total concerns found: ${concerns.length}`);
    expect(concerns.length).toBeGreaterThan(0);

    const allResults: ConcernResult[] = [];

    /* ── 3. Loop every concern ─────────────────────────────────────── */
    for (const concern of concerns) {

      console.log(`\n${'═'.repeat(60)}`);
      console.log(`📂 CONCERN: "${concern.name}"`);
      console.log(`   href: ${concern.href}`);
      console.log('═'.repeat(60));

      const result: ConcernResult = {
        concernName:  concern.name,
        listingUrl:   '',
        productCount: 0,
        products:     [],
      };

      try {
        /* ── 3a. Navigate directly to concern URL ────────────────── */
        await page.goto(concern.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1000);

        /* ── 3b. Check if products are directly on this page ─────── */
        let listingUrl = concern.href;
        const directCount = await concernPage.getProductCount();

        if (directCount === 0) {
          // No products here — click View All to get listing page
          listingUrl = await concernPage.clickViewAll();
        }

        result.listingUrl = listingUrl;
        console.log(`🔗 Listing URL: ${listingUrl}`);

        /* ── 3c. Load ALL products ───────────────────────────────── */
        await concernPage.loadAllProducts();
        const productCount = await concernPage.getProductCount();
        result.productCount = productCount;
        expect(productCount).toBeGreaterThan(0);
        console.log(`📦 Products found: ${productCount}`);

        /* ── 3d. Interact with each product ─────────────────────── */
        for (let i = 0; i < productCount; i++) {
          console.log(`\n  [${i + 1}/${productCount}]`);
          let productResult: ProductResult;

          try {
            productResult = await concernPage.interactWithProduct(i, listingUrl);
            console.log(`  📌 Name : ${productResult.productName}`);
            console.log(`  🆔 ID   : ${productResult.productId}`);
            console.log(`  🛒 ATC  : Visible=${productResult.addToCartVisible ? '✅' : '❌'} Clicked=${productResult.addToCartClicked ? '✅' : '❌'}`);
            console.log(`  ⚡ BN   : Visible=${productResult.buyNowVisible ? '✅' : '❌'} Clicked=${productResult.buyNowClicked ? '✅' : '❌'}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message.slice(0, 100) : String(err);
            console.warn(`  ⚠️  ERROR: ${msg}`);
            productResult = {
              productId: '', productName: `Product #${i + 1}`,
              addToCartVisible: false, addToCartClicked: false,
              buyNowVisible: false,    buyNowClicked: false,
              error: msg,
            };
          }

          result.products.push(productResult);
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 200) : String(err);
        console.warn(`⚠️  CONCERN ERROR: ${msg}`);
        result.products = [{ productId: '', productName: '', addToCartVisible: false, addToCartClicked: false, buyNowVisible: false, buyNowClicked: false, error: msg }];
      }

      allResults.push(result);
    }

    /* ── 4. Print summary ──────────────────────────────────────────── */
    printSummary(allResults);
  });
});

/* ─────────────────────────────────────────────────────────────────────── */
function printSummary(results: ConcernResult[]) {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(112) + '╗');
  console.log('║' + '  CONCERN PRODUCTS CRAWL — FULL SUMMARY'.padEnd(112) + '║');
  console.log('╚' + '═'.repeat(112) + '╝');

  let totalProducts = 0, totalAtc = 0, totalBn = 0, totalErrors = 0;

  for (const concern of results) {
    totalProducts += concern.productCount;

    console.log(`\n📂 ${concern.concernName}  (${concern.productCount} products)`);
    console.log(`   ${concern.listingUrl}`);

    if (concern.products.length > 0) {
      const hdr = `${'#'.padEnd(3)} | ${'ID'.padEnd(8)} | ${'Product Name'.padEnd(42)} | ${'ATC'.padEnd(3)} | ${'ATC✓'.padEnd(5)} | ${'BN'.padEnd(3)} | ${'BN✓'.padEnd(5)} | Note`;
      console.log('  ' + '─'.repeat(108));
      console.log('  ' + hdr);
      console.log('  ' + '─'.repeat(108));

      concern.products.forEach((p, i) => {
        const atcV = p.addToCartVisible ? '✅' : '❌';
        const atcC = p.addToCartClicked ? '✅' : '❌';
        const bnV  = p.buyNowVisible    ? '✅' : '❌';
        const bnC  = p.buyNowClicked    ? '✅' : '❌';
        const note = p.error ? `⚠️ ${p.error.slice(0, 25)}` : '';

        console.log(
          `  ${String(i + 1).padEnd(3)} | ${p.productId.padEnd(8)} | ` +
          `${p.productName.slice(0, 42).padEnd(42)} | ` +
          `${atcV.padEnd(3)} | ${atcC.padEnd(5)} | ${bnV.padEnd(3)} | ${bnC.padEnd(5)} | ${note}`
        );

        if (p.addToCartVisible) totalAtc++;
        if (p.buyNowVisible)    totalBn++;
        if (p.error)            totalErrors++;
      });
      console.log('  ' + '─'.repeat(108));
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('📊 TOTALS');
  console.log('─'.repeat(50));
  console.log(`  Concerns     : ${results.length}`);
  console.log(`  Products     : ${totalProducts}`);
  console.log(`  Add to Cart Visible : ${totalAtc} / ${totalProducts}`);
  console.log(`  Buy Now Visible     : ${totalBn} / ${totalProducts}`);
  console.log(`  Errors       : ${totalErrors}`);
  console.log('─'.repeat(50) + '\n');
}
