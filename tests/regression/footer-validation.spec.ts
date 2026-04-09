import { test, expect } from '@playwright/test';
import { FooterPage } from '../../pages/FooterPage';

const FOOTER_LINKS = [
  { label: 'SHOP ALL',             path: '/shop-all/',                              expectedUrl: /shop-all/i },
  { label: 'MY ACCOUNT',           path: '/account.php',                            expectedUrl: /account/i },
  { label: 'FAQS',                 path: '/faq/',                                   expectedUrl: /faq/i },
  { label: 'INNOVATION FUND',      path: 'https://innovation.kapiva.in/',           expectedUrl: /innovation\.kapiva\.in/i },
  { label: 'ABOUT US',             path: '/about-us/',                              expectedUrl: /about-us/i },
  { label: 'BLOG',                 path: 'https://blog.kapiva.in/',                 expectedUrl: /blog\.kapiva\.in/i },
  { label: 'MEDIA',                path: '/media/',                                 expectedUrl: /media/i },
  { label: 'CONTACT US',           path: '/contact-us/',                            expectedUrl: /contact-us/i },
  { label: 'Privacy Policy',       path: '/privacy-policy/',                        expectedUrl: /privacy-policy/i },
  { label: 'Terms and Conditions', path: '/terms-and-condition/',                   expectedUrl: /terms-and-condition/i },
  { label: 'Shipping Policy',      path: '/shipping-policy/',                       expectedUrl: /shipping-policy/i },
  { label: 'Cancellation Policy',  path: '/cancellation-returns-refunds-policy/',   expectedUrl: /cancellation/i },
];

const CONTACT_LINKS = [
  { label: 'Phone', href: 'tel:18002742575',       display: '1800-274-2575' },
  { label: 'Email', href: 'mailto:info@kapiva.in', display: 'info@kapiva.in' },
];

const ALSO_AVAILABLE_ON = [
  { label: 'Amazon',    srcPattern: /top_strip\/amazon/i },
  { label: 'Flipkart',  srcPattern: /top_strip\/flipkart/i },
  { label: 'Zepto',     srcPattern: /top_strip\/zepto/i },
  { label: 'Instamart', srcPattern: /top_strip\/instamart/i },
];

const WE_ACCEPT = [
  { label: 'Amazon Pay',  srcPattern: /bottom_strip\/amazon_pay/i },
  { label: 'BHIM UPI',    srcPattern: /bottom_strip\/bhim_upi/i },
  { label: 'Net Banking', srcPattern: /bottom_strip\/intersection/i },
  { label: 'Google Pay',  srcPattern: /bottom_strip\/google_pay/i },
  { label: 'Mastercard',  srcPattern: /bottom_strip\/mastercard/i },
  { label: 'RuPay',       srcPattern: /bottom_strip\/rupay/i },
  { label: 'Visa',        srcPattern: /bottom_strip\/visa/i },
];

test.describe('Footer Validation – All Links & Redirections', () => {

  test('Contact info (phone & email) are visible in footer', async ({ page }) => {
    const footer = new FooterPage(page);
    await footer.openHomePage();
    console.log('\n===== CONTACT INFO =====');
    await footer.verifyContactInfo(CONTACT_LINKS);
    console.log('========================\n');
  });

  test('All footer navigation links are visible and redirect correctly', async ({ page, context }) => {
    const footer = new FooterPage(page);
    const results = await footer.verifyNavLinks(FOOTER_LINKS, context);

    console.log('\n\n============ FOOTER VALIDATION SUMMARY ============');
    console.log(`${'Link'.padEnd(26)} | ${'Vis'.padEnd(3)} | ${'404'.padEnd(3)} | ${'Pass'.padEnd(4)} | ${'Note'.padEnd(24)} | Redirected URL`);
    console.log('─'.repeat(120));
    for (const r of results) {
      const vis = r.visible ? '✅' : '❌';
      const err = r.is404   ? '🚨' : '  ';
      const pss = r.passed  ? '✅' : '❌';
      console.log(`${r.label.padEnd(26)} | ${vis.padEnd(3)} | ${err.padEnd(3)} | ${pss.padEnd(4)} | ${r.note.padEnd(24)} | ${r.redirectedUrl}`);
    }
    const allPassed = results.every(r => r.passed);
    const any404    = results.some(r => r.is404);
    console.log('─'.repeat(120));
    console.log(`Overall: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}${any404 ? '  |  🚨 404 errors detected!' : ''}`);
    console.log('===================================================\n');

    for (const r of results) {
      expect(r.visible, `"${r.label}" should be visible in footer`).toBe(true);
      expect(r.is404,   `"${r.label}" returned 404 at ${r.redirectedUrl}`).toBe(false);
      expect(r.passed,  `"${r.label}" should redirect correctly to ${r.href}`).toBe(true);
    }
  });

  test('"Also available on" platform icons are visible in footer', async ({ page }) => {
    const footer = new FooterPage(page);
    await footer.openHomePage();
    console.log('\n===== ALSO AVAILABLE ON =====');
    await footer.verifyPlatformIcons(ALSO_AVAILABLE_ON);
    console.log('==============================\n');
  });

  test('"We Accept" payment icons are visible in footer', async ({ page }) => {
    const footer = new FooterPage(page);
    await footer.openHomePage();
    console.log('\n===== WE ACCEPT =====');
    await footer.verifyPaymentIcons(WE_ACCEPT);
    console.log('=====================\n');
  });

});
