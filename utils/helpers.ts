import { Page } from '@playwright/test';

const MAX_RETRIES = 2;
const GOTO_TIMEOUT = 30000;

/**
 * Retry-enabled page.goto wrapper.
 * Retries on ERR_TIMED_OUT or ERR_ABORTED up to MAX_RETRIES times.
 */
/**
 * Closes the staging popup using window.hideStagingPopup(),
 * with a fallback to clicking the close button if the function doesn't exist.
 */
export async function closePopupIfPresent(page: Page): Promise<void> {
  try {
    const closed = await page.evaluate(() => {
      if (typeof (window as any).hideStagingPopup === 'function') {
        (window as any).hideStagingPopup();
        return true;
      }
      return false;
    });

    if (!closed) {
      // Fallback: click any visible close/X button in a popup/modal
      const closeBtn = page.locator(
        'button[aria-label*="close" i], button[aria-label*="dismiss" i], div[class*="popup"] button, div[class*="modal"] button[class*="close"]'
      ).first();
      const visible = await closeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) await closeBtn.click();
    }

    await page.waitForTimeout(300);
  } catch {
    // Popup close is best-effort — never fail the test for this
  }
}

export async function navigateTo(
  page: Page,
  url: string,
  options: Parameters<Page['goto']>[1] = {}
): Promise<void> {
  const opts = { waitUntil: 'domcontentloaded' as const, timeout: GOTO_TIMEOUT, ...options };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await page.goto(url, opts);
      await closePopupIfPresent(page);
      return;
    } catch (err: any) {
      const isRetryable =
        err.message?.includes('ERR_TIMED_OUT') ||
        err.message?.includes('ERR_ABORTED') ||
        err.message?.includes('net::ERR') ||
        err.message?.includes('Timeout') ||
        err.message?.includes('timeout');

      if (isRetryable && attempt < MAX_RETRIES) {
        console.log(`⚠️  navigateTo attempt ${attempt} failed for ${url} — retrying...`);
        await page.waitForTimeout(2000);
      } else {
        throw err;
      }
    }
  }
}
