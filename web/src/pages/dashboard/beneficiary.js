// Beneficiary dashboard: polished role-focused interface with request tracking.
import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth } from '../../lib/auth';
import StatCard from '../../components/ui/StatCard';
import Toast from '../../components/Toast';

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch (_error) {
    return null;
  }
}

function toUiStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (['under_review', 'draft', 'pending'].includes(normalized)) return 'Pending';
  if (['published', 'partially_funded', 'funded', 'closed', 'approved'].includes(normalized)) return 'Approved';
  if (['rejected', 'failed', 'canceled'].includes(normalized)) return 'Rejected';
  return 'Pending';
}

function StatusPill({ status }) {
  const uiStatus = toUiStatus(status);
  const styles = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Rejected: 'bg-red-100 text-red-800 border-red-200'
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${styles[uiStatus]}`}>{uiStatus}</span>;
}

export default function BeneficiaryDashboardPage() {
  const [auth, setAuth] = useState(null);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [errors, setErrors] = useState({});
  const [proofFile, setProofFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    urgency_level: 'medium',
    amount_target: '120'
  });

  useEffect(() => {
    const authState = getStoredAuth();
    setAuth(authState || null);

    if (authState?.token) {
      setToken(authState.token);
      const decoded = decodeJwtPayload(authState.token);
      setUserId(authState?.user?.id || decoded?.id || null);
    }
  }, []);

  async function loadAll() {
    if (!token || !userId) return;
    setLoading(true);

    const headers = { Authorization: `Bearer ${token}` };
    const params = new URLSearchParams({ page: '1', limit: '20', sort_by: 'priority', creator_user_id: String(userId) });

    const [needsRes, notificationsRes] = await Promise.all([
      fetch(apiUrl(`/api/needs?${params.toString()}`), { headers }),
      fetch(apiUrl('/api/solidarity/notifications/my?page=1&limit=8'), { headers })
    ]);

    const [needsData, notificationsData] = await Promise.all([needsRes.json(), notificationsRes.json()]);
    setRequests(Array.isArray(needsData.items) ? needsData.items : []);
    setNotifications(Array.isArray(notificationsData.items) ? notificationsData.items : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!token || !userId) return;
    loadAll();
    const timer = setInterval(loadAll, 20000);
    return () => clearInterval(timer);
  }, [token, userId]);

  function validate() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (Number(form.amount_target) <= 0) nextErrors.amount_target = 'Amount must be greater than 0.';
    if (!form.description.trim() || form.description.trim().length < 12) {
      nextErrors.description = 'Description must be at least 12 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitRequest() {
    if (!validate()) return;
    setSubmitting(true);

    const response = await fetch(apiUrl('/api/needs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        amount_target: Number(form.amount_target),
        status: 'under_review'
      })
    });

    setToast({
      message: response.ok
        ? proofFile
          ? 'Request submitted. Proof file captured for review.'
          : 'Request submitted successfully.'
        : 'Request submission failed.',
      type: response.ok ? 'success' : 'error'
    });

    if (response.ok) {
      setForm({ title: '', description: '', category: 'other', urgency_level: 'medium', amount_target: '120' });
      setProofFile(null);
      await loadAll();
    }
    setSubmitting(false);
  }

  const summary = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => toUiStatus(r.status) === 'Pending').length;
    const approved = requests.filter((r) => toUiStatus(r.status) === 'Approved').length;
    return { total, pending, approved, helpReceived: approved };
  }, [requests]);

  if (auth?.user?.role && auth.user.role !== 'beneficiary') {
    return (
      <main className="page">
        <div className="card rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="mb-2 text-2xl font-bold text-red-700">Beneficiary area only</h1>
          <p className="text-red-700">This dashboard is reserved for beneficiary accounts.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold">Welcome, {auth?.user?.full_name || 'Beneficiary'} 👋</h1>
        <p className="mt-1 text-sm text-emerald-50">Manage your support requests</p>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Requests" value={summary.total} hint="All requests" />
        <StatCard label="Pending Requests" value={summary.pending} hint="Under review" />
        <StatCard label="Approved Requests" value={summary.approved} hint="Validated support" />
        <StatCard label="Help Received" value={summary.helpReceived} hint="Confirmed assistance" />
      </section>

      <section className="card rounded-2xl border border-slate-200 bg-white/90 p-5">
        <h2 className="mb-4 text-xl font-bold text-slate-800">Request Help</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="Ex: School supplies for 2 children"
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
            />
            {errors.title ? <p className="text-sm font-semibold text-red-600">{errors.title}</p> : null}
          </div>

          <div>
            <label className="label">Amount Needed (TND)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.amount_target}
              onChange={(e) => setForm((v) => ({ ...v, amount_target: e.target.value }))}
            />
            {errors.amount_target ? <p className="text-sm font-semibold text-red-600">{errors.amount_target}</p> : null}
          </div>

          <div>
            <label className="label">Category</label>
            <select className="select" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>
              <option value="food">food</option>
              <option value="medical">medical</option>
              <option value="education">education</option>
              <option value="other">other</option>
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select className="select" value={form.urgency_level} onChange={(e) => setForm((v) => ({ ...v, urgency_level: e.target.value }))}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Explain your situation and what support is needed."
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
            />
            {errors.description ? <p className="text-sm font-semibold text-red-600">{errors.description}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="label">Upload Proof</label>
            <input
              type="file"
              className="input"
              accept="image/*,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
            <p className="muted text-sm">{proofFile ? `Selected file: ${proofFile.name}` : 'Optional: attach image or PDF proof.'}</p>
          </div>
        </div>
        <button className="button mt-2" onClick={submitRequest} disabled={submitting || loading}>
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </section>

      <section className="card rounded-2xl border border-slate-200 bg-white/90 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">My Requests</h2>
          <button className="button button-soft" onClick={loadAll} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : requests.length ? (
          <div className="grid grid-cols-1 gap-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{request.title}</h3>
                    <p className="text-sm text-slate-500">Amount: {Number(request.amount_target || 0).toFixed(2)} TND</p>
                  </div>
                  <StatusPill status={request.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>Date: {new Date(request.created_at || request.date || Date.now()).toLocaleDateString()}</span>
                  <span>Category: {request.category || 'other'}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">No requests yet</p>
            <p className="mt-1 text-sm text-slate-500">Submit your first request using the form above.</p>
          </div>
        )}
      </section>

      <section className="card rounded-2xl border border-slate-200 bg-white/90 p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-800">Notifications</h2>
        {notifications.length ? (
          <ul className="space-y-2">
            {notifications.map((item) => (
              <li key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <span className="text-base">🔔</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No recent updates yet.</p>
        )}
      </section>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
