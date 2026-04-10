// Admin payment dashboard with filters, KPIs, incidents, and export actions.
import { useEffect, useState } from 'react';
import { t } from '../../lib/i18n';
import { formatMoney } from '../../lib/currency';
import { apiUrl } from '../../lib/api';
import { getStoredAuth, saveToken } from '../../lib/auth';

export default function AdminPaymentsDashboard() {
  const [token, setToken] = useState('');
  const [lang, setLang] = useState('fr');
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    provider: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) setToken(auth.token);
  }, []);

  function onTokenChange(value) {
    setToken(value);
    saveToken(value);
  }

  async function loadTransactions() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const response = await fetch(`${apiUrl('/api/admin/payments')}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setTransactions(Array.isArray(data.items) ? data.items : []);
  }

  async function loadMetrics() {
    const response = await fetch(apiUrl('/api/admin/metrics'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setMetrics(data);
  }

  async function loadMonitoring() {
    const response = await fetch(apiUrl('/api/monitoring/webhooks'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setMonitoring(data);
  }

  async function loadHeartbeat() {
    const response = await fetch(apiUrl('/api/monitoring/heartbeat'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setHeartbeat(data);
  }

  async function cancelOrder(orderId) {
    await fetch(apiUrl(`/api/admin/orders/${orderId}/cancel`), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    await loadTransactions();
    await loadMetrics();
  }

  async function markIncident(transactionId) {
    await fetch(apiUrl(`/api/admin/transactions/${transactionId}/incident`), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_note: 'Flagged from admin dashboard' })
    });
    await loadTransactions();
  }

  function exportFile(format) {
    const params = new URLSearchParams({ format });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    window.open(`${apiUrl('/api/admin/transactions/export')}?${params.toString()}`, '_blank');
  }

  return (
    <main className="page">
      <h1>{t(lang, 'adminTitle')}</h1>
      <div className="card">
        <label className="label">{t(lang, 'tokenLabel')}</label>
        <textarea className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />

        <label className="label">Language</label>
        <select className="select" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>

        <div className="grid-2">
          <div>
            <label className="label">Status</label>
            <select className="select" value={filters.status} onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))}>
              <option value="">all</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="failed">failed</option>
              <option value="refunded">refunded</option>
              <option value="canceled">canceled</option>
            </select>
          </div>
          <div>
            <label className="label">Provider</label>
            <input className="input" value={filters.provider} onChange={(e) => setFilters((v) => ({ ...v, provider: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t(lang, 'fromDate')}</label>
            <input type="date" className="input" value={filters.start_date} onChange={(e) => setFilters((v) => ({ ...v, start_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t(lang, 'toDate')}</label>
            <input type="date" className="input" value={filters.end_date} onChange={(e) => setFilters((v) => ({ ...v, end_date: e.target.value }))} />
          </div>
        </div>

        <div className="actions-row">
          <button className="button" onClick={loadTransactions}>{t(lang, 'loadTransactions')}</button>
          <button className="button button-soft" onClick={loadMetrics}>{t(lang, 'kpis')}</button>
          <button className="button button-soft" onClick={loadMonitoring}>Webhook monitoring</button>
          <button className="button button-soft" onClick={loadHeartbeat}>Heartbeat</button>
          <button className="button button-soft" onClick={() => exportFile('csv')}>{t(lang, 'exportCsv')}</button>
          <button className="button button-soft" onClick={() => exportFile('excel')}>{t(lang, 'exportExcel')}</button>
        </div>
      </div>

      {metrics && (
        <div className="card">
          <h3>KPIs</h3>
          <p>Total paid: {formatMoney(metrics.totals?.total_paid_amount || 0, 'TND')}</p>
          <p>Failure rate: {metrics.totals?.failure_rate_percent || 0}%</p>
          <p>Pending without webhook &gt; 10min: {metrics.alerts?.pending_without_webhook_over_10m || 0}</p>
          <h4>Volume by day</h4>
          {(metrics.volume_by_day || []).map((item) => (
            <p key={item.day} className="muted">
              {item.day}: {item.transactions_count} tx / {formatMoney(item.amount_sum, 'TND')}
            </p>
          ))}
          <h4>Amount by currency</h4>
          {(metrics.amount_by_currency || []).map((item) => (
            <p key={item.currency} className="muted">
              {item.currency}: {item.transactions_count} tx / {formatMoney(item.amount_sum, item.currency)}
            </p>
          ))}
          <h4>Provider health KPI</h4>
          {(metrics.provider_health || []).map((item) => (
            <p key={item.provider_name} className="muted">
              {item.provider_name}: {item.transactions_count} tx, failed {item.failed_count}, partial {item.partially_paid_count}, rate {item.failure_rate_percent}%
            </p>
          ))}
          <h4>Realtime 60m</h4>
          <div>
            {(metrics.realtime_series_60m || []).slice(-12).map((item) => (
              <div key={item.minute} style={{ marginBottom: 6 }}>
                <div className="muted">{item.minute} - {item.transactions_count} tx ({item.failed_count} failed)</div>
                <div style={{ background: '#e5edf5', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(Number(item.transactions_count || 0) * 12, 100)}%`,
                      background: '#0f766e',
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monitoring && (
        <div className="card">
          <h3>Webhook Monitoring</h3>
          <p>Environment: {monitoring.environment}</p>
          <p>Threshold: {monitoring.threshold_minutes} min</p>
          <p>Delayed orders: {monitoring.delayed_orders_count}</p>
          {(monitoring.delayed_orders || []).map((row) => (
            <p key={row.order_id} className="muted">
              Order #{row.order_id} ({row.order_status}) - provider {row.provider || '-'} - last webhook {String(row.last_webhook_at || 'none')}
            </p>
          ))}
        </div>
      )}

      {heartbeat && (
        <div className="card">
          <h3>Provider Heartbeat</h3>
          <p>Checked at: {heartbeat.checked_at}</p>
          <p>Issue type: <span className={`badge badge-${heartbeat.issue_type === 'healthy' ? 'paid' : 'failed'}`}>{heartbeat.issue_type}</span></p>
          <p>Delayed orders: {heartbeat.delayed_orders_count}</p>
          {(heartbeat.providers || []).map((provider) => (
            <p key={provider.provider} className="muted">
              {provider.provider}: {provider.available ? 'up' : 'down'} - latency {provider.latency_ms ?? 'n/a'} ms - reason {provider.reason || '-'}
            </p>
          ))}
          {heartbeat.issue_type === 'provider_unavailable' && (
            <p style={{ color: '#991b1b', fontWeight: 600 }}>
              Provider down detected. Alerting is triggered by backend monitoring.
            </p>
          )}
        </div>
      )}

      {transactions.map((tx) => (
        <div className="card" key={tx.id}>
          <h3>Tx #{tx.id}</h3>
          <p>
            Status: <span className={`badge badge-${tx.status}`}>{tx.status}</span> | Provider: {tx.provider_name}
          </p>
          <p>Amount: {formatMoney(tx.amount, tx.currency)}</p>
          <p>Order: {tx.order?.order_reference || '-'} ({tx.order?.status || '-'})</p>
          <p>Donor: {tx.order?.donor?.full_name || '-'}</p>
          <p>Incident: {tx.incident_flag ? 'yes' : 'no'}</p>
          <div className="actions-row">
            <button className="button button-danger" disabled={tx.order?.status !== 'pending'} onClick={() => cancelOrder(tx.donation_order_id)}>
              Cancel pending order
            </button>
            <button className="button button-soft" onClick={() => markIncident(tx.id)}>
              Mark incident
            </button>
          </div>
        </div>
      ))}
      {!transactions.length && <p className="muted">No transactions loaded.</p>}
    </main>
  );
}
