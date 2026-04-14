import { test } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

test('inspect download app in menu', async ({ page }) => {
  await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.evaluate(() => {
    if (typeof (window as any).hideStagingPopup === 'function') {
      (window as any).hideStagingPopup();
    }
  });
  await page.waitForTimeout(500);

  await page.locator('//button[@class="h-full px-1 lg:order-2 "]').click();
  await page.waitForTimeout(1500);

  const menu = page.locator('//div[@class="flex-1 overflow-y-auto"]');
  const result = await menu.evaluate(el => {
    return Array.from(el.querySelectorAll('*')).filter(e =>
      /download.?app/i.test(e.textContent || '')
    ).map(e => ({
      tag: e.tagName,
      text: e.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60),
      href: (e as HTMLAnchorElement).href || null,
      classes: (e as HTMLElement).className?.slice(0, 100),
      childCount: e.children.length,
    }));
  });
  console.log(JSON.stringify(result, null, 2));
});
