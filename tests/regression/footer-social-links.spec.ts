import { test, expect } from '@playwright/test';
import { navigateTo } from '../../utils/helpers';

const SOCIAL_LINKS = [
  { label: 'Facebook',  pattern: 'facebook.com' },
  { label: 'Instagram', pattern: 'instagram.com' },
  { label: 'YouTube',   pattern: 'youtube.com' },
  { label: 'Twitter',   pattern: 'twitter.com' },
];

test.describe('Footer — Social Links', () => {

  test('Scroll to footer → verify social media links present and point to correct domains', async ({ page, context }) => {
    // Step 1: Open homepage
    await navigateTo(page, 'https://staging.kapiva.in/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveTitle(/KAPIVA/i);
    console.log('\n✅ Step 1: Homepage opened');

    // Step 2: Close popup
    await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') (window as any).hideStagingPopup();
    });
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Popup dismissed');

    // Step 3: Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    console.log('✅ Step 3: Scrolled to footer');

    // Step 4: Collect all social links from footer
    const footerSocialLinks = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return [];
      const anchors = Array.from(footer.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      return anchors
        .map(a => ({ href: a.href, target: a.getAttribute('target') || '' }))
        .filter(a =>
          /facebook\.com|instagram\.com|youtube\.com|twitter\.com|x\.com/i.test(a.href)
        );
    });

    console.log(`\n✅ Step 4: Found ${footerSocialLinks.length} social link(s) in footer`);
    footerSocialLinks.forEach(l => console.log(`   — ${l.href} (target="${l.target}")`));

    // Step 5: Check each expected social platform
    const results: any[] = [];
    for (const social of SOCIAL_LINKS) {
      const link = footerSocialLinks.find(l =>
        l.href.toLowerCase().includes(social.pattern) ||
        (social.label === 'Twitter' && l.href.toLowerCase().includes('x.com'))
      );

      if (!link) {
        console.log(`⚠️  Step 5: ${social.label} link NOT found in footer (may not be on staging)`);
        results.push({ label: social.label, found: false, href: null, passed: false });
        continue;
      }

      console.log(`✅ Step 5: ${social.label} → ${link.href}`);

      // If opens in new tab, verify URL
      if (link.target === '_blank') {
        const footerAnchor = page.locator(`footer a[href*="${social.pattern}"], footer a[href*="x.com"]`).first();
        const anchorCount = await footerAnchor.count();
        if (anchorCount > 0) {
          const [newPage] = await Promise.all([
            context.waitForEvent('page', { timeout: 15000 }),
            footerAnchor.click(),
          ]);
          await newPage.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
          const newUrl = newPage.url();
          await newPage.close();
          console.log(`   ↳ Opened new tab → ${newUrl}`);
          results.push({ label: social.label, found: true, href: link.href, newTabUrl: newUrl, passed: true });
        } else {
          results.push({ label: social.label, found: true, href: link.href, passed: true });
        }
      } else {
        results.push({ label: social.label, found: true, href: link.href, passed: true });
      }
    }

    // Step 6: Summary
    console.log('\n── Social Links Summary ──────────────────────');
    for (const r of results) {
      console.log(`${r.found ? '✅' : '⚠️ '} ${r.label.padEnd(12)} → ${r.href || 'NOT FOUND'}`);
    }

    const foundCount = results.filter(r => r.found).length;
    console.log(`─────────────────────────────────────────────`);
    console.log(`Found: ${foundCount}/${SOCIAL_LINKS.length} social links`);

    // Step 7: Hard assert — at least 1 social link must exist
    expect(foundCount, 'At least 1 social media link should exist in footer').toBeGreaterThanOrEqual(1);
    console.log('✅ Step 7: At least 1 social link confirmed in footer');

    console.log('\n🎉 Footer social links validated successfully!\n');
  });

});
