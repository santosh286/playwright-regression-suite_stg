import { test } from '@playwright/test';
import { ProductSectionPage } from '../../pages/ProductSectionPage';

// glider-track[grid-rows-2] index: 0=SELECT CONCERN, 1=Bestsellers, 2=New Arrivals
const NEW_ARRIVALS_INDEX = 2;

test.describe('New Arrivals Section', () => {

  test('Homepage → close popup → scroll to New Arrivals → verify all products', async ({ page }) => {
    test.setTimeout(120000);
    const section = new ProductSectionPage(page);

    await section.openHomePage();
    console.log('\n✅ Step 1: Homepage opened');

    await section.closePopupIfPresent();
    console.log('✅ Step 2: Popup dismissed');

    await section.scrollToSection();
    await section.scrollToSectionHeading(/^New Arrivals$/i);
    console.log('✅ Step 3: Scrolled to New Arrivals section');

    const results = await section.inspectAllCards(NEW_ARRIVALS_INDEX);
    console.log(`\n✅ Step 4: Inspected ${results.length} product card(s) in New Arrivals`);

    section.printSummary('NEW ARRIVALS', results);
    section.assertAllPassed(results);
  });

});
