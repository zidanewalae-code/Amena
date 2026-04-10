import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';
import { getStoredAuth } from '../lib/auth';

const labels = {
  purchased: 'Purchased ✅',
  picked_up: 'Picked up 🚚',
  delivered_to_association: 'Delivered to association 🏢',
  given_to_beneficiary: 'Given to beneficiary ❤️'
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const auth = getStoredAuth();
      if (!auth?.token) {
        if (mounted) setLoading(false);
        return;
      }
      const response = await fetch(apiUrl('/api/marketplace/orders/my'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      if (!mounted) return;
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
      setLastRefresh(new Date());
    }

    load();
    const timer = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="page">
      <h1>Order Tracking</h1>
      <p className="muted">Real-time updates every 15 seconds. Last refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}</p>
      {loading ? <p className="muted">Loading orders...</p> : null}
      {!loading && !orders.length ? <div className="card"><p className="muted">No orders yet.</p></div> : null}
      {orders.map((order) => {
        const progress = ((order.timeline || []).filter((step) => step.done).length / 4) * 100;
        return (
          <article key={order.id} className="card">
            <h3>Order #{order.id}</h3>
            <p className="muted">Total: {Number(order.total_amount || 0).toFixed(2)} TND</p>
            <div className="card compact" style={{ marginTop: 6 }}>
              <div style={{ height: 10, background: '#dbe5e5', borderRadius: 999 }}>
                <div style={{ width: `${progress}%`, height: 10, background: '#0f766e', borderRadius: 999 }} />
              </div>
            </div>
            <ul className="timeline">
              {(order.timeline || []).map((step) => (
                <li key={step.key} className={step.done ? 'timeline-done' : ''} style={{ opacity: step.done ? 1 : 0.65 }}>
                  {labels[step.key]} {step.done ? '' : '⏳'}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </main>
  );
}
