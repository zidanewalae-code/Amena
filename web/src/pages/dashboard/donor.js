// Donor dashboard: donations, orders, notifications, and quick actions.
import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth, saveToken } from '../../lib/auth';
import StatCard from '../../components/ui/StatCard';
import SimpleTable from '../../components/ui/SimpleTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Toast from '../../components/Toast';

export default function DonorDashboardPage() {
  const [token, setToken] = useState('');
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [amount, setAmount] = useState('50');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) setToken(auth.token);
  }, []);

  function onTokenChange(value) {
    setToken(value);
    saveToken(value);
  }

  async function loadAll() {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) query.set('status', statusFilter);

    const [dRes, oRes, tRes, nRes] = await Promise.all([
      fetch(apiUrl(`/api/solidarity/donations/my?${query.toString()}`), { headers }),
      fetch(apiUrl(`/api/solidarity/orders/my?${query.toString()}`), { headers }),
      fetch(apiUrl('/api/solidarity/tracking/my'), { headers }),
      fetch(apiUrl(`/api/solidarity/notifications/my?page=${page}&limit=${limit}`), { headers })
    ]);

    const [dData, oData, tData, nData] = await Promise.all([dRes.json(), oRes.json(), tRes.json(), nRes.json()]);
    setDonations(Array.isArray(dData?.items) ? dData.items : []);
    setOrders(Array.isArray(oData?.items) ? oData.items : []);
    setTracking(Array.isArray(tData) ? tData : []);
    setNotifications(Array.isArray(nData.items) ? nData.items : []);
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
    const timer = setInterval(loadAll, 15000);
    return () => clearInterval(timer);
  }, [token, page, limit, statusFilter]);

  async function makeDonation() {
    const res = await fetch(apiUrl('/api/solidarity/donations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: Number(amount) })
    });

    if (res.ok) {
      setToast({ message: 'Donation created', type: 'success' });
      await loadAll();
    } else {
      setToast({ message: 'Donation failed', type: 'error' });
    }
  }

  const summary = useMemo(() => {
    const totalDonationAmount = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const totalOrders = orders.length;
    return { totalDonationAmount, totalOrders };
  }, [donations, orders]);

  return (
    <main className="page">
      <h1>Donor Dashboard</h1>
      <div className="card">
        <label className="label">JWT token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <div className="actions-row">
          <button className="button" onClick={loadAll}>Refresh</button>
          <select className="select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">all statuses</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
          </select>
          <a className="button button-soft" href="/donations/checkout">Buy a product</a>
          <button className="button button-soft" onClick={() => window.print()}>Download receipt</button>
        </div>
      </div>

      <div className="grid-2">
        <StatCard label="Total donations" value={summary.totalDonationAmount.toFixed(2)} hint="All statuses" />
        <StatCard label="Total orders" value={summary.totalOrders} hint="Your solidarity purchases" />
      </div>

      <div className="card">
        <h3>Quick action: Make donation</h3>
        <div className="actions-row">
          <input className="input" style={{ maxWidth: 220 }} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="button" onClick={makeDonation}>Make a donation</button>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'id', label: 'Donation ID' },
          { key: 'amount', label: 'Amount' },
          { key: 'date', label: 'Date', render: (r) => new Date(r.date || r.created_at).toLocaleString() },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'beneficiary',
            label: 'Beneficiary',
            render: (r) => (r.assignments?.[0]?.beneficiary?.name || '-')
          }
        ]}
        rows={donations}
        emptyText="No donations yet."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Order ID' },
          {
            key: 'products',
            label: 'Products',
            render: (r) => (r.items || []).map((item) => `${item.product?.name || item.product_id} x${item.quantity}`).join(', ')
          },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'beneficiary',
            label: 'Beneficiary',
            render: (r) => (r.assignments?.[0]?.beneficiary?.name || '-')
          }
        ]}
        rows={orders}
        emptyText="No orders yet."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Tracking ID' },
          { key: 'type', label: 'Type' },
          { key: 'beneficiary', label: 'Beneficiary', render: (r) => r.beneficiary?.name || '-' },
          { key: 'need', label: 'Need', render: (r) => r.beneficiary?.need || '-' }
        ]}
        rows={tracking}
        emptyText="No assignments yet."
      />

      <div className="card">
        <h3>Notifications</h3>
        {notifications.length ? notifications.map((n) => (
          <p key={n.id} className="muted">[{n.is_read ? 'read' : 'new'}] {n.title}: {n.body}</p>
        )) : <p className="muted">No notifications.</p>}
        <div className="actions-row">
          <button className="button button-soft" onClick={() => setPage((v) => Math.max(1, v - 1))}>Prev</button>
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
