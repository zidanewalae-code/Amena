// Mock provider supports local testing and deterministic webhook simulation.
const crypto = require('crypto');

class MockProvider {
  async createPaymentIntent({ idempotencyKey }) {
    return {
      providerTransactionId: `mock_pi_${Date.now()}`,
      clientSecret: `mock_secret_${idempotencyKey || 'default'}`,
      payload: { mock: true }
    };
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (!signatureHeader || signatureHeader !== expected) {
      throw new Error('Invalid mock webhook signature');
    }

    return JSON.parse(rawBody.toString('utf8'));
  }

  mapWebhookEvent(event) {
    return {
      eventId: event.event_id,
      orderId: Number(event.order_id || 0),
      transactionId: event.transaction_id,
      status: event.status,
      providerName: event.provider_name || 'mock',
      payload: event
    };
  }

  async fetchPaymentStatus(providerTransactionId) {
    const forced = String(process.env.MOCK_RETRY_STATUS || '').toLowerCase();
    if (['paid', 'failed', 'refunded', 'pending'].includes(forced)) {
      return {
        status: forced,
        payload: { providerTransactionId, source: 'mock_fetch_status_forced' }
      };
    }

    return {
      status: 'pending',
      payload: { providerTransactionId, source: 'mock_fetch_status_default' }
    };
  }

  async healthCheck() {
    return {
      provider: 'mock',
      available: true,
      latency_ms: 0,
      reason: null
    };
  }
}

module.exports = MockProvider;
