import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

const initialForm = {
  full_name: '',
  phone: '',
  address: '',
  city: '',
  organization_id: ''
};

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();

    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  }, []);

  async function loadData() {
    try {
      const response = await api.get('/users');

      const orgs = response.data.filter(
        (user) => user.role === 'organization'
      );

      setOrganizations(orgs);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to load organizations');
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handlePayment() {
    setError('');
    setMessage('');

    if (!cart.length) {
      setError('Your cart is empty. Add items before checkout.');
      return;
    }

    if (!form.full_name || !form.phone || !form.address || !form.city || !form.organization_id) {
      setError('Please complete all checkout fields before placing your order.');
      return;
    }

    try {
      const payload = {
        donor_id: user?.user_id,
        customer_name: form.full_name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        delivery_address: form.address,
        payment_method: paymentMethod,
        organization_id: Number(form.organization_id),
        status: 'pending',
        products: cart
      };

      await api.post('/orders', payload);

      setMessage('Order placed successfully. Thank you for your donation.');
      setError('');
      localStorage.removeItem('cart');
      setCart([]);
      setForm(initialForm);
      navigate('/products');
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Unable to create order');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await handlePayment();
  }

  return (
    <Layout title="Checkout" subtitle="Review your cart, choose an organization, and place the order.">
      <form className="checkout-grid" onSubmit={handleSubmit}>
        <article className="card checkout-summary">
          <div className="card-header">
            <div>
              <h2>Your cart</h2>
              <p>Double-check the products before confirming the order.</p>
            </div>
          </div>

          {message ? <p className="inline-message">{message}</p> : null}
          {error ? <p className="inline-message error">{error}</p> : null}

          {cart.length === 0 ? (
            <p className="empty-state">No products in cart</p>
          ) : (
            <div className="checkout-list">
              {cart.map((product, index) => (
                <div key={index} className="checkout-item">
                  <div>
                    <strong>{product.name}</strong>
                    <p>Quantity: {product.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card checkout-form-card">
          <div className="card-header">
            <div>
              <h2>Donator information</h2>
              <p>Enter the billing and delivery information for this donation.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Full name</span>
              <input name="full_name" placeholder="Full name" value={form.full_name} onChange={handleChange} />
            </label>

            <label>
              <span>Phone number</span>
              <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} />
            </label>

            <label>
              <span>Address</span>
              <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
            </label>

            <label>
              <span>City</span>
              <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
            </label>

            <label>
              <span>Organization</span>
              <select name="organization_id" value={form.organization_id} onChange={handleChange}>
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization.user_id} value={organization.user_id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <h3>Payment method</h3>
            <div className="payment-methods">
              <label className="payment-option">
                <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span>Cash</span>
              </label>

              <label className="payment-option">
                <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span>Credit Card</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              Place order
            </button>
          </div>
        </article>
      </form>
    </Layout>
  );
}