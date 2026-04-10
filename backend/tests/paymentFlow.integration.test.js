// Integration test for checkout -> webhook -> donation confirmation critical flow.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.PAYMENT_PROVIDER = 'mock';
process.env.PAYMENT_WEBHOOK_SECRET = 'test_webhook_secret';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const sequelize = require('../config/db');
const { User, Profile, Need, DonationOrder, Donation, PaymentTransaction, PaymentAuditLog } = require('../models');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
}

describe('payment critical flow', () => {
  let donor;
  let need;
  let secondNeed;
  let token;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    donor = await User.create({
      full_name: 'Test Donor',
      email: 'test_donor@amena.tn',
      password_hash: 'hash',
      role: 'donor',
      phone: '+21699900000',
      is_active: true
    });

    await Profile.create({ user_id: donor.id, trust_score: 10, role_metadata: {} });

    need = await Need.create({
      title: 'Need Test',
      description: 'Need for integration testing',
      category: 'food',
      urgency_level: 'medium',
      amount_target: 500,
      amount_collected: 0,
      status: 'published',
      created_by_user_id: donor.id
    });

    secondNeed = await Need.create({
      title: 'Need Test 2',
      description: 'Second need for partial rollback testing',
      category: 'medical',
      urgency_level: 'high',
      amount_target: 300,
      amount_collected: 0,
      status: 'published',
      created_by_user_id: donor.id
    });

    token = signToken(donor);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('checkout then webhook paid confirms donation and increments need amount', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ need_id: need.id, amount: 120 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider_name: 'mock' })
      .expect(201);

    const orderId = checkoutResponse.body.order.id;
    const tx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });

    const payload = {
      event_id: 'evt_test_paid_001',
      order_id: orderId,
      transaction_id: tx.transaction_id || 'mock_tx_paid_001',
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
    const updatedDonation = await Donation.findOne({ where: { order_id: orderId, need_id: need.id } });
    const updatedNeed = await Need.findByPk(need.id);
    const auditRows = await PaymentAuditLog.findAll({ where: { payment_transaction_id: tx.id } });

    expect(updatedOrder.status).toBe('paid');
    expect(updatedDonation.status).toBe('confirmed');
    expect(Number(updatedNeed.amount_collected)).toBe(120);
    expect(auditRows.length).toBeGreaterThan(0);
  });

  test('duplicate webhook event is idempotent and does not double increment amount', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ need_id: need.id, amount: 60 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider_name: 'mock' })
      .expect(201);

    const orderId = checkoutResponse.body.order.id;
    const tx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });

    const payload = {
      event_id: 'evt_test_paid_002',
      order_id: orderId,
      transaction_id: tx.transaction_id || 'mock_tx_paid_002',
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

    await request(app)
      .post('/api/payments/webhook/mock')
      .set('Content-Type', 'application/json')
      .set('x-provider-signature', signature)
      .send(rawBody)
      .expect(200);

    const updatedNeed = await Need.findByPk(need.id);
    expect(Number(updatedNeed.amount_collected)).toBe(60);
  });

  test('partial rollback marks only failed donation lines and keeps confirmed lines', async () => {
    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ need_id: need.id, amount: 80 })
      .expect(201);

    await request(app)
      .post('/api/donations/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ need_id: secondNeed.id, amount: 50 })
      .expect(201);

    const checkoutResponse = await request(app)
      .post('/api/donations/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider_name: 'mock' })
      .expect(201);

    const orderId = checkoutResponse.body.order.id;
    const tx = await PaymentTransaction.findOne({ where: { donation_order_id: orderId } });

    const payload = {
      event_id: 'evt_test_partial_001',
      order_id: orderId,
      transaction_id: tx.transaction_id || 'mock_tx_partial_001',
      provider_name: 'mock',
      status: 'paid',
      failed_need_ids: [secondNeed.id]
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
    const line1 = await Donation.findOne({ where: { order_id: orderId, need_id: need.id } });
    const line2 = await Donation.findOne({ where: { order_id: orderId, need_id: secondNeed.id } });
    const need1 = await Need.findByPk(need.id);
    const need2 = await Need.findByPk(secondNeed.id);
    const updatedTx = await PaymentTransaction.findByPk(tx.id);

    expect(updatedOrder.status).toBe('partially_paid');
    expect(updatedTx.status).toBe('partially_paid');
    expect(line1.status).toBe('confirmed');
    expect(line2.status).toBe('failed');
    expect(Number(need1.amount_collected)).toBe(80);
    expect(Number(need2.amount_collected)).toBe(0);
  });
});
