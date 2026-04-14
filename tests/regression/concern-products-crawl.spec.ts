import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

interface ProductResult {
  productId: string;
  productName: string;
  addToCartVisible: boolean;
  addToCartClicked: boolean;
  buyNowVisible: boolean;
  buyNowClicked: boolean;
  error?: string;
}

interface ConcernResult {
  concernName: string;
  listingUrl: string;
  productCount: number;
  products: ProductResult[];
  error?: string;
}

async function openHomePage(page: any) {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page).toHaveTitle(/KAPIVA/i);
}

async function closePopupIfPresent(page: any) {
  await page.evaluate(() => { if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup(); });
  await page.waitForTimeout(500);
}

async function getAllConcerns(page: any): Promise<{ name: string; href: string }[]> {
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(800);

  const pillNames: string[] = await page.evaluate(() => {
    const snap = document.evaluate(
      '//div[@class="relative mb-5 lg:mb-10"]/div[contains(@class,"gap")]/*',
      document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    const names: string[] = [];
    for (let i = 0; i < snap.snapshotLength; i++) {
      const el = snap.snapshotItem(i) as HTMLElement;
      const name = el.querySelector('p')?.textContent?.trim() || '';
      names.push(/select concern/i.test(name) ? '' : name);
    }
    return names;
  });

  const validCount = pillNames.filter(n => n.length > 0).length;
  console.log(`🔍 Found ${validCount} concern pills: ${pillNames.filter(n => n).map(n => `"${n}"`).join(', ')}`);

  const concerns: { name: string; href: string }[] = [];

  for (let i = 0; i < pillNames.length; i++) {
    const pillName = pillNames[i];
    if (!pillName) continue;

    await page.evaluate((idx: number) => {
      const snap = document.evaluate(
        '//div[@class="relative mb-5 lg:mb-10"]/div[contains(@class,"gap")]/*',
        document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
      const el = snap.snapshotItem(idx) as HTMLElement | null;
      if (el) el.click();
    }, i).catch(() => {});

    await page.waitForTimeout(800);

    const currentUrl = page.url();
    if (!currentUrl.includes('staging.kapiva.in') || currentUrl !== 'https://staging.kapiva.in/') {
      if (!currentUrl.startsWith('https://staging.kapiva.in/#') && currentUrl !== 'https://staging.kapiva.in/') {
        await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(800);
        console.log(`  ⚠️ "${pillName}" — pill navigated away, skipping`);
        continue;
      }
    }

    const viewAllHref = await page.evaluate(() => {
      const snap = document.evaluate(
        '(//div[@class="mb-5 flex items-center justify-start lg:mb-10"])//a',
        document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
      );
      if (snap.snapshotLength === 0) return '';
      return (snap.snapshotItem(0) as HTMLAnchorElement).href || '';
    }).catch(() => '');

    if (viewAllHref) {
      concerns.push({ name: pillName, href: viewAllHref });
      console.log(`  ✅ "${pillName}" → ${viewAllHref}`);
    } else {
      console.log(`  ⚠️ "${pillName}" — no View All link found, skipping`);
    }
  }

  console.log(`✅ Concerns (${concerns.length}): ${concerns.map((c: { name: string }) => `"${c.name}"`).join(', ')}`);
  return concerns;
}

async function getProductCount(page: any): Promise<number> {
  return page.locator('[data-product-id]').count();
}

async function clickViewAll(page: any): Promise<string> {
  const viewAll = page.locator('xpath=(//div[@class="mb-5 flex items-center justify-start lg:mb-10"])//a').first();
  let visible = await viewAll.isVisible({ timeout: 5000 }).catch(() => false);

  if (!visible) {
    const fallback = page.locator('a').filter({ hasText: /view all/i }).first();
    visible = await fallback.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) throw new Error('View All link not found');
    await fallback.scrollIntoViewIfNeeded();
    await fallback.click();
  } else {
    await viewAll.scrollIntoViewIfNeeded();
    await viewAll.click();
  }

  await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
  await page.waitForTimeout(1000);
  return page.url();
}

async function loadAllProducts(page: any, maxIterations = 5): Promise<void> {
  for (let i = 0; i < maxIterations; i++) {
    const loadMoreBtn = page.getByRole('button', { name: /load more/i });
    const visible = await loadMoreBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) break;

    const countBefore = await page.locator('[data-product-id]').count();
    await loadMoreBtn.scrollIntoViewIfNeeded();
    await loadMoreBtn.click();

    await page.waitForFunction(
      (before: number) => document.querySelectorAll('[data-product-id]').length > before,
      countBefore,
      { timeout: 10000 }
    ).catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function getProductName(page: any, index: number): Promise<string> {
  const card = page.locator('[data-product-id]').nth(index);
  const name = await card.evaluate((el: Element) => {
    const leaves = Array.from(el.querySelectorAll('*'))
      .filter((e: Element) => e.children.length === 0)
      .map((e: Element) => e.textContent?.trim() || '')
      .filter(t =>
        t.length > 3 && t.length < 100 &&
        !t.includes('₹') &&
        !/^[\d%+\-\s]+$/.test(t) &&
        !/^(add to cart|buy now|off|sale|new|hot|view|shop)/i.test(t) &&
        !/^(out of stock|delivered by|delivery by|arriving|expected)/i.test(t) &&
        !/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t)
      );
    return leaves.sort((a, b) => b.length - a.length)[0] || '';
  });
  return name || `Product #${index + 1}`;
}

async function getProductId(page: any, index: number): Promise<string> {
  return (await page.locator('[data-product-id]').nth(index).getAttribute('data-product-id')) || '';
}

async function checkAddToCart(page: any, index: number): Promise<boolean> {
  const card = page.locator('[data-product-id]').nth(index);
  await card.scrollIntoViewIfNeeded();
  const btn = card.locator('button').filter({ has: page.locator('svg') }).first();
  return btn.isVisible({ timeout: 3000 }).catch(() => false);
}

async function checkBuyNow(page: any, index: number): Promise<boolean> {
  const card = page.locator('[data-product-id]').nth(index);
  await card.scrollIntoViewIfNeeded();
  const btn = card.getByRole('button', { name: /buy now/i });
  return btn.isVisible({ timeout: 3000 }).catch(() => false);
}

async function interactWithProduct(page: any, index: number, listingUrl: string): Promise<ProductResult> {
  await navigateTo(page, listingUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await loadAllProducts(page);

  const productId   = await getProductId(page, index);
  const productName = await getProductName(page, index);
  const atcVisible  = await checkAddToCart(page, index);
  const bnVisible   = await checkBuyNow(page, index);

  return {
    productId,
    productName,
    addToCartVisible: atcVisible,
    addToCartClicked: false,
    buyNowVisible:    bnVisible,
    buyNowClicked:    false,
  };
}

test.describe('Kapiva – Concerns & Products Crawl', () => {

  test.setTimeout(600_000); // 10 min for full crawl

  test('Get all concerns → click each → View All → products → Add to Cart + Buy Now', async ({ page }) => {

    await openHomePage(page);
    await closePopupIfPresent(page);

    const concerns = await getAllConcerns(page);
    console.log(`\n✅ Total concerns found: ${concerns.length}`);
    expect(concerns.length).toBeGreaterThan(0);

    const allResults: ConcernResult[] = [];

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
        await page.goto(concern.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1000);

        let listingUrl = concern.href;
        const directCount = await getProductCount(page);

        if (directCount === 0) {
          listingUrl = await clickViewAll(page);
        }

        result.listingUrl = listingUrl;
        console.log(`🔗 Listing URL: ${listingUrl}`);

        await loadAllProducts(page);
        const productCount = await getProductCount(page);
        result.productCount = productCount;
        expect(productCount).toBeGreaterThan(0);
        console.log(`📦 Products found: ${productCount}`);

        for (let i = 0; i < productCount; i++) {
          console.log(`\n  [${i + 1}/${productCount}]`);
          let productResult: ProductResult;

          try {
            productResult = await interactWithProduct(page, i, listingUrl);
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

    printSummary(allResults);
  });
});

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
