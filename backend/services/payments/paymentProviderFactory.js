// Payment provider factory enables future multi-provider support.
const StripeProvider = require('./providers/stripeProvider');
const MockProvider = require('./providers/mockProvider');
const PayPalProvider = require('./providers/paypalProvider');

function getProvider(providerName) {
  const key = (providerName || process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();

  if (key === 'stripe') {
    return new StripeProvider();
  }

  if (key === 'paypal') {
    return new PayPalProvider();
  }

  return new MockProvider();
}

module.exports = {
  getProvider
};
