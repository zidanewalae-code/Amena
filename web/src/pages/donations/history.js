// Donation history page displays donor orders and payment status.
import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import DonationOrderCard from '../../components/DonationOrderCard';
import { t } from '../../lib/i18n';
import { apiUrl } from '../../lib/api';
import { formatMoney } from '../../lib/currency';
import Toast from '../../components/Toast';
import { getStoredAuth, saveToken } from '../../lib/auth';

export default function DonationHistoryPage() {
  const [token, setToken] = useState('');
  const [history, setHistory] = useState([]);
  const [lang, setLang] = useState('fr');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_pages: 1, total: 0 });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    provider: '',
    currency: '',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: ''
  });

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) setToken(auth.token);
  }, []);

  function onTokenChange(value) {
    setToken(value);
    saveToken(value);
  }

  async function loadHistory(page = pagination.page) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pagination.limit)
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    try {
      const response = await fetch(`${apiUrl('/api/donations/orders/history')}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      setHistory(Array.isArray(data.items) ? data.items : []);
      setPagination((prev) => ({
        ...prev,
        page: data.page || page,
        total_pages: data.total_pages || 1,
        total: data.total || 0
      }));

      if (!response.ok) {
        setToast({ message: t(lang, 'toastError'), type: 'error' });
      }
    } catch (_error) {
      setToast({ message: t(lang, 'toastError'), type: 'error' });
    }
  }

  const sortedHistory = useMemo(() => {
    const copy = [...history];
    copy.sort((a, b) => {
      const left = a?.[sortBy] ?? a?.transaction?.[sortBy] ?? '';
      const right = b?.[sortBy] ?? b?.transaction?.[sortBy] ?? '';
      if (sortBy === 'amount') {
        return Number(left || 0) - Number(right || 0);
      }
      if (String(sortBy).includes('created')) {
        return new Date(left || 0).getTime() - new Date(right || 0).getTime();
      }
      return String(left).localeCompare(String(right));
    });
    return sortOrder === 'asc' ? copy : copy.reverse();
  }, [history, sortBy, sortOrder]);

  function exportCsv() {
    if (!sortedHistory.length) return;
    const rows = [
      ['id', 'reference', 'status', 'payment_status', 'amount', 'currency', 'provider', 'created_at'].join(',')
    ];
    sortedHistory.forEach((order) => {
      rows.push([
        order.id,
        order.reference,
        order.status,
        order.payment_status || order.transaction?.status || '',
        Number(order.amount || 0),
        order.currency || 'TND',
        order.provider_name || order.transaction?.provider_name || '',
        order.created_at || ''
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'donation-history.csv';
    link.click();
    URL.revokeObjectURL(url);
    setToast({ message: t(lang, 'toastSuccess'), type: 'success' });
  }

  function exportPdf() {
    if (!sortedHistory.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(t(lang, 'historyTitle'), 14, 14);
    doc.setFontSize(10);

    let y = 24;
    sortedHistory.slice(0, 40).forEach((order) => {
      const line = `${order.reference || order.id} | ${order.status} | ${formatMoney(order.amount, order.currency || 'TND')} | ${order.created_at || '-'}`;
      doc.text(line, 14, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 14;
      }
    });

    doc.save('donation-history.pdf');
    setToast({ message: t(lang, 'toastSuccess'), type: 'success' });
  }

  return (
    <main className="page">
      <a href="#history-list" className="skip-link">Skip to history list</a>
      <h1>{t(lang, 'historyTitle')}</h1>
      <p className="muted" aria-live="polite">{t(lang, 'keyboardHint')}</p>
      <div className="card">
        <label className="label" htmlFor="history-token">{t(lang, 'tokenLabel')}</label>
        <textarea id="history-token" className="textarea" rows={3} value={token} onChange={(e) => onTokenChange(e.target.value)} />

        <label className="label" htmlFor="history-language">Language</label>
        <select id="history-language" className="select" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="ar">AR</option>
        </select>

        <h3>{t(lang, 'filters')}</h3>
        <div className="grid-2">
          <div>
            <label className="label">{t(lang, 'status')}</label>
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
            <label className="label">{t(lang, 'paymentStatus')}</label>
            <select
              className="select"
              value={filters.payment_status}
              onChange={(e) => setFilters((v) => ({ ...v, payment_status: e.target.value }))}
            >
              <option value="">all</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="failed">failed</option>
              <option value="refunded">refunded</option>
              <option value="canceled">canceled</option>
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'provider')}</label>
            <input className="input" value={filters.provider} onChange={(e) => setFilters((v) => ({ ...v, provider: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t(lang, 'currency')}</label>
            <select className="select" value={filters.currency} onChange={(e) => setFilters((v) => ({ ...v, currency: e.target.value }))}>
              <option value="">all</option>
              <option value="TND">TND</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="label">{t(lang, 'fromDate')}</label>
            <input
              type="date"
              className="input"
              value={filters.start_date}
              onChange={(e) => setFilters((v) => ({ ...v, start_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t(lang, 'toDate')}</label>
            <input
              type="date"
              className="input"
              value={filters.end_date}
              onChange={(e) => setFilters((v) => ({ ...v, end_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t(lang, 'minAmount')}</label>
            <input
              className="input"
              value={filters.min_amount}
              onChange={(e) => setFilters((v) => ({ ...v, min_amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t(lang, 'maxAmount')}</label>
            <input
              className="input"
              value={filters.max_amount}
              onChange={(e) => setFilters((v) => ({ ...v, max_amount: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="label" htmlFor="sort-by">{t(lang, 'sortBy')}</label>
            <select id="sort-by" className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">{t(lang, 'createdAt')}</option>
              <option value="amount">{t(lang, 'amount')}</option>
              <option value="status">{t(lang, 'status')}</option>
              <option value="payment_status">{t(lang, 'paymentStatus')}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sort-order">{t(lang, 'sortOrder')}</label>
            <select id="sort-order" className="select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">ASC</option>
              <option value="desc">DESC</option>
            </select>
          </div>
        </div>

        <div className="actions-row">
          <button className="button" onClick={() => loadHistory(1)}>{t(lang, 'loadHistory')}</button>
          <button className="button button-soft" onClick={exportCsv}>{t(lang, 'exportCsv')}</button>
          <button className="button button-soft" onClick={exportPdf}>{t(lang, 'exportPdf')}</button>
        </div>
      </div>

      <div className="card compact">
        <strong>{t(lang, 'page')}:</strong> {pagination.page} / {pagination.total_pages} | <strong>Total:</strong> {pagination.total}
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button className="button button-soft" disabled={pagination.page <= 1} onClick={() => loadHistory(pagination.page - 1)}>Prev</button>
          <button
            className="button button-soft"
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => loadHistory(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <section id="history-list" aria-label={t(lang, 'historyTitle')}>
        {sortedHistory.map((order) => <DonationOrderCard key={order.id} order={order} />)}
      </section>
      {!sortedHistory.length && <p className="muted">{t(lang, 'noOrders')}</p>}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </main>
  );
}
