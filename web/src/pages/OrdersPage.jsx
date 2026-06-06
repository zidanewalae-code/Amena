import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

const initialForm = {
  donor_id: '',
  status: 'pending',
  delivery_address: '',
  order_date: '',
  total_price: '',
  purchase_id: '',
  delivery_person_id: ''
};

export default function OrdersPage() {
  return <OrdersContent />;
}

function OrdersContent() {
  const { user } = useAuth();
  const canEdit = ['admin', 'organization', 'donator', 'delivery_person'].includes(user?.role);
  const statusOnly = user?.role === 'delivery_person';
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadOrders() {
    try {
      const response = await api.get('/orders');
      setOrders(response.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load orders');
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function beginEdit(order) {
    setEditingId(order.order_id);
    setForm({
      donor_id: String(order.purchase?.donator?.donor_id || ''),
      status: order.status || 'pending',
      delivery_address: order.delivery_address || '',
      order_date: order.order_date || '',
      total_price: String(order.purchase?.total_price ?? ''),
      purchase_id: String(order.purchase_id || ''),
      delivery_person_id: String(order.delivery_person_id || '')
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = statusOnly
        ? { status: form.status }
        : {
            ...form,
            donor_id: Number(form.donor_id),
            total_price: form.total_price ? Number(form.total_price) : 0,
            purchase_id: form.purchase_id ? Number(form.purchase_id) : null,
            delivery_person_id: form.delivery_person_id ? Number(form.delivery_person_id) : null
          };

      if (editingId) {
        await api.put(`/orders/${editingId}`, payload);
      } else {
        await api.post('/orders', payload);
      }

      resetForm();
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save order');
    }
  }

  async function handleDelete(orderId) {
    try {
      await api.delete(`/orders/${orderId}`);
      await loadOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete order');
    }
  }

  return (
    <Layout title="Orders" subtitle="Keep order tracking simple with a basic CRUD page.">
      <section className="card">
        {canEdit && (!statusOnly || editingId) ? (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Status</span>
              <input name="status" value={form.status} onChange={handleChange} />
            </label>
            {statusOnly ? null : (
              <>
                <label>
                  <span>Donor ID</span>
                  <input name="donor_id" type="number" min="1" value={form.donor_id} onChange={handleChange} />
                </label>
                <label>
                  <span>Delivery address</span>
                  <input name="delivery_address" value={form.delivery_address} onChange={handleChange} />
                </label>
                <label>
                  <span>Order date</span>
                  <input name="order_date" type="date" value={form.order_date} onChange={handleChange} />
                </label>
                <label>
                  <span>Total price</span>
                  <input name="total_price" type="number" step="0.01" min="0" value={form.total_price} onChange={handleChange} />
                </label>
                <label>
                  <span>Purchase ID</span>
                  <input name="purchase_id" type="number" min="1" value={form.purchase_id} onChange={handleChange} />
                </label>
                <label>
                  <span>Delivery person ID</span>
                  <input name="delivery_person_id" type="number" min="1" value={form.delivery_person_id} onChange={handleChange} />
                </label>
              </>
            )}

            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? (statusOnly ? 'Update status' : 'Update order') : 'Create order'}
              </button>
              {editingId ? (
                <button className="ghost-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : statusOnly ? (
          <p className="inline-message">Delivery staff can only update the status of assigned orders from the list below.</p>
        ) : (
          <p className="inline-message">You can view orders. Editing is reserved for authenticated academic CRUD flows.</p>
        )}

        {message ? <p className="inline-message error">{message}</p> : null}

        <div className="list-stack spaced">
   {orders.map((order) => {
  const parsedProducts =
    typeof order.products === 'string'
      ? JSON.parse(order.products || '[]')
      : order.products || [];

  return (
    <article key={order.order_id} className="list-card">
      <div>
        <strong>Order #{order.order_id}</strong>

        <p>
          Status: {order.status || '-'} | Address:{' '}
          {order.delivery_address || '-'} | Date:{' '}
          {order.order_date || '-'}
        </p>

        <p>
          <strong>Customer:</strong> {order.customer_name || '-'}
        </p>

        <p>
          <strong>Phone:</strong> {order.phone || '-'}
        </p>

        <p>
          <strong>Organization:</strong>{' '}
          {order.organization?.name || order.organization_id || '-'}
        </p>

        <p>
          <strong>Products:</strong>{' '}
          {parsedProducts.length
            ? parsedProducts.map((product, idx) => (
                <span key={idx}>
                  {product.name || `#${product.product_id || 'unknown'}`} x
                  {product.quantity || 1}
                  {idx < parsedProducts.length - 1 ? ', ' : ''}
                </span>
              ))
            : 'None'}
        </p>

        <span className="meta-line">
          Purchase: {order.purchase_id || '-'} | Delivery person:{' '}
          {order.delivery_person_id || '-'}
        </span>
      </div>

      {canEdit ? (
        <div className="row-actions">
          <button
            className="link-button"
            type="button"
            onClick={() => beginEdit(order)}
          >
            {statusOnly ? 'Update status' : 'Edit'}
          </button>

          {!statusOnly ? (
            <button
              className="link-button danger"
              type="button"
              onClick={() => handleDelete(order.order_id)}
            >
              Delete
            </button>
          ) : null}
        </div>
            ) : null}
    </article>
  );
})}

        </div>
      </section>
    </Layout>
  );
}