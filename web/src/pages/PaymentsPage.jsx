import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function PaymentsPage() {
  return <PaymentsContent />;
}

function PaymentsContent() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin';
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await api.get('/payments');
        setPayments(response.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load payments');
      }
    }

    loadPayments();
  }, []);

  return (
    <Layout title="Payments" subtitle="Read payment records according to your role scope.">
      <section className="card">
        {canEdit ? <p className="inline-message">Admin can manage payments via API endpoints.</p> : null}
        {message ? <p className="inline-message error">{message}</p> : null}

        <div className="list-stack spaced">
          {payments.map((payment) => (
            <article key={payment.payment_id} className="list-card">
              <div>
                <strong>Payment #{payment.payment_id}</strong>
                <p>
                  Amount: {payment.amount} | Status: {payment.payment_status || '-'} | Method: {payment.payment_method || '-'}
                </p>
                <span className="meta-line">Order: {payment.order_id || '-'}</span>
              </div>
            </article>
          ))}
          {!payments.length && !message ? <p className="empty-state">No payment records found.</p> : null}
        </div>
      </section>
    </Layout>
  );
}
