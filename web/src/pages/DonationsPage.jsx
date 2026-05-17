import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

const initialForm = {
  donor_id: '',
  date: '',
  status: 'pending',
  product_ids: ''
};

export default function DonationsPage() {
  return <DonationsContent />;
}

function DonationsContent() {
  const { user } = useAuth();
  const canEdit = ['admin', 'organization', 'donator'].includes(user?.role);
  const [dons, setDons] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      const [donResponse, productResponse] = await Promise.all([api.get('/dons'), api.get('/products')]);
      setDons(donResponse.data || []);
      setProducts(productResponse.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load donations');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      setForm((current) => ({ ...current, donor_id: current.donor_id || String(user.user_id) }));
    }
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm({ ...initialForm, donor_id: String(user?.user_id || '') });
    setEditingId(null);
  }

  function beginEdit(don) {
    setEditingId(don.don_id);
    setForm({
      donor_id: String(don.donor_id || user?.user_id || ''),
      date: don.date || '',
      status: don.status || 'pending',
      product_ids: (don.products || []).map((product) => product.product_id).join(', ')
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = {
        donor_id: Number(form.donor_id),
        date: form.date || null,
        status: form.status,
        product_ids: form.product_ids
          ? form.product_ids
              .split(',')
              .map((item) => Number(item.trim()))
              .filter(Boolean)
          : []
      };

      if (editingId) {
        await api.patch(`/dons/${editingId}`, payload);
      } else {
        await api.post('/dons', payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save donation');
    }
  }

  async function handleDelete(donId) {
    try {
      await api.delete(`/dons/${donId}`);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete donation');
    }
  }

  return (
    <Layout title="Donations" subtitle="Simple donation CRUD connected to the simplified AMENA schema.">
      <section className="card">
        {canEdit ? (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Donor ID</span>
              <input name="donor_id" type="number" min="1" value={form.donor_id} onChange={handleChange} />
            </label>
            <label>
              <span>Date</span>
              <input name="date" type="date" value={form.date} onChange={handleChange} />
            </label>
            <label>
              <span>Status</span>
              <input name="status" value={form.status} onChange={handleChange} />
            </label>
            <label>
              <span>Product IDs</span>
              <input name="product_ids" value={form.product_ids} onChange={handleChange} placeholder="1, 2, 3" />
            </label>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? 'Update don' : 'Create don'}
              </button>
              {editingId ? (
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="inline-message">You can view donations. Logged users can create them through the CRUD form.</p>
        )}

        {message ? <p className="inline-message error">{message}</p> : null}

        <div className="list-stack spaced">
          {dons.map((don) => (
            <article key={don.don_id} className="list-card">
              <div>
                <strong>Don #{don.don_id}</strong>
                <p>
                  Donor: {don.donor_id} | Date: {don.date || '-'} | Status: {don.status || '-'}
                </p>
                <span className="meta-line">
                  Products: {(don.products || []).map((product) => product.name).join(', ') || 'None'}
                </span>
              </div>
              {canEdit ? (
                <div className="row-actions">
                  <button className="link-button" type="button" onClick={() => beginEdit(don)}>
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => handleDelete(don.don_id)}>
                    Delete
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="card subtle-card">
          <h3>Available products</h3>
          <p>Use these IDs in the donation form: {products.map((product) => `${product.product_id}:${product.name}`).join(' | ') || 'No products yet'}</p>
        </div>
      </section>
    </Layout>
  );
}