// PayPal provider supports basic order creation, heartbeat health checks, and status lookup.
class PayPalProvider {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.baseUrl = String(process.env.PAYPAL_MODE || 'sandbox') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  ensureCredentials() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required for PayPal provider');
    }
  }

  async fetchAccessToken() {
    this.ensureCredentials();

    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal OAuth failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async createPaymentIntent({ amount, currency, metadata }) {
    const token = await this.fetchAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: (currency || 'USD').toUpperCase(),
              value: Number(amount).toFixed(2)
            },
            custom_id: metadata?.order_id || undefined
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal create order failed: ${response.status} ${text}`);
    }

    const order = await response.json();
    return {
      providerTransactionId: order.id,
      clientSecret: null,
      payload: order
    };
  }

  async fetchPaymentStatus(providerTransactionId) {
    if (!providerTransactionId) return null;
    const token = await this.fetchAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${providerTransactionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal status failed: ${response.status} ${text}`);
    }

    const order = await response.json();
    let status = 'pending';
    if (order.status === 'COMPLETED') status = 'paid';
    if (order.status === 'VOIDED' || order.status === 'CANCELLED') status = 'failed';

    return { status, payload: order };
  }

  async healthCheck() {
    const startedAt = Date.now();

    try {
      await this.fetchAccessToken();
      return {
        provider: 'paypal',
        available: true,
        latency_ms: Date.now() - startedAt,
        reason: null
      };
    } catch (error) {
      return {
        provider: 'paypal',
        available: false,
        latency_ms: Date.now() - startedAt,
        reason: error.message
      };
    }
  }
}

module.exports = PayPalProvider;
