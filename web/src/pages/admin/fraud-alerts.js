import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import { getStoredAuth } from '../../lib/auth';

export default function AdminFraudAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadAlerts() {
      const auth = getStoredAuth();
      if (!auth?.token) {
        if (mounted) {
          setError('Login as admin to view fraud alerts.');
          setLoading(false);
        }
        return;
      }

      const response = await fetch(apiUrl('/api/marketplace/admin/fraud-alerts?limit=50'), {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();

      if (!mounted) return;

      if (!response.ok) {
        setError(data?.message || 'Unable to load fraud alerts.');
        setLoading(false);
        return;
      }

      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      setError('');
      setLoading(false);
      setLastRefresh(new Date());
    }

    loadAlerts();
    const timer = setInterval(loadAlerts, 15000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="page">
      <section className="card">
        <h1>Fraud Alerts Monitoring</h1>
        <p className="muted">Automated signals from reports, suspicious activity, and trust scoring. Refreshed every 15s.</p>
        <p className="muted">Last refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}</p>
        {error ? <p style={{ color: '#991b1b', fontWeight: 700 }}>{error}</p> : null}
      </section>

      {loading ? <p className="muted">Loading alerts...</p> : null}
      {!loading && !alerts.length ? <section className="card"><p className="muted">No active alerts.</p></section> : null}

      {alerts.map((alert) => (
        <section key={alert.item_id || alert.id} className="card">
          <h3>{alert.item_title || 'Marketplace item'}</h3>
          <div className="actions-row">
            <span className="badge badge-pending">Reports: {alert.reports_count || 0}</span>
            <span className="badge badge-success">Trust score: {alert.trust_score || 0}</span>
            <span className="badge badge-pending">Suspicious orders: {alert.recent_suspicious_orders || 0}</span>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            Triggered by repeated reports or unusual checkout patterns. Review and decide: monitor, suspend, or investigate.
          </p>
          <div className="actions-row">
            <button className="button button-soft" type="button">Mark as reviewed</button>
            <button className="button button-soft" type="button">Open incident</button>
          </div>
        </section>
      ))}
    </main>
  );
}
