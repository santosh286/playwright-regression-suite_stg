import { test, expect } from '@playwright/test';

/**
 * Get next hour safely
 */
function getNextHour(currentHour: number): string {
  if (currentHour >= 23) {
    throw new Error(`Cannot move appointment beyond 23:00. Current hour: ${currentHour}`);
  }
  return String(currentHour + 1).padStart(2, '0');
}

/**
 * Read currently selected hour from Start Time dropdown
 */
async function getSelectedHour(page) {
  const selectedValue = await page
    .getByLabel('Start Time')
    .inputValue();

  const hour = parseInt(selectedValue, 10);
  if (Number.isNaN(hour)) {
    throw new Error(`Invalid Start Time value: ${selectedValue}`);
  }

  return hour;
}

test('HTS appointment actions with logs', async ({ page }) => {

  console.log('🚀 Test started');

  // ---------------- LOGIN ----------------
  await test.step('Open HTS login page', async () => {
    await page.goto('https://stg-hts.kapiva.tech/');
  });

  await test.step('Login to application', async () => {
    await page.getByRole('textbox', { name: 'Email ID' }).fill('rishi@kapiva.in');
    await page.getByRole('textbox', { name: 'Password' }).fill('r');
    await page.getByRole('button', { name: 'LOGIN', exact: true }).click();
    console.log('✅ Logged in');
  });

  await test.step('Open Today’s Appointments', async () => {
    await page.locator('div').filter({ hasText: 'Todays Appointments' }).nth(3).click();
  });

  // ================= RESCHEDULE =================
  await test.step('Reschedule appointment for santosh k (next hour)', async () => {
    console.log('⏰ Opening appointment');

    await page.locator('div')
      .filter({ hasText: /^santosh kMen's HealthRishi$/ })
      .nth(3)
      .click();

    await page.getByRole('button', { name: 'request' }).click();
    await page.getByText('Reschedule').click();

    // ✅ Read current appointment hour from dropdown
    const currentHour = await getSelectedHour(page);
    console.log(`🕒 Current appointment hour: ${currentHour}`);

    const nextHour = getNextHour(currentHour);
    console.log(`⏭️ Reschedule to next hour: ${nextHour}`);

    await page.getByLabel('Start Time').selectOption(nextHour);
    await page.getByRole('button', { name: 'Submit' }).click();

    console.log(`✅ Appointment rescheduled to ${nextHour}:00`);
  });

  // ================= TRANSFER =================
  await test.step('Transfer appointment for test demo (next hour)', async () => {
    console.log('🔁 Opening appointment');

    await page.locator('div')
      .filter({ hasText: /^test demoMen's HealthRishi$/ })
      .nth(3)
      .click();

    await page.getByRole('button', { name: 'request' }).click();
    await page.getByText('Transfer').click();

    // ✅ Read current appointment hour from dropdown
    const currentHour = await getSelectedHour(page);
    console.log(`🕒 Current appointment hour: ${currentHour}`);

    const nextHour = getNextHour(currentHour);
    console.log(`⏭️ Transfer to next hour: ${nextHour}`);

    await page.getByLabel('Start Time').selectOption(nextHour);
    await page.getByRole('textbox', { name: 'Reason' }).fill('Transfer to next hour');
    await page.getByRole('button', { name: 'Submit' }).click();

    console.log(`✅ Appointment transferred to ${nextHour}:00`);
  });

  // ================= CANCEL =================
  await test.step('Cancel appointment for test demo', async () => {
    await page.locator('div')
      .filter({ hasText: /^test demoMen's HealthRishi$/ })
      .nth(3)
      .click();

    await page.getByRole('button', { name: 'request' }).click();
    await page.getByText('Cancel').click();
    await page.getByRole('textbox', { name: 'Reason' }).fill('testing');
    await page.getByRole('button', { name: 'Submit' }).click();

    console.log('✅ Appointment cancelled');
  });

  // ---------------- LOGOUT ----------------
  await test.step('Logout from application', async () => {
    await page.getByRole('button', { name: 'log-out-icon Logout' }).click();
  });

  console.log('🏁 Test completed successfully');
});
