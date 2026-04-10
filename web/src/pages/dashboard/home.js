import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';
import { getStoredAuth } from '../../lib/auth';
import StatCard from '../../components/ui/StatCard';

function actionsForRole(role) {
  if (role === 'courier') {
    return [
      { href: '/dashboard/delivery', label: 'Accept Delivery' },
      { href: '/orders', label: 'Track Missions' }
    ];
  }
  if (role === 'company') {
    return [
      { href: '/dashboard/company', label: 'Upload Contribution' },
      { href: '/dashboard/company', label: 'Track Beneficiaries' }
    ];
  }
  if (role === 'organization') {
    return [
      { href: '/dashboard/association', label: 'Manage Cases' },
      { href: '/dashboard/association', label: 'Publish Updates' }
    ];
  }
  if (role === 'admin') {
    return [
      { href: '/dashboard/admin', label: 'Open Admin Dashboard' },
      { href: '/admin/fraud-alerts', label: 'Review Fraud Alerts' }
    ];
  }
  return [
    { href: '/my-items/new', label: 'Add Item' },
    { href: '/marketplace', label: 'Browse Marketplace' }
  ];
}

export default function HomeDashboardPage() {
  const [auth, setAuth] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    const state = getStoredAuth();
    setAuth(state || null);
  }, []);

  useEffect(() => {
    async function load() {
      const token = auth?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [recoRes, impactRes] = await Promise.all([
        token
          ? fetch(apiUrl('/api/marketplace/recommendations?limit=6'), { headers })
          : fetch(apiUrl('/api/marketplace/items?recommended=true&limit=6')),
        token
          ? fetch(apiUrl('/api/marketplace/impact/me'), { headers })
          : Promise.resolve({ ok: true, json: async () => null })
      ]);
      const [recoData, impactData] = await Promise.all([recoRes.json(), impactRes.json()]);
      setRecommendations(Array.isArray(recoData.items) ? recoData.items : []);
      setImpact(impactData || null);
    }
    if (auth) load();
  }, [auth]);

  const stats = useMemo(() => {
    return {
      donated: impact?.items_donated || 0,
      bought: impact?.items_bought || 0,
      totalImpact: impact?.total_impact || 0,
      impactScore: impact?.impact_score || 0,
      badges: impact?.badges || ['Rising Impact']
    };
  }, [impact]);

  const quickActions = actionsForRole(auth?.user?.role);

  return (
    <main className="page">
      <section className="card hero">
        <p className="kicker">Smart Home Dashboard</p>
        <h1>Welcome back, {auth?.user?.full_name || 'Friend'} 👋</h1>
        <p className="muted">Your actions in the marketplace directly support families in need.</p>
        <div className="actions-row">
          {quickActions.map((entry, index) => (
            <Link key={entry.href + entry.label} className={index === 0 ? 'button' : 'button button-soft'} href={entry.href}>{entry.label}</Link>
          ))}
        </div>
      </section>

      <section className="grid-2">
        <StatCard label="Items Donated" value={stats.donated} />
        <StatCard label="Items Bought" value={stats.bought} />
        <StatCard label="Total Impact" value={`${stats.totalImpact} people`} />
        <StatCard label="Impact Score" value={stats.impactScore} hint={stats.badges.join(', ')} />
      </section>

      <section className="card">
        <h2>Smart recommendations</h2>
        <div className="actions-row" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {recommendations.map((item) => (
            <article key={item.id} className="card compact" style={{ minWidth: 250 }}>
              <h3>{item.title}</h3>
              <p className="muted">{item.category} • {item.size || 'N/A'}</p>
              <p>{Number(item.price || 0).toFixed(2)} TND</p>
              <Link className="button button-soft" href={`/marketplace/${item.id}`}>View item</Link>
            </article>
          ))}
          {!recommendations.length ? <p className="muted">No recommendations yet.</p> : null}
        </div>
      </section>

      <section className="card">
        <h2>Badges and impact score</h2>
        <div className="actions-row">
          {stats.badges.map((badge) => (
            <span key={badge} className="badge badge-success">{badge}</span>
          ))}
          <span className="badge badge-pending">Impact score: {stats.impactScore}</span>
        </div>
      </section>
    </main>
  );
}
