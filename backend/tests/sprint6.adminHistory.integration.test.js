// Sprint 6 integration tests for history filters, multi-currency checkout, and admin payment actions.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.PAYMENT_PROVIDER = 'mock';
process.env.PAYMENT_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.WEBHOOK_ALERT_THRESHOLD_MIN = '10';
process.env.MONITORED_PAYMENT_PROVIDERS = 'mock,stripe';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const sequelize = require('../config/db');
const { User, Profile, Need, DonationOrder, PaymentTransaction } = require('../models');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
}

describe('Sprint 6 admin/history features', () => {
  let donor;
  let admin;
  let need;
  let donorToken;
  let adminToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    admin = await User.create({
      full_name: 'Admin',
      email: 'admin_test@amena.tn',
      password_hash: 'hash',
      role: 'admin',
      phone: '+21699000111',
      is_active: true
    });

    donor = await User.create({
      full_name: 'Donor',
      email: 'donor_test@amena.tn',
      password_hash: 'hash',
      role: 'donor',
      phone: '+21699000112',
      is_active: true
    });

    await Profile.create({ user_id: donor.id, trust_score: 30, role_metadata: {} });

    need = await Need.create({
      title: 'Need Sprint 6',
      description: 'Need for sprint 6 tests',
      category: 'food',
      urgency_level: 'medium',
      amount_target: 2000,
      amount_collected: 0,
      status: 'published',
      created_by_user_id: donor.id
    });

    donorToken = signToken(donor);
    adminToken = signToken(admin);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('checkout supports USD currency and history filter by currency', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ need_id: need.id, amount: 310 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ provider_name: 'mock', currency: 'USD' })
      .expect(201);

    expect(checkoutResponse.body.order.currency).toBe('USD');
    expect(Number(checkoutResponse.body.order.total_amount)).toBe(100);

    const historyResponse = await request(app)
      .get('/api/donations/orders/history?currency=USD&page=1&limit=10')
      .set('Authorization', `Bearer ${donorToken}`)
      .expect(200);

    expect(Array.isArray(historyResponse.body.items)).toBe(true);
    expect(historyResponse.body.items.length).toBe(1);
    expect(historyResponse.body.items[0].currency).toBe('USD');
  });

  test('history can filter by paid status after webhook confirmation', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ need_id: need.id, amount: 100 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ provider_name: 'mock', currency: 'TND' })
      .expect(201);

    const orderId = checkoutResponse.body.order.id;
    const tx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });

    const payload = {
      event_id: 'evt_sprint6_paid',
      order_id: orderId,
      transaction_id: tx.transaction_id || 'mock_tx_sprint6_paid',
      provider_name: 'mock',
      status: 'paid'
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');

    await request(app)
      .post('/api/payments/webhook/mock')
      .set('Content-Type', 'application/json')
      .set('x-provider-signature', signature)
      .send(rawBody)
      .expect(200);

    const historyResponse = await request(app)
      .get('/api/donations/orders/history?status=paid&payment_status=paid')
      .set('Authorization', `Bearer ${donorToken}`)
      .expect(200);

    expect(historyResponse.body.items.length).toBe(1);
    expect(historyResponse.body.items[0].status).toBe('paid');
    expect(historyResponse.body.items[0].transaction.status).toBe('paid');
  });

  test('admin can cancel pending order and mark incident', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ need_id: need.id, amount: 80 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ provider_name: 'mock' })
      .expect(201);

    const orderId = checkoutResponse.body.order.id;

    await request(app)
      .patch(`/api/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    const updatedOrder = await DonationOrder.findByPk(orderId);
    expect(updatedOrder.status).toBe('canceled');

    const tx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });
    expect(tx.status).toBe('canceled');

    const incidentResponse = await request(app)
      .patch(`/api/admin/transactions/${tx.id}/incident`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ incident_note: 'Webhook timeout observed' })
      .expect(200);

    expect(incidentResponse.body.transaction.incident_flag).toBe(true);
  });

  test('admin metrics and CSV export are available', async () => {
    const metricsResponse = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(metricsResponse.body).toHaveProperty('totals.total_paid_amount');
    expect(metricsResponse.body).toHaveProperty('totals.failure_rate_percent');
    expect(Array.isArray(metricsResponse.body.volume_by_day)).toBe(true);

    const exportResponse = await request(app)
      .get('/api/admin/transactions/export?format=csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(exportResponse.text.includes('transaction_id')).toBe(true);
  });

  test('monitoring endpoint returns delayed pending orders and webhook timestamps', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ need_id: need.id, amount: 70 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({ provider_name: 'mock', currency: 'TND' })
      .expect(201);

    const orderId = checkoutResponse.body.order.id;
    await sequelize.query("UPDATE donation_orders SET created_at = datetime('now', '-20 minutes') WHERE id = :orderId", {
      replacements: { orderId }
    });

    const monitoringResponse = await request(app)
      .get('/api/monitoring/webhooks')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(monitoringResponse.body).toHaveProperty('threshold_minutes');
    expect(monitoringResponse.body).toHaveProperty('delayed_orders_count');
    expect(Array.isArray(monitoringResponse.body.delayed_orders)).toBe(true);
    expect(monitoringResponse.body.delayed_orders.some((o) => o.order_id === orderId)).toBe(true);

    const tx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });
    const payload = {
      event_id: 'evt_sprint61_paid',
      order_id: orderId,
      transaction_id: tx.transaction_id || 'mock_tx_sprint61_paid',
      provider_name: 'mock',
      status: 'paid'
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');

    await request(app)
      .post('/api/payments/webhook/mock')
      .set('Content-Type', 'application/json')
      .set('x-provider-signature', signature)
      .send(rawBody)
      .expect(200);

    const updatedOrder = await DonationOrder.findByPk(orderId);
    const updatedTx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });
    expect(updatedOrder.last_webhook_at).toBeTruthy();
    expect(updatedTx.last_webhook_at).toBeTruthy();

    const heartbeatResponse = await request(app)
      .get('/api/monitoring/heartbeat')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(heartbeatResponse.body).toHaveProperty('checked_at');
    expect(heartbeatResponse.body).toHaveProperty('issue_type');
    expect(Array.isArray(heartbeatResponse.body.providers)).toBe(true);
    expect(heartbeatResponse.body.providers.some((p) => p.provider === 'mock')).toBe(true);
  });
});
