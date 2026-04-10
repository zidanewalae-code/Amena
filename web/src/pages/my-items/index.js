import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';
import { getStoredAuth } from '../../lib/auth';
import Toast from '../../components/Toast';

function statusLabel(status) {
  if (status === 'sold') return 'Sold';
  if (status === 'delivered') return 'Delivered';
  return 'Pending';
}

export default function MyItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    async function load() {
      const auth = getStoredAuth();
      if (!auth?.token) {
        setLoading(false);
        return;
      }
      const response = await fetch(apiUrl('/api/marketplace/my-items'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, []);

  function removeItem(itemId) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setToast({ message: 'Item removed from your list.', type: 'success' });
  }

  return (
    <main className="page">
      <div className="actions-row" style={{ justifyContent: 'space-between' }}>
        <h1>My Items</h1>
        <Link className="button" href="/my-items/new">Add Item</Link>
      </div>

      {loading ? <p className="muted">Loading items...</p> : null}
      {!loading && !items.length ? <div className="card"><p className="muted">No items yet.</p></div> : null}

      {items.length ? (
        <section className="card table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Views</th>
                <th>Impact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td><span className={item.status === 'sold' ? 'badge badge-success' : 'badge badge-pending'}>{statusLabel(item.status)}</span></td>
                  <td>{item.views_count || 0}</td>
                  <td>Helped about {item.impact_people || 0} people</td>
                  <td>
                    <div className="actions-row">
                      <Link className="button button-soft" href={`/marketplace/${item.id}`}>Edit</Link>
                      <button className="button button-soft" onClick={() => removeItem(item.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
