// Checkout page creates mock payment intent and confirms payment callback.
import { useEffect, useMemo, useState } from 'react';
import { t } from '../../lib/i18n';
import { apiUrl } from '../../lib/api';
import { convertCurrency, formatMoney } from '../../lib/currency';
import Toast from '../../components/Toast';
import DonationSummaryModal from '../../components/DonationSummaryModal';
import { getStoredAuth, saveToken } from '../../lib/auth';

export default function CheckoutPage() {
  const [token, setToken] = useState('');
  const [orderId, setOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [provider, setProvider] = useState('mock');
  const [currency, setCurrency] = useState('TND');
  const [lang, setLang] = useState('fr');
  const [paymentState, setPaymentState] = useState('pending');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('change_me');
  const [baseAmount, setBaseAmount] = useState('50');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [result, setResult] = useState(null);

  const convertedAmount = useMemo(() => {
    return convertCurrency(Number(baseAmount || 0), 'TND', currency);
  }, [baseAmount, currency]);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) setToken(auth.token);
  }, []);

  function onTokenChange(value) {
    setToken(value);
    saveToken(value);
  }

  async function createIntent() {
    try {
      setPaymentState('pending');
      const response = await fetch(apiUrl('/api/donations/checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ provider_name: provider, currency })
      });
      const data = await response.json();
      setResult(data);
      if (data.order?.id) {
        setCreatedOrderId(String(data.order.id));
        setSummaryOpen(true);
      }
      setTransactionId(String(data.payment?.provider_transaction_id || ''));
      if (!response.ok) {
        setPaymentState('failed');
        setToast({ message: t(lang, 'toastError'), type: 'error' });
        return;
      }
      setToast({ message: t(lang, 'toastSuccess'), type: 'success' });
    } catch (_error) {
      setPaymentState('failed');
      setToast({ message: t(lang, 'toastError'), type: 'error' });
    }
  }

  async function refreshStatus() {
    const targetOrderId = createdOrderId || orderId;
    if (!targetOrderId) return;

    try {
      const response = await fetch(apiUrl(`/api/donations/orders/${Number(targetOrderId)}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setResult(data);

      const status = data.transaction?.status || data.status || 'pending';
      if (status === 'paid') setPaymentState('success');
      else if (status === 'failed' || status === 'canceled') setPaymentState('failed');
      else setPaymentState('pending');
    } catch (_error) {
      setPaymentState('failed');
      setToast({ message: t(lang, 'toastError'), type: 'error' });
    }
  }

  async function simulateWebhook(success) {
    const targetOrderId = createdOrderId || orderId;
    if (!targetOrderId) return;

    setPaymentState('pending');

    try {
      const response = await fetch(apiUrl('/api/payments/callback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret
        },
        body: JSON.stringify({
          order_id: Number(targetOrderId),
          transaction_id: transactionId || `sim_${Date.now()}`,
          provider_name: provider,
          status: success ? 'paid' : 'failed',
          event_id: `evt_ui_${Date.now()}`
        })
      });
      const data = await response.json();
      setResult(data);
      setPaymentState(response.ok && success ? 'success' : 'failed');
      setToast({ message: response.ok ? t(lang, 'toastSuccess') : t(lang, 'toastError'), type: response.ok ? 'success' : 'error' });
      await refreshStatus();
    } catch (_error) {
      setPaymentState('failed');
      setToast({ message: t(lang, 'toastError'), type: 'error' });
    }
  }

  return (
    <main className="page">
      <a href="#checkout-result" className="skip-link">Skip to checkout result</a>
      <h1>{t(lang, 'checkoutTitle')} (mock)</h1>
      <div className="card">
        <label className="label" htmlFor="checkout-token">{t(lang, 'tokenLabel')}</label>
        <textarea id="checkout-token" className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <label className="label" htmlFor="checkout-language">Language</label>
        <select id="checkout-language" className="select" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>
        <label className="label" htmlFor="checkout-order-id">Order ID</label>
        <input id="checkout-order-id" className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        <label className="label" htmlFor="checkout-provider">Provider</label>
        <select id="checkout-provider" className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="mock">mock</option>
          <option value="stripe">stripe</option>
          <option value="paypal">paypal</option>
        </select>
        <label className="label" htmlFor="checkout-currency">{t(lang, 'currency')}</label>
        <select id="checkout-currency" className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="TND">TND</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>

        <label className="label" htmlFor="checkout-base-amount">Base amount (TND)</label>
        <input
          id="checkout-base-amount"
          className="input"
          value={baseAmount}
          onChange={(e) => setBaseAmount(e.target.value)}
          inputMode="decimal"
        />
        <p className="muted" aria-live="polite">
          {t(lang, 'convertedAmount')}: {formatMoney(convertedAmount, currency)}
        </p>

        <button className="button" onClick={createIntent}>{t(lang, 'createIntent')} ({provider}/{currency})</button>
        {createdOrderId && <p className="muted">Order cree: {createdOrderId}</p>}
      </div>

      <div className="card">
        <label className="label">Transaction ID (provider)</label>
        <input className="input" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
        <label className="label">Webhook Secret</label>
        <input className="input" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
        <div className="actions-row">
          <button className="button" onClick={() => simulateWebhook(true)}>{t(lang, 'confirmPaid')}</button>
          <button className="button button-danger" onClick={() => simulateWebhook(false)}>{t(lang, 'confirmFailed')}</button>
          <button className="button button-soft" onClick={refreshStatus}>Refresh status</button>
        </div>
        <p>
          {t(lang, 'paymentState')}: <span className={`badge badge-${paymentState === 'success' ? 'paid' : paymentState}`}>{t(lang, paymentState)}</span>
        </p>
      </div>

      {result && <pre id="checkout-result" className="card" aria-live="polite">{JSON.stringify(result, null, 2)}</pre>}

      <DonationSummaryModal
        open={summaryOpen}
        title={t(lang, 'donationSummary')}
        summary={{
          provider,
          currency,
          orderId: createdOrderId || orderId,
          convertedAmount: formatMoney(convertedAmount, currency),
          state: paymentState
        }}
        onClose={() => setSummaryOpen(false)}
      />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
