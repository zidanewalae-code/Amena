// Centralized conversion rates for checkout and history display.
const SUPPORTED_CURRENCIES = ['TND', 'USD', 'EUR'];

const TO_TND_RATE = {
  TND: 1,
  USD: 3.1,
  EUR: 3.35
};

function normalizeCurrency(input) {
  const value = String(input || 'TND').toUpperCase();
  return SUPPORTED_CURRENCIES.includes(value) ? value : 'TND';
}

function convertFromTnd(amountTnd, targetCurrency) {
  const currency = normalizeCurrency(targetCurrency);
  if (currency === 'TND') return Number(amountTnd);
  const rate = TO_TND_RATE[currency];
  return Number((Number(amountTnd) / rate).toFixed(2));
}

module.exports = {
  SUPPORTED_CURRENCIES,
  TO_TND_RATE,
  normalizeCurrency,
  convertFromTnd
};
