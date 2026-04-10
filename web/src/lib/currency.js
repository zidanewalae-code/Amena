// Currency formatting helper reused by web donation and admin views.
const FX_RATES = {
  TND: { TND: 1, USD: 0.3226, EUR: 0.2985 },
  USD: { TND: 3.1, USD: 1, EUR: 0.9259 },
  EUR: { TND: 3.35, USD: 1.08, EUR: 1 }
};

function formatMoney(value, currency) {
  const safeValue = Number(value || 0);
  const safeCurrency = currency || 'TND';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 2
  }).format(safeValue);
}

function convertCurrency(amount, fromCurrency, toCurrency) {
  const from = String(fromCurrency || 'TND').toUpperCase();
  const to = String(toCurrency || 'TND').toUpperCase();
  const amountNum = Number(amount || 0);
  const rate = FX_RATES[from]?.[to] || 1;
  return Number((amountNum * rate).toFixed(2));
}

export { formatMoney, convertCurrency, FX_RATES };
