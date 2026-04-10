// Donation cart page supports adding items and triggering checkout.
import { useState } from 'react';
import Link from 'next/link';
import CartItemCard from '../../components/CartItemCard';
import { apiUrl } from '../../lib/api';

export default function CartPage() {
  const [token, setToken] = useState('');
  const [needId, setNeedId] = useState('1');
  const [amount, setAmount] = useState('50');
  const [cart, setCart] = useState(null);
  const [message, setMessage] = useState('');

  async function loadCart() {
    const response = await fetch(apiUrl('/api/donations/cart'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setCart(data);
  }

  async function addItem() {
    const response = await fetch(apiUrl('/api/donations/cart/items'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ need_id: Number(needId), amount: Number(amount) })
    });
    const data = await response.json();
    setMessage(data.message || 'Done');
    await loadCart();
  }

  async function runCheckout() {
    const response = await fetch(apiUrl('/api/donations/checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ provider_name: 'mock', currency: 'TND' })
    });
    const data = await response.json();
    setMessage(data.message || 'Checkout done');
    if (data.order?.id) {
      setMessage(`Checkout cree. Passe a /donations/checkout avec order id ${data.order.id}`);
    }
  }

  async function updateItem(itemId, nextAmount) {
    if (!nextAmount || nextAmount <= 0) return;

    await fetch(apiUrl(`/api/donations/cart/items/${itemId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: nextAmount })
    });

    await loadCart();
  }

  async function removeItem(itemId) {
    await fetch(apiUrl(`/api/donations/cart/items/${itemId}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    await loadCart();
  }

  return (
    <main className="page">
      <h1>Panier et checkout</h1>
      <div className="card">
        <label className="label">JWT Token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => setToken(e.target.value)} />
        <button className="button" onClick={loadCart}>Charger panier</button>
      </div>

      <div className="card">
        <label className="label">Need ID</label>
        <input className="input" value={needId} onChange={(e) => setNeedId(e.target.value)} />
        <label className="label">Montant</label>
        <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="button" onClick={addItem}>Ajouter au panier</button>
        <button className="button" onClick={runCheckout} style={{ marginLeft: 8 }}>Checkout</button>
        <Link href="/donations/checkout" style={{ marginLeft: 12 }}>Page checkout</Link>
      </div>

      {message && <p className="muted">{message}</p>}
      {cart?.cart?.items?.map((item) => (
        <CartItemCard key={item.id} item={item} onChangeAmount={updateItem} onRemove={removeItem} />
      ))}
      {cart && <pre className="card">{JSON.stringify({ total_amount: cart.total_amount }, null, 2)}</pre>}
    </main>
  );
}
