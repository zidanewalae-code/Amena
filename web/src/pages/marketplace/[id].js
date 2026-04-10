import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';
import { addToCart } from '../../lib/cart';
import { getStoredAuth } from '../../lib/auth';
import Toast from '../../components/Toast';

export default function ItemDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    async function loadItem() {
      if (!id) return;
      const response = await fetch(apiUrl(`/api/marketplace/items/${id}`));
      const data = await response.json();
      setItem(data);
    }
    loadItem();
  }, [id]);

  async function reportItem() {
    const auth = getStoredAuth();
    if (!auth?.token) {
      setToast({ message: 'Please login to report', type: 'error' });
      return;
    }

    const response = await fetch(apiUrl(`/api/marketplace/items/${id}/report`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ reason: 'Potential suspicious listing' })
    });

    setToast({ message: response.ok ? 'Report submitted' : 'Report failed', type: response.ok ? 'success' : 'error' });
  }

  if (!item) {
    return <main className="page"><p className="muted">Loading item...</p></main>;
  }

  return (
    <main className="page">
      <article className="card">
        <div className="item-thumb" style={{ minHeight: 220, marginBottom: 12 }} aria-hidden="true">
          {item.category || 'Solidarity item image'}
        </div>
        <h1>{item.title}</h1>
        <p className="muted">{item.category} • size {item.size || 'N/A'} • condition {item.condition}</p>
        <p>{item.description}</p>
        <p><strong>{item.is_free ? 'Free' : `${Number(item.price || 0).toFixed(2)} TND`}</strong></p>
        <p className="muted">Seller trust score: {item.transparency?.trust_score ?? item.trust_score ?? 80}/100</p>
        <p className="muted">Association: {item.transparency?.association_name || item.association_name || 'Verified local association'}</p>
        <p className="muted">Transparency: allocation and beneficiary updates are visible in the order timeline.</p>

        <div className="card compact" style={{ marginTop: 10 }}>
          <strong>Impact</strong>
          <p className="muted">{item.impact_message || 'Buying this helps a family in need.'}</p>
        </div>

        <div className="actions-row">
          <button className="button" onClick={() => { addToCart(item); setToast({ message: 'Added to cart', type: 'success' }); }}>Add to cart</button>
          <Link className="button button-soft" href="/marketplace/cart">Go to cart</Link>
          <button className="button button-soft" onClick={reportItem}>Report</button>
        </div>
      </article>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
