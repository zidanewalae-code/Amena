import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AlertCard from '../components/AlertCard';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AlertsPage() {
  return <AlertsContent />;
}

function AlertsContent() {
  const { user } = useAuth();
  const canEdit = ['admin', 'organization'].includes(user?.role);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: '', organization_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadAlerts() {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load alerts');
    }
  }

  useEffect(() => {
    loadAlerts();
    setForm((current) => ({ ...current, organization_id: String(user?.user_id || '') }));
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm({ title: '', description: '', priority: '', organization_id: String(user?.user_id || '') });
    setEditingId(null);
  }

  function beginEdit(alert) {
    setEditingId(alert.alert_id);
    setForm({
      title: alert.title || '',
      description: alert.description || '',
      priority: alert.priority || '',
      organization_id: String(alert.organization_id || user?.user_id || '')
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority
      };

      if (!editingId || user?.role === 'admin') {
        payload.organization_id = Number(form.organization_id);
      }

      if (editingId) {
        await api.put(`/alerts/${editingId}`, payload);
      } else {
        await api.post('/alerts', payload);
      }

      resetForm();
      await loadAlerts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save alert');
    }
  }

  async function handleDelete(alertId) {
    try {
      await api.delete(`/alerts/${alertId}`);
      await loadAlerts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete alert');
    }
  }

  return (
    <Layout title="Alerts" subtitle="Track short organization alerts in one simple place.">
      <section className="card">
        {canEdit ? (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Title</span>
              <input name="title" value={form.title} onChange={handleChange} />
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
            </label>
            <label>
              <span>Priority</span>
              <input name="priority" value={form.priority} onChange={handleChange} placeholder="low, medium, high" />
            </label>
            <label>
              <span>Organization ID</span>
              <input name="organization_id" value={form.organization_id} onChange={handleChange} />
            </label>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? 'Update alert' : 'Create alert'}
              </button>
              {editingId ? (
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="inline-message">You can read alerts. Only admin and organization roles can edit them.</p>
        )}

        {message ? <p className="inline-message error">{message}</p> : null}

        <div className="list-stack spaced">
          {alerts.map((alert) => (
            <AlertCard key={alert.alert_id} alert={alert} canEdit={canEdit} onEdit={beginEdit} onDelete={handleDelete} />
          ))}
        </div>
      </section>
    </Layout>
  );
}