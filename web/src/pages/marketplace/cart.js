import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getCart, removeFromCart, updateCartQty } from '../../lib/cart';

export default function CartPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const total = useMemo(() => items.reduce((sum, row) => sum + Number(row.price || 0) * Number(row.quantity || 1), 0), [items]);
  const impactPeople = useMemo(() => items.reduce((sum, row) => sum + (row.urgent_need ? 2 : 1), 0), [items]);

  return (
    <main className="page">
      <h1>Smart Cart</h1>
      {items.length ? items.map((item) => (
        <article key={item.id} className="card">
          <h3>{item.title}</h3>
          <p className="muted">{item.category} • {item.condition}</p>
          <p>{item.is_free ? 'Free' : `${Number(item.price).toFixed(2)} TND`}</p>
          <p className="muted">Impact from this item: helps about {item.urgent_need ? 2 : 1} people.</p>
          <div className="actions-row">
            <input
              className="input"
              style={{ maxWidth: 120 }}
              type="number"
              min={1}
              value={item.quantity || 1}
              onChange={(e) => setItems(updateCartQty(item.id, Number(e.target.value)))}
            />
            <span className="badge badge-success">Subtotal: {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} TND</span>
            <button className="button button-soft" onClick={() => setItems(removeFromCart(item.id))}>Remove</button>
          </div>
        </article>
      )) : <div className="card"><p className="muted">Your cart is empty.</p></div>}

      <section className="card">
        <h3>Total amount: {total.toFixed(2)} TND</h3>
        <p className="muted">Impact preview: Your purchase will help {impactPeople} people.</p>
        <div className="actions-row">
          <Link className="button" href="/marketplace/checkout">Continue to payment</Link>
          <Link className="button button-soft" href="/marketplace">Back to marketplace</Link>
        </div>
      </section>
    </main>
  );
}
