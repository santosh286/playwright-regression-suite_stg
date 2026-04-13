import { chromium } from '@playwright/test';

const STAGING_URL = 'https://staging.kapiva.in/';
const MAX_WAIT_MS = 120000; // 2 minutes
const RETRY_INTERVAL_MS = 10000; // 10 seconds
const PING_TIMEOUT_MS = 10000; // 10 seconds per attempt

async function globalSetup() {
  const start = Date.now();
  let attempt = 0;

  console.log(`\n🔍 Pre-flight: checking staging server at ${STAGING_URL}`);

  while (Date.now() - start < MAX_WAIT_MS) {
    attempt++;
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(STAGING_URL, { waitUntil: 'domcontentloaded', timeout: PING_TIMEOUT_MS });
      await browser.close();
      console.log(`✅ Staging is up (attempt ${attempt}). Proceeding with tests.\n`);
      return;
    } catch (err) {
      await browser.close();
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`⏳ Staging not ready (attempt ${attempt}, ${elapsed}s elapsed). Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }

  throw new Error(`❌ Staging server at ${STAGING_URL} did not respond within ${MAX_WAIT_MS / 1000}s. Aborting test run.`);
}

export default globalSetup;
