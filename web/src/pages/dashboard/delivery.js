// Delivery dashboard for couriers: assigned missions, status updates, history pagination.
import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth, saveToken } from '../../lib/auth';
import StatCard from '../../components/ui/StatCard';
import SimpleTable from '../../components/ui/SimpleTable';
import StatusBadge from '../../components/ui/StatusBadge';

export default function DeliveryDashboardPage() {
  const [token, setToken] = useState('');
  const [missions, setMissions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) setToken(auth.token);
  }, []);

  function onTokenChange(value) {
    setToken(value);
    saveToken(value);
  }

  async function loadMissions() {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    const response = await fetch(`${apiUrl('/api/deliveries')}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setMissions(Array.isArray(data) ? data : []);
  }

  async function updateStatus(missionId, status) {
    await fetch(apiUrl(`/api/deliveries/${missionId}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, event_note: `Updated from delivery dashboard (${status})` })
    });
    await loadMissions();
  }

  useEffect(() => {
    if (!token) return;
    loadMissions();
    const timer = setInterval(loadMissions, 15000);
    return () => clearInterval(timer);
  }, [token, filterStatus]);

  const paged = useMemo(() => {
    const start = (page - 1) * limit;
    return missions.slice(start, start + limit);
  }, [missions, page, limit]);

  const stats = useMemo(() => ({
    assigned: missions.filter((m) => m.status === 'assigned').length,
    inProgress: missions.filter((m) => m.status === 'in_progress').length,
    delivered: missions.filter((m) => m.status === 'delivered').length
  }), [missions]);

  return (
    <main className="page">
      <h1>Delivery Agent Dashboard</h1>
      <div className="card">
        <label className="label">JWT token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <div className="actions-row">
          <select className="select" style={{ maxWidth: 180 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">all statuses</option>
            <option value="assigned">assigned</option>
            <option value="in_progress">in_progress</option>
            <option value="delivered">delivered</option>
            <option value="failed">failed</option>
          </select>
          <button className="button" onClick={loadMissions}>Refresh missions</button>
        </div>
      </div>

      <div className="grid-2">
        <StatCard label="Assigned" value={stats.assigned} />
        <StatCard label="In progress" value={stats.inProgress} />
      </div>
      <StatCard label="Delivered" value={stats.delivered} />

      <SimpleTable
        columns={[
          { key: 'id', label: 'Mission ID' },
          { key: 'order', label: 'Order', render: (m) => m.donation_order_id || '-' },
          {
            key: 'products',
            label: 'Products/Need',
            render: (m) => m.need?.title || '-'
          },
          { key: 'beneficiary', label: 'Beneficiary address', render: (m) => m.dropoff_address || '-' },
          { key: 'contact', label: 'Contact', render: (m) => m.courier?.phone || '-' },
          { key: 'status', label: 'Status', render: (m) => <StatusBadge status={m.status} /> }
        ]}
        rows={paged}
        renderActions={(m) => (
          <div className="actions-row">
            <button className="button button-soft" onClick={() => updateStatus(m.id, 'in_progress')}>Mark picked up</button>
            <button className="button" onClick={() => updateStatus(m.id, 'delivered')}>Mark delivered</button>
          </div>
        )}
        emptyText="No missions assigned."
      />

      <div className="card compact">
        <div className="actions-row">
          <button className="button button-soft" onClick={() => setPage((v) => Math.max(1, v - 1))}>Prev</button>
          <span>Page {page}</span>
          <button className="button button-soft" onClick={() => setPage((v) => v + 1)}>Next</button>
          <select className="select" style={{ maxWidth: 120 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={12}>12</option>
          </select>
        </div>
      </div>
    </main>
  );
}
