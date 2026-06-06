import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Layout from '../components/Layout';
import DashboardCard from '../components/DashboardCard';
import StatCard from '../components/StatCard';
import { EmptyState } from '../components/UIStates';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  getDashboardConfig,
  getDashboardSections,
  getDashboardStats,
  getSectionDescription,
  getSectionHint,
  getSectionItemTitle
} from '../lib/access';

const PAGE_SIZE = 3;
const PIE_COLORS = ['#2f6f6d', '#d98e50', '#7b6cf6', '#b34d3d', '#4a8fba', '#7d8c59'];

const ROLE_META = {
  admin: { accent: 'system', label: 'Admin analytics', badge: 'AS' },
  donator: { accent: 'donor', label: 'Personal trail', badge: 'DT' },
  organization: { accent: 'org', label: 'Operations analytics', badge: 'OR' },
  delivery_person: { accent: 'delivery', label: 'Field workflow', badge: 'DL' }
};

const TONE_MAP = {
  users: 'system',
  orders: 'delivery',
  payments: 'finance',
  alerts: 'alert',
  products: 'inventory',
  dons: 'donor',
  history: 'muted'
};

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function getItemDate(item, sectionKey) {
  return (
    item?.date ||
    item?.created_at ||
    item?.updated_at ||
    item?.timestamp ||
    item?.order_date ||
    item?.action_date ||
    item?.[`${sectionKey}_date`] ||
    null
  );
}

function monthKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function buildMonthlySeries(sections, data) {
  const now = new Date();
  const months = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: monthKey(month),
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      value: 0
    });
  }

  const monthIndex = new Map(months.map((entry) => [entry.key, entry]));

  sections.forEach((section) => {
    (data[section.key] || []).forEach((item) => {
      const value = getItemDate(item, section.key);
      if (!value) {
        return;
      }

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }

      const bucket = monthIndex.get(monthKey(parsed));
      if (bucket) {
        bucket.value += 1;
      }
    });
  });

  return months;
}

function buildMix(items, labelResolver) {
  const counters = new Map();

  items.forEach((item) => {
    const label = labelResolver(item) || 'Unspecified';
    counters.set(label, (counters.get(label) || 0) + 1);
  });

  return [...counters.entries()].map(([name, value]) => ({ name, value })).slice(0, 6);
}

function getBadge(sectionKey, item) {
  if (sectionKey === 'alerts') {
    const priority = normalizeText(item?.priority);
    if (priority === 'high') return { label: 'Critical', tone: 'danger' };
    if (priority === 'medium') return { label: 'Medium', tone: 'warning' };
    return { label: priority || 'Open', tone: 'success' };
  }

  if (sectionKey === 'payments') {
    const status = normalizeText(item?.payment_status || item?.status);
    if (status === 'paid' || status === 'completed') return { label: 'Paid', tone: 'success' };
    if (status === 'pending') return { label: 'Pending', tone: 'warning' };
    return { label: status || 'Pending', tone: 'muted' };
  }

  if (sectionKey === 'orders') {
    const status = normalizeText(item?.status);
    if (status === 'delivered' || status === 'completed') return { label: 'Delivered', tone: 'success' };
    if (status === 'assigned' || status === 'in_transit' || status === 'in progress') return { label: 'In progress', tone: 'warning' };
    if (status === 'pending') return { label: 'Pending', tone: 'muted' };
    return { label: status || 'Open', tone: 'muted' };
  }

  if (sectionKey === 'products') {
    const quantity = Number(item?.quantity ?? 0);
    if (quantity <= 5) return { label: 'Low stock', tone: 'danger' };
    if (quantity <= 20) return { label: 'Medium stock', tone: 'warning' };
    return { label: 'Healthy stock', tone: 'success' };
  }

  if (sectionKey === 'dons') {
    const status = normalizeText(item?.status);
    return { label: status || 'Recorded', tone: 'success' };
  }

  if (sectionKey === 'history') {
    return { label: 'Timeline', tone: 'muted' };
  }

  return { label: normalizeText(item?.status) || 'Active', tone: 'muted' };
}

function DashboardNotice({ type = 'info', message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`dashboard-notice ${type}`}>
      <span>{message}</span>
      {onDismiss ? (
        <button className="link-button" type="button" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <section className="grid-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={`sk-${index}`} className="stat-card skeleton-card">
            <div className="skeleton skeleton-badge" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-value" />
            <div className="skeleton skeleton-line short" />
          </article>
        ))}
      </section>

      <section className="grid-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={`chart-sk-${index}`} className="card">
            <div className="card-header">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-button" />
            </div>
            <div className="skeleton skeleton-chart" />
          </article>
        ))}
      </section>
    </>
  );
}

function renderChart(analytics) {
  if (!analytics || !analytics.data.length) {
    return <p className="empty-state">No analytics available yet.</p>;
  }

  if (analytics.kind === 'line') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={analytics.data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={analytics.color} strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (analytics.kind === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Tooltip />
          <Pie data={analytics.data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
            {analytics.data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={analytics.data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[14, 14, 4, 4]} fill={analytics.color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function getRecentItems(data, limit = 3) {
  return ['alerts', 'payments', 'orders']
    .flatMap((key) => (data[key] || []).slice(0, limit).map((item) => ({ key, item })))
    .slice(0, limit * 3);
}

function ActivityCard({ title, items, toneResolver }) {
  return (
    <article className="card activity-card">
      <div className="card-header">
        <div>
          <span className="section-badge">Activity</span>
          <h2>{title}</h2>
          <p>Latest operational items pulled from the current dashboard scope.</p>
        </div>
      </div>

      {items.length ? (
        <div className="list-stack compact">
          {items.map((entry, index) => {
            const badge = getBadge(entry.key, entry.item);

            return (
              <div key={`${entry.key}-${index}`} className="list-row dashboard-row activity-row">
                <div>
                  <div className="row-heading">
                    <strong>{getSectionItemTitle(entry.key, entry.item)}</strong>
                    <span className={`status-chip tone-${badge.tone}`}>{toneResolver ? toneResolver(entry) : badge.label}</span>
                  </div>
                  <p>{getSectionDescription(entry.key)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No recent activity" description="Activity will appear here as new records are created." />
      )}
    </article>
  );
}

function getItemKey(sectionKey, item, index) {
  return `${sectionKey}-${item.product_id || item.don_id || item.order_id || item.payment_id || item.notification_id || item.alert_id || item.history_id || item.category_id || item.email || item.name || item.title || item.message || 'row'}-${index}`;
}

export default function DashboardPage({ role }) {
  return <DashboardContent role={role} />;
}

function DashboardContent({ role }) {
  const { user } = useAuth();
  const config = useMemo(() => getDashboardConfig(role), [role]);
  const sections = useMemo(() => getDashboardSections(role), [role]);
  const stats = useMemo(() => getDashboardStats(role), [role]);
  const modules = useMemo(() => {
    const next = new Map();
    [...stats, ...sections].forEach((section) => {
      if (section?.key) {
        next.set(section.key, section);
      }
    });
    return [...next.values()];
  }, [sections, stats]);

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState({});
  const loadAbortRef = useRef(null);
  const loadVersionRef = useRef(0);

  const loadAll = useCallback(async () => {
    const nextVersion = loadVersionRef.current + 1;
    loadVersionRef.current = nextVersion;

    if (loadAbortRef.current) {
      loadAbortRef.current.abort();
    }

    const controller = new AbortController();
    loadAbortRef.current = controller;

    setLoading(true);
    setNotice(null);

    try {
      const settled = await Promise.allSettled(
        modules.map(async (section) => {
          const response = await api.get(section.endpoint, { signal: controller.signal });
          return [section.key, Array.isArray(response.data) ? response.data : []];
        })
      );

      if (loadVersionRef.current !== nextVersion || controller.signal.aborted) {
        return;
      }

      const nextData = {};
      let hadError = false;

      settled.forEach((result, index) => {
        const section = modules[index];

        if (result.status === 'fulfilled') {
          const [key, value] = result.value;
          nextData[key] = [...value].sort((left, right) => {
            const leftDate = new Date(getItemDate(left, key) || 0).getTime();
            const rightDate = new Date(getItemDate(right, key) || 0).getTime();
            return rightDate - leftDate;
          });
        } else if (section) {
          nextData[section.key] = [];
          hadError = true;
        }
      });

      setData(nextData);
      setNotice({
        type: hadError ? 'warning' : 'success',
        message: hadError
          ? 'Some dashboard data could not be loaded. Showing the available records.'
          : 'Dashboard refreshed with the latest data.'
      });
    } finally {
      if (loadVersionRef.current === nextVersion) {
        setLoading(false);
      }
    }
  }, [modules]);

  useEffect(() => {
    loadAll();
    setPages({});
    setSearch('');
  }, [loadAll, role]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleData = useMemo(() => {
    const next = {};
    const query = normalizeText(search);

    sections.forEach((section) => {
      const source = data[section.key] || [];
      next[section.key] = query
        ? source.filter((item) => {
            const title = normalizeText(getSectionItemTitle(section.key, item));
            const summary = normalizeText(section.summary(item));
            const badge = normalizeText(getBadge(section.key, item).label);
            return [title, summary, badge].some((value) => value.includes(query));
          })
        : source;
    });

    return next;
  }, [data, search, sections]);

  const monthlySeries = useMemo(() => buildMonthlySeries(sections, data), [data, sections]);

  const roleAnalytics = useMemo(() => {
    if (role === 'donator') {
      return {
        title: 'Donation progression',
        kind: 'line',
        color: '#d98e50',
        data: monthlySeries
      };
    }

    if (role === 'organization') {
      return {
        title: 'Top product categories',
        kind: 'pie',
        color: '#2f6f6d',
        data: buildMix(data.products || [], (item) => item?.category?.name || 'Uncategorized')
      };
    }

    if (role === 'delivery_person') {
      return {
        title: 'Delivery status mix',
        kind: 'pie',
        color: '#b34d3d',
        data: buildMix(data.orders || [], (item) => item?.status || 'unknown')
      };
    }

    return {
      title: 'System module mix',
      kind: 'bar',
      color: '#2f6f6d',
      data: sections.map((section) => ({ name: section.label, value: (data[section.key] || []).length }))
    };
  }, [data, monthlySeries, role, sections]);

  const recentItems = useMemo(() => getRecentItems(data), [data]);

  const meta = ROLE_META[role] || ROLE_META.donator;

  function handleRefresh() {
    if (loading) {
      return;
    }

    loadAll();
  }

  function updatePage(sectionKey, delta) {
    setPages((current) => ({
      ...current,
      [sectionKey]: Math.max(0, (current[sectionKey] || 0) + delta)
    }));
  }

  return (
    <Layout title={config.title} subtitle={`${config.subtitle} Connected as ${user?.name || 'current user'}.`}>
      <section className={`dashboard-banner tone-${meta.accent}`}>
        <div>
          <p className="eyebrow">Cockpit</p>
          <h2>{config.subtitle}</h2>
          <p>{`${sections.length} visible modules · ${stats.length} KPI cards · role scoped analytics`}</p>
        </div>

        <div className="dashboard-toolbar-actions">
          <label className="dashboard-search">
            <span>Search dashboard</span>
            <input
              type="search"
              placeholder="Search titles, statuses, categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="button-row wrap">
            <button className="primary-button" type="button" onClick={handleRefresh} disabled={loading}>
              Refresh dashboard
            </button>
            {config.quickLinks.slice(0, 2).map((link) => (
              <Link key={link.to} className="ghost-button" to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <DashboardNotice type={notice?.type || 'info'} message={notice?.message} onDismiss={() => setNotice(null)} />

      {loading ? <DashboardSkeleton /> : null}

      {!loading ? (
        <>
          <section className="dashboard-hero-grid">
            <article className="card dashboard-hero-card">
              <div className="card-header">
                <div>
                  <span className="section-badge">Overview</span>
                  <h2>{config.title}</h2>
                  <p>{config.subtitle}</p>
                </div>
              </div>

              <div className="button-row wrap">
                {config.quickLinks.map((link) => (
                  <Link key={link.to} className="ghost-button" to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>

            <article className="card dashboard-hero-card dashboard-hero-meta">
              <span className="section-badge">Scope</span>
              <h2>{meta.label}</h2>
              <p>Premium cockpit view with clear KPIs, trends, and operational activity for the current role.</p>
            </article>
          </section>

          <section className="grid-4">
            {stats.map((stat) => {
              const items = data[stat.key] || [];
              const previousMonth = monthlySeries[monthlySeries.length - 2]?.value || 0;
              const currentMonth = monthlySeries[monthlySeries.length - 1]?.value || 0;
              const trend = previousMonth ? `${currentMonth >= previousMonth ? '+' : ''}${Math.round(((currentMonth - previousMonth) / previousMonth) * 100)}%` : 'Live';

              return (
                <StatCard
                  key={stat.key}
                  label={stat.label}
                  value={items.length}
                  hint={getSectionHint(stat.key)}
                  icon={meta.badge}
                  trend={trend}
                  tone={TONE_MAP[stat.key] || 'default'}
                />
              );
            })}
          </section>

          <section className="grid-2 analytics-grid">
            <article className="card analytics-card">
              <div className="card-header">
                <div>
                  <span className="section-badge">Trends</span>
                  <h2>Donations and orders</h2>
                  <p>Six-month trend across the currently visible dashboard modules.</p>
                </div>
              </div>
              {renderChart({ kind: 'line', color: '#2f6f6d', data: monthlySeries })}
            </article>

            <article className="card analytics-card">
              <div className="card-header">
                <div>
                  <span className="section-badge">Insights</span>
                  <h2>{roleAnalytics.title}</h2>
                  <p>Role-specific analytics built from the same API payloads already used by the dashboard.</p>
                </div>
              </div>
              {renderChart(roleAnalytics)}
            </article>
          </section>

          <section className="grid-3">
            <ActivityCard
              title="Recent alerts"
              items={recentItems.filter((entry) => entry.key === 'alerts').slice(0, 3)}
            />
            <ActivityCard
              title="Recent payments"
              items={recentItems.filter((entry) => entry.key === 'payments').slice(0, 3)}
            />
            <ActivityCard
              title="Recent orders"
              items={recentItems.filter((entry) => entry.key === 'orders').slice(0, 3)}
            />
          </section>

          <section className="dashboard-grid">
            {sections.map((section) => {
              const items = visibleData[section.key] || [];
              const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
              const currentPage = Math.min(pages[section.key] || 0, pageCount - 1);
              const pagedItems = items.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
              const from = items.length ? currentPage * PAGE_SIZE + 1 : 0;
              const to = Math.min(items.length, (currentPage + 1) * PAGE_SIZE);

              return (
                <DashboardCard
                  key={section.key}
                  title={section.label}
                  description={getSectionDescription(section.key)}
                  badge={`${items.length} item${items.length === 1 ? '' : 's'}`}
                  action={section.action ? <Link className="ghost-button" to={section.action.to}>{section.action.label}</Link> : null}
                  footer={
                    <div className="section-footer">
                      <span className="meta-line">
                        {items.length ? `Showing ${from}-${to} of ${items.length}` : 'No records to display'}
                      </span>
                      {items.length > PAGE_SIZE ? (
                        <div className="row-actions">
                          <button className="ghost-button" type="button" onClick={() => updatePage(section.key, -1)} disabled={currentPage === 0}>
                            Prev
                          </button>
                          <button className="ghost-button" type="button" onClick={() => updatePage(section.key, 1)} disabled={currentPage >= pageCount - 1}>
                            Next
                          </button>
                        </div>
                      ) : null}
                    </div>
                  }
                >
                  <div className="list-stack compact">
                    {pagedItems.map((item, index) => {
                      const badge = getBadge(section.key, item);

                      return (
                        <div key={getItemKey(section.key, item, index)} className="list-row dashboard-row">
                          <div>
                            <div className="row-heading">
                              <strong>{getSectionItemTitle(section.key, item)}</strong>
                              <span className={`status-chip tone-${badge.tone}`}>{badge.label}</span>
                            </div>
<p>{section.summary(item)}</p>

{section.key === 'orders' ? (
  <div className="order-details">
    <p><strong>Customer:</strong> {item.customer_name || '-'}</p>
    <p><strong>Phone:</strong> {item.phone || '-'}</p>
    <p><strong>Address:</strong> {item.address || '-'}</p>
    <p><strong>City:</strong> {item.city || '-'}</p>
    <p><strong>Organization:</strong> {item.organization?.name || item.organization?.user_id || item.organization_id || '-'}</p>
    <p><strong>Payment:</strong> {item.payment_method || '-'}</p>
    <p><strong>Order status:</strong> {item.status || 'pending'}</p>
    <p>
      <strong>Delivery earnings:</strong>
      {' '}
      10%
    </p>
    <p>
      <strong>Products:</strong>{' '}
      {(() => {
        const orderProducts = typeof item.products === 'string'
          ? JSON.parse(item.products || '[]')
          : item.products || [];

        return orderProducts.length
          ? orderProducts.map((product, idx) => (
              <span key={idx}>
                {product.name || `#${product.product_id || 'unknown'}`} x{product.quantity || 1}
                {idx < orderProducts.length - 1 ? ', ' : ''}
              </span>
            ))
          : 'None';
      })()}
    </p>

    {role === 'delivery_person' && item.status === 'pending' ? (
      <button
        className="primary-button"
        onClick={async () => {
          try {
            await api.put(`/orders/${item.order_id}`, {
              status: 'assigned',
              delivery_person_id: user.user_id
            });

            loadAll();
          } catch (error) {
            alert(error.response?.data?.message || 'Unable to accept delivery');
          }
        }}
      >
        Accept delivery
      </button>
    ) : null}
  </div>
) : null}                          </div>
                        </div>
                      );
                    })}

                    {!pagedItems.length ? <p className="empty-state">No data yet.</p> : null}
                  </div>
                </DashboardCard>
              );
            })}
          </section>

          <section className="card footer-cta dashboard-actions">
            <div className="card-header">
              <div>
                <span className="section-badge">Actions</span>
                <h2>Quick actions</h2>
                <p>Shortcuts kept aligned with the current role and the validated sidebar.</p>
              </div>
            </div>
            <div className="button-row wrap">
              {config.quickLinks.map((link) => (
                <Link key={link.to} className="ghost-button" to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </Layout>
  );
}
