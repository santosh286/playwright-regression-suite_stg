import { test } from '@playwright/test';
import { ProductSectionPage } from '../../pages/ProductSectionPage';

// glider-track[grid-rows-2] index: 0=SELECT CONCERN, 1=Bestsellers, 2=New Arrivals
const BESTSELLERS_INDEX = 1;

test.describe('Kapiva Bestsellers Section', () => {

  test('Homepage → close popup → scroll to Bestsellers → verify all products', async ({ page }) => {
    test.setTimeout(120000);
    const section = new ProductSectionPage(page);

    await section.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await section.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await section.scrollToSection();
    await section.scrollToSectionHeading(/^Kapiva Bestsellers$/i);
    console.log('✅ Step 3: Scrolled to Kapiva Bestsellers section');

    const results = await section.inspectAllCards(BESTSELLERS_INDEX);
    console.log(`\n✅ Step 4: Inspected ${results.length} product card(s) in Bestsellers`);

    section.printSummary('KAPIVA BESTSELLERS', results);
    section.assertAllPassed(results);
  });

});
