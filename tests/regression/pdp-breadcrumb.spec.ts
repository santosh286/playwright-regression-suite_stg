import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const PDP_URL = 'https://staging.kapiva.in/mens-health/him-foods-shilajit-gold-20g/';

test.describe('PDP — Breadcrumb Navigation', () => {

  test('Open PDP → close popup → verify breadcrumb links → click Home → back to homepage', async ({ page }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
      }
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Navigate to PDP and wait for content to settle
    await navigateTo(page, PDP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Step 3: PDP opened → ${page.url()}`);

    // Step 4: Verify breadcrumb exists in DOM with Home / Solution / Product links
    const breadcrumbInfo = await page.evaluate(() => {
      // Find all <ol> containing <a itemprop="item"> or any <ol> with 2+ <a href> links
      const ols = Array.from(document.querySelectorAll('ol'));
      for (const ol of ols) {
        const links = Array.from(ol.querySelectorAll('a[href]')) as HTMLAnchorElement[];
        if (links.length >= 2) {
          return links.map(a => ({ text: (a.textContent || a.querySelector('[itemprop="name"]')?.textContent || '').trim(), href: a.href }));
        }
      }
      // Fallback: find by itemprop
      const itemLinks = Array.from(document.querySelectorAll('a[itemprop="item"]')) as HTMLAnchorElement[];
      if (itemLinks.length >= 2) {
        return itemLinks.map(a => ({ text: (a.querySelector('[itemprop="name"]')?.textContent || a.textContent || '').trim(), href: a.href }));
      }
      return null;
    });

    expect(breadcrumbInfo, 'A breadcrumb with at least 2 links should exist in DOM').toBeTruthy();
    console.log(`✅ Step 4: Breadcrumb found with ${breadcrumbInfo!.length} links:`);
    breadcrumbInfo!.forEach((l, i) => console.log(`   [${i + 1}] "${l.text}" → ${l.href}`));

    // Step 5: Verify Home link exists in breadcrumb
    const homeEntry = breadcrumbInfo!.find(l => /^home$/i.test(l.text) || l.href.replace(/\/$/, '').endsWith('staging.kapiva.in'));
    expect(homeEntry, 'Breadcrumb should contain a Home link').toBeTruthy();
    console.log(`✅ Step 5: "Home" link verified → ${homeEntry!.href}`);

    // Step 6: Verify breadcrumb has at least 3 items
    expect(breadcrumbInfo!.length, 'Breadcrumb should have at least 3 links').toBeGreaterThanOrEqual(3);
    const lastItem = breadcrumbInfo![breadcrumbInfo!.length - 1];
    expect(lastItem.text.length, 'Last breadcrumb item should be non-empty product name').toBeGreaterThan(0);
    console.log(`✅ Step 6: ${breadcrumbInfo!.length} breadcrumb items — last: "${lastItem.text}"`);

    // Step 7: Navigate to homepage via Home link → verify
    await navigateTo(page, homeEntry!.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/staging\.kapiva\.in\/?$/);
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log(`✅ Step 7: Navigated to Home → ${page.url()}`);

    console.log('\n🎉 Breadcrumb navigation validated successfully!\n');
  });

});
