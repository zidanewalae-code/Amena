import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function NotificationsPage() {
  return <NotificationsContent />;
}

function NotificationsContent() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Unable to load notifications');
      }
    }

    loadNotifications();
  }, []);

  return (
    <Layout title="Notifications" subtitle="Only your authorized notification scope is shown.">
      <section className="card">
        {message ? <p className="inline-message error">{message}</p> : null}

        <div className="list-stack spaced">
          {notifications.map((notification) => (
            <article key={notification.notification_id} className="list-card">
              <div>
                <strong>Notification #{notification.notification_id}</strong>
                <p>
                  {notification.message || '-'}
                </p>
                <span className="meta-line">
                  Date: {notification.date || '-'} | Read: {notification.is_read ? 'yes' : 'no'} | Order: {notification.order_id || '-'}
                </span>
              </div>
            </article>
          ))}
          {!notifications.length && !message ? <p className="empty-state">No notifications found.</p> : null}
        </div>

        <p className="inline-message">Connected as: {user?.role || '-'}</p>
      </section>
    </Layout>
  );
}
