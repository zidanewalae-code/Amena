import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { getDashboardPath } from '../lib/access';

const registrationRoles = [
  { value: 'donator', label: 'Donator' },
  { value: 'organization', label: 'Organization' },
  { value: 'delivery_person', label: 'Delivery Person' }
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'donator' });
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/register', form);
      login(response.data);
      navigate(getDashboardPath(response.data.user.role));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <Layout title="Register" subtitle="Create a simple account and choose your profile type.">
      <section className="card auth-card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" value={form.password} onChange={handleChange} />
          </label>
          <label>
            <span>Phone</span>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            <span>Role</span>
            <select name="role" value={form.role} onChange={handleChange}>
              {registrationRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="inline-message error">{error}</p> : null}

          <button className="primary-button" type="submit">
            Register
          </button>
        </form>

        <p className="card-note">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </Layout>
  );
}