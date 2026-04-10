// Stripe provider encapsulates live payment intent and webhook signature verification.
const Stripe = require('stripe');

class StripeProvider {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required for Stripe provider');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createPaymentIntent({ amount, currency, metadata, idempotencyKey }) {
    const cents = Math.round(Number(amount) * 100);

    const intent = await this.stripe.paymentIntents.create(
      {
        amount: cents,
        currency: (currency || 'tnd').toLowerCase(),
        metadata: metadata || {}
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    return {
      providerTransactionId: intent.id,
      clientSecret: intent.client_secret,
      payload: intent
    };
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    return this.stripe.webhooks.constructEvent(rawBody, signatureHeader, process.env.STRIPE_WEBHOOK_SECRET);
  }

  mapWebhookEvent(event) {
    if (!event || !event.data || !event.data.object) {
      throw new Error('Invalid Stripe event payload');
    }

    const pi = event.data.object;
    const orderId = Number(pi.metadata?.order_id || 0);

    let status = 'failed';
    if (event.type === 'payment_intent.succeeded') status = 'paid';
    if (event.type === 'payment_intent.payment_failed') status = 'failed';
    if (event.type === 'charge.refunded' || event.type === 'payment_intent.canceled') status = 'refunded';

    return {
      eventId: event.id,
      orderId,
      transactionId: pi.id,
      status,
      providerName: 'stripe',
      payload: event
    };
  }

  async fetchPaymentStatus(providerTransactionId) {
    if (!providerTransactionId) return null;

    const intent = await this.stripe.paymentIntents.retrieve(providerTransactionId);
    let status = 'pending';

    if (intent.status === 'succeeded') status = 'paid';
    if (intent.status === 'canceled') status = 'failed';
    if (intent.status === 'requires_payment_method') status = 'failed';

    return { status, payload: intent };
  }

  async healthCheck() {
    const startedAt = Date.now();

    try {
      await this.stripe.balance.retrieve();
      return {
        provider: 'stripe',
        available: true,
        latency_ms: Date.now() - startedAt,
        reason: null
      };
    } catch (error) {
      return {
        provider: 'stripe',
        available: false,
        latency_ms: Date.now() - startedAt,
        reason: error.message
      };
    }
  }
}

module.exports = StripeProvider;
