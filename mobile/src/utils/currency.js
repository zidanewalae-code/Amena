// Currency formatter shared by mobile cards and screens.
const FX_RATES = {
  TND: { TND: 1, USD: 0.3226, EUR: 0.2985 },
  USD: { TND: 3.1, USD: 1, EUR: 0.9259 },
  EUR: { TND: 3.35, USD: 1.08, EUR: 1 }
};

export function formatMoney(value, currency) {
  const safeValue = Number(value || 0);
  const safeCurrency = currency || 'TND';

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 2
  }).format(safeValue);
}

export function convertCurrency(value, fromCurrency, toCurrency) {
  const from = String(fromCurrency || 'TND').toUpperCase();
  const to = String(toCurrency || 'TND').toUpperCase();
  const amount = Number(value || 0);
  const rate = FX_RATES[from]?.[to] || 1;
  return Number((amount * rate).toFixed(2));
}
