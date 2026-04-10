// Association dashboard: manage cases, publish updates, monitor received support.
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth, saveToken } from '../../lib/auth';
import SimpleTable from '../../components/ui/SimpleTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Toast from '../../components/Toast';

export default function AssociationDashboardPage() {
  const [token, setToken] = useState('');
  const [cases, setCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'food',
    urgency_level: 'medium',
    amount_target: '200'
  });

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
    const [needsRes, notificationsRes] = await Promise.all([
      fetch(apiUrl('/api/needs?page=1&limit=20&sort_by=priority'), { headers }),
      fetch(apiUrl('/api/solidarity/notifications/my?page=1&limit=8'), { headers })
    ]);

    const [needsData, notificationsData] = await Promise.all([needsRes.json(), notificationsRes.json()]);
    setCases(Array.isArray(needsData.items) ? needsData.items : []);
    setNotifications(Array.isArray(notificationsData.items) ? notificationsData.items : []);
  }

  useEffect(() => {
    if (!token) return;
    loadAll();
    const timer = setInterval(loadAll, 20000);
    return () => clearInterval(timer);
  }, [token]);

  async function submitCase() {
    const response = await fetch(apiUrl('/api/needs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        amount_target: Number(form.amount_target),
        status: 'under_review'
      })
    });

    if (!response.ok) {
      setToast({ message: 'Case creation failed', type: 'error' });
      return;
    }

    setToast({ message: 'Case submitted for review', type: 'success' });
    setForm({ title: '', description: '', category: 'food', urgency_level: 'medium', amount_target: '200' });
    await loadAll();
  }

  async function publishCase(needId) {
    const response = await fetch(apiUrl(`/api/needs/${needId}/status`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'published' })
    });

    setToast({ message: response.ok ? 'Case published' : 'Publish failed', type: response.ok ? 'success' : 'error' });
    if (response.ok) await loadAll();
  }

  async function addProgressUpdate(needId) {
    const response = await fetch(apiUrl(`/api/needs/${needId}/updates`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ update_text: 'Association progress update: delivery phase started.' })
    });

    setToast({ message: response.ok ? 'Progress update added' : 'Update failed', type: response.ok ? 'success' : 'error' });
    if (response.ok) await loadAll();
  }

  return (
    <main className="page">
      <h1>Association Dashboard</h1>
      <div className="card">
        <label className="label">JWT token</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />
        <button className="button" onClick={loadAll}>Refresh</button>
      </div>

      <div className="card">
        <h3>Create new case</h3>
        <div className="grid-2">
          <input className="input" placeholder="title" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          <input className="input" placeholder="target amount" value={form.amount_target} onChange={(e) => setForm((v) => ({ ...v, amount_target: e.target.value }))} />
          <select className="select" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>
            <option value="food">food</option>
            <option value="medical">medical</option>
            <option value="education">education</option>
            <option value="housing">housing</option>
            <option value="emergency">emergency</option>
          </select>
          <select className="select" value={form.urgency_level} onChange={(e) => setForm((v) => ({ ...v, urgency_level: e.target.value }))}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <textarea className="textarea" rows={3} placeholder="description" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
        <button className="button" onClick={submitCase}>Submit case</button>
      </div>

      <SimpleTable
        columns={[
          { key: 'id', label: 'Case ID' },
          { key: 'title', label: 'Title' },
          { key: 'urgency_level', label: 'Urgency' },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'priority_score', label: 'Priority score' },
          { key: 'transparency_score', label: 'Transparency score' }
        ]}
        rows={cases}
        renderActions={(row) => (
          <div className="actions-row">
            <button className="button button-soft" onClick={() => publishCase(row.id)}>Publish</button>
            <button className="button" onClick={() => addProgressUpdate(row.id)}>Add update</button>
          </div>
        )}
        emptyText="No cases yet."
      />

      <div className="card">
        <h3>Notifications</h3>
        {notifications.length ? notifications.map((n) => (
          <p key={n.id} className="muted">{n.title}: {n.body}</p>
        )) : <p className="muted">No notifications.</p>}
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
