import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div style={{ padding: '40px' }}>
      <h1>Checkout</h1>

      {message ? <p style={{ color: 'green' }}>{message}</p> : null}
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <h2>Your cart</h2>

      {cart.length === 0 ? (
        <p>No products in cart</p>
      ) : (
        cart.map((product, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '10px'
            }}
          >
            <h3>{product.name}</h3>

            <p>Quantity: {product.quantity}</p>
          </div>
        ))
      )}

      <h2>Donator information</h2>

      <input
        name="full_name"
        placeholder="Full name"
        value={form.full_name}
        onChange={handleChange}
      />

      <br /><br />

      <input
        name="phone"
        placeholder="Phone number"
        value={form.phone}
        onChange={handleChange}
      />

      <br /><br />

      <input
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
      />

      <br /><br />

      <input
        name="city"
        placeholder="City"
        value={form.city}
        onChange={handleChange}
      />

      <br /><br />

      <select
        name="organization_id"
        value={form.organization_id}
        onChange={handleChange}
      >
        <option value="">Select organization</option>

        {organizations.map((organization) => (
          <option
            key={organization.user_id}
            value={organization.user_id}
          >
            {organization.name}
          </option>
        ))}
      </select>

      <h2>Payment method</h2>

      <div>
        <label>
          <input
            type="radio"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />

          Cash
        </label>
      </div>

      <div>
        <label>
          <input
            type="radio"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />

          Credit Card
        </label>
      </div>

      <button
        onClick={handlePayment}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Place order
      </button>
    </div>
  );
}