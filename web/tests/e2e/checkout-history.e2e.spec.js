// E2E flow for checkout -> webhook callback -> history confirmation using real backend API.
const { test, expect } = require('@playwright/test');

const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.E2E_PAYMENT_WEBHOOK_SECRET || 'change_me';

async function loginAsSeedDonor(request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email: process.env.E2E_DONOR_EMAIL || 'donor1@amena.tn',
      password: process.env.E2E_DONOR_PASSWORD || 'secret123'
    }
  });

  const payload = await response.json();
  return payload.token;
}

async function prepareCart(request, token) {
  await request.post(`${API_BASE_URL}/api/donations/cart/items`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      need_id: Number(process.env.E2E_NEED_ID || 1),
      amount: Number(process.env.E2E_AMOUNT || 40)
    }
  });
}

test('checkout callback success appears in history (real api)', async ({ page, request }) => {
  const token = await loginAsSeedDonor(request);
  await prepareCart(request, token);

  await page.goto('/donations/checkout');

  await page.locator('textarea').first().fill(token);
  await page.getByRole('button', { name: /Creer paiement|Create payment/ }).click();

  const orderCreated = page.getByText(/Order cree:/);
  await expect(orderCreated).toBeVisible();
  await page.getByRole('button', { name: /Confirmer success|Confirm success/ }).click();

  await expect(page.getByText(/Paiement confirme|Payment confirmed/)).toBeVisible();

  await page.goto('/donations/history');
  await page.locator('textarea').first().fill(token);
  await page.getByRole('button', { name: /Charger historique|Load history/ }).click();
  await expect(page.locator('.badge-paid').first()).toBeVisible();
});

test('admin dashboard exposes KPI, payments listing and export actions', async ({ page, request }) => {
  const adminResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || 'admin@amena.tn',
      password: process.env.E2E_ADMIN_PASSWORD || 'secret123'
    }
  });
  const adminData = await adminResponse.json();

  await page.goto('/admin/payments');
  await page.locator('textarea').first().fill(adminData.token);
  await page.getByRole('button', { name: /Load transactions|Charger transactions/ }).click();

  await expect(page.getByRole('button', { name: /KPIs/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Exporter CSV|Export CSV/ })).toBeVisible();
  await expect(page.getByText(/Tx #/).first()).toBeVisible();

  await page.getByRole('button', { name: /Heartbeat/i }).click();
  await expect(page.getByText(/Heartbeat/).first()).toBeVisible();
});
