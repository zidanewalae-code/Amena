import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function HistoryPage() {
  return <HistoryContent />;
}

function HistoryContent() {
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await api.get('/history');
        setHistory(response.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load history');
      }
    }

    loadHistory();
  }, []);

  return (
    <Layout title="History" subtitle="Read operational history entries available for your account.">
      <section className="card">
        {message ? <p className="inline-message error">{message}</p> : null}

        <div className="list-stack spaced">
          {history.map((entry) => (
            <article key={entry.history_id} className="list-card">
              <div>
                <strong>History #{entry.history_id}</strong>
                <p>{entry.action || '-'}</p>
                <span className="meta-line">
                  Date: {entry.action_date || '-'} | Order: {entry.order_id || '-'} | Don: {entry.don_id || '-'}
                </span>
              </div>
            </article>
          ))}
          {!history.length && !message ? <p className="empty-state">No history entries found.</p> : null}
        </div>
      </section>
    </Layout>
  );
}
