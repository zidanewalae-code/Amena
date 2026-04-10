// Admin dashboard: users, products, beneficiaries, transactions, assignments, KPIs, monitoring.
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth, saveToken } from '../../lib/auth';
import StatCard from '../../components/ui/StatCard';
import SimpleTable from '../../components/ui/SimpleTable';
import StatusBadge from '../../components/ui/StatusBadge';

export default function AdminDashboardPage() {
  const [token, setToken] = useState('');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [paymentMetrics, setPaymentMetrics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
    const headers = { Authorization: `Bearer ${token}` };
    const commonQuery = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) commonQuery.set('status', statusFilter);
    const [uRes, pRes, bRes, dRes, oRes, aRes, kRes, pmRes, mRes, hRes] = await Promise.all([
      fetch(apiUrl('/api/users'), { headers }),
      fetch(apiUrl('/api/solidarity/products?page=1&limit=100'), { headers }),
      fetch(apiUrl('/api/solidarity/beneficiaries'), { headers }),
      fetch(apiUrl(`/api/solidarity/donations?${commonQuery.toString()}`), { headers }),
      fetch(apiUrl(`/api/solidarity/orders/my?${commonQuery.toString()}`), { headers }),
      fetch(apiUrl('/api/solidarity/assignments'), { headers }),
      fetch(apiUrl('/api/solidarity/kpis'), { headers }),
      fetch(apiUrl('/api/admin/metrics'), { headers }),
      fetch(apiUrl('/api/monitoring/webhooks'), { headers }),
      fetch(apiUrl('/api/monitoring/heartbeat'), { headers })
    ]);

    const [uData, pData, bData, dData, oData, aData, kData, pmData, mData, hData] = await Promise.all([
      uRes.json(), pRes.json(), bRes.json(), dRes.json(), oRes.json(), aRes.json(), kRes.json(), pmRes.json(), mRes.json(), hRes.json()
    ]);

    setUsers(Array.isArray(uData) ? uData : []);
    setProducts(Array.isArray(pData) ? pData : []);
    setBeneficiaries(Array.isArray(bData) ? bData : []);
    setDonations(Array.isArray(dData?.items) ? dData.items : []);
    setOrders(Array.isArray(oData?.items) ? oData.items : []);
    setAssignments(Array.isArray(aData) ? aData : []);
    setKpis(kData || null);
    setPaymentMetrics(pmData || null);
    setMonitoring(mData || null);
    setHeartbeat(hData || null);
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
    const timer = setInterval(loadAll, 20000);
    return () => clearInterval(timer);
  }, [token, page, limit, statusFilter]);

  return (
    <main className="page">
      <h1>Admin Dashboard</h1>
      <div className="card">
        <label className="label">JWT token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <div className="actions-row">
          <select className="select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">all statuses</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
          </select>
          <button className="button" onClick={loadAll}>Refresh all sections</button>
        </div>
      </div>

      <div className="grid-2">
        <StatCard label="Total donations (solidarity)" value={kpis?.totals?.total_donations_amount || 0} />
        <StatCard label="Total orders (solidarity)" value={kpis?.totals?.orders_count || 0} />
      </div>
      <div className="grid-2">
        <StatCard label="Payment failure rate" value={`${paymentMetrics?.totals?.failure_rate_percent || 0}%`} />
        <StatCard label="Pending without webhook >10m" value={paymentMetrics?.alerts?.pending_without_webhook_over_10m || 0} />
      </div>

      <SimpleTable
        columns={[
          { key: 'id', label: 'User ID' },
          { key: 'full_name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'is_active', label: 'Active', render: (u) => (u.is_active ? 'yes' : 'no') }
        ]}
        rows={users}
        emptyText="No users."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Product ID' },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price' },
          { key: 'stock', label: 'Stock' }
        ]}
        rows={products}
        emptyText="No products."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Beneficiary ID' },
          { key: 'name', label: 'Name' },
          { key: 'need', label: 'Need' },
          { key: 'description', label: 'Description' }
        ]}
        rows={beneficiaries}
        emptyText="No beneficiaries."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Donation ID' },
          { key: 'amount', label: 'Amount' },
          { key: 'status', label: 'Status', render: (d) => <StatusBadge status={d.status} /> }
        ]}
        rows={donations}
        emptyText="No donations."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Order ID' },
          { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
          { key: 'user_id', label: 'User ID' }
        ]}
        rows={orders}
        emptyText="No orders."
      />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Assignment ID' },
          { key: 'type', label: 'Type' },
          { key: 'beneficiary', label: 'Beneficiary', render: (a) => a.beneficiary?.name || '-' },
          { key: 'target', label: 'Target', render: (a) => (a.type === 'donation' ? `donation #${a.donation_id}` : `order #${a.order_id}`) }
        ]}
        rows={assignments}
        emptyText="No assignments."
      />

      <div className="card">
        <h3>Monitoring and alerts</h3>
        <p className="muted">Webhook delayed orders: {monitoring?.delayed_orders_count ?? '-'}</p>
        <p className="muted">Heartbeat issue type: <StatusBadge status={heartbeat?.issue_type || 'pending'} /></p>
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
    </main>
  );
}
