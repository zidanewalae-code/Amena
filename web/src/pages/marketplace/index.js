import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';
import { addToCart } from '../../lib/cart';
import Toast from '../../components/Toast';

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: '', size: '', category: '', price_max: '', urgency: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  async function loadItems() {
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ limit: '24' });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });

    try {
      const response = await fetch(apiUrl(`/api/marketplace/items?${query.toString()}`));
      const data = await response.json();
      if (!response.ok) {
        setItems([]);
        setError(data?.message || 'Unable to load marketplace items.');
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (_e) {
      setItems([]);
      setError('Failed to reach backend. Verify API is running on http://localhost:5000.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const recommended = useMemo(() => items.filter((it) => it.urgent_need).slice(0, 4), [items]);

  function onAdd(item) {
    addToCart(item);
    setToast({ message: 'Item added to cart', type: 'success' });
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Marketplace</h1>
        <p className="muted">Discover verified items, urgent needs, and donation opportunities.</p>
        <div className="grid-2">
          <input className="input" placeholder="Search items" value={filters.search} onChange={(e) => setFilters((v) => ({ ...v, search: e.target.value }))} />
          <select className="select" value={filters.category} onChange={(e) => setFilters((v) => ({ ...v, category: e.target.value }))}>
            <option value="">All categories</option>
            <option value="clothes">clothes</option>
            <option value="shoes">shoes</option>
            <option value="accessories">accessories</option>
            <option value="other">other</option>
          </select>
          <input className="input" placeholder="Size (S, M, L...)" value={filters.size} onChange={(e) => setFilters((v) => ({ ...v, size: e.target.value }))} />
          <input className="input" type="number" placeholder="Max price" value={filters.price_max} onChange={(e) => setFilters((v) => ({ ...v, price_max: e.target.value }))} />
          <select className="select" value={filters.urgency} onChange={(e) => setFilters((v) => ({ ...v, urgency: e.target.value }))}>
            <option value="">All urgency</option>
            <option value="urgent">Urgent only</option>
          </select>
          <button className="button" onClick={loadItems}>Apply Filters</button>
        </div>
      </section>

      <section className="card">
        <h2>Recommended for you</h2>
        <div className="actions-row" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {recommended.map((item) => (
            <article key={item.id} className="card compact item-card" style={{ minWidth: 240 }}>
              <div className="item-thumb" aria-hidden="true">{item.category || 'Solidarity item'}</div>
              <h3>{item.title}</h3>
              <p className="muted">{item.category} • {item.condition}</p>
              <p>{item.is_free ? 'Free' : `${Number(item.price).toFixed(2)} TND`}</p>
              <Link className="button button-soft" href={`/marketplace/${item.id}`}>Open</Link>
            </article>
          ))}
          {!recommended.length ? <p className="muted">No recommendations available yet.</p> : null}
        </div>
      </section>

      <section className="grid-2">
        {loading ? <p className="muted">Loading marketplace...</p> : null}
        {error ? <p style={{ color: '#991b1b', fontWeight: 700 }}>{error}</p> : null}
        {!loading && !items.length ? <p className="muted">No items found.</p> : null}
        {items.map((item) => (
          <article key={item.id} className="card item-card">
            <div className="item-thumb" aria-hidden="true">{item.category || 'Item preview'}</div>
            <h3>{item.title}</h3>
            <p className="muted">Size: {item.size || 'N/A'} • Condition: {item.condition}</p>
            <p>{item.is_free ? 'Free' : `${Number(item.price || 0).toFixed(2)} TND`}</p>
            <div className="actions-row">
              {item.is_donation ? <span className="badge badge-success">Donation</span> : <span className="badge badge-pending">Sale</span>}
              {item.urgent_need ? <span className="badge badge-pending">Urgent Need</span> : null}
            </div>
            <div className="actions-row" style={{ marginTop: 8 }}>
              <Link className="button button-soft" href={`/marketplace/${item.id}`}>Details</Link>
              <button className="button" onClick={() => onAdd(item)}>Add to cart</button>
            </div>
          </article>
        ))}
      </section>

      <div className="actions-row" style={{ marginTop: 16 }}>
        <Link className="button" href="/marketplace/cart">Go to cart</Link>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
