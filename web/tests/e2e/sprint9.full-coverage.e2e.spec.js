// Sprint 9 full-coverage e2e checks across donor and admin journeys.
const { test, expect } = require('@playwright/test');

const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:5000';

async function login(request, email, password) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { email, password }
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function seedCart(request, token, needId, amount) {
  const response = await request.post(`${API_BASE_URL}/api/donations/cart/items`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { need_id: needId, amount }
  });
  expect(response.ok()).toBeTruthy();
}

test('donor checkout and history Sprint 9 controls', async ({ page, request }) => {
  const donor = await login(
    request,
    process.env.E2E_DONOR_EMAIL || 'donor1@amena.tn',
    process.env.E2E_DONOR_PASSWORD || 'secret123'
  );

  await seedCart(request, donor.token, Number(process.env.E2E_NEED_ID || 1), Number(process.env.E2E_AMOUNT || 55));

  await page.goto('/donations/checkout');
  await page.locator('#checkout-token').fill(donor.token);
  await page.locator('#checkout-base-amount').fill('120');

  await expect(page.getByText(/Montant converti|Converted amount/)).toBeVisible();
  await page.getByRole('button', { name: /Creer paiement|Create payment/ }).click();

  await expect(page.getByText(/Order cree|Order created/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Resume donation|Donation summary/ })).toBeVisible();

  await page.getByRole('button', { name: /Fermer|Close/ }).click();

  await page.goto('/donations/history');
  await page.locator('#history-token').fill(donor.token);
  await page.getByRole('button', { name: /Charger historique|Load history/ }).click();

  await expect(page.getByRole('button', { name: /Exporter CSV|Export CSV/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Exporter PDF|Export PDF/ })).toBeVisible();
  await expect(page.locator('#sort-by')).toBeVisible();
});

test('admin payments dashboard and monitoring', async ({ page, request }) => {
  const admin = await login(
    request,
    process.env.E2E_ADMIN_EMAIL || 'admin@amena.tn',
    process.env.E2E_ADMIN_PASSWORD || 'secret123'
  );

  await page.goto('/admin/payments');
  await page.locator('textarea').first().fill(admin.token);
  await page.getByRole('button', { name: /Load transactions|Charger transactions/ }).click();

  await expect(page.getByRole('button', { name: /KPIs/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Exporter CSV|Export CSV/ })).toBeVisible();
  await expect(page.getByText(/Tx #/).first()).toBeVisible();

  await page.getByRole('button', { name: /Heartbeat/i }).click();
  await expect(page.getByText(/issue_type|Heartbeat/).first()).toBeVisible();
});

test('route smoke coverage for major pages', async ({ page }) => {
  const routes = [
    '/','/profile','/needs','/needs/new','/donations/cart','/donations/checkout','/donations/history','/delivery/dashboard','/admin/payments'
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('main, body')).toBeVisible();
  }
});
