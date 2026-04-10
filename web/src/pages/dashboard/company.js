// Company dashboard: contributions (money/product), impact tracking, notifications.
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth, saveToken } from '../../lib/auth';
import SimpleTable from '../../components/ui/SimpleTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Toast from '../../components/Toast';

export default function CompanyDashboardPage() {
  const [token, setToken] = useState('');
  const [donations, setDonations] = useState([]);
  const [products, setProducts] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [moneyAmount, setMoneyAmount] = useState('200');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '0', stock: '10' });
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) setToken(auth.token);
  }, []);

  function onTokenChange(value) {
    setToken(value);
    saveToken(value);
  }

  async function loadAll() {
    const headers = { Authorization: `Bearer ${token}` };
    const contributionQuery = new URLSearchParams({ page: String(page), limit: String(limit), type: typeFilter });
    const [dRes, pRes, tRes, nRes] = await Promise.all([
      fetch(apiUrl(`/api/contributions?${contributionQuery.toString()}`), { headers }),
      fetch(apiUrl('/api/solidarity/products?page=1&limit=100'), { headers }),
      fetch(apiUrl('/api/solidarity/tracking/my'), { headers }),
      fetch(apiUrl('/api/solidarity/notifications/my'), { headers })
    ]);

    const [dData, pData, tData, nData] = await Promise.all([dRes.json(), pRes.json(), tRes.json(), nRes.json()]);
    setDonations(Array.isArray(dData?.items) ? dData.items : []);
    setProducts(Array.isArray(pData) ? pData : []);
    setTracking(Array.isArray(tData) ? tData : []);
    setNotifications(Array.isArray(nData.items) ? nData.items : []);
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
    const timer = setInterval(loadAll, 15000);
    return () => clearInterval(timer);
  }, [token, typeFilter, page, limit]);

  async function addMoneyContribution() {
    const response = await fetch(apiUrl('/api/contributions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'money', amount: Number(moneyAmount) })
    });
    setToast({ message: response.ok ? 'Money contribution created' : 'Contribution failed', type: response.ok ? 'success' : 'error' });
    if (response.ok) await loadAll();
  }

  async function addProductContribution() {
    const response = await fetch(apiUrl('/api/contributions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: 'product',
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock)
      })
    });
    setToast({ message: response.ok ? 'Product contribution created' : 'Product contribution failed', type: response.ok ? 'success' : 'error' });
    if (response.ok) await loadAll();
  }

  return (
    <main className="page">
      <h1>Company Dashboard</h1>
      <div className="card">
        <label className="label">JWT token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <div className="actions-row">
          <select className="select" style={{ maxWidth: 180 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">all types</option>
            <option value="money">money</option>
            <option value="product">product</option>
          </select>
          <button className="button" onClick={loadAll}>Refresh</button>
        </div>
      </div>

      <div className="card">
        <h3>Add money contribution</h3>
        <div className="actions-row">
          <input className="input" style={{ maxWidth: 220 }} value={moneyAmount} onChange={(e) => setMoneyAmount(e.target.value)} />
          <button className="button" onClick={addMoneyContribution}>Add donation</button>
        </div>
      </div>

      <div className="card">
        <h3>Add product batch contribution</h3>
        <div className="grid-2">
          <input className="input" placeholder="name" value={productForm.name} onChange={(e) => setProductForm((v) => ({ ...v, name: e.target.value }))} />
          <input className="input" placeholder="description" value={productForm.description} onChange={(e) => setProductForm((v) => ({ ...v, description: e.target.value }))} />
          <input className="input" placeholder="price" value={productForm.price} onChange={(e) => setProductForm((v) => ({ ...v, price: e.target.value }))} />
          <input className="input" placeholder="stock" value={productForm.stock} onChange={(e) => setProductForm((v) => ({ ...v, stock: e.target.value }))} />
        </div>
        <button className="button" onClick={addProductContribution}>Add product</button>
      </div>

      <SimpleTable
        columns={[
          { key: 'id', label: 'Contribution ID', sortable: false },
          { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date || r.created_at).toLocaleString() },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> }
        ]}
        rows={donations}
        emptyText="No money contributions."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Product ID' },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price' },
          { key: 'stock', label: 'Stock' }
        ]}
        rows={products}
        emptyText="No product contributions."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Assignment ID' },
          { key: 'type', label: 'Type' },
          { key: 'beneficiary', label: 'Beneficiary', render: (r) => r.beneficiary?.name || '-' }
        ]}
        rows={tracking}
        emptyText="No beneficiary impact yet."
      />

      <div className="card">
        <h3>Notifications</h3>
        {notifications.length ? notifications.map((n) => (
          <p key={n.id} className="muted">{n.title} - {n.body}</p>
        )) : <p className="muted">No notifications.</p>}
      </div>

      <div className="card compact">
        <div className="actions-row">
          <button className="button button-soft" onClick={() => setPage((v) => Math.max(1, v - 1))}>Prev</button>
          <span>Page {page}</span>
          <button className="button button-soft" onClick={() => setPage((v) => v + 1)}>Next</button>
          <select className="select" style={{ maxWidth: 120 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
