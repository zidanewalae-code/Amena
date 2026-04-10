import { useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';
import { clearCart, getCart } from '../../lib/cart';
import { getStoredAuth } from '../../lib/auth';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState({ full_name: '', phone: '', address: '', city: '' });
  const [payment, setPayment] = useState({ method: 'card', card_name: '', card_last4: '' });

  async function payNow() {
    setLoading(true);
    setError('');

    const auth = getStoredAuth();
    if (!auth?.token) {
      setError('Please login first.');
      setLoading(false);
      return;
    }

    const items = getCart();
    if (!items.length) {
      setError('Cart is empty.');
      setLoading(false);
      return;
    }

    if (!delivery.full_name.trim() || !delivery.phone.trim() || !delivery.address.trim()) {
      setError('Please complete delivery information.');
      setLoading(false);
      return;
    }

    if (payment.method === 'card' && (!payment.card_name.trim() || !payment.card_last4.trim())) {
      setError('Please complete payment information.');
      setLoading(false);
      return;
    }

    const response = await fetch(apiUrl('/api/marketplace/checkout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({
        items: items.map((item) => ({ item_id: item.id, quantity: item.quantity || 1 })),
        delivery,
        payment: { method: payment.method, card_last4: payment.card_last4 }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data?.message || 'Payment failed');
      setLoading(false);
      return;
    }

    clearCart();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Checkout & Payment</h1>
        <p className="muted">Review cart, confirm delivery, and complete secure payment.</p>
        <div className="actions-row" style={{ marginBottom: 10 }}>
          <span className={`badge ${step >= 1 ? 'badge-success' : 'badge-pending'}`}>1. Review cart</span>
          <span className={`badge ${step >= 2 ? 'badge-success' : 'badge-pending'}`}>2. Delivery info</span>
          <span className={`badge ${step >= 3 ? 'badge-success' : 'badge-pending'}`}>3. Payment</span>
        </div>

        {step === 1 ? (
          <div>
            {getCart().map((item) => (
              <p key={item.id} className="muted">{item.title} x{item.quantity || 1}</p>
            ))}
            <button className="button" onClick={() => setStep(2)}>Continue to delivery</button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <label className="label">Full name</label>
            <input className="input" value={delivery.full_name} onChange={(e) => setDelivery((v) => ({ ...v, full_name: e.target.value }))} />
            <label className="label">Phone</label>
            <input className="input" value={delivery.phone} onChange={(e) => setDelivery((v) => ({ ...v, phone: e.target.value }))} />
            <label className="label">Address</label>
            <input className="input" value={delivery.address} onChange={(e) => setDelivery((v) => ({ ...v, address: e.target.value }))} />
            <label className="label">City</label>
            <input className="input" value={delivery.city} onChange={(e) => setDelivery((v) => ({ ...v, city: e.target.value }))} />
            <div className="actions-row">
              <button className="button button-soft" onClick={() => setStep(1)}>Back</button>
              <button className="button" onClick={() => setStep(3)}>Continue to payment</button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <label className="label">Payment method</label>
            <select className="select" value={payment.method} onChange={(e) => setPayment((v) => ({ ...v, method: e.target.value }))}>
              <option value="card">Card</option>
              <option value="cash">Cash on delivery</option>
            </select>
            {payment.method === 'card' ? (
              <>
                <label className="label">Card holder</label>
                <input className="input" value={payment.card_name} onChange={(e) => setPayment((v) => ({ ...v, card_name: e.target.value }))} />
                <label className="label">Last 4 digits</label>
                <input className="input" maxLength={4} value={payment.card_last4} onChange={(e) => setPayment((v) => ({ ...v, card_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
              </>
            ) : null}
            <div className="actions-row">
              <button className="button button-soft" onClick={() => setStep(2)}>Back</button>
              <button className="button" onClick={payNow} disabled={loading}>{loading ? 'Processing...' : 'Confirm payment'}</button>
            </div>
          </div>
        ) : null}

        {error ? <p style={{ color: '#b91c1c', fontWeight: 700 }}>{error}</p> : null}
      </section>

      {result ? (
        <section className="card">
          <h2>Thank you ❤️ You made an impact!</h2>
          <p className="muted">Order #{result.order_id} • Impact: {result.impact_people_count} people</p>
          <p className="muted">Badge update: Helper unlocked.</p>
          <div className="actions-row">
            <a className="button button-soft" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just made an impact on Smart Solidarity Marketplace!')}`} target="_blank" rel="noreferrer">Share</a>
            <a className="button button-soft" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://amena-impact.local')}`} target="_blank" rel="noreferrer">Share on Facebook</a>
            <Link className="button" href="/orders">Track Order</Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
