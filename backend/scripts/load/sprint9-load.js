// Sprint 9 load test harness for checkout, webhook callback, and admin dashboard endpoints.
/* eslint-disable no-console */
const { performance } = require('perf_hooks');

const API_BASE_URL = process.env.LOAD_API_BASE_URL || 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.LOAD_PAYMENT_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || 'change_me';
const ITERATIONS = Math.max(Number(process.env.LOAD_ITERATIONS || 20), 1);
const CONCURRENCY = Math.max(Number(process.env.LOAD_CONCURRENCY || 5), 1);
const NEED_ID = Number(process.env.LOAD_NEED_ID || 1);
const AMOUNT = Number(process.env.LOAD_AMOUNT || 20);
const PROVIDERS = String(process.env.LOAD_PROVIDERS || 'mock')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Number(sorted[Math.max(idx, 0)].toFixed(2));
}

async function requestJson(path, options = {}) {
  const started = performance.now();
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (_err) {
    payload = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    durationMs: performance.now() - started,
    payload
  };
}

async function login(email, password) {
  const res = await requestJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok || !res.payload?.token) {
    throw new Error(`Login failed for ${email} (${res.status})`);
  }

  return res.payload.token;
}

async function addCartItem(token) {
  return requestJson('/api/donations/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ need_id: NEED_ID, amount: AMOUNT })
  });
}

async function createCheckout(token, provider, currency) {
  return requestJson('/api/donations/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ provider_name: provider, currency })
  });
}

async function sendWebhook(orderId, transactionId, providerName, idx) {
  return requestJson('/api/payments/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET
    },
    body: JSON.stringify({
      order_id: orderId,
      transaction_id: transactionId,
      provider_name: providerName,
      status: 'paid',
      event_id: `evt_load_${Date.now()}_${idx}`
    })
  });
}

async function fetchDashboard(token) {
  const listRes = await requestJson('/api/admin/transactions?page=1&limit=20', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const kpiRes = await requestJson('/api/admin/metrics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return [listRes, kpiRes];
}

async function runWorkers(total, concurrency, workerFn) {
  let index = 0;
  const workers = Array.from({ length: concurrency }).map(async () => {
    const results = [];
    while (index < total) {
      const current = index;
      index += 1;
      // eslint-disable-next-line no-await-in-loop
      results.push(await workerFn(current));
    }
    return results;
  });

  const chunks = await Promise.all(workers);
  return chunks.flat();
}

function summarize(name, results) {
  const durations = results.map((entry) => entry.durationMs);
  const success = results.filter((entry) => entry.ok).length;
  const failed = results.length - success;

  const summary = {
    scenario: name,
    requests: results.length,
    success,
    failed,
    avg_ms: Number((durations.reduce((sum, v) => sum + v, 0) / Math.max(durations.length, 1)).toFixed(2)),
    p50_ms: percentile(durations, 50),
    p95_ms: percentile(durations, 95),
    p99_ms: percentile(durations, 99)
  };

  console.log(JSON.stringify(summary));
  return summary;
}

async function main() {
  console.log('Starting Sprint 9 load harness...');
  console.log(JSON.stringify({ API_BASE_URL, ITERATIONS, CONCURRENCY }));

  const donorCredentials = [
    {
      email: process.env.LOAD_DONOR_EMAIL_1 || process.env.LOAD_DONOR_EMAIL || 'donor1@amena.tn',
      password: process.env.LOAD_DONOR_PASSWORD_1 || process.env.LOAD_DONOR_PASSWORD || 'secret123'
    },
    {
      email: process.env.LOAD_DONOR_EMAIL_2 || 'donor2@amena.tn',
      password: process.env.LOAD_DONOR_PASSWORD_2 || 'secret123'
    },
    {
      email: process.env.LOAD_DONOR_EMAIL_3 || 'donor3@amena.tn',
      password: process.env.LOAD_DONOR_PASSWORD_3 || 'secret123'
    }
  ];

  const donorTokens = [];
  for (const donor of donorCredentials) {
    // eslint-disable-next-line no-await-in-loop
    donorTokens.push(await login(donor.email, donor.password));
  }

  const checkoutConcurrency = Math.min(CONCURRENCY, donorTokens.length);
  const adminToken = await login(
    process.env.LOAD_ADMIN_EMAIL || 'admin@amena.tn',
    process.env.LOAD_ADMIN_PASSWORD || 'secret123'
  );

  const currencies = ['TND', 'USD', 'EUR'];

  const checkoutResults = [];
  const webhookInputs = [];

  const checkoutRun = await runWorkers(ITERATIONS, checkoutConcurrency, async (idx) => {
    const donorToken = donorTokens[idx % donorTokens.length];
    await addCartItem(donorToken);

    const provider = PROVIDERS[idx % PROVIDERS.length] || 'mock';
    const currency = currencies[idx % currencies.length];
    const res = await createCheckout(donorToken, provider, currency);

    if (res.ok && res.payload?.order?.id) {
      webhookInputs.push({
        orderId: Number(res.payload.order.id),
        transactionId: res.payload?.payment?.provider_transaction_id || `tx_load_${Date.now()}_${idx}`,
        providerName: provider
      });
    }

    checkoutResults.push(res);
    return res;
  });

  const webhookTotal = Math.min(webhookInputs.length, ITERATIONS);
  const webhookRun = await runWorkers(webhookTotal, CONCURRENCY, async (idx) => {
    const input = webhookInputs[idx];
    return sendWebhook(input.orderId, input.transactionId, input.providerName, idx);
  });

  const dashboardRunNested = await runWorkers(ITERATIONS, CONCURRENCY, async () => {
    const [txRes, kpiRes] = await fetchDashboard(adminToken);
    return [txRes, kpiRes];
  });
  const dashboardRun = dashboardRunNested.flat();

  summarize('checkout', checkoutRun);
  summarize('webhook_callback', webhookRun);
  summarize('dashboard', dashboardRun);
}

main().catch((error) => {
  console.error('Load test failed:', error.message);
  process.exit(1);
});
